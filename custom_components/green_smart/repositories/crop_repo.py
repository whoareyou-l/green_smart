"""Crop read-only repository helpers — RB-006A.

Repository functions own SQL and return the same row dictionaries that the
legacy HTTP view returned. They do not know about HTTP requests, permissions,
or write routes.
"""

from __future__ import annotations

from typing import Any

from ..db import fetchall


async def list_crop_seasons(hass) -> list[dict[str, Any]]:
    """Return non-deleted crop seasons with legacy response keys preserved."""
    return await fetchall(hass, """
        SELECT
            s.id, s.crop_type AS cropType, s.variety, s.method,
            s.plant_date AS plantDate, s.demolish_date AS demolishDate,
            s.row_spacing AS rowSpacing, s.plant_spacing AS plantSpacing,
            s.total_plants AS totalPlants, s.plant_density AS plantDensity,
            s.train_dir AS trainDir, s.notes,
            COALESCE(z.name, CONCAT(s.zone_id, '구역')) AS zoneName, s.zone_id AS zoneId
        FROM crop_seasons s
        LEFT JOIN zones z ON z.id = s.zone_id
        WHERE s.deleted_at IS NULL
        ORDER BY s.plant_date DESC
    """)
