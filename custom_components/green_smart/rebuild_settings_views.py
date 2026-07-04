"""Settings/Admin DB-backed API views for the Green Smart rebuild surface."""
from __future__ import annotations

from typing import Any
import json

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



ROLE_PERMISSION_DEFAULTS = [
    {"role": "admin", "role_label": "관리자", "permission_summary": "전체 권한 · 시스템 설정", "view_permission": "allowed", "record_permission": "allowed", "strategy_permission": "allowed", "execution_permission": "allowed", "safety_permission": "allowed", "settings_permission": "allowed", "status": "active"},
    {"role": "farm_owner", "role_label": "농장 소유자", "permission_summary": "운영 승인 · 전략 검토", "view_permission": "allowed", "record_permission": "allowed", "strategy_permission": "allowed", "execution_permission": "allowed", "safety_permission": "review", "settings_permission": "review", "status": "active"},
    {"role": "farm_staff", "role_label": "농장 작업자", "permission_summary": "기록 작성 · 조회 중심", "view_permission": "allowed", "record_permission": "allowed", "strategy_permission": "readonly", "execution_permission": "request", "safety_permission": "readonly", "settings_permission": "none", "status": "active"},
]


async def ensure_role_permissions_schema(hass) -> None:
    if execute is None:
        raise RuntimeError("green_smart db helpers unavailable outside package runtime")
    await execute(
        hass,
        """
        CREATE TABLE IF NOT EXISTS gs_role_permissions (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            role VARCHAR(64) NOT NULL,
            role_label VARCHAR(128) NOT NULL DEFAULT '',
            permission_summary VARCHAR(255) NOT NULL DEFAULT '조회 · 기록',
            view_permission VARCHAR(32) NOT NULL DEFAULT 'allowed',
            record_permission VARCHAR(32) NOT NULL DEFAULT 'allowed',
            strategy_permission VARCHAR(32) NOT NULL DEFAULT 'readonly',
            execution_permission VARCHAR(32) NOT NULL DEFAULT 'request',
            safety_permission VARCHAR(32) NOT NULL DEFAULT 'readonly',
            settings_permission VARCHAR(32) NOT NULL DEFAULT 'none',
            status VARCHAR(32) NOT NULL DEFAULT 'active',
            note TEXT NULL,
            created_by VARCHAR(128) NULL,
            updated_by VARCHAR(128) NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_gs_role_permissions_role (role),
            KEY idx_gs_role_permissions_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
    )
    for row in ROLE_PERMISSION_DEFAULTS:
        await execute(
            hass,
            """
            INSERT INTO gs_role_permissions (role, role_label, permission_summary, view_permission, record_permission, strategy_permission, execution_permission, safety_permission, settings_permission, status, created_by, updated_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'system', 'system')
            ON DUPLICATE KEY UPDATE role = role
            """,
            (row["role"], row["role_label"], row["permission_summary"], row["view_permission"], row["record_permission"], row["strategy_permission"], row["execution_permission"], row["safety_permission"], row["settings_permission"], row["status"]),
        )


def _role_permission_dto(row: dict[str, Any]) -> dict[str, Any]:
    role = row.get("role") or "farm_staff"
    tone = "blue" if role == "admin" else "green" if role == "farm_owner" else "amber"
    return {
        "id": role,
        "role": role,
        "roleLabel": row.get("role_label") or role,
        "permissionSummary": row.get("permission_summary") or "조회 · 기록",
        "viewPermission": row.get("view_permission") or "allowed",
        "recordPermission": row.get("record_permission") or "allowed",
        "strategyPermission": row.get("strategy_permission") or "readonly",
        "executionPermission": row.get("execution_permission") or "request",
        "safetyPermission": row.get("safety_permission") or "readonly",
        "settingsPermission": row.get("settings_permission") or "none",
        "status": row.get("status") or "active",
        "note": row.get("note") or "",
        "createdAt": _fmt_time(row.get("created_at")),
        "updatedAt": _fmt_time(row.get("updated_at")),
        "tone": tone,
    }


async def list_role_permissions(hass) -> list[dict[str, Any]]:
    if fetchall is None:
        raise RuntimeError("green_smart db helpers unavailable outside package runtime")
    await ensure_role_permissions_schema(hass)
    rows = await fetchall(
        hass,
        """
        SELECT role, role_label, permission_summary, view_permission, record_permission, strategy_permission, execution_permission, safety_permission, settings_permission, status, note, created_at, updated_at
        FROM gs_role_permissions
        ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'farm_owner' THEN 2 WHEN 'farm_staff' THEN 3 ELSE 9 END, role
        """,
    )
    return [_role_permission_dto(row) for row in rows]


def _role_permission_payload(payload: dict[str, Any]) -> dict[str, str]:
    def pick(*keys: str, default: str = "") -> str:
        for key in keys:
            if payload.get(key) is not None:
                return str(payload.get(key) or "").strip()
        return default
    return {
        "role": pick("role", default="farm_staff"),
        "role_label": pick("roleLabel", "role_label", default="농장 작업자"),
        "permission_summary": pick("permissionSummary", "permission_summary", default="조회 · 기록"),
        "view_permission": pick("viewPermission", "view_permission", default="allowed"),
        "record_permission": pick("recordPermission", "record_permission", default="allowed"),
        "strategy_permission": pick("strategyPermission", "strategy_permission", default="readonly"),
        "execution_permission": pick("executionPermission", "execution_permission", default="request"),
        "safety_permission": pick("safetyPermission", "safety_permission", default="readonly"),
        "settings_permission": pick("settingsPermission", "settings_permission", default="none"),
        "status": pick("status", default="active"),
        "note": pick("note", default=""),
    }


async def upsert_role_permission(hass, user: Any | None, payload: dict[str, Any], role_id: str | None = None) -> dict[str, Any]:
    await ensure_role_permissions_schema(hass)
    actor = _ha_user_id(user) or "admin"
    data = _role_permission_payload(payload)
    if role_id:
        data["role"] = str(payload.get("role") or role_id).strip() or role_id
        await execute(
            hass,
            """
            UPDATE gs_role_permissions SET role=%s, role_label=%s, permission_summary=%s, view_permission=%s, record_permission=%s, strategy_permission=%s, execution_permission=%s, safety_permission=%s, settings_permission=%s, status=%s, note=%s, updated_by=%s WHERE role=%s
            """,
            (data["role"], data["role_label"], data["permission_summary"], data["view_permission"], data["record_permission"], data["strategy_permission"], data["execution_permission"], data["safety_permission"], data["settings_permission"], data["status"], data["note"], actor, role_id),
        )
        action = "role_permission_updated"
    else:
        await execute(
            hass,
            """
            INSERT INTO gs_role_permissions (role, role_label, permission_summary, view_permission, record_permission, strategy_permission, execution_permission, safety_permission, settings_permission, status, note, created_by, updated_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE role_label=VALUES(role_label), permission_summary=VALUES(permission_summary), view_permission=VALUES(view_permission), record_permission=VALUES(record_permission), strategy_permission=VALUES(strategy_permission), execution_permission=VALUES(execution_permission), safety_permission=VALUES(safety_permission), settings_permission=VALUES(settings_permission), status=VALUES(status), note=VALUES(note), updated_by=VALUES(updated_by)
            """,
            (data["role"], data["role_label"], data["permission_summary"], data["view_permission"], data["record_permission"], data["strategy_permission"], data["execution_permission"], data["safety_permission"], data["settings_permission"], data["status"], data["note"], actor, actor),
        )
        action = "role_permission_created"
    await execute(hass, "INSERT INTO gs_audit_logs (actor, action, summary, target_ref, result) VALUES (%s, %s, %s, %s, 'ok')", (actor, action, f"역할 권한 {data['role']} 저장", data["role"]))
    return {"ok": True, "role": data["role"], "settingsUsersPermissions": await settings_users_permissions_response(hass, user)}


async def delete_role_permission(hass, user: Any | None, role_id: str) -> dict[str, Any]:
    await ensure_role_permissions_schema(hass)
    actor = _ha_user_id(user) or "admin"
    affected = await execute(hass, "DELETE FROM gs_role_permissions WHERE role = %s", (role_id,))
    await execute(hass, "INSERT INTO gs_audit_logs (actor, action, summary, target_ref, result) VALUES (%s, 'role_permission_deleted', %s, %s, 'ok')", (actor, f"역할 권한 {role_id} 삭제", role_id))
    return {"ok": True, "deletedRole": role_id, "affectedRows": affected, "settingsUsersPermissions": await settings_users_permissions_response(hass, user)}

def settings_users_permissions_response_from_rows(*, users: list[dict[str, Any]], approvals: list[dict[str, Any]], audits: list[dict[str, Any]], role_permissions: list[dict[str, Any]] | None = None, source: str = SETTINGS_USERS_PERMISSIONS_SOURCE) -> dict[str, Any]:
    """Map DB rows into the rebuild settings/users-permissions DTO."""
    user_rows = [
        {
            "id": row.get("id"),
            "kind": row.get("display_name") or row.get("ha_user_id") or "사용자",
            "displayName": row.get("display_name") or "",
            "at": row.get("role") or "farm_staff",
            "role": row.get("role") or "farm_staff",
            "memo": f"{row.get('status') or 'active'} · {_fmt_time(row.get('last_seen_at'))}",
            "state": row.get("permission_summary") or "조회 · 기록",
            "permissionSummary": row.get("permission_summary") or "조회 · 기록",
            "status": row.get("status") or "active",
            "lastSeenAt": _fmt_time(row.get("last_seen_at")),
            "createdAt": _fmt_time(row.get("created_at")),
            "updatedAt": _fmt_time(row.get("updated_at")),
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
            "requestType": row.get("request_type") or "승인 요청",
            "requester": row.get("requester") or "",
            "requestedRole": row.get("requested_role") or "farm_staff",
            "createdBy": row.get("created_by") or "",
            "createdAt": _fmt_time(row.get("created_at")),
            "note": row.get("note") or "",
            "meta": " · ".join([str(v) for v in [row.get("requester"), row.get("requested_role"), row.get("status")] if v]),
            "icon": row.get("icon") or "mdi:account-clock-outline",
            "tone": row.get("tone") or "amber",
            "status": row.get("status") or "pending",
            "approvalStage": "review-pending" if str(row.get("status") or "pending") in {"pending", "requested"} else str(row.get("status") or "pending"),
            "riskLevel": "높음" if row.get("tone") == "red" else "낮음" if row.get("tone") == "green" else "중간",
            "target": row.get("requester") or "대상 미지정",
            "beforeValue": "승인 전 상태",
            "afterValue": row.get("requested_role") or "요청값 미지정",
            "scope": "사용자·권한",
            "validationChecks": ["requester", "reason", "approver-memo"],
        }
        for row in approvals
    ]
    audit_rows = [
        {
            "id": row.get("id"),
            "label": row.get("action") or row.get("actor") or "감사 로그",
            "actor": row.get("actor") or "system",
            "action": row.get("action") or "audit",
            "meta": _fmt_time(row.get("created_at")),
            "createdAt": _fmt_time(row.get("created_at")),
            "summary": row.get("summary") or row.get("action") or "감사 로그",
            "target": row.get("target_ref") or "대상 미지정",
            "targetRef": row.get("target_ref") or "",
            "result": row.get("result") or "ok",
            "status": row.get("result") or "ok",
            "icon": "mdi:account-check-outline",
            "tone": "green" if row.get("result", "ok") == "ok" else "red" if row.get("result") == "rejected" else "amber",
        }
        for row in audits
    ]
    return {
        "ok": True,
        "source": source,
        "users": user_rows,
        "approvalRows": approval_rows,
        "auditRows": audit_rows,
        "rolePermissions": role_permissions or [],
        "counts": {"users": len(user_rows), "approvals": len(approval_rows), "audits": len(audit_rows), "rolePermissions": len(role_permissions or [])},
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
    role_permissions = await list_role_permissions(hass)
    users = await fetchall(
        hass,
        """
        SELECT id, ha_user_id, display_name, role, status, permission_summary, last_seen_at, created_at, updated_at
        FROM gs_users
        ORDER BY last_seen_at DESC, updated_at DESC, id DESC
        LIMIT 50
        """,
    )
    approvals = await fetchall(
        hass,
        """
        SELECT id, request_type, requester, requested_role, status, icon, tone, note, created_by, created_at
        FROM gs_approval_requests
        WHERE status IN ('pending', 'requested')
        ORDER BY created_at DESC, id DESC
        LIMIT 20
        """,
    )
    audits = await fetchall(
        hass,
        """
        SELECT id, actor, action, summary, target_ref, result, created_at
        FROM gs_audit_logs
        ORDER BY created_at DESC, id DESC
        LIMIT 20
        """,
    )
    return settings_users_permissions_response_from_rows(users=users, approvals=approvals, audits=audits, role_permissions=role_permissions)


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


def _permission_summary_for_role(role: str) -> str:
    return "전체 설정" if role == "admin" else "승인 · 전략" if role == "farm_owner" else "기록 · 모니터링"


def _valid_role(role: Any) -> str:
    value = str(role or "farm_staff").strip()
    return value if value in {"admin", "farm_owner", "farm_staff"} else "farm_staff"


def _valid_user_status(status: Any) -> str:
    value = str(status or "active").strip()
    return value if value in {"active", "pending", "disabled", "approved"} else "active"


async def _json_payload(request: web.Request) -> dict[str, Any]:
    try:
        payload = await request.json()
    except Exception:
        payload = {}
    return payload if isinstance(payload, dict) else {}


async def create_permission_change_request(hass, user: Any | None, payload: dict[str, Any]) -> dict[str, Any]:
    """Create an approval request from the permission-matrix content card."""
    if execute is None:
        raise RuntimeError("green_smart db helpers unavailable outside package runtime")
    actor_id = _ha_user_id(user)
    actor_name = _ha_user_name(user) or actor_id or "system"
    bucket = str(payload.get("bucket") or payload.get("permissionBucket") or "권한 버킷").strip() or "권한 버킷"
    requested_role = _valid_role(payload.get("requestedRole") or payload.get("role") or "farm_staff")
    note = str(payload.get("note") or f"{bucket} 권한 버킷 변경 요청").strip()
    new_id = await execute(
        hass,
        """
        INSERT INTO gs_approval_requests (request_type, requester, requested_role, status, icon, tone, note, created_by)
        VALUES ('권한 변경', %s, %s, 'pending', 'mdi:table-key', 'blue', %s, %s)
        """,
        (actor_name, requested_role, note, actor_id),
    )
    await execute(
        hass,
        """
        INSERT INTO gs_audit_logs (actor, action, summary, target_ref, result)
        VALUES (%s, 'permission_change_requested', %s, %s, 'ok')
        """,
        (actor_id or actor_name, f"권한 변경 요청: {bucket} → {requested_role}", bucket),
    )
    return {"ok": True, "requestId": new_id, "requestType": "권한 변경", "bucket": bucket, "requestedRole": requested_role, "settingsUsersPermissions": await settings_users_permissions_response(hass, user)}


async def update_settings_user_role(hass, ha_user_id: str, user: Any | None, payload: dict[str, Any]) -> dict[str, Any]:
    """Update a user's role/status from the Settings > 사용자·권한 card action."""
    if fetchall is None or execute is None:
        raise RuntimeError("green_smart db helpers unavailable outside package runtime")
    actor_id = _ha_user_id(user)
    actor_role, _source = await async_get_green_smart_user_role(hass, actor_id, is_ha_admin=_ha_user_is_admin(user))
    if actor_role != "admin":
        return {"ok": False, "reasonCode": "admin_required", "status": 403}
    target = str(ha_user_id or "").strip()
    if not target:
        return {"ok": False, "reasonCode": "ha_user_id_required", "status": 400}
    role = _valid_role(payload.get("role"))
    status = _valid_user_status(payload.get("status") or "active")
    display_name = str(payload.get("displayName") or payload.get("display_name") or "").strip()
    permission_summary = str(payload.get("permissionSummary") or payload.get("permission_summary") or _permission_summary_for_role(role))
    existing = await fetchall(hass, "SELECT ha_user_id, display_name, role, status, permission_summary FROM gs_users WHERE ha_user_id=%s LIMIT 1", (target,))
    if not existing:
        return {"ok": False, "reasonCode": "settings_user_not_found", "status": 404}
    if not display_name:
        display_name = str(existing[0].get("display_name") or target)
    await execute(
        hass,
        "UPDATE gs_users SET display_name = %s, role = %s, status = %s, permission_summary = %s WHERE ha_user_id = %s",
        (display_name, role, status, permission_summary, target),
    )
    await execute(
        hass,
        """
        INSERT INTO gs_audit_logs (actor, action, summary, target_ref, result)
        VALUES (%s, 'settings_user_role_updated', %s, %s, 'ok')
        """,
        (actor_id or "admin", f"사용자 역할 변경: {target} → {role}/{status}", target),
    )
    return {"ok": True, "haUserId": target, "role": role, "status": status, "permissionSummary": permission_summary, "settingsUsersPermissions": await settings_users_permissions_response(hass, user)}


async def approve_user_approval_request(hass, request_id: str, actor: Any | None = None, payload: dict[str, Any] | None = None) -> dict[str, Any]:
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
    decision_payload = payload or {}
    decision = str(payload.get("decision") if payload else decision_payload.get("decision") or "approve").strip().lower()
    memo = str(decision_payload.get("memo") or "").strip()
    target_id = str(row.get("created_by") or "")
    if decision in {"reject", "rejected", "deny", "denied"}:
        await execute(
            hass,
            "UPDATE gs_users SET status = 'rejected', permission_summary = %s WHERE ha_user_id = %s",
            ("승인 거부", target_id),
        )
        await execute(
            hass,
            """
            UPDATE gs_approval_requests SET status='rejected', decided_by=%s, decided_at=NOW(), note=CONCAT(COALESCE(note,''), %s)
            WHERE id=%s
            """,
            (actor_id, f"\n반려 메모: {memo}" if memo else "", request_id),
        )
        await execute(
            hass,
            """
            INSERT INTO gs_audit_logs (actor, action, summary, target_ref, result)
            VALUES (%s, 'reject_user_access', %s, %s, 'rejected')
            """,
            (actor_id or "admin", f"승인 거부: {row.get('requester') or target_id} Green Smart 접근 반려", target_id or request_id),
        )
        return {"ok": True, "requestId": request_id, "rejectedHaUserId": target_id, "status": "rejected", "settingsUsersPermissions": await settings_users_permissions_response(hass, actor)}
    requested_role = str(row.get("requested_role") or "farm_staff")
    await execute(
        hass,
        """
        INSERT INTO gs_users (ha_user_id, display_name, role, status, permission_summary, last_seen_at)
        VALUES (%s, %s, %s, %s, %s, NOW())
        ON DUPLICATE KEY UPDATE
            role = VALUES(role),
            status = %s,
            permission_summary = VALUES(permission_summary),
            last_seen_at = NOW()
        """,
        (target_id, row.get("requester") or target_id, requested_role, "active", _permission_summary_for_role(requested_role), "active"),
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
        (actor_id or "admin", f"사용자 승인: {row.get('requester') or target_id} Green Smart 접근 승인 → {row.get('requested_role') or 'farm_staff'}", target_id),
    )
    return {"ok": True, "requestId": request_id, "approvedHaUserId": target_id, "status": "approved", "settingsUsersPermissions": await settings_users_permissions_response(hass, actor)}


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
        payload = await _json_payload(request)
        result = await approve_user_approval_request(hass, request_id, user, payload)
        status_code = int(result.pop("status", 200))
        if status_code != 200:
            return web.json_response(result, status=status_code)
        return self.json(result)


async def update_settings_audit_log(hass, audit_id: str, user: Any | None, payload: dict[str, Any]) -> dict[str, Any]:
    """Reject or edit the selected Settings audit-log row in gs_audit_logs."""
    if fetchall is None or execute is None:
        raise RuntimeError("green_smart db helpers unavailable outside package runtime")
    actor_id = _ha_user_id(user)
    actor_role, _source = await async_get_green_smart_user_role(hass, actor_id, is_ha_admin=_ha_user_is_admin(user))
    if actor_role != "admin":
        return {"ok": False, "reasonCode": "admin_required", "status": 403}
    target_id = str(audit_id or "").strip()
    if not target_id:
        return {"ok": False, "reasonCode": "audit_id_required", "status": 400}
    rows = await fetchall(
        hass,
        "SELECT id, actor, action, summary, target_ref, result FROM gs_audit_logs WHERE id=%s LIMIT 1",
        (target_id,),
    )
    if not rows:
        return {"ok": False, "reasonCode": "audit_log_not_found", "status": 404}
    row = rows[0]
    decision = str(payload.get("decision") or payload.get("operation") or "edit").strip().lower()
    memo = str(payload.get("memo") or payload.get("summary") or "").strip()
    if decision in {"reject", "rejected", "deny", "denied"}:
        next_actor = str(row.get("actor") or "")
        next_action = "audit_log_rejected"
        next_result = "rejected"
        next_target_ref = row.get("target_ref")
        next_summary = memo or f"거부됨: {row.get('summary') or row.get('action') or target_id}"
    else:
        next_actor = str(payload.get("actor") or row.get("actor") or "").strip()
        next_action = str(payload.get("action") or "audit_log_edited").strip() or "audit_log_edited"
        next_summary = str(payload.get("summary") or memo or row.get("summary") or row.get("action") or target_id).strip()
        next_target_ref = str(payload.get("target_ref") or payload.get("targetRef") or row.get("target_ref") or "").strip() or None
        next_result = str(payload.get("result") or "edited").strip() or "edited"
    await execute(
        hass,
        "UPDATE gs_audit_logs SET actor=%s, action=%s, summary=%s, target_ref=%s, result=%s WHERE id=%s",
        (next_actor, next_action, next_summary, next_target_ref, next_result, target_id),
    )
    await execute(
        hass,
        """
        INSERT INTO gs_audit_logs (actor, action, summary, target_ref, result)
        VALUES (%s, %s, %s, %s, 'ok')
        """,
        (actor_id or "admin", f"settings_{next_action}", f"감사 로그 row {target_id} {('거부' if next_result == 'rejected' else '수정')}: {row.get('summary') or row.get('action') or ''}", target_id),
    )
    return {"ok": True, "auditId": target_id, "actor": next_actor, "action": next_action, "targetRef": next_target_ref or "", "result": next_result, "summary": next_summary, "settingsUsersPermissions": await settings_users_permissions_response(hass, user)}


class RebuildSettingsAuditLogItemView(HomeAssistantView):
    """PATCH /api/green_smart/rebuild/settings/audit-logs/{audit_id}."""

    url = "/api/green_smart/rebuild/settings/audit-logs/{audit_id}"
    name = "api:green_smart:rebuild:settings:audit_log_item"
    requires_auth = True

    async def patch(self, request: web.Request, audit_id: str) -> web.Response:
        hass = request.app["hass"]
        user = _ha_user_from_request(request)
        result = await update_settings_audit_log(hass, audit_id, user, await _json_payload(request))
        status_code = int(result.pop("status", 200))
        if status_code != 200:
            return web.json_response(result, status=status_code)
        return self.json(result)


class RebuildSettingsPermissionChangeRequestView(HomeAssistantView):
    """POST /api/green_smart/rebuild/settings/permission-change-request."""

    url = "/api/green_smart/rebuild/settings/permission-change-request"
    name = "api:green_smart:rebuild:settings:permission_change_request"
    requires_auth = True

    async def post(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        user = _ha_user_from_request(request)
        return self.json(await create_permission_change_request(hass, user, await _json_payload(request)))


class RebuildSettingsUserRoleView(HomeAssistantView):
    """PATCH /api/green_smart/rebuild/settings/users/{ha_user_id}."""

    url = "/api/green_smart/rebuild/settings/users/{ha_user_id}"
    name = "api:green_smart:rebuild:settings:user_role"
    requires_auth = True

    async def patch(self, request: web.Request, ha_user_id: str) -> web.Response:
        hass = request.app["hass"]
        user = _ha_user_from_request(request)
        result = await update_settings_user_role(hass, ha_user_id, user, await _json_payload(request))
        if result.get("ok") is False and isinstance(result.get("status"), int):
            status_code = int(result.pop("status", 400))
            return web.json_response(result, status=status_code)
        return self.json(result)



class RebuildSettingsRolePermissionsView(HomeAssistantView):
    """GET/POST /api/green_smart/rebuild/settings/role-permissions."""

    url = "/api/green_smart/rebuild/settings/role-permissions"
    name = "api:green_smart:rebuild:settings:role_permissions"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        return self.json({"ok": True, "rolePermissions": await list_role_permissions(hass)})

    async def post(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        user = _ha_user_from_request(request)
        return self.json(await upsert_role_permission(hass, user, await _json_payload(request)))


class RebuildSettingsRolePermissionItemView(HomeAssistantView):
    """PATCH/DELETE /api/green_smart/rebuild/settings/role-permissions/{role_id}."""

    url = "/api/green_smart/rebuild/settings/role-permissions/{role_id}"
    name = "api:green_smart:rebuild:settings:role_permission_item"
    requires_auth = True

    async def patch(self, request: web.Request, role_id: str) -> web.Response:
        hass = request.app["hass"]
        user = _ha_user_from_request(request)
        return self.json(await upsert_role_permission(hass, user, await _json_payload(request), role_id=role_id))

    async def delete(self, request: web.Request, role_id: str) -> web.Response:
        hass = request.app["hass"]
        user = _ha_user_from_request(request)
        return self.json(await delete_role_permission(hass, user, role_id))

class RebuildSettingsUsersPermissionsView(HomeAssistantView):
    """GET /api/green_smart/rebuild/settings/users-permissions."""

    url = "/api/green_smart/rebuild/settings/users-permissions"
    name = "api:green_smart:rebuild:settings:users_permissions"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        user = _ha_user_from_request(request)
        return self.json(await settings_users_permissions_response(hass, user))
