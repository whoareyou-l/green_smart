"""작물 관리 CRUD HTTP Views — HA 인증 내장."""
from __future__ import annotations
import json
import logging
from datetime import date
from aiohttp import web
from homeassistant.components.http import HomeAssistantView
from .db import fetchall, fetchone, execute

_LOGGER = logging.getLogger(__name__)


def _json(data) -> web.Response:
    return web.Response(
        text=json.dumps(data, ensure_ascii=False, default=str),
        content_type="application/json",
    )


def _err(msg: str, status: int = 400) -> web.Response:
    return web.Response(
        text=json.dumps({"error": msg}),
        content_type="application/json",
        status=status,
    )


async def _ensure_zone(hass, zone_id: int) -> None:
    await execute(hass, "INSERT IGNORE INTO zones (id, name) VALUES (%s, %s)", (zone_id, f"{zone_id}구역"))


# ── 작기 ──────────────────────────────────────────────────────────────────────

class CropSeasonsView(HomeAssistantView):
    """GET 전체 목록 / POST 정식 등록."""
    url  = "/api/green_smart/crop/seasons"
    name = "api:green_smart:crop:seasons"

    async def get(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        rows = await fetchall(hass, """
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
        return _json(rows)

    async def post(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        try:
            body = await request.json()
        except Exception:
            return _err("Invalid JSON")

        crop_type  = body.get("cropType", "other")
        plant_date = body.get("plantDate")
        zone_id    = body.get("zoneId")
        if not plant_date or not zone_id:
            return _err("cropType, plantDate, zoneId 필수")

        zone_id_int = int(zone_id)
        await _ensure_zone(hass, zone_id_int)
        new_id = await execute(hass, """
            INSERT INTO crop_seasons
                (greenhouse_id, zone_id, crop_type, variety, method,
                 plant_date, row_spacing, plant_spacing,
                 total_plants, plant_density, train_dir, notes)
            VALUES (1, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            zone_id_int, crop_type,
            body.get("variety") or "",
            body.get("method") or "hydro",
            plant_date,
            body.get("rowSpacing"),
            body.get("plantSpacing"),
            body.get("totalPlants"),
            body.get("plantDensity"),
            body.get("trainDir") or "v",
            body.get("notes") or "",
        ))
        row = await fetchone(hass, """
            SELECT s.id, s.crop_type AS cropType, s.variety, s.method,
                   s.plant_date AS plantDate, s.demolish_date AS demolishDate,
                   s.row_spacing AS rowSpacing, s.plant_spacing AS plantSpacing,
                   s.total_plants AS totalPlants, s.plant_density AS plantDensity,
                   s.train_dir AS trainDir, s.notes,
                   COALESCE(z.name, CONCAT(s.zone_id, '구역')) AS zoneName, s.zone_id AS zoneId
            FROM crop_seasons s LEFT JOIN zones z ON z.id = s.zone_id
            WHERE s.id = %s
        """, (new_id,))
        return _json(row)


class CropSeasonDemolishView(HomeAssistantView):
    """PATCH /api/green_smart/crop/seasons/{season_id}/demolish"""
    url  = "/api/green_smart/crop/seasons/{season_id}/demolish"
    name = "api:green_smart:crop:season:demolish"

    async def patch(self, request: web.Request, season_id: str) -> web.Response:
        hass = request.app["hass"]
        try:
            body = await request.json()
        except Exception:
            body = {}
        demolish_date = body.get("date") or date.today().isoformat()
        await execute(hass,
            "UPDATE crop_seasons SET demolish_date = %s, updated_at = NOW() WHERE id = %s AND deleted_at IS NULL",
            (demolish_date, int(season_id)),
        )
        return _json({"id": int(season_id), "demolishDate": demolish_date})


class CropSeasonDeleteView(HomeAssistantView):
    """PATCH/DELETE /api/green_smart/crop/seasons/{season_id}."""
    url  = "/api/green_smart/crop/seasons/{season_id}"
    name = "api:green_smart:crop:season:delete"

    async def patch(self, request: web.Request, season_id: str) -> web.Response:
        hass = request.app["hass"]
        try:
            body = await request.json()
        except Exception:
            return _err("Invalid JSON")

        zone_id = body.get("zoneId")
        plant_date = body.get("plantDate")
        if not zone_id or not plant_date:
            return _err("plantDate, zoneId 필수")
        zone_id_int = int(zone_id)
        await _ensure_zone(hass, zone_id_int)
        await execute(hass, """
            UPDATE crop_seasons
            SET zone_id = %s, crop_type = %s, variety = %s, method = %s,
                plant_date = %s, row_spacing = %s, plant_spacing = %s,
                total_plants = %s, plant_density = %s, train_dir = %s,
                notes = %s, updated_at = NOW()
            WHERE id = %s AND deleted_at IS NULL
        """, (
            zone_id_int,
            body.get("cropType") or "other",
            body.get("variety") or "",
            body.get("method") or "hydro",
            plant_date,
            body.get("rowSpacing"),
            body.get("plantSpacing"),
            body.get("totalPlants"),
            body.get("plantDensity"),
            body.get("trainDir") or "v",
            body.get("notes") or "",
            int(season_id),
        ))
        row = await fetchone(hass, """
            SELECT s.id, s.crop_type AS cropType, s.variety, s.method,
                   s.plant_date AS plantDate, s.demolish_date AS demolishDate,
                   s.row_spacing AS rowSpacing, s.plant_spacing AS plantSpacing,
                   s.total_plants AS totalPlants, s.plant_density AS plantDensity,
                   s.train_dir AS trainDir, s.notes,
                   COALESCE(z.name, CONCAT(s.zone_id, '구역')) AS zoneName, s.zone_id AS zoneId
            FROM crop_seasons s LEFT JOIN zones z ON z.id = s.zone_id
            WHERE s.id = %s AND s.deleted_at IS NULL
        """, (int(season_id),))
        return _json(row)

    async def delete(self, request: web.Request, season_id: str) -> web.Response:
        hass = request.app["hass"]
        sid = int(season_id)
        await execute(hass, """
            DELETE cp FROM control_pesticides cp
            JOIN control_records cr ON cr.id = cp.control_id
            WHERE cr.season_id = %s
        """, (sid,))
        await execute(hass, "DELETE FROM control_records WHERE season_id = %s", (sid,))
        await execute(hass, "DELETE FROM pest_surveys WHERE season_id = %s", (sid,))
        await execute(hass, "DELETE FROM growth_surveys WHERE season_id = %s", (sid,))
        await execute(hass, "DELETE FROM crop_seasons WHERE id = %s", (sid,))
        return _json({"ok": True, "id": sid, "hardDeleted": True})


# ── 생육조사 ──────────────────────────────────────────────────────────────────

class CropGrowthListView(HomeAssistantView):
    """GET /api/green_smart/crop/seasons/{season_id}/growth  /  POST 추가."""
    url  = "/api/green_smart/crop/seasons/{season_id}/growth"
    name = "api:green_smart:crop:growth:list"

    async def get(self, request: web.Request, season_id: str) -> web.Response:
        hass = request.app["hass"]
        rows = await fetchall(hass, """
            SELECT id, survey_date AS date, plant_height AS height,
                   leaf_count AS leafCount, stem_diameter AS stemDia,
                   truss_count AS truss, node_count AS node,
                   crop_type AS cropType, metrics_json AS metricsJson,
                   notes AS note
            FROM growth_surveys
            WHERE season_id = %s AND deleted_at IS NULL
            ORDER BY survey_date DESC
        """, (int(season_id),))
        return _json(rows)

    async def post(self, request: web.Request, season_id: str) -> web.Response:
        hass = request.app["hass"]
        try:
            body = await request.json()
        except Exception:
            return _err("Invalid JSON")
        if not body.get("date"):
            return _err("date 필수")
        metrics_json = json.dumps(body.get("metrics") or [], ensure_ascii=False)
        new_id = await execute(hass, """
            INSERT INTO growth_surveys
                (season_id, survey_date, plant_height, leaf_count,
                 stem_diameter, truss_count, node_count, crop_type, metrics_json, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            int(season_id), body["date"],
            body.get("height"), body.get("leafCount"),
            body.get("stemDia"), body.get("truss"),
            body.get("node"), body.get("cropType") or "other", metrics_json,
            body.get("note") or "",
        ))
        row = await fetchone(hass, """
            SELECT id, survey_date AS date, plant_height AS height,
                   leaf_count AS leafCount, stem_diameter AS stemDia,
                   truss_count AS truss, node_count AS node,
                   crop_type AS cropType, metrics_json AS metricsJson,
                   notes AS note
            FROM growth_surveys WHERE id = %s
        """, (new_id,))
        return _json(row)


class CropGrowthDeleteView(HomeAssistantView):
    """DELETE /api/green_smart/crop/growth/{record_id}"""
    url  = "/api/green_smart/crop/growth/{record_id}"
    name = "api:green_smart:crop:growth:delete"

    async def delete(self, request: web.Request, record_id: str) -> web.Response:
        hass = request.app["hass"]
        await execute(hass,
            "UPDATE growth_surveys SET deleted_at = NOW() WHERE id = %s",
            (int(record_id),),
        )
        return _json({"ok": True})


# ── 병해충 예찰 ───────────────────────────────────────────────────────────────

class CropPestListView(HomeAssistantView):
    """GET /api/green_smart/crop/seasons/{season_id}/pest  /  POST 추가."""
    url  = "/api/green_smart/crop/seasons/{season_id}/pest"
    name = "api:green_smart:crop:pest:list"

    async def get(self, request: web.Request, season_id: str) -> web.Response:
        hass = request.app["hass"]
        rows = await fetchall(hass, """
            SELECT id, survey_date AS date, pest_type AS type,
                   location, severity, notes AS note
            FROM pest_surveys
            WHERE season_id = %s AND deleted_at IS NULL
            ORDER BY survey_date DESC
        """, (int(season_id),))
        return _json(rows)

    async def post(self, request: web.Request, season_id: str) -> web.Response:
        hass = request.app["hass"]
        try:
            body = await request.json()
        except Exception:
            return _err("Invalid JSON")
        if not body.get("date") or not body.get("type"):
            return _err("date, type 필수")
        new_id = await execute(hass, """
            INSERT INTO pest_surveys
                (season_id, survey_date, pest_type, location, severity, notes)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            int(season_id), body["date"], body["type"],
            body.get("location") or "",
            int(body.get("severity") or 1),
            body.get("note") or "",
        ))
        row = await fetchone(hass, """
            SELECT id, survey_date AS date, pest_type AS type,
                   location, severity, notes AS note
            FROM pest_surveys WHERE id = %s
        """, (new_id,))
        return _json(row)


class CropPestDeleteView(HomeAssistantView):
    """DELETE /api/green_smart/crop/pest/{record_id}"""
    url  = "/api/green_smart/crop/pest/{record_id}"
    name = "api:green_smart:crop:pest:delete"

    async def delete(self, request: web.Request, record_id: str) -> web.Response:
        hass = request.app["hass"]
        await execute(hass,
            "UPDATE pest_surveys SET deleted_at = NOW() WHERE id = %s",
            (int(record_id),),
        )
        return _json({"ok": True})


# ── 방제 기록 ─────────────────────────────────────────────────────────────────

class CropControlListView(HomeAssistantView):
    """GET /api/green_smart/crop/seasons/{season_id}/control  /  POST 추가."""
    url  = "/api/green_smart/crop/seasons/{season_id}/control"
    name = "api:green_smart:crop:control:list"

    async def get(self, request: web.Request, season_id: str) -> web.Response:
        hass = request.app["hass"]
        rows = await fetchall(hass, """
            SELECT
                r.id, r.control_date AS date,
                r.zone_description AS zone, r.notes AS note,
                p.id AS pId, p.sort_order AS pSort,
                p.pesticide_name AS name, p.reg_no AS regNo,
                p.mode_of_action AS moa, p.dilution_ratio AS dil,
                p.usage_amount AS amount, p.pls_compliant AS pls
            FROM control_records r
            LEFT JOIN control_pesticides p ON p.control_id = r.id
            WHERE r.season_id = %s AND r.deleted_at IS NULL
            ORDER BY r.control_date DESC, p.sort_order ASC
        """, (int(season_id),))

        # Python 에서 record.id 기준 그룹핑
        records: dict[int, dict] = {}
        for row in rows:
            rid = row["id"]
            if rid not in records:
                records[rid] = {
                    "id": rid, "date": row["date"],
                    "zone": row["zone"], "note": row["note"],
                    "pesticides": [],
                }
            if row.get("pId") is not None:
                records[rid]["pesticides"].append({
                    "name": row["name"], "regNo": row["regNo"],
                    "moa": row["moa"], "dil": row["dil"],
                    "amount": row["amount"], "pls": bool(row["pls"]) if row["pls"] is not None else None,
                })
        return _json(list(records.values()))

    async def post(self, request: web.Request, season_id: str) -> web.Response:
        hass = request.app["hass"]
        try:
            body = await request.json()
        except Exception:
            return _err("Invalid JSON")
        control_date = body.get("controlDate")
        pesticides   = body.get("pesticides") or []
        if not control_date or not pesticides:
            return _err("controlDate, pesticides 필수")

        # 헤더 INSERT
        control_id = await execute(hass, """
            INSERT INTO control_records (season_id, control_date, zone_description, notes)
            VALUES (%s, %s, %s, %s)
        """, (
            int(season_id), control_date,
            body.get("zone") or "",
            body.get("note") or "",
        ))

        # 약제 순서대로 INSERT
        for idx, p in enumerate(pesticides):
            await execute(hass, """
                INSERT INTO control_pesticides
                    (control_id, sort_order, pesticide_name, reg_no,
                     mode_of_action, dilution_ratio, usage_amount, pls_compliant)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                control_id, idx,
                p.get("name") or "",
                p.get("regNo"),
                p.get("moa"),
                p.get("dil"),
                p.get("amount"),
                1 if p.get("pls") is True else (0 if p.get("pls") is False else None),
            ))

        # 생성된 레코드 반환 (재조회)
        rows = await fetchall(hass, """
            SELECT
                r.id, r.control_date AS date,
                r.zone_description AS zone, r.notes AS note,
                p.id AS pId, p.sort_order AS pSort,
                p.pesticide_name AS name, p.reg_no AS regNo,
                p.mode_of_action AS moa, p.dilution_ratio AS dil,
                p.usage_amount AS amount, p.pls_compliant AS pls
            FROM control_records r
            LEFT JOIN control_pesticides p ON p.control_id = r.id
            WHERE r.id = %s
            ORDER BY p.sort_order ASC
        """, (control_id,))

        result: dict = {"id": control_id, "date": control_date,
                        "zone": body.get("zone") or "", "note": body.get("note") or "",
                        "pesticides": []}
        for row in rows:
            if row.get("pId") is not None:
                result["pesticides"].append({
                    "name": row["name"], "regNo": row["regNo"],
                    "moa": row["moa"], "dil": row["dil"],
                    "amount": row["amount"],
                    "pls": bool(row["pls"]) if row["pls"] is not None else None,
                })
        return _json(result)


class CropControlDeleteView(HomeAssistantView):
    """DELETE /api/green_smart/crop/control/{record_id}"""
    url  = "/api/green_smart/crop/control/{record_id}"
    name = "api:green_smart:crop:control:delete"

    async def delete(self, request: web.Request, record_id: str) -> web.Response:
        hass = request.app["hass"]
        await execute(hass,
            "UPDATE control_records SET deleted_at = NOW() WHERE id = %s",
            (int(record_id),),
        )
        return _json({"ok": True})
