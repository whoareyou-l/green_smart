"""Green Smart RBAC helpers and auth HTTP views.

RBAC source of truth: Home Assistant user ID -> Green Smart role mapping.
"""

from __future__ import annotations

from typing import Any

from aiohttp import web
from homeassistant.components.http import HomeAssistantView
from homeassistant.helpers.storage import Store

from .const import DOMAIN

GREEN_SMART_ROLES = ("admin", "farm_owner", "farm_staff")
GREEN_SMART_HA_USER_ROLE_STORE_KEY = f"{DOMAIN}_ha_user_roles"
_GREEN_SMART_HA_USER_ROLE_STORE_VERSION = 1

GREEN_SMART_ROLE_PERMISSIONS: dict[str, tuple[str, ...]] = {
    "admin": (
        "view_dashboard",
        "view_crop_records",
        "edit_crop_records",
        "manage_crop_seasons",
        "view_control_pages",
        "edit_strategy_settings",
        "edit_interlock_thresholds",
        "edit_interlock_rules",
        "edit_entity_mapping",
        "run_dry_run",
        "execute_final_targets",
        "manual_device_control",
        "ack_safety_event",
        "clear_safety_event",
        "manage_users_roles",
        "system_settings",
        "view_audit_logs",
    ),
    "farm_owner": (
        "view_dashboard",
        "view_crop_records",
        "edit_crop_records",
        "manage_crop_seasons",
        "view_control_pages",
        "edit_strategy_settings",
        "edit_interlock_thresholds",
        "run_dry_run",
        "execute_final_targets",
        "manual_device_control",
        "view_audit_logs",
    ),
    "farm_staff": (
        "view_dashboard",
        "view_crop_records",
        "edit_crop_records",
        "view_control_pages",
        "run_dry_run",
        "manual_device_control",
    ),
}


def normalize_green_smart_role(role: str | None) -> str:
    """Return a known Green Smart role, defaulting to farm_staff for safety."""
    value = str(role or "").strip()
    return value if value in GREEN_SMART_ROLES else "farm_staff"


def permissions_for_role(role: str | None) -> list[str]:
    """Return permissions for a Green Smart role."""
    return list(GREEN_SMART_ROLE_PERMISSIONS[normalize_green_smart_role(role)])


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


async def async_set_green_smart_user_role(hass, ha_user_id: str, role: str) -> dict[str, str]:
    """Persist a Home Assistant user ID -> Green Smart role mapping."""
    normalized = normalize_green_smart_role(role)
    data = await _load_role_map(hass)
    roles = _roles_from_data(data)
    roles[str(ha_user_id)] = normalized
    data["roles"] = roles
    store = Store(hass, _GREEN_SMART_HA_USER_ROLE_STORE_VERSION, GREEN_SMART_HA_USER_ROLE_STORE_KEY)
    await store.async_save(data)
    return {"ha_user_id": str(ha_user_id), "role": normalized}


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
