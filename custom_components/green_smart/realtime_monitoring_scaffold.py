"""Pure VS-N003 real-time monitoring read-only scaffold.

This module is intentionally Home Assistant independent.  VS-N003 defines the
monitoring/read-only DTO, permission, and freshness boundaries only. It does not
query DB rows, read HA entities, collect sensors, render a panel card, publish
MQTT, or control devices.
"""

from __future__ import annotations

from typing import Any

REALTIME_MONITORING_DTO_FIELDS = (
    "zone_id",
    "crop_cycle_id",
    "sensorSnapshot",
    "dataFreshnessState",
    "freshnessBoundary",
    "monitoringMode",
    "dtoBoundary",
    "requiredPermission",
    "readOnly",
    "writeEnabled",
    "runtimeReadAdapterEnabled",
    "sensorCollectionEnabled",
    "dbMigrationEnabled",
    "executionEnabled",
)

REALTIME_MONITORING_PERMISSION_BOUNDARY = {
    "requiredPermission": "monitoring.read",
    "legacyAlias": "view_dashboard",
    "bucket": "조회",
    "backendEnforcement": "backend permission enforcement before UI-only hiding",
}

REALTIME_MONITORING_NON_GOALS = (
    "No DB migration in VS-N003",
    "No legacy sensor table query adapter in VS-N003",
    "No HA entity read API in VS-N003",
    "No sensor collection/scheduler in VS-N003",
    "No panel monitoring card in VS-N003",
    "No write/mutation in VS-N003",
    "No MQTT/device command in VS-N003",
)


def normalize_realtime_monitoring_readonly_scaffold(
    *,
    actor_role: str | None,
    zone_id: int | str | None = None,
    crop_cycle_id: int | str | None = None,
    sensor_snapshot: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Return the read-only VS-N003 monitoring scaffold DTO.

    `sensorSnapshot` is caller-provided sample/evidence only. This helper never
    reads Home Assistant state, DB rows, MQTT, or external sensors.
    """

    normalized_role = str(actor_role or "farm_staff").strip() or "farm_staff"
    snapshot = dict(sensor_snapshot or {})
    return {
        "realtimeMonitoringReadOnlyScaffold": True,
        "monitoringMode": "scaffold_only",
        "dtoBoundary": "monitoring/read-only",
        "requiredPermission": REALTIME_MONITORING_PERMISSION_BOUNDARY["requiredPermission"],
        "actorRole": normalized_role,
        "canViewMonitoringScaffold": True,
        "zone_id": zone_id,
        "crop_cycle_id": crop_cycle_id,
        "sensorSnapshot": snapshot,
        "dataFreshnessState": "source_not_connected",
        "freshnessBoundary": "sensor state freshness boundary",
        "readOnly": True,
        "writeEnabled": False,
        "runtimeReadAdapterEnabled": False,
        "sensorCollectionEnabled": False,
        "dbMigrationEnabled": False,
        "existingSensorBehaviorChanged": False,
        "compatibilityRoutePreserved": True,
        "executionEnabled": False,
    }
