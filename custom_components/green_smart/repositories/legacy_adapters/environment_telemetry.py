"""Legacy environment telemetry adapters.

DB-02 migration boundary: this module intentionally contains the remaining
`sensor_readings` legacy-table lookup used by the edge environment telemetry
scheduler. Keeping the SQL here prevents product/runtime scheduler code from
embedding legacy table names directly while later slices migrate the data source
to a current canonical telemetry table.
"""
from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant

from ...db import fetchall

LEGACY_TABLE_SENSOR_READINGS = "sensor_readings"


async def list_recent_environment_telemetry_zone_ids(hass: HomeAssistant) -> list[dict[str, Any]]:
    """Return recent zone IDs from the legacy sensor_readings table.

    This is a compatibility adapter only. New product code must not add direct
    `sensor_readings` SQL outside this module.
    """
    return await fetchall(
        hass,
        """
        SELECT DISTINCT COALESCE(zone_id, 1) AS zone_id
        FROM sensor_readings
        WHERE captured_at >= DATE_SUB(NOW(), INTERVAL 10 MINUTE)
        ORDER BY zone_id ASC
        LIMIT 20
        """,
    )
