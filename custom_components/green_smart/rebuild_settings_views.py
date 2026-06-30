"""Settings/Admin DB-backed API views for the Green Smart rebuild surface."""
from __future__ import annotations

from typing import Any

try:  # Home Assistant runtime
    from aiohttp import web
    from homeassistant.components.http import HomeAssistantView
except Exception:  # contract tests outside HA
    class _WebFallback:
        class Request:  # type: ignore[no-redef]
            pass

    web = _WebFallback()  # type: ignore[assignment]

    class HomeAssistantView:  # type: ignore[no-redef]
        requires_auth = True

        def json(self, data: dict, status_code: int = 200):
            return data

try:  # package import in Home Assistant runtime
    from .db import execute, fetchall
    from .rbac import (
        _ha_user_from_request,
        _ha_user_id,
        _ha_user_is_admin,
        _ha_user_name,
        async_get_green_smart_user_role,
    )
except Exception:  # direct exec/import contract tests outside package
    execute = None  # type: ignore[assignment]
    fetchall = None  # type: ignore[assignment]

    def _ha_user_from_request(request):  # type: ignore[no-redef]
        return None

    def _ha_user_id(user):  # type: ignore[no-redef]
        return ""

    def _ha_user_is_admin(user):  # type: ignore[no-redef]
        return False

    def _ha_user_name(user):  # type: ignore[no-redef]
        return ""

    async def async_get_green_smart_user_role(hass, ha_user_id: str, *, is_ha_admin: bool = False):  # type: ignore[no-redef]
        return ("admin" if is_ha_admin else "farm_staff", "fallback")

SETTINGS_USERS_PERMISSIONS_SOURCE = "green-smart-db"
APPROVED_USER_STATUSES = {"active", "approved"}


def _is_approved_status(status: Any) -> bool:
    return str(status or "").lower() in APPROVED_USER_STATUSES


def settings_users_permissions_pending_response(*, ha_user_id: str = "", display_name: str = "", role: str = "farm_staff", status: str = "pending", source: str = SETTINGS_USERS_PERMISSIONS_SOURCE) -> dict[str, Any]:
    return {
        "ok": False,
        "source": source,
        "approvalRequired": True,
        "approvalStatus": status or "pending",
        "reasonCode": "user_approval_required",
        "haUserId": ha_user_id,
        "displayName": display_name or "현재 사용자",
        "role": role or "farm_staff",
        "users": [],
        "approvalRows": [],
        "auditRows": [],
        "counts": {"users": 0, "approvals": 0, "audits": 0},
    }


async def async_get_or_create_user_approval_state(hass, user: Any | None) -> dict[str, Any]:
    if fetchall is None or execute is None:
        raise RuntimeError("green_smart db helpers unavailable outside package runtime")
    ha_user_id = _ha_user_id(user)
    display_name = _ha_user_name(user) or ha_user_id or "현재 사용자"
    role, role_source = await async_get_green_smart_user_role(hass, ha_user_id, is_ha_admin=_ha_user_is_admin(user))
    if not ha_user_id:
        return {"approved": False, "ha_user_id": "", "display_name": display_name, "role": role, "role_source": role_source, "status": "missing_user"}
    default_status = "active" if _ha_user_is_admin(user) else "pending"
    permission_summary = "전체 설정" if role == "admin" else "승인 · 전략" if role == "farm_owner" else "기록 · 모니터링"
    await execute(
        hass,
        """
        INSERT INTO gs_users (ha_user_id, display_name, role, status, permission_summary, last_seen_at)
        VALUES (%s, %s, %s, %s, %s, NOW())
        ON DUPLICATE KEY UPDATE
            display_name = VALUES(display_name),
            role = VALUES(role),
            status = CASE WHEN VALUES(status) = 'active' THEN 'active' ELSE status END,
            permission_summary = VALUES(permission_summary),
            last_seen_at = NOW()
        """,
        (ha_user_id, display_name, role, default_status, permission_summary),
    )
    rows = await fetchall(
        hass,
        """
        SELECT ha_user_id, display_name, role, status, permission_summary, last_seen_at
        FROM gs_users
        WHERE ha_user_id = %s
        LIMIT 1
        """,
        (ha_user_id,),
    )
    row = rows[0] if rows else {"ha_user_id": ha_user_id, "display_name": display_name, "role": role, "status": default_status}
    return {**row, "approved": _is_approved_status(row.get("status")), "role_source": role_source}


def _fmt_time(value: Any) -> str:
    if value is None:
        return "-"
    text = str(value).replace("T", " ")
    return text[:16]


def settings_users_permissions_response_from_rows(*, users: list[dict[str, Any]], approvals: list[dict[str, Any]], audits: list[dict[str, Any]], source: str = SETTINGS_USERS_PERMISSIONS_SOURCE) -> dict[str, Any]:
    """Map DB rows into the rebuild settings/users-permissions DTO."""
    user_rows = [
        {
            "kind": row.get("display_name") or row.get("ha_user_id") or "사용자",
            "at": row.get("role") or "farm_staff",
            "memo": f"{row.get('status') or 'active'} · {_fmt_time(row.get('last_seen_at'))}",
            "state": row.get("permission_summary") or "조회 · 기록",
            "icon": "mdi:shield-account-outline" if row.get("role") == "admin" else "mdi:account-tie-outline" if row.get("role") == "farm_owner" else "mdi:account-outline",
            "tone": "green" if row.get("status") == "active" else "amber",
            "haUserId": row.get("ha_user_id") or "",
        }
        for row in users
    ]
    approval_rows = [
        {
            "id": row.get("id"),
            "label": row.get("request_type") or "승인 요청",
            "requester": row.get("requester") or "",
            "requestedRole": row.get("requested_role") or "farm_staff",
            "createdBy": row.get("created_by") or "",
            "meta": " · ".join([str(v) for v in [row.get("requester"), row.get("requested_role"), row.get("status")] if v]),
            "icon": row.get("icon") or "mdi:account-clock-outline",
            "tone": row.get("tone") or "amber",
            "status": row.get("status") or "pending",
        }
        for row in approvals
    ]
    audit_rows = [
        {
            "label": row.get("actor") or "system",
            "meta": _fmt_time(row.get("created_at")),
            "summary": row.get("summary") or row.get("action") or "감사 로그",
            "icon": "mdi:account-check-outline",
            "tone": "green" if row.get("result", "ok") == "ok" else "amber",
        }
        for row in audits
    ]
    return {
        "ok": True,
        "source": source,
        "users": user_rows,
        "approvalRows": approval_rows,
        "auditRows": audit_rows,
        "counts": {"users": len(user_rows), "approvals": len(approval_rows), "audits": len(audit_rows)},
    }


async def settings_users_permissions_response(hass, user: Any | None = None) -> dict[str, Any]:
    """Read users/approval/audit state from MariaDB for Settings > 사용자·권한."""
    approval_state = await async_get_or_create_user_approval_state(hass, user)
    if not approval_state.get("approved"):
        return settings_users_permissions_pending_response(
            ha_user_id=str(approval_state.get("ha_user_id") or ""),
            display_name=str(approval_state.get("display_name") or ""),
            role=str(approval_state.get("role") or "farm_staff"),
            status=str(approval_state.get("status") or "pending"),
        )
    users = await fetchall(
        hass,
        """
        SELECT ha_user_id, display_name, role, status, permission_summary, last_seen_at
        FROM gs_users
        ORDER BY last_seen_at DESC, updated_at DESC, id DESC
        LIMIT 50
        """,
    )
    approvals = await fetchall(
        hass,
        """
        SELECT id, request_type, requester, requested_role, status, icon, tone, created_by, created_at
        FROM gs_approval_requests
        WHERE status IN ('pending', 'requested')
        ORDER BY created_at DESC, id DESC
        LIMIT 20
        """,
    )
    audits = await fetchall(
        hass,
        """
        SELECT actor, action, summary, result, created_at
        FROM gs_audit_logs
        ORDER BY created_at DESC, id DESC
        LIMIT 20
        """,
    )
    return settings_users_permissions_response_from_rows(users=users, approvals=approvals, audits=audits)


async def create_user_approval_request(hass, user: Any | None = None) -> dict[str, Any]:
    """Create or reuse a pending approval request for the current HA user."""
    if fetchall is None or execute is None:
        raise RuntimeError("green_smart db helpers unavailable outside package runtime")
    state = await async_get_or_create_user_approval_state(hass, user)
    ha_user_id = str(state.get("ha_user_id") or "")
    display_name = str(state.get("display_name") or ha_user_id or "현재 사용자")
    role = str(state.get("role") or "farm_staff")
    if state.get("approved"):
        return {"ok": True, "approvalRequired": False, "approvalStatus": str(state.get("status") or "active"), "message": "already_approved"}
    existing = await fetchall(
        hass,
        """
        SELECT id, request_type, requester, requested_role, status, created_by, created_at
        FROM gs_approval_requests
        WHERE created_by = %s AND status IN ('pending', 'requested')
        ORDER BY created_at DESC, id DESC
        LIMIT 1
        """,
        (ha_user_id,),
    )
    if not existing:
        await execute(
            hass,
            """
            INSERT INTO gs_approval_requests (request_type, requester, requested_role, status, icon, tone, note, created_by)
            VALUES ('사용자 승인 요청', %s, %s, 'pending', 'mdi:account-clock-outline', 'amber', 'pending user requested Green Smart access', %s)
            """,
            (display_name, role, ha_user_id),
        )
        existing = await fetchall(
            hass,
            """
            SELECT id, request_type, requester, requested_role, status, created_by, created_at
            FROM gs_approval_requests
            WHERE created_by = %s AND status IN ('pending', 'requested')
            ORDER BY created_at DESC, id DESC
            LIMIT 1
            """,
            (ha_user_id,),
        )
    row = existing[0] if existing else {}
    return {
        "ok": True,
        "approvalRequired": True,
        "approvalStatus": "pending",
        "request": {
            "id": row.get("id"),
            "label": row.get("request_type") or "사용자 승인 요청",
            "requester": row.get("requester") or display_name,
            "requestedRole": row.get("requested_role") or role,
            "status": row.get("status") or "pending",
            "createdBy": row.get("created_by") or ha_user_id,
        },
    }


async def approve_user_approval_request(hass, request_id: str, actor: Any | None = None) -> dict[str, Any]:
    """Approve a pending user approval request and activate the target user."""
    if fetchall is None or execute is None:
        raise RuntimeError("green_smart db helpers unavailable outside package runtime")
    actor_id = _ha_user_id(actor)
    actor_role, _source = await async_get_green_smart_user_role(hass, actor_id, is_ha_admin=_ha_user_is_admin(actor))
    if actor_role != "admin":
        return {"ok": False, "reasonCode": "admin_required", "status": 403}
    rows = await fetchall(
        hass,
        """
        SELECT id, requester, requested_role, created_by, status
        FROM gs_approval_requests
        WHERE id = %s AND status IN ('pending', 'requested')
        LIMIT 1
        """,
        (request_id,),
    )
    if not rows:
        return {"ok": False, "reasonCode": "approval_request_not_found", "status": 404}
    row = rows[0]
    target_id = str(row.get("created_by") or "")
    await execute(
        hass,
        "UPDATE gs_users SET status = 'active', role = %s, permission_summary = %s WHERE ha_user_id = %s",
        (row.get("requested_role") or "farm_staff", "기록 · 모니터링", target_id),
    )
    await execute(
        hass,
        """
        UPDATE gs_approval_requests SET status='approved', decided_by=%s, decided_at=NOW()
        WHERE id=%s
        """,
        (actor_id, request_id),
    )
    await execute(
        hass,
        """
        INSERT INTO gs_audit_logs (actor, action, summary, target_ref, result)
        VALUES (%s, 'approve_user_access', %s, %s, 'ok')
        """,
        (actor_id or "admin", f"사용자 승인: {row.get('requester') or target_id} → {row.get('requested_role') or 'farm_staff'}", target_id),
    )
    return {"ok": True, "requestId": request_id, "approvedHaUserId": target_id, "status": "approved"}


class RebuildSettingsApprovalRequestView(HomeAssistantView):
    """POST /api/green_smart/rebuild/settings/approval-request."""

    url = "/api/green_smart/rebuild/settings/approval-request"
    name = "api:green_smart:rebuild:settings:approval_request"
    requires_auth = True

    async def post(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        user = _ha_user_from_request(request)
        return self.json(await create_user_approval_request(hass, user))


class RebuildSettingsApprovalDecisionView(HomeAssistantView):
    """POST /api/green_smart/rebuild/settings/approval-requests/{request_id}/decision."""

    url = "/api/green_smart/rebuild/settings/approval-requests/{request_id}/decision"
    name = "api:green_smart:rebuild:settings:approval_decision"
    requires_auth = True

    async def post(self, request: web.Request, request_id: str) -> web.Response:
        hass = request.app["hass"]
        user = _ha_user_from_request(request)
        result = await approve_user_approval_request(hass, request_id, user)
        status_code = int(result.pop("status", 200))
        if status_code != 200:
            return web.json_response(result, status=status_code)
        return self.json(result)


class RebuildSettingsUsersPermissionsView(HomeAssistantView):
    """GET /api/green_smart/rebuild/settings/users-permissions."""

    url = "/api/green_smart/rebuild/settings/users-permissions"
    name = "api:green_smart:rebuild:settings:users_permissions"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        user = _ha_user_from_request(request)
        return self.json(await settings_users_permissions_response(hass, user))
