"""Pure VS-N002 crop cycle recording scaffold.

This module is intentionally Home Assistant independent.  VS-N002 defines the
crop_cycle/currentCrop DTO and permission boundary only; it does not connect
runtime write routes, DB migrations, MQTT, or device execution.
"""

from __future__ import annotations

from typing import Any

CROP_CYCLE_RECORDING_DTO_FIELDS = (
    "crop_cycle_id",
    "zone_id",
    "currentCrop",
    "recordingState",
    "recordingMode",
    "dtoBoundary",
    "requiredPermission",
    "sourceCompatibility",
    "readOnly",
    "writeEnabled",
    "runtimeWriteAdapterEnabled",
    "dbMigrationEnabled",
)

CROP_CYCLE_RECORDING_PERMISSION_BOUNDARY = {
    "requiredPermission": "crop_cycle.write",
    "legacyAlias": "manage_crop_seasons",
    "bucket": "기록",
    "backendEnforcement": "backend permission enforcement before UI-only hiding",
}

CROP_CYCLE_RECORDING_NON_GOALS = (
    "No DB migration in VS-N002",
    "No write/mutation in VS-N002",
    "No existing crop season save behavior change in VS-N002",
    "No production route removal in VS-N002",
    "No physical MQTT/device hookup in VS-N002",
    "No approval/execution release in VS-N002",
)

_CROP_CYCLE_WRITE_ROLES = {"admin", "farm_owner"}


def normalize_crop_cycle_recording_scaffold(
    *,
    actor_role: str | None,
    zone_id: int | str | None = None,
    current_crop: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Return the read-only VS-N002 crop cycle recording scaffold DTO.

    `canScaffoldRecord` is a policy/DTO signal only.  It does not enable an
    existing save route or write adapter in this slice.
    """

    normalized_role = str(actor_role or "farm_staff").strip() or "farm_staff"
    can_scaffold_record = normalized_role in _CROP_CYCLE_WRITE_ROLES
    crop = dict(current_crop or {})
    return {
        "cropCycleRecordingScaffold": True,
        "recordingState": "permission_boundary_ready" if can_scaffold_record else "permission_required",
        "recordingMode": "scaffold_only",
        "dtoBoundary": "crop_cycle/currentCrop",
        "requiredPermission": CROP_CYCLE_RECORDING_PERMISSION_BOUNDARY["requiredPermission"],
        "actorRole": normalized_role,
        "zone_id": zone_id,
        "currentCrop": crop,
        "crop_cycle_id": crop.get("crop_cycle_id"),
        "canScaffoldRecord": can_scaffold_record,
        "denialReason": None if can_scaffold_record else "crop_cycle_write_permission_required",
        "sourceCompatibility": "legacy crop_seasons adapter-only",
        "readOnly": True,
        "writeEnabled": False,
        "runtimeWriteAdapterEnabled": False,
        "dbMigrationEnabled": False,
        "existingSaveBehaviorChanged": False,
        "compatibilityRoutePreserved": True,
    }
