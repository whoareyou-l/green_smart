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
            "label": row.get("request_type") or "승인 요청",
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
    ha_user_id = _ha_user_id(user)
    display_name = _ha_user_name(user) or ha_user_id or "현재 사용자"
    role, _role_source = await async_get_green_smart_user_role(hass, ha_user_id, is_ha_admin=_ha_user_is_admin(user))
    if ha_user_id:
        permission_summary = "전체 설정" if role == "admin" else "승인 · 전략" if role == "farm_owner" else "기록 · 모니터링"
        await execute(
            hass,
            """
            INSERT INTO gs_users (ha_user_id, display_name, role, status, permission_summary, last_seen_at)
            VALUES (%s, %s, %s, 'active', %s, NOW())
            ON DUPLICATE KEY UPDATE
                display_name = VALUES(display_name),
                role = VALUES(role),
                status = 'active',
                permission_summary = VALUES(permission_summary),
                last_seen_at = NOW()
            """,
            (ha_user_id, display_name, role, permission_summary),
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
        SELECT request_type, requester, requested_role, status, icon, tone, created_at
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


class RebuildSettingsUsersPermissionsView(HomeAssistantView):
    """GET /api/green_smart/rebuild/settings/users-permissions."""

    url = "/api/green_smart/rebuild/settings/users-permissions"
    name = "api:green_smart:rebuild:settings:users_permissions"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        user = _ha_user_from_request(request)
        return self.json(await settings_users_permissions_response(hass, user))
