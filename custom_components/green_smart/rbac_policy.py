"""Pure Green Smart RBAC/Admin ownership policy.

This module is intentionally Home Assistant independent so rebuild slices can
contract-test role/permission ownership without booting Home Assistant.
"""

from __future__ import annotations

GREEN_SMART_ROLES = ("admin", "farm_owner", "farm_staff")

RBAC_UI_BUCKETS = ("조회", "기록", "전략", "실행", "안전", "고급설정")
RBAC_VISIBILITY_STATES = (
    "visible_enabled",
    "visible_disabled",
    "summary_only",
    "hidden",
)

RBAC_BACKEND_ENFORCED_ACTION_CLASSES = (
    "write",
    "execute",
    "save",
    "delete",
    "ack",
    "clear",
    "apply",
)

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
        "manage_farm_staff_roles",
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
        "manage_farm_staff_roles",
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

RBAC_ROLE_OWNERSHIP = {
    "admin": {
        "label": "어드민",
        "owns": ("system_settings", "ha_mapping", "rbac", "diagnostics", "config_metadata"),
    },
    "farm_owner": {
        "label": "농장주",
        "owns": ("approvals", "strategy_review", "high_impact_operation_review", "farm_staff_role_assignment"),
    },
    "farm_staff": {
        "label": "농장직원",
        "owns": ("daily_records", "routine_monitoring", "allowed_routine_actions"),
    },
}

RBAC_PERMISSION_BUCKETS = {
    "조회": ("view_dashboard", "view_crop_records", "view_control_pages"),
    "기록": ("edit_crop_records", "manage_crop_seasons"),
    "전략": ("edit_strategy_settings",),
    "실행": ("run_dry_run", "execute_final_targets", "manual_device_control"),
    "안전": ("ack_safety_event", "clear_safety_event", "edit_interlock_thresholds", "edit_interlock_rules"),
    "고급설정": ("manage_users_roles", "manage_farm_staff_roles", "system_settings", "edit_entity_mapping"),
}

RBAC_ADMIN_OWNERSHIP = {
    "user_role_mapping": "admin owns all role mapping; farm_owner may assign/revoke farm_staff only",
    "ha_entity_mapping": "admin",
    "system_config": "admin",
    "diagnostics": "admin",
    "backup_audit_export": "admin",
}

ROLE_ASSIGNMENT_RULES = {
    "admin": GREEN_SMART_ROLES,
    "farm_owner": ("farm_staff",),
    "farm_staff": (),
}


def normalize_green_smart_role(role: str | None) -> str:
    """Return a known Green Smart role, defaulting safely to farm_staff."""
    value = str(role or "").strip()
    return value if value in GREEN_SMART_ROLES else "farm_staff"


def permissions_for_role(role: str | None) -> list[str]:
    """Return product permissions for a role."""
    return list(GREEN_SMART_ROLE_PERMISSIONS[normalize_green_smart_role(role)])


def can_assign_role(actor_role: str | None, target_role: str | None) -> bool:
    """Return whether actor_role may assign/revoke target_role."""
    actor = normalize_green_smart_role(actor_role)
    target = normalize_green_smart_role(target_role)
    return target in ROLE_ASSIGNMENT_RULES.get(actor, ())


def role_assignment_authorization(actor_role: str | None, target_role: str | None) -> dict[str, object]:
    """Return a structured decision for role assignment/revocation.

    `farm_owner` can assign/revoke only `farm_staff`; `admin` can assign all
    Green Smart roles; `farm_staff` cannot assign roles.
    """
    actor = normalize_green_smart_role(actor_role)
    target = normalize_green_smart_role(target_role)
    allowed = can_assign_role(actor, target)
    required_permission = "manage_users_roles"
    if actor == "farm_owner" and target == "farm_staff":
        required_permission = "manage_farm_staff_roles"
    return {
        "allowed": allowed,
        "actorRole": actor,
        "targetRole": target,
        "requiredPermission": required_permission,
        "reasonCode": None if allowed else "role_assignment_not_allowed",
    }


def action_requires_backend_enforcement(action_class: str | None) -> bool:
    """Return whether an action class must be backend-enforced."""
    return str(action_class or "").strip() in RBAC_BACKEND_ENFORCED_ACTION_CLASSES
