"""Green Smart RBAC helpers and auth HTTP views.

RBAC source of truth: Home Assistant user ID -> Green Smart role mapping.
"""

from __future__ import annotations

from typing import Any

from aiohttp import web
from homeassistant.components.http import HomeAssistantView
from homeassistant.helpers.storage import Store

from .const import DOMAIN
from .rbac_policy import (
    GREEN_SMART_ROLE_PERMISSIONS,
    GREEN_SMART_ROLES,
    can_assign_role,
    normalize_green_smart_role,
    permissions_for_role,
    role_assignment_authorization,
)

# Compatibility source marker: farm_owner receives manage_farm_staff_roles only;
# admin keeps manage_users_roles/system_settings.
# Static compatibility roles: "admin", "farm_owner", "farm_staff".
GREEN_SMART_HA_USER_ROLE_STORE_KEY = f"{DOMAIN}_ha_user_roles"
_GREEN_SMART_HA_USER_ROLE_STORE_VERSION = 1


def _ha_user_from_request(request: web.Request) -> Any | None:
    """Best-effort Home Assistant user lookup from an authenticated request."""
    return request.get("hass_user") or request.get("user")


def _ha_user_id(user: Any | None) -> str:
    return str(getattr(user, "id", "") or getattr(user, "user_id", "") or "")


def _ha_user_name(user: Any | None) -> str:
    return str(getattr(user, "name", "") or getattr(user, "display_name", "") or "")


def _ha_user_is_admin(user: Any | None) -> bool:
    return bool(getattr(user, "is_admin", False) or getattr(user, "admin", False))


async def _load_role_map(hass) -> dict[str, Any]:
    store = Store(hass, _GREEN_SMART_HA_USER_ROLE_STORE_VERSION, GREEN_SMART_HA_USER_ROLE_STORE_KEY)
    data = await store.async_load()
    return data if isinstance(data, dict) else {"roles": {}}


def _roles_from_data(data: dict[str, Any]) -> dict[str, str]:
    roles = data.get("roles")
    if not isinstance(roles, dict):
        return {}
    return {str(key): normalize_green_smart_role(str(value)) for key, value in roles.items()}


async def async_get_green_smart_user_role(hass, ha_user_id: str, *, is_ha_admin: bool = False) -> tuple[str, str]:
    """Resolve a Green Smart role for a Home Assistant user ID.

    Returns (role, roleSource). HA admins default to `admin`; unmapped non-admin users
    default to `farm_staff` so safe read/record flows remain available.
    """
    data = await _load_role_map(hass)
    roles = _roles_from_data(data)
    if ha_user_id and str(ha_user_id) in roles:
        return roles[str(ha_user_id)], "ha_user_role_mapping"
    if is_ha_admin:
        return "admin", "ha_admin_default"
    return "farm_staff", "default_farm_staff"


async def async_set_green_smart_user_role(hass, ha_user_id: str, role: str, *, actor_role: str | None = None) -> dict[str, Any]:
    """Persist a Home Assistant user ID -> Green Smart role mapping after authorization."""
    normalized = normalize_green_smart_role(role)
    assignment_decision = role_assignment_authorization(actor_role, normalized)
    if not assignment_decision["allowed"]:
        raise PermissionError("role_assignment_not_allowed")
    data = await _load_role_map(hass)
    roles = _roles_from_data(data)
    roles[str(ha_user_id)] = normalized
    data["roles"] = roles
    store = Store(hass, _GREEN_SMART_HA_USER_ROLE_STORE_VERSION, GREEN_SMART_HA_USER_ROLE_STORE_KEY)
    await store.async_save(data)
    return {"ha_user_id": str(ha_user_id), "role": normalized, "assignmentDecision": assignment_decision}


class GreenSmartRoleAssignmentView(HomeAssistantView):
    """POST /api/green_smart/auth/roles/{ha_user_id} — authorized role assignment."""

    url = "/api/green_smart/auth/roles/{ha_user_id}"
    name = "api:green_smart:auth:roles"
    requires_auth = True

    async def post(self, request: web.Request, ha_user_id: str) -> web.Response:
        hass = request.app["hass"]
        user = _ha_user_from_request(request)
        actor_ha_user_id = _ha_user_id(user)
        actor_role, _role_source = await async_get_green_smart_user_role(
            hass,
            actor_ha_user_id,
            is_ha_admin=_ha_user_is_admin(user),
        )
        try:
            body = await request.json()
        except Exception:
            body = {}
        requested_role = normalize_green_smart_role(body.get("role") if isinstance(body, dict) else None)
        try:
            result = await async_set_green_smart_user_role(
                hass,
                ha_user_id,
                requested_role,
                actor_role=actor_role,
            )
        except PermissionError:
            assignment_decision = role_assignment_authorization(actor_role, requested_role)
            return web.json_response(
                {
                    "ok": False,
                    "reasonCode": "role_assignment_not_allowed",
                    "assignmentDecision": assignment_decision,
                },
                status=403,
            )
        return self.json({"ok": True, **result})


class GreenSmartAuthMeView(HomeAssistantView):
    """GET /api/green_smart/auth/me — current HA user mapped to Green Smart RBAC."""

    url = "/api/green_smart/auth/me"
    name = "api:green_smart:auth:me"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        user = _ha_user_from_request(request)
        ha_user_id = _ha_user_id(user)
        role, role_source = await async_get_green_smart_user_role(
            hass,
            ha_user_id,
            is_ha_admin=_ha_user_is_admin(user),
        )
        return self.json(
            {
                "ha_user_id": ha_user_id,
                "userId": ha_user_id,
                "displayName": _ha_user_name(user),
                "role": role,
                "roleSource": role_source,
                "permissions": permissions_for_role(role),
            }
        )
