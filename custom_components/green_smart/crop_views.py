"""작물 관리 CRUD HTTP Views — HA 인증 내장."""
from __future__ import annotations
import json
import logging
from datetime import date, datetime, timedelta
from aiohttp import web
from homeassistant.components.http import HomeAssistantView
from .db import fetchall, fetchone, execute

_LOGGER = logging.getLogger(__name__)

WEEKLY_REPORT_INTERVAL_DAYS = 7
GROWTH_REPORT_NOTIFICATION_SETTINGS_KEY = "growth_report_notification_settings"
GROWTH_REPORT_NOTIFICATION_STATE_KEY = "growth_report_notification_state"

YIELD_MODEL_BY_CROP = {
    "tomato": {
        "modelVersion": "tomato_growth_model_v1",
        "cropModelLabel": "토마토 생육 기반 수확 모델 v1",
        "baseKgPerPlant": 3.2,
        "densityKgPerM2": 8.5,
        "gIndexOptimal": 18.0,
        "velocityOptimal": 12.0,
    },
    "lettuce": {
        "modelVersion": "lettuce_growth_model_v1",
        "cropModelLabel": "상추 생육 기반 수확 모델 v1",
        "baseKgPerPlant": 0.18,
        "densityKgPerM2": 3.0,
        "gIndexOptimal": 9.0,
        "velocityOptimal": 5.0,
    },
    "default": {
        "modelVersion": "generic_growth_model_v1",
        "cropModelLabel": "일반 생육 기반 수확 모델 v1",
        "baseKgPerPlant": 0.8,
        "densityKgPerM2": 3.5,
        "gIndexOptimal": 12.0,
        "velocityOptimal": 7.0,
    },
}


def _bounded_factor(value: float, optimal: float, *, floor: float = 0.35, ceiling: float = 1.45) -> float:
    if optimal <= 0:
        return 1.0
    return round(max(floor, min(ceiling, value / optimal)), 3)


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


def _growth_metric_value(row: dict, key: str, fallback_key: str | None = None) -> float | None:
    try:
        metrics = json.loads(row.get("metricsJson") or "[]")
    except Exception:
        metrics = []
    for metric in metrics if isinstance(metrics, list) else []:
        if metric.get("key") == key and metric.get("value") not in (None, ""):
            try:
                return float(metric.get("value"))
            except Exception:
                return None
    value = row.get(fallback_key or key)
    if value in (None, ""):
        return None
    try:
        return float(value)
    except Exception:
        return None


def _growth_report_points(rows: list[dict], key: str, fallback_key: str | None = None) -> list[dict]:
    points = []
    for row in reversed(rows):
        value = _growth_metric_value(row, key, fallback_key)
        if value is not None:
            points.append({"date": row.get("date"), "value": value})
    return points


def _growth_g_index(row: dict) -> float:
    height = _growth_metric_value(row, "height", "height") or 0
    leaf = _growth_metric_value(row, "leafCount", "leafCount") or 0
    stem = _growth_metric_value(row, "stemDia", "stemDia") or 0
    return round((height * 0.08) + (leaf * 0.55) + (stem * 0.35), 2)


def _growth_days_between(a, b) -> int:
    try:
        da = datetime.fromisoformat(str(a)).date()
        db = datetime.fromisoformat(str(b)).date()
        return max((db - da).days, 1)
    except Exception:
        return 7


def _weather_risk_snapshot(hass) -> dict:
    domain_data = getattr(hass, "data", {}).get("green_smart", {}) if hass else {}
    store = domain_data.get("weather_store")
    current = {}
    forecast = []
    if store:
        current = store.get_cached("current") or store.get_stale("current") or {}
        forecast = store.get_cached("forecast") or store.get_stale("forecast") or []
    humidities = []
    temperatures = []
    rain_hits = 0
    if current:
        if current.get("humidity") not in (None, "--"):
            humidities.append(float(current.get("humidity") or 0))
        if current.get("temperature") not in (None, "--"):
            temperatures.append(float(current.get("temperature") or 0))
        if float(current.get("precipitation") or 0) > 0 or current.get("precipitation_type") not in (None, "", "없음"):
            rain_hits += 1
    for item in forecast[:24] if isinstance(forecast, list) else []:
        if item.get("humidity") not in (None, "--"):
            humidities.append(float(item.get("humidity") or 0))
        temp = item.get("temp", item.get("temperature"))
        if temp not in (None, "--"):
            temperatures.append(float(temp or 0))
        if item.get("precipitation_type") not in (None, "", "없음") or float(item.get("pop") or 0) >= 60:
            rain_hits += 1
    avg_humidity = round(sum(humidities) / len(humidities), 1) if humidities else None
    avg_temperature = round(sum(temperatures) / len(temperatures), 1) if temperatures else None
    humidityRisk = 6 if avg_humidity is not None and avg_humidity >= 88 else 3 if avg_humidity is not None and avg_humidity >= 78 else 0
    rainRisk = 5 if rain_hits >= 3 else 3 if rain_hits else 0
    temperatureRisk = 3 if avg_temperature is not None and 18 <= avg_temperature <= 28 else 1 if avg_temperature is not None and 15 <= avg_temperature <= 32 else 0
    return {
        "avgHumidity": avg_humidity,
        "avgTemperature": avg_temperature,
        "rainSignalCount": rain_hits,
        "humidityRisk": humidityRisk,
        "rainRisk": rainRisk,
        "temperatureRisk": temperatureRisk,
        "source": "weather_store_cache" if store else "unavailable",
    }


def _days_since(value) -> int | None:
    if not value:
        return None
    try:
        day = datetime.fromisoformat(str(value)).date()
        return max((date.today() - day).days, 0)
    except Exception:
        return None


def _growth_pest_risk(hass, pest_rows: list[dict], control_rows: list[dict]) -> dict:
    weatherDrivers = _weather_risk_snapshot(hass)
    pest_history_score = sum(int(r.get("severity") or 0) for r in pest_rows[:5])
    lastControlDate = control_rows[0].get("date") if control_rows else None
    daysSinceLastControl = _days_since(lastControlDate)
    control_score = 0
    if daysSinceLastControl is None:
        control_score = 3
    elif daysSinceLastControl > 21:
        control_score = 4
    elif daysSinceLastControl > 10:
        control_score = 2
    elif daysSinceLastControl <= 3:
        control_score = -2
    environmentDrivers = {
        "humidityRisk": weatherDrivers["humidityRisk"],
        "temperatureRisk": weatherDrivers["temperatureRisk"],
        "combinedHumidityTemperatureRisk": weatherDrivers["humidityRisk"] + weatherDrivers["temperatureRisk"],
    }
    controlHistoryDrivers = {
        "lastControlDate": lastControlDate,
        "daysSinceLastControl": daysSinceLastControl,
        "controlHistoryScore": control_score,
        "recentControlCount": len(control_rows),
    }
    score = max(0, pest_history_score + weatherDrivers["humidityRisk"] + weatherDrivers["rainRisk"] + weatherDrivers["temperatureRisk"] + control_score)
    level = "high" if score >= 14 else "medium" if score >= 7 else "low"
    riskFactors = ["pest_history_score"] if pest_history_score else []
    if weatherDrivers["humidityRisk"]:
        riskFactors.append("humidityRisk")
    if weatherDrivers["rainRisk"]:
        riskFactors.append("rainRisk")
    if weatherDrivers["temperatureRisk"]:
        riskFactors.append("temperatureRisk")
    if control_score > 0:
        riskFactors.append("controlHistoryRisk")
    recommendedActions = ["예찰 기록을 최신 상태로 유지"]
    if level in ("medium", "high"):
        recommendedActions.extend(["고습/강우 후 병해충 예찰 강화", "최근 방제 기록과 약제 PLS 준수 여부 확인"])
    if level == "high":
        recommendedActions.append("관리자 승인 후 방제 계획 검토")
    return {
        "level": level,
        "score": score,
        "recentCount": len(pest_rows[:5]),
        "modelVersion": "weather_environment_control_model_v1",
        "environmentDrivers": environmentDrivers,
        "weatherDrivers": weatherDrivers,
        "controlHistoryDrivers": controlHistoryDrivers,
        "riskFactors": riskFactors,
        "recommendedActions": recommendedActions,
        "pestHistoryScore": pest_history_score,
    }


def _weekly_report_export_csv(weekly_report: dict) -> str:
    rows = [
        ["항목", "내용"],
        ["요약", weekly_report.get("summary", "")],
        ["마지막 방제일", weekly_report.get("lastControlDate") or ""],
        ["예상 수확량(kg)", weekly_report.get("yieldEstimatedKg", "")],
        ["병해 위험도", weekly_report.get("pestRiskLevel", "")],
        ["권장 조치", " / ".join(weekly_report.get("actions") or [])],
    ]
    return "\n".join(",".join('"' + str(col).replace('"', '""') + '"' for col in row) for row in rows)


def _growth_weekly_report(season_id: int, growth_rows: list[dict], control_rows: list[dict], weekly_growth: float, pestRisk: dict, yieldPrediction: dict) -> dict:
    last_control = control_rows[0].get("date") if control_rows else None
    summary = f"최근 생육조사 {len(growth_rows)}건 기준 주간 초장 증가 {weekly_growth}cm, 병해 위험도 {pestRisk['level']}, 예상 수확량 {yieldPrediction.get('estimatedKg', 0)}kg"
    actions = ["생육조사 주 1회 이상 기록", "병해 위험도 medium 이상이면 예찰/방제 기록 확인", "G-Index 급변 시 환경 전략 preview 확인"]
    actions.extend(pestRisk.get("recommendedActions") or [])
    actions = list(dict.fromkeys(actions))
    export_text = "\n".join([
        "주간 생육 리포트",
        f"작기 ID: {season_id}",
        f"요약: {summary}",
        f"예상 수확량: {yieldPrediction.get('estimatedKg', 0)}kg",
        f"병해 위험도: {pestRisk['level']} (score {pestRisk.get('score', 0)})",
        f"마지막 방제일: {last_control or '기록 없음'}",
        "권장 조치:",
        *[f"- {a}" for a in actions],
    ])
    report = {
        "summary": summary,
        "actions": actions,
        "lastControlDate": last_control,
        "yieldEstimatedKg": yieldPrediction.get("estimatedKg", 0),
        "pestRiskLevel": pestRisk["level"],
        "exportText": export_text,
        "exportFilename": f"green_smart_weekly_report_{season_id}.csv",
        "notificationDraft": f"주간 생육 리포트: {summary}",
    }
    report["exportCsv"] = _weekly_report_export_csv(report)
    return report


def _growth_yield_prediction(season: dict, latest: dict, oldest: dict, growth_rows: list[dict], latest_g: float, weekly_growth: float) -> dict:
    crop_type = str(season.get("cropType") or latest.get("cropType") or "default").lower()
    model = YIELD_MODEL_BY_CROP.get(crop_type, YIELD_MODEL_BY_CROP["default"])
    total_plants = float(season.get("totalPlants") or 0)
    density = float(season.get("plantDensity") or 0)
    gIndexFactor = _bounded_factor(float(latest_g or 0), float(model["gIndexOptimal"]))
    growthVelocityCmPerWeek = round(float(weekly_growth or 0), 2)
    velocityFactor = _bounded_factor(growthVelocityCmPerWeek, float(model["velocityOptimal"]), floor=0.45, ceiling=1.35)
    densityFactor = _bounded_factor(density, 3.0 if crop_type == "tomato" else 16.0 if crop_type == "lettuce" else max(density, 1), floor=0.65, ceiling=1.2) if density else 1.0
    estimatedKgPerPlant = round(float(model["baseKgPerPlant"]) * gIndexFactor * velocityFactor, 3)
    estimatedKgPerArea = round(float(model["densityKgPerM2"]) * gIndexFactor * velocityFactor * densityFactor, 2)
    estimatedKg = round(estimatedKgPerPlant * total_plants, 1) if total_plants else round(estimatedKgPerArea * 100, 1) if density else 0
    confidenceReasons = []
    if len(growth_rows) < 3:
        confidenceReasons.append("생육조사 3건 미만")
    if not total_plants and not density:
        confidenceReasons.append("총 주수/재식밀도 없음")
    if not latest:
        confidenceReasons.append("최신 생육조사 없음")
    confidence = "high" if len(growth_rows) >= 6 and (total_plants or density) else "medium" if len(growth_rows) >= 3 else "low"
    yieldDrivers = {
        "cropType": crop_type,
        "gIndexFactor": gIndexFactor,
        "velocityFactor": velocityFactor,
        "densityFactor": densityFactor,
        "growthVelocityCmPerWeek": growthVelocityCmPerWeek,
        "totalPlants": total_plants,
        "plantDensity": density,
    }
    return {
        "estimatedKg": estimatedKg,
        "estimatedKgPerPlant": estimatedKgPerPlant,
        "estimatedKgPerArea": estimatedKgPerArea,
        "confidence": confidence,
        "confidenceReasons": confidenceReasons,
        "modelVersion": model["modelVersion"],
        "cropModelLabel": model["cropModelLabel"],
        "basis": "crop-specific growth model + growth_surveys + plant_density",
        "yieldDrivers": yieldDrivers,
    }


async def _growth_report_response(hass, season_id: int) -> dict:
    season = await fetchone(hass, """
        SELECT id, crop_type AS cropType, variety, method, plant_date AS plantDate,
               demolish_date AS demolishDate, total_plants AS totalPlants,
               plant_density AS plantDensity, zone_id AS zoneId
        FROM crop_seasons
        WHERE id = %s AND deleted_at IS NULL
    """, (season_id,)) or {"id": season_id}
    growth_rows = await fetchall(hass, """
        SELECT id, survey_date AS date, plant_height AS height,
               leaf_count AS leafCount, stem_diameter AS stemDia,
               truss_count AS truss, node_count AS node,
               crop_type AS cropType, metrics_json AS metricsJson,
               notes AS note
        FROM growth_surveys
        WHERE season_id = %s AND deleted_at IS NULL
        ORDER BY survey_date DESC
        LIMIT 60
    """, (season_id,))
    pest_rows = await fetchall(hass, """
        SELECT id, survey_date AS date, pest_type AS type, severity, notes AS note
        FROM pest_surveys
        WHERE season_id = %s AND deleted_at IS NULL
        ORDER BY survey_date DESC
        LIMIT 30
    """, (season_id,))
    control_rows = await fetchall(hass, """
        SELECT id, control_date AS date, notes AS note
        FROM control_records
        WHERE season_id = %s AND deleted_at IS NULL
        ORDER BY control_date DESC
        LIMIT 10
    """, (season_id,))
    latest = growth_rows[0] if growth_rows else {}
    oldest = growth_rows[-1] if growth_rows else latest
    height_now = _growth_metric_value(latest, "height", "height") or 0
    height_old = _growth_metric_value(oldest, "height", "height") or height_now
    days = _growth_days_between(oldest.get("date"), latest.get("date")) if growth_rows else 7
    weekly_growth = round((height_now - height_old) / days * 7, 2) if days else 0
    latest_g = _growth_g_index(latest) if latest else 0
    pestRisk = _growth_pest_risk(hass, pest_rows, control_rows)
    yieldPrediction = _growth_yield_prediction(season, latest, oldest, growth_rows, latest_g, weekly_growth)
    growthTrend = {
        "height": _growth_report_points(growth_rows, "height", "height"),
        "leafCount": _growth_report_points(growth_rows, "leafCount", "leafCount"),
        "stemDia": _growth_report_points(growth_rows, "stemDia", "stemDia"),
    }
    gIndexTrend = [{"date": row.get("date"), "value": _growth_g_index(row)} for row in reversed(growth_rows)]
    weeklyReport = _growth_weekly_report(season_id, growth_rows, control_rows, weekly_growth, pestRisk, yieldPrediction)
    return {
        "ok": True,
        "seasonId": season_id,
        "season": season,
        "latestMetrics": latest,
        "growthTrend": growthTrend,
        "gIndexTrend": gIndexTrend,
        "yieldPrediction": yieldPrediction,
        "pestRisk": pestRisk,
        "weeklyReport": weeklyReport,
    }


class CropGrowthReportView(HomeAssistantView):
    """GET /api/green_smart/crop/seasons/{season_id}/growth-report."""
    url  = "/api/green_smart/crop/seasons/{season_id}/growth-report"
    name = "api:green_smart:crop:growth_report"

    async def get(self, request: web.Request, season_id: str) -> web.Response:
        return _json(await _growth_report_response(request.app["hass"], int(season_id)))

def _growth_report_health_signature(report: dict) -> dict:
    pest_rank = {"low": 0, "medium": 1, "high": 2}
    pest = report.get("pestRisk") or {}
    yield_prediction = report.get("yieldPrediction") or {}
    g_index_trend = report.get("gIndexTrend") or []
    latest_g = float((g_index_trend[-1] or {}).get("value") or 0) if g_index_trend else 0.0
    return {
        "pestRiskLevel": pest.get("level") or "low",
        "pestRiskRank": pest_rank.get(str(pest.get("level") or "low"), 0),
        "pestRiskScore": float(pest.get("score") or 0),
        "yieldEstimatedKg": float(yield_prediction.get("estimatedKg") or 0),
        "gIndex": latest_g,
    }


def _growth_report_worsened(previous: dict | None, current: dict) -> bool:
    if not previous:
        return False
    if int(current.get("pestRiskRank", 0)) > int(previous.get("pestRiskRank", 0)):
        return True
    if float(current.get("pestRiskScore", 0)) > float(previous.get("pestRiskScore", 0)):
        return True
    previous_yield = float(previous.get("yieldEstimatedKg") or 0)
    current_yield = float(current.get("yieldEstimatedKg") or 0)
    if previous_yield and current_yield < previous_yield:
        return True
    previous_g = float(previous.get("gIndex") or 0)
    current_g = float(current.get("gIndex") or 0)
    if previous_g and current_g < previous_g:
        return True
    return False


async def _send_growth_report_notification(hass, season_id: int, report: dict, *, reason: str = "weekly_report_auto_sent") -> dict:
    weekly = report.get("weeklyReport") or {}
    message = weekly.get("notificationDraft") or weekly.get("summary") or "주간 생육 리포트"
    await hass.services.async_call(
        "persistent_notification",
        "create",
        {
            "title": "주간 생육 리포트",
            "message": message,
            "notification_id": f"green_smart_weekly_report_{season_id}",
        },
        blocking=False,
    )
    return {"ok": True, "notificationId": f"green_smart_weekly_report_{season_id}", "message": message, "reason": reason}


def _growth_report_notification_maps(hass) -> tuple[dict, dict]:
    domain_data = hass.data.setdefault("green_smart", {})
    settings = domain_data.setdefault(GROWTH_REPORT_NOTIFICATION_SETTINGS_KEY, {})
    state = domain_data.setdefault(GROWTH_REPORT_NOTIFICATION_STATE_KEY, {})
    return settings, state


def _growth_report_notification_enabled(settings: dict, season_id: int) -> bool:
    season_settings = settings.get(str(season_id)) or {}
    return bool(season_settings.get("enabled", True))


async def _maybe_send_growth_report_auto_notification(hass, season_id: int, *, now: datetime | None = None) -> dict:
    settings, state = _growth_report_notification_maps(hass)
    if not _growth_report_notification_enabled(settings, season_id):
        return {"ok": True, "sent": False, "reason": "disabled"}
    now = now or datetime.utcnow()
    key = str(season_id)
    previous_state = state.get(key) or {}
    report = await _growth_report_response(hass, season_id)
    current_signature = _growth_report_health_signature(report)
    previous_signature = previous_state.get("signature")
    last_sent_raw = previous_state.get("lastSentAt")
    last_sent_at = datetime.fromisoformat(last_sent_raw) if last_sent_raw else None
    due_weekly = not last_sent_at or (now - last_sent_at) >= timedelta(days=WEEKLY_REPORT_INTERVAL_DAYS)
    worsened = _growth_report_worsened(previous_signature, current_signature)
    if not due_weekly and not worsened:
        state[key] = {**previous_state, "lastCheckedAt": now.isoformat(), "signature": current_signature}
        return {"ok": True, "sent": False, "reason": "growth_report_notification_checked", "worsened": False}
    reason = "growth_report_worsened_sent" if worsened else "weekly_report_auto_sent"
    result = await _send_growth_report_notification(hass, season_id, report, reason=reason)
    state[key] = {
        "lastCheckedAt": now.isoformat(),
        "lastSentAt": now.isoformat(),
        "signature": current_signature,
        "reason": reason,
    }
    return {**result, "sent": True, "worsened": worsened, "signature": current_signature}


async def _run_growth_report_notification_tick(hass, now) -> None:
    try:
        rows = await fetchall(hass, """
            SELECT id
            FROM crop_seasons
            WHERE deleted_at IS NULL AND demolish_date IS NULL
            ORDER BY plant_date DESC
            LIMIT 20
        """)
        for row in rows:
            await _maybe_send_growth_report_auto_notification(hass, int(row["id"]), now=now.replace(tzinfo=None) if hasattr(now, "replace") else datetime.utcnow())
        hass.data.setdefault("green_smart", {})["growth_report_notification_checked"] = datetime.utcnow().isoformat()
    except Exception as exc:  # pragma: no cover - HA runtime scheduler path
        _LOGGER.warning("Growth report notification scheduler tick failed: %s", exc)


class CropGrowthReportNotifyView(HomeAssistantView):
    """POST /api/green_smart/crop/seasons/{season_id}/growth-report/notify."""
    url  = "/api/green_smart/crop/seasons/{season_id}/growth-report/notify"
    name = "api:green_smart:crop:growth_report_notify"

    async def post(self, request: web.Request, season_id: str) -> web.Response:
        hass = request.app["hass"]
        report = await _growth_report_response(hass, int(season_id))
        result = await _send_growth_report_notification(hass, int(season_id), report, reason="manual_notify")
        settings, state = _growth_report_notification_maps(hass)
        state[str(season_id)] = {
            **(state.get(str(season_id)) or {}),
            "lastSentAt": datetime.utcnow().isoformat(),
            "signature": _growth_report_health_signature(report),
            "reason": result.get("reason"),
        }
        return _json(result)


class CropGrowthReportNotificationSettingsView(HomeAssistantView):
    """POST /api/green_smart/crop/seasons/{season_id}/growth-report/notification-settings."""
    url  = "/api/green_smart/crop/seasons/{season_id}/growth-report/notification-settings"
    name = "api:green_smart:crop:growth_report_notification_settings"

    async def post(self, request: web.Request, season_id: str) -> web.Response:
        hass = request.app["hass"]
        try:
            body = await request.json()
        except Exception:
            body = {}
        settings, _state = _growth_report_notification_maps(hass)
        settings[str(season_id)] = {
            "enabled": bool(body.get("enabled", True)),
            "weeklyIntervalDays": int(body.get("weeklyIntervalDays") or WEEKLY_REPORT_INTERVAL_DAYS),
            "worseningAlerts": bool(body.get("worseningAlerts", True)),
        }
        return _json({"ok": True, "seasonId": int(season_id), **settings[str(season_id)]})


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
