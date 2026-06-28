"""RS-013 read-only adapter repository for rebuild crop context.

Reads legacy physical schema and returns target-friendly row aliases.
No writes, no migrations, no route changes.
"""

from __future__ import annotations

from typing import Any

from ..db import fetchall


async def list_current_crop_cycle_rows(hass) -> list[dict[str, Any]]:
    """Return active crop cycles from legacy crop_seasons using target aliases."""
    return await fetchall(hass, """
        SELECT
            s.zone_id AS zone_id,
            COALESCE(z.name, CONCAT(s.zone_id, '구역')) AS zone_name,
            s.id AS crop_cycle_id,
            s.id AS compatibility_crop_season_id,
            s.crop_type AS crop_type,
            s.variety AS variety,
            COALESCE(s.method, '') AS cultivation_method,
            s.plant_date AS plant_date,
            s.demolish_date AS demolish_date,
            s.updated_at AS updated_at,
            CASE
                WHEN s.demolish_date IS NOT NULL THEN '철거 예정'
                WHEN s.crop_type = 'tomato' THEN '착과·비대 관찰'
                WHEN s.crop_type = 'strawberry' THEN '개화·수분 관리'
                WHEN s.crop_type = 'lettuce' THEN '엽채 생육 관찰'
                ELSE '생육 관찰'
            END AS growth_stage
        FROM crop_seasons s
        LEFT JOIN zones z ON z.id = s.zone_id
        WHERE s.deleted_at IS NULL
        ORDER BY s.plant_date DESC, s.id DESC
    """)
