"""Crop record API wrappers for the Green Smart rebuild records-workflow surface."""
from __future__ import annotations

from aiohttp import web
from homeassistant.components.http import HomeAssistantView

from .db import execute, fetchone
from .repositories.crop_repo import list_control_records, list_growth_records, list_pest_records

REBUILD_CROP_RECORD_TYPES = {"growth-survey", "pest-scouting", "control-treatment"}


def _normalize_season_id(season_id: str) -> int:
    """Accept numeric ids plus compatibility strings such as crop_seasons:7 or cycle-7."""
    raw = str(season_id or "").strip()
    if raw.isdigit():
        return int(raw)
    for prefix in ("crop_seasons:", "cycle-"):
        if raw.startswith(prefix) and raw[len(prefix):].isdigit():
            return int(raw[len(prefix):])
    raise ValueError("invalid season_id")


def _record_summary(record_type: str, row: dict) -> str:
    if record_type == "growth-survey":
        parts = [row.get("date"), row.get("height") is not None and f"초장 {row.get('height')}cm", row.get("leafCount") is not None and f"엽수 {row.get('leafCount')}"]
        return " · ".join(str(part) for part in parts if part)
    if record_type == "pest-scouting":
        return " · ".join(str(part) for part in [row.get("date"), row.get("type"), row.get("location"), row.get("severity") is not None and f"severity {row.get('severity')}"] if part)
    pesticides = row.get("pesticides") or []
    first = pesticides[0] if pesticides else {}
    return " · ".join(str(part) for part in [row.get("date"), first.get("name") or row.get("zone"), first.get("phiDays") is not None and f"PHI {first.get('phiDays')}일"] if part)


def _history_response(record_type: str, rows: list[dict]) -> dict:
    return {"recordType": record_type, "count": len(rows), "rows": [{**row, "summary": _record_summary(record_type, row)} for row in rows]}


def _bad(message: str, status: int = 400) -> web.Response:
    return web.json_response({"ok": False, "error": message}, status=status)


class RebuildCropRecordsHistoryView(HomeAssistantView):
    """GET /api/green_smart/rebuild/crop-records/{season_id}/history/{record_type}."""

    url = "/api/green_smart/rebuild/crop-records/{season_id}/history/{record_type}"
    name = "api:green_smart:rebuild:crop_records:history"
    requires_auth = True

    async def get(self, request: web.Request, season_id: str, record_type: str) -> web.Response:
        hass = request.app["hass"]
        if record_type not in REBUILD_CROP_RECORD_TYPES:
            return _bad("unknown record_type", 404)
        try:
            sid = _normalize_season_id(season_id)
        except ValueError:
            return _bad("invalid season_id", 400)
        if record_type == "growth-survey":
            rows = await list_growth_records(hass, sid)
        elif record_type == "pest-scouting":
            rows = await list_pest_records(hass, sid)
        else:
            rows = await list_control_records(hass, sid)
        return self.json(_history_response(record_type, rows))


class RebuildCropRecordsWriteView(HomeAssistantView):
    """POST /api/green_smart/rebuild/crop-records/{season_id}/{record_type}."""

    url = "/api/green_smart/rebuild/crop-records/{season_id}/{record_type}"
    name = "api:green_smart:rebuild:crop_records:write"
    requires_auth = True

    async def post(self, request: web.Request, season_id: str, record_type: str) -> web.Response:
        hass = request.app["hass"]
        if record_type not in REBUILD_CROP_RECORD_TYPES:
            return _bad("unknown record_type", 404)
        try:
            body = await request.json()
        except Exception:
            return _bad("Invalid JSON")
        try:
            sid = _normalize_season_id(season_id)
        except ValueError:
            return _bad("invalid season_id", 400)
        if record_type == "growth-survey":
            date = body.get("date")
            if not date:
                return _bad("date 필수")
            new_id = await execute(hass, """
                INSERT INTO growth_surveys
                    (season_id, survey_date, plant_height, leaf_count, stem_diameter, truss_count, node_count, crop_type, metrics_json, notes)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (sid, date, body.get("height"), body.get("leafCount"), body.get("stemDia"), body.get("truss"), body.get("node"), body.get("cropType") or "other", body.get("metricsJson") or "[]", body.get("note") or ""))
            row = await fetchone(hass, """
                SELECT id, survey_date AS date, plant_height AS height, leaf_count AS leafCount, stem_diameter AS stemDia,
                       truss_count AS truss, node_count AS node, crop_type AS cropType, metrics_json AS metricsJson, notes AS note
                FROM growth_surveys WHERE id = %s
            """, (new_id,))
        elif record_type == "pest-scouting":
            date = body.get("date")
            pest_type = body.get("type") or body.get("pestType")
            if not date or not pest_type:
                return _bad("date, type 필수")
            new_id = await execute(hass, """
                INSERT INTO pest_surveys
                    (season_id, survey_date, pest_type, location, severity, notes)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (sid, date, pest_type, body.get("location") or "", int(body.get("severity") or 1), body.get("note") or ""))
            row = await fetchone(hass, """
                SELECT id, survey_date AS date, pest_type AS type, location, severity, notes AS note
                FROM pest_surveys WHERE id = %s
            """, (new_id,))
        else:
            date = body.get("date") or body.get("controlDate")
            pesticide_name = body.get("pesticideName") or body.get("name") or "미지정 약제"
            if not date:
                return _bad("date 필수")
            control_id = await execute(hass, """
                INSERT INTO control_records (season_id, control_date, zone_description, notes)
                VALUES (%s, %s, %s, %s)
            """, (sid, date, body.get("zone") or "", body.get("note") or ""))
            await execute(hass, """
                INSERT INTO control_pesticides
                    (control_id, sort_order, pesticide_name, pls_compliant, phi_days, rei_hours)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (control_id, 0, pesticide_name, 1 if body.get("pls") is True else (0 if body.get("pls") is False else None), body.get("phiDays"), body.get("reiHours")))
            rows = await list_control_records(hass, sid)
            row = next((item for item in rows if item.get("id") is not None and int(item.get("id")) == int(control_id)), {"id": control_id, "date": date, "pesticides": [{"name": pesticide_name}]})
        return self.json({"ok": True, "recordType": record_type, "record": row, "summary": _record_summary(record_type, row or {})})
