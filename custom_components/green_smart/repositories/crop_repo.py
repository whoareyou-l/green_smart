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


async def list_growth_records(hass, season_id: int) -> list[dict[str, Any]]:
    """Return non-deleted growth survey rows with legacy response keys preserved."""
    return await fetchall(hass, """
        SELECT id, survey_date AS date, plant_height AS height,
               leaf_count AS leafCount, stem_diameter AS stemDia,
               truss_count AS truss, node_count AS node,
               crop_type AS cropType, metrics_json AS metricsJson,
               notes AS note
        FROM growth_surveys
        WHERE season_id = %s AND deleted_at IS NULL
        ORDER BY survey_date DESC
    """, (int(season_id),))


async def list_pest_records(hass, season_id: int) -> list[dict[str, Any]]:
    """Return non-deleted pest scouting rows with legacy response keys preserved."""
    return await fetchall(hass, """
        SELECT id, survey_date AS date, pest_type AS type,
               location, severity, notes AS note
        FROM pest_surveys
        WHERE season_id = %s AND deleted_at IS NULL
        ORDER BY survey_date DESC
    """, (int(season_id),))


async def list_control_records(hass, season_id: int) -> list[dict[str, Any]]:
    """Return non-deleted control rows grouped with pesticide children."""
    rows = await fetchall(hass, """
        SELECT
            r.id, r.control_date AS date,
            r.zone_description AS zone, r.notes AS note,
            p.id AS pId, p.sort_order AS pSort,
            p.pesticide_name AS name, p.reg_no AS regNo,
            p.mode_of_action AS moa, p.dilution_ratio AS dil,
            p.usage_amount AS amount, p.pls_compliant AS pls,
            p.mixable AS mixable, p.mix_check_status AS mixCheckStatus,
            p.mix_check_note AS mixCheckNote, p.pls_warning AS plsWarning,
            p.phi_days AS phiDays, p.rei_hours AS reiHours
        FROM control_records r
        LEFT JOIN control_pesticides p ON p.control_id = r.id
        WHERE r.season_id = %s AND r.deleted_at IS NULL
        ORDER BY r.control_date DESC, p.sort_order ASC
    """, (int(season_id),))

    records: dict[int, dict[str, Any]] = {}
    for row in rows:
        rid = row["id"]
        if rid not in records:
            records[rid] = {
                "id": rid,
                "date": row["date"],
                "zone": row["zone"],
                "note": row["note"],
                "pesticides": [],
            }
        if row.get("pId") is not None:
            records[rid]["pesticides"].append({
                "name": row["name"],
                "regNo": row["regNo"],
                "moa": row["moa"],
                "dil": row["dil"],
                "amount": row["amount"],
                "pls": bool(row["pls"]) if row["pls"] is not None else None,
                "mixable": bool(row["mixable"]) if row["mixable"] is not None else None,
                "mixCheckStatus": row["mixCheckStatus"],
                "mixCheckNote": row["mixCheckNote"],
                "plsWarning": row["plsWarning"],
                "phiDays": row["phiDays"],
                "reiHours": row["reiHours"],
            })
    return list(records.values())
