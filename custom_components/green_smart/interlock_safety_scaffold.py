"""Pure VS-N004 interlock/safety core scaffold.

This module is intentionally Home Assistant independent. VS-N004 defines the
safety/interlock read-only DTO, permission, and state-gate boundaries only. It
does not connect existing safety runtime, change execution decisions, release
approval/override authority, publish device commands, or render a panel card.
"""

from __future__ import annotations

from typing import Any

INTERLOCK_SAFETY_DTO_FIELDS = (
    "zone_id",
    "crop_cycle_id",
    "monitoringState",
    "safetyStateGateBoundary",
    "safetyMode",
    "dtoBoundary",
    "requiredPermission",
    "readOnly",
    "writeEnabled",
    "runtimeSafetyAdapterEnabled",
    "executionDecisionEnabled",
    "approvalOverrideEnabled",
    "dbMigrationEnabled",
    "deviceCommandEnabled",
)

INTERLOCK_SAFETY_PERMISSION_BOUNDARY = {
    "requiredPermission": "safety.core.read",
    "legacyAlias": "view_safety_status",
    "bucket": "안전",
    "backendEnforcement": "backend permission enforcement before UI-only hiding",
}

INTERLOCK_SAFETY_NON_GOALS = (
    "No DB migration in VS-N004",
    "No existing SafetyGuard runtime behavior change in VS-N004",
    "No existing Interlock runtime behavior change in VS-N004",
    "No execution decision change in VS-N004",
    "No approval/override release in VS-N004",
    "No device command in VS-N004",
    "No panel safety card in VS-N004",
)


def normalize_interlock_safety_core_scaffold(
    *,
    actor_role: str | None,
    zone_id: int | str | None = None,
    crop_cycle_id: int | str | None = None,
    monitoring_state: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Return the read-only VS-N004 safety/interlock scaffold DTO.

    This helper only preserves the product boundary. It never calls runtime
    safety, interlock, approval, device, MQTT, or Home Assistant services.
    """

    normalized_role = str(actor_role or "farm_staff").strip() or "farm_staff"
    return {
        "interlockSafetyCoreScaffold": True,
        "safetyMode": "scaffold_only",
        "dtoBoundary": "safety/interlock read-only",
        "requiredPermission": INTERLOCK_SAFETY_PERMISSION_BOUNDARY["requiredPermission"],
        "actorRole": normalized_role,
        "canViewSafetyScaffold": True,
        "zone_id": zone_id,
        "crop_cycle_id": crop_cycle_id,
        "monitoringState": dict(monitoring_state or {}),
        "safetyStateGateBoundary": "safety state gate boundary",
        "readOnly": True,
        "writeEnabled": False,
        "runtimeSafetyAdapterEnabled": False,
        "executionDecisionEnabled": False,
        "approvalOverrideEnabled": False,
        "dbMigrationEnabled": False,
        "existingSafetyGuardBehaviorChanged": False,
        "existingInterlockBehaviorChanged": False,
        "compatibilityRoutePreserved": True,
        "deviceCommandEnabled": False,
    }
