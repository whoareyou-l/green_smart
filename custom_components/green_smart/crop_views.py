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
CROP_POLICY_NOTIFICATION_SETTINGS_KEY = "crop_policy_notification_settings"
CROP_POLICY_NOTIFICATION_STATE_KEY = "crop_policy_notification_state"
CROP_MODEL_VERSION = "crop_season_model_v1"
CROP_SAFETY_RULE_VERSION = "crop_safety_rules_v1"
CROP_INTERLOCK_VERSION = "crop_interlock_policy_v1"
CROP_STAGE_DIAGNOSIS_VERSION = "crop_stage_diagnosis_v1"
CROP_STAGE_INTERLOCK_VERSION = "crop_stage_interlock_v1"
CROP_INTERLOCK_APPROVAL_VERSION = "crop_interlock_approval_v1"
CENTER_CROP_POLICY_INTEGRATION_VERSION = "center_crop_policy_integration_v1"
CENTER_CROP_POLICY_ALERT_VERSION = "center_crop_policy_alert_v1"
CENTER_CROP_POLICY_NOTIFICATION_VERSION = "center_crop_policy_notification_v1"
CENTER_CROP_POLICY_ALERT_STATUSES = {"fallback_safe", "stale_restricted", "rejected"}
CENTER_CROP_POLICY_NOTIFICATION_DEFAULT_STATUSES = {"fallback_safe", "rejected"}
CROP_SAFETY_RULE_DEFAULTS = {
    "growthSurveyStaleDays": 14,
    "controlRecordStaleDays": 21,
    "minGIndex": 0.0,
    "maxGIndex": 120.0,
    "maxWeeklyGrowthCm": 80.0,
    "supportedCropTypes": ["tomato", "lettuce"],
    "metricBoundsByKey": {
        "height": {"min": 0.0, "max": 600.0},
        "leafCount": {"min": 0.0, "max": 120.0},
        "stemDia": {"min": 0.0, "max": 80.0},
        "truss": {"min": 0.0, "max": 80.0},
        "node": {"min": 0.0, "max": 150.0},
    },
    "maxMetricDeltaByKey": {
        "height": 80.0,
        "leafCount": 30.0,
        "stemDia": 20.0,
        "truss": 10.0,
        "node": 30.0,
    },
}

CROP_STAGE_CALIBRATION_VERSION = "crop_stage_calibration_v1"
CROP_STAGE_CALIBRATION_DEFAULTS = [
    {
        "cropType": "tomato",
        "cultivationMethod": "hydro",
        "stageId": "tomato_transplant_establishment",
        "stageLabel": "정식·활착기",
        "indexType": "G-Index",
        "threshold": {
            "targetRange": [-1.5, 1.5],
            "cautionRange": [[-2.5, -1.5], [1.5, 2.5]],
            "problemRange": [[-4.0, -2.5], [2.5, 4.0]],
            "hardBlockRange": [[None, -4.0], [4.0, None]],
        },
        "boundary": {
            "entryCondition": "transplant_date exists",
            "exitCondition": "DAT >= 4 and establishment/rooting confirmed",
            "stageConfidence": "low until establishment evidence exists",
            "entryEvidence": ["transplantDate", "wiltingStatus", "feedEc", "feedPh", "drainEc", "drainPh"],
            "missingEvidence": ["establishmentStatus", "rootZoneStatus"],
            "nextRequiredSurvey": "confirm rooting/wilting recovery by DAT 4; require review after DAT 7",
            "thresholdKeys": {"tomato.establishmentDays": 4, "tomato.establishmentMaxDaysWithoutReview": 7},
        },
        "source": {"basis": "RDA/Nongsaro transplant and establishment guidance; hydroponic terms converted to EC/pH/drain/root-zone controls"},
    },
    {
        "cropType": "tomato",
        "cultivationMethod": "hydro",
        "stageId": "tomato_vegetative_build_up",
        "stageLabel": "영양생장 형성기",
        "indexType": "G-Index",
        "threshold": {"targetRange": [0.5, 2.5], "cautionRange": [[-1.0, 0.5], [2.5, 3.5]], "problemRange": [[None, -1.0], [3.5, 5.0]], "hardBlockRange": [[None, -3.0], [5.0, None]]},
        "boundary": {"entryCondition": "establishment confirmed", "exitCondition": "first cluster flowering >= 10%", "stageConfidence": "medium when cluster observation exists", "entryEvidence": ["plantHeight", "stemDiameter", "leafCount", "nodeCount", "firstClusterStatus"], "missingEvidence": ["firstClusterStatus"], "nextRequiredSurvey": "record first cluster flowering percent", "thresholdKeys": {"tomato.firstClusterFloweringEntryPercent": 10}},
        "source": {"basis": "RDA/Nongsaro first cluster 10% flowering transplant/stage marker"},
    },
    {
        "cropType": "tomato",
        "cultivationMethod": "hydro",
        "stageId": "tomato_first_cluster_flowering_fruit_set",
        "stageLabel": "제1화방 개화·착과기",
        "indexType": "G-Index",
        "threshold": {"targetRange": [-0.5, 1.5], "cautionRange": [[-2.0, -0.5], [1.5, 3.0]], "problemRange": [[None, -2.0], [3.0, 4.5]], "hardBlockRange": [[None, -4.0], [4.5, None]]},
        "boundary": {"entryCondition": "first cluster flowering >= 10%", "exitCondition": "fruit set confirmed or 3-5 days after flowering with set record", "stageConfidence": "high only with fruit-set evidence", "entryEvidence": ["firstClusterFloweringPercent", "fruitSetCount", "flowerStatus", "stemDiameter", "gIndex"], "missingEvidence": ["fruitSetCount"], "nextRequiredSurvey": "confirm fruit set 3-5 days after flowering", "thresholdKeys": {"tomato.firstClusterFruitSetConfirm": "fruit_set_seen OR 3~5 days after flowering with set record"}},
        "source": {"basis": "Nongsaro: fruit set begins 3-5 days after fertilization"},
    },
    {
        "cropType": "tomato",
        "cultivationMethod": "hydro",
        "stageId": "tomato_cluster_expansion_balance",
        "stageLabel": "화방 전개·생육균형 조정기",
        "indexType": "G-Index",
        "threshold": {"targetRange": [-1.0, 1.0], "cautionRange": [[-2.5, -1.0], [1.0, 2.5]], "problemRange": [[None, -2.5], [2.5, None]], "hardBlockRange": [[None, -4.0], [4.0, None]]},
        "boundary": {"entryCondition": "first cluster fruit set confirmed AND cluster_no >= 2", "exitCondition": "fruit expansion confirmed", "stageConfidence": "high when cluster_no and flowering/fruit-set observations exist", "entryEvidence": ["clusterNo", "floweringProgress", "fruitSetProgress", "plantHeight", "stemDiameter", "leafCount", "nodeCount", "gIndex"], "missingEvidence": ["clusterNo"], "nextRequiredSurvey": "record current cluster number and fruit expansion signal", "thresholdKeys": {"tomato.clusterExpansionEntry": "first_cluster_fruit_set_confirmed AND cluster_no >= 2", "tomato.thirdClusterManagementPoint": "cluster_no >= 3 OR 25~30 DAT"}},
        "source": {"basis": "Nongsaro cluster management transition; tomato growth diagnosis MI/PI"},
    },
    {
        "cropType": "tomato",
        "cultivationMethod": "hydro",
        "stageId": "tomato_fruit_expansion_quality",
        "stageLabel": "과실비대·품질관리기",
        "indexType": "G-Index",
        "threshold": {"targetRange": [-1.5, 0.5], "cautionRange": [[-3.0, -1.5], [0.5, 2.0]], "problemRange": [[None, -3.0], [2.0, 3.5]], "hardBlockRange": [[None, -4.5], [3.5, None]]},
        "boundary": {"entryCondition": "fruit diameter growth seen OR fruit_age >= 7 days after set", "exitCondition": "first harvest recorded OR fruit_age >= 35~50 days after set", "stageConfidence": "medium unless fruit size/quality metrics exist", "entryEvidence": ["fruitAge", "fruitDiameter", "cracking", "blossomEndRot", "drainRate", "drainEc", "drainPh", "gIndex"], "missingEvidence": ["fruitDiameter"], "nextRequiredSurvey": "record fruit size and quality disorders", "thresholdKeys": {"tomato.fruitExpansionEntry": "fruit_diameter_growth_seen OR fruit_age >= 7 days after set", "tomato.harvestWindowEntry": "first_harvest_recorded OR fruit_age >= 35~50 days after set"}},
        "source": {"basis": "Nongsaro: fruit expansion near 30 days; harvest 35-50 days by temperature"},
    },
    {
        "cropType": "tomato", "cultivationMethod": "hydro", "stageId": "tomato_continuous_harvest", "stageLabel": "연속 수확기", "indexType": "G-Index",
        "threshold": {"targetRange": [-1.0, 1.0], "cautionRange": [[-2.5, -1.0], [1.0, 2.5]], "problemRange": [[None, -2.5], [2.5, None]], "hardBlockRange": [[None, -4.0], [4.0, None]]},
        "boundary": {"entryCondition": "first harvest recorded OR harvestable fruit confirmed", "exitCondition": "crop termination decision confirmed", "stageConfidence": "requires harvest and PHI/REI evidence", "entryEvidence": ["harvestDate", "harvestKg", "pesticideDate", "PHI", "REI", "qualityDisorders", "gIndex"], "missingEvidence": ["PHI", "REI"], "nextRequiredSurvey": "confirm food-safety clearance before harvest promotion"},
        "source": {"basis": "Nongsaro harvest timing and food-safety-first interlock policy"},
    },
    {
        "cropType": "tomato", "cultivationMethod": "hydro", "stageId": "tomato_late_crop_termination", "stageLabel": "후기·작기 종료기", "indexType": "G-Index",
        "threshold": {"targetRange": [-2.0, 1.0], "cautionRange": [[-3.5, -2.0], [1.0, 2.5]], "problemRange": [[None, -3.5], [2.5, None]], "hardBlockRange": [[None, -5.0], [4.0, None]]},
        "boundary": {"entryCondition": "termination planned OR vigor decline + disease accumulation + low yield signal", "exitCondition": "crop ended", "stageConfidence": "manual/manager decision preferred", "entryEvidence": ["vigorStatus", "diseaseAccumulation", "yieldTrend", "terminationPlan"], "missingEvidence": ["terminationPlan"], "nextRequiredSurvey": "manager/owner termination decision"},
        "source": {"basis": "operational termination decision; G-Index correction secondary"},
    },
    {
        "cropType": "lettuce", "cultivationMethod": "hydro", "stageId": "lettuce_transplant_establishment", "stageLabel": "정식·활착기", "indexType": "L-Index",
        "threshold": {"targetRange": [-1.0, 1.5], "cautionRange": [[-2.5, -1.0], [1.5, 2.5]], "problemRange": [[None, -2.5], [2.5, 4.0]], "hardBlockRange": [[None, -4.0], [4.0, None]]},
        "boundary": {"entryCondition": "transplant_date exists", "exitCondition": "DAT >= 3 and establishment/wilting recovery confirmed", "stageConfidence": "low until leaf/root recovery evidence exists", "entryEvidence": ["transplantDate", "leafCount", "wiltingStatus", "feedEc", "feedPh", "waterTemp"], "missingEvidence": ["establishmentStatus"], "nextRequiredSurvey": "confirm rooting/wilting recovery by DAT 3; review after DAT 7", "thresholdKeys": {"lettuce.establishmentDays": 3, "lettuce.establishmentMaxDaysWithoutReview": 7}},
        "source": {"basis": "lettuce studies use DAT 3 initial survey; RDA transplant leaf count 3-5 leaves"},
    },
    {
        "cropType": "lettuce", "cultivationMethod": "hydro", "stageId": "lettuce_leaf_expansion_early", "stageLabel": "초기 엽생장기", "indexType": "L-Index",
        "threshold": {"targetRange": [0.5, 2.5], "cautionRange": [[-1.0, 0.5], [2.5, 3.5]], "problemRange": [[None, -1.0], [3.5, 4.5]], "hardBlockRange": [[None, -3.5], [4.5, None]]},
        "boundary": {"entryCondition": "DAT >= 3 AND leaf metrics available", "exitCondition": "DAT >= 14 OR leaf length/width/count increase stable", "stageConfidence": "medium when leaf metrics exist", "entryEvidence": ["leafCount", "leafLength", "leafWidth", "plantHeight", "leafColor"], "missingEvidence": ["leafLength", "leafWidth"], "nextRequiredSurvey": "record leaf metrics before DAT 14", "thresholdKeys": {"lettuce.earlyLeafExpansionEntry": "DAT >= 3 AND leaf_count >= transplant_leaf_count"}},
        "source": {"basis": "lettuce DAT 3 and DAT 14 survey timing"},
    },
    {
        "cropType": "lettuce", "cultivationMethod": "hydro", "stageId": "lettuce_leaf_expansion_main", "stageLabel": "본격 엽생장기", "indexType": "L-Index",
        "threshold": {"targetRange": [0.0, 2.0], "cautionRange": [[-2.0, 0.0], [2.0, 3.5]], "problemRange": [[None, -2.0], [3.5, 4.5]], "hardBlockRange": [[None, -4.0], [4.5, None]]},
        "boundary": {"entryCondition": "DAT >= 14 OR clear leaf expansion", "exitCondition": "DAT >= 21 OR harvest-size approaching", "stageConfidence": "high with leaf growth trend", "entryEvidence": ["leafCount", "leafLength", "leafWidth", "plantHeight", "freshWeightProxy", "feedEc", "feedPh"], "missingEvidence": ["leafGrowthTrend"], "nextRequiredSurvey": "record leaf size trend and quality risk", "thresholdKeys": {"lettuce.mainLeafExpansionEntry": "DAT >= 14 OR clear leaf_size increase"}},
        "source": {"basis": "lettuce study: DAT 14 differences; DAT 21 late growth survey"},
    },
    {
        "cropType": "lettuce", "cultivationMethod": "hydro", "stageId": "lettuce_pre_harvest_quality", "stageLabel": "수확 전 품질관리기", "indexType": "L-Index",
        "threshold": {"targetRange": [-0.5, 1.0], "cautionRange": [[-2.0, -0.5], [1.0, 2.5]], "problemRange": [[None, -2.0], [2.5, 4.0]], "hardBlockRange": [[None, -4.0], [4.0, None]]},
        "boundary": {"entryCondition": "DAT >= 21 OR leaf_length >= 15cm OR leaf_width >= 5cm", "exitCondition": "DAT >= 25 OR harvest spec reached", "stageConfidence": "requires quality and food-safety evidence", "entryEvidence": ["leafLength", "leafWidth", "leafColor", "tipburn", "boltingSigns", "pesticideDate", "PHI", "REI"], "missingEvidence": ["PHI", "REI"], "nextRequiredSurvey": "confirm harvest safety and quality", "thresholdKeys": {"lettuce.preHarvestEntry": "DAT >= 21 OR leaf_length >= 15cm OR leaf_width >= 5cm"}},
        "source": {"basis": "RDA harvest leaf size 15-18cm x 5-6cm; DAT 21 late growth survey"},
    },
    {
        "cropType": "lettuce", "cultivationMethod": "hydro", "stageId": "lettuce_harvest_window", "stageLabel": "수확기", "indexType": "L-Index",
        "threshold": {"targetRange": [-1.0, 1.0], "cautionRange": [[-2.5, -1.0], [1.0, 2.5]], "problemRange": [[None, -2.5], [2.5, 3.5]], "hardBlockRange": [[None, -4.0], [3.5, None]]},
        "boundary": {"entryCondition": "DAT 25~30 OR leaf 15~18cm x 5~6cm AND food-safety clear", "exitCondition": "crop ended OR next harvest/cut cycle starts", "stageConfidence": "requires PHI/REI/quality clearance", "entryEvidence": ["harvestable", "harvestDate", "leafLength", "leafWidth", "quality", "PHI", "REI"], "missingEvidence": ["PHI", "REI", "quality"], "nextRequiredSurvey": "block harvest promotion until food-safety clear", "thresholdKeys": {"lettuce.harvestWindowEntry": "DAT >= 25 OR leaf_length 15~18cm AND leaf_width 5~6cm", "lettuce.harvestWindowMaxDays": 30, "lettuce.boltingRiskHeat": "temp > 25°C sustained OR accumulated_temp approaching 1,400~1,700°C"}},
        "source": {"basis": "RDA: harvest after DAT 25-30; bolting at high temperature / accumulated temp 1,400-1,700°C"},
    },
]

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


def _crop_growth_stage(season: dict, latest: dict, growth_rows: list[dict]) -> dict:
    plant_date = season.get("plantDate")
    days_after_planting = _days_since(plant_date)
    latest_g = _growth_g_index(latest) if latest else 0
    crop_type = str(season.get("cropType") or latest.get("cropType") or "default").lower()
    if days_after_planting is None:
        stage = "unknown"
        label = "생육단계 미확정"
    elif crop_type == "lettuce":
        if days_after_planting < 14:
            stage, label = "establishment", "활착기"
        elif days_after_planting < 35:
            stage, label = "vegetative", "엽채 생장기"
        else:
            stage, label = "harvest_window", "수확 가능기"
    else:
        if days_after_planting < 21:
            stage, label = "establishment", "활착기"
        elif latest_g >= 18:
            stage, label = "fruiting", "착과/수확기"
        elif days_after_planting >= 45:
            stage, label = "reproductive", "개화/착과 전환기"
        else:
            stage, label = "vegetative", "영양생장기"
    return {
        "stage": stage,
        "label": label,
        "daysAfterPlanting": days_after_planting,
        "evidence": {
            "cropType": crop_type,
            "gIndex": latest_g,
            "growthSurveyCount": len(growth_rows),
        },
    }


def _crop_profile_for_season(season: dict, latest: dict) -> dict:
    crop_type = str(season.get("cropType") or latest.get("cropType") or "default").lower()
    model = YIELD_MODEL_BY_CROP.get(crop_type, YIELD_MODEL_BY_CROP["default"])
    return {
        "cropType": crop_type,
        "variety": season.get("variety") or "",
        "method": season.get("method") or "",
        "plantDate": season.get("plantDate"),
        "zoneId": season.get("zoneId"),
        "plantDensity": season.get("plantDensity") or 0,
        "totalPlants": season.get("totalPlants") or 0,
        "yieldModelVersion": model["modelVersion"],
        "yieldModelLabel": model["cropModelLabel"],
    }


def _crop_safety_rule_result(reason_code: str, matched: bool, *, severity: str = "block", message: str = "", evidence: dict | None = None) -> dict:
    return {
        "reasonCode": reason_code,
        "matched": bool(matched),
        "severity": severity,
        "message": message or reason_code,
        "evidence": evidence or {},
    }


def _crop_stage_interlock_rule_results(stageDiagnosis: dict | None, control_rows: list[dict] | None = None) -> list[dict]:
    diagnosis = stageDiagnosis or {}
    band = str(diagnosis.get("indexBand") or "unknown")
    stage_id = str(diagnosis.get("stageId") or "unknown")
    missing = list(diagnosis.get("missingEvidence") or [])
    entry_status = diagnosis.get("entryEvidenceStatus") or {}
    if entry_status.get("missing"):
        missing = list(dict.fromkeys(missing + list(entry_status.get("missing") or [])))
    pesticide_entries = []
    for control in control_rows or []:
        for pesticide in control.get("pesticides") or []:
            pesticide_entries.append({**pesticide, "controlDate": control.get("date")})
    harvest_stage = any(token in stage_id for token in ("harvest", "pre_harvest", "continuous_harvest"))
    phi_rei_unknown = harvest_stage and bool(pesticide_entries) and any(
        p.get("PHI") in (None, "") and p.get("phi") in (None, "") and p.get("REI") in (None, "") and p.get("rei") in (None, "")
        for p in pesticide_entries
    )
    return [
        _crop_safety_rule_result(
            "stage_index_hard_block",
            band == "hardBlock",
            message="생육단계별 index가 hard block 범위라 target promotion과 자동 실행을 차단",
            evidence={"stageId": stage_id, "indexBand": band, "indexValue": diagnosis.get("indexValue")},
        ),
        _crop_safety_rule_result(
            "stage_index_problem",
            band == "problem",
            severity="block",
            message="생육단계별 index가 problem 범위라 자동 실행 차단 및 보수 fallback 필요",
            evidence={"stageId": stage_id, "indexBand": band, "indexValue": diagnosis.get("indexValue")},
        ),
        _crop_safety_rule_result(
            "stage_index_caution",
            band == "caution",
            severity="confirm",
            message="생육단계별 index가 caution 범위라 preview는 허용하되 보정 폭 제한 필요",
            evidence={"stageId": stage_id, "indexBand": band, "indexValue": diagnosis.get("indexValue")},
        ),
        _crop_safety_rule_result(
            "stage_missing_evidence",
            bool(missing),
            severity="confirm",
            message="생육단계 판단 증거가 부족해 최신 조사 또는 운영자 확인 필요",
            evidence={"stageId": stage_id, "missingEvidence": missing, "nextRequiredSurvey": diagnosis.get("nextRequiredSurvey")},
        ),
        _crop_safety_rule_result(
            "stage_harvest_phi_rei_unknown",
            phi_rei_unknown,
            message="수확 관련 단계에서 최근 방제 PHI/REI 확인값이 없어 수확/target promotion 차단",
            evidence={"stageId": stage_id, "pesticides": pesticide_entries},
        ),
    ]


def _crop_interlock_approval_resolved_reasons(reasons: set[str], approvalAudit: list[dict] | None = None) -> set[str]:
    resolved: set[str] = set()
    for approval in approvalAudit or []:
        approval_type = str(approval.get("approvalType") or "")
        approved_reasons = set(approval.get("reasonCodes") or [])
        if approval_type == "operator_confirm":
            resolved.update(approved_reasons & {"stage_missing_evidence", "stage_index_caution", "growth_survey_stale", "crop_confidence_low"})
        elif approval_type == "manager_approve":
            resolved.update(approved_reasons & {"stage_harvest_phi_rei_unknown", "crop_pest_risk_high", "pesticide_mix_unknown"})
        elif approval_type == "admin_approve":
            resolved.update(approved_reasons & {"stage_index_hard_block", "stage_index_problem", "pesticide_pls_noncompliant", "pesticide_mix_forbidden", "crop_growth_anomaly", "crop_metric_anomaly", "stage_harvest_phi_rei_unknown"})
    return resolved & reasons


def _crop_interlock_decision(cropSafety: dict | None, *, stageDiagnosis: dict | None = None, control_rows: list[dict] | None = None, approvalAudit: list[dict] | None = None, centerCropPolicy: dict | None = None) -> dict:
    safety = cropSafety or {}
    center_policy = centerCropPolicy or {}
    stage_rule_results = _crop_stage_interlock_rule_results(stageDiagnosis, control_rows)
    reasons = set(safety.get("cropSafetyReasons") or [])
    reasons.update(item["reasonCode"] for item in stage_rule_results if item.get("matched"))
    center_policy_status = str(center_policy.get("policyStatus") or "")
    center_reason_codes = set(center_policy.get("reasonCodes") or [])
    if center_policy_status == "stale_restricted":
        reasons.add("center_policy_stale_restricted")
    if center_policy_status == "fallback_safe":
        reasons.add("center_policy_fallback_safe")
    if center_policy_status == "rejected":
        reasons.add("center_policy_rejected")
    if center_policy.get("applyMode") == "recommend_only":
        reasons.add("center_policy_recommend_only")
    if center_policy.get("recommendationHints"):
        reasons.add("center_policy_recommendation_hint")
    reasons.update(code for code in center_reason_codes if str(code).startswith("center_policy_"))
    matched_results = [item for item in safety.get("cropSafetyRuleResults") or [] if item.get("matched")] + [item for item in stage_rule_results if item.get("matched")]
    confirm_reasons = {item.get("reasonCode") for item in matched_results if item.get("severity") == "confirm"}

    hard_block_reasons = {
        "crop_season_missing",
        "pesticide_pls_noncompliant",
        "pesticide_mix_forbidden",
        "crop_pest_risk_high",
        "crop_growth_anomaly",
        "crop_metric_anomaly",
        "stage_index_hard_block",
        "stage_index_problem",
        "stage_harvest_phi_rei_unknown",
    }
    uncertain_reasons = {
        "crop_type_unknown",
        "growth_survey_stale",
        "pesticide_mix_unknown",
        "crop_control_record_stale",
        "crop_confidence_low",
        "stage_index_caution",
        "stage_missing_evidence",
        "center_policy_stale_restricted",
        "center_policy_fallback_safe",
        "center_policy_rejected",
        "center_policy_recommend_only",
        "center_policy_recommendation_hint",
    }

    actions = []
    if reasons:
        actions.append("allow_read_only_preview")
    if reasons & hard_block_reasons:
        actions.extend(["block_target_promotion", "block_auto_execution"])
    if reasons & uncertain_reasons or confirm_reasons:
        actions.extend(["block_target_promotion", "block_auto_execution", "require_operator_confirmation"])
    if "crop_season_missing" in reasons:
        actions.append("block_downstream_model_targets")
    if "crop_type_unknown" in reasons:
        actions.append("use_generic_safe_ranges_only")
    if "growth_survey_stale" in reasons:
        actions.append("require_fresh_growth_survey")
    if "crop_pest_risk_high" in reasons:
        actions.append("block_aggressive_climate_and_irrigation_changes")
    if "pesticide_pls_noncompliant" in reasons:
        actions.append("block_pesticide_noncompliant_targets")
    if "pesticide_mix_forbidden" in reasons:
        actions.append("block_pesticide_mix_targets")
    if "pesticide_mix_unknown" in reasons:
        actions.append("require_pesticide_mix_confirmation")
    if reasons & {"stage_index_hard_block", "stage_index_problem", "stage_harvest_phi_rei_unknown"}:
        actions.append("block_stage_based_target_promotion")
    if "stage_index_caution" in reasons:
        actions.append("limit_stage_based_correction_magnitude")
    if "stage_missing_evidence" in reasons:
        actions.append("require_stage_evidence_survey")
    if "stage_harvest_phi_rei_unknown" in reasons:
        actions.append("require_harvest_safety_clearance")
    if reasons & {"crop_confidence_low", "crop_control_record_stale", "crop_growth_anomaly", "crop_metric_anomaly", "stage_index_hard_block", "stage_index_problem", "stage_missing_evidence", "stage_harvest_phi_rei_unknown"}:
        actions.append("fallback_conservative_crop_baseline")
    if reasons & {"center_policy_stale_restricted", "center_policy_fallback_safe", "center_policy_rejected"}:
        actions.append("fallback_conservative_crop_baseline")
        actions.append("require_operator_confirmation")
    if "center_policy_recommend_only" in reasons:
        actions.append("center_policy_read_only_recommendation")
    if "center_policy_recommendation_hint" in reasons:
        actions.append("review_center_crop_recommendation_hint")
    if reasons & hard_block_reasons:
        actions.append("fallback_conservative_crop_baseline")

    actions = list(dict.fromkeys(actions))
    hard_block = bool(reasons & hard_block_reasons)
    needs_confirm = bool(reasons & uncertain_reasons or confirm_reasons or hard_block)
    blocked = bool(reasons)
    approval_resolved_reasons = _crop_interlock_approval_resolved_reasons(reasons, approvalAudit)
    unresolved_for_target = reasons - approval_resolved_reasons
    target_promotion_blocked = bool(unresolved_for_target)
    auto_execution_blocked = blocked
    if approval_resolved_reasons and not target_promotion_blocked:
        actions.append("approval_allows_target_promotion")
    if approval_resolved_reasons and auto_execution_blocked:
        actions.append("approval_keeps_auto_execution_blocked")
    actions = list(dict.fromkeys(actions))
    if not blocked:
        approval_gate_status = "clear"
    elif target_promotion_blocked:
        approval_gate_status = "approval_required"
    else:
        approval_gate_status = "target_promotion_approved"
    status = "blocked" if hard_block else ("confirm_required" if blocked else "clear")

    return {
        "cropInterlockVersion": CROP_INTERLOCK_VERSION,
        "cropStageInterlockVersion": CROP_STAGE_INTERLOCK_VERSION,
        "cropInterlockStatus": status,
        "cropInterlockBlocked": blocked,
        "cropInterlockReasons": sorted(reasons),
        "cropInterlockActions": actions,
        "approvalGateStatus": approval_gate_status,
        "approvalResolvedReasons": sorted(approval_resolved_reasons),
        "approvalUnresolvedReasons": sorted(unresolved_for_target),
        "approvalAudit": approvalAudit or [],
        "centerCropPolicy": centerCropPolicy or {},
        "stageDiagnosis": stageDiagnosis or {},
        "stageInterlockRuleResults": stage_rule_results,
        "fallbackToConservativeBaseline": "fallback_conservative_crop_baseline" in actions,
        "operatorConfirmationRequired": needs_confirm,
        "managerApprovalRequired": bool(reasons & {"crop_pest_risk_high", "pesticide_pls_noncompliant", "pesticide_mix_forbidden", "stage_harvest_phi_rei_unknown", "stage_index_hard_block"}),
        "adminApprovalRequired": bool(reasons & {"pesticide_pls_noncompliant", "pesticide_mix_forbidden", "crop_growth_anomaly", "crop_metric_anomaly", "stage_harvest_phi_rei_unknown"}),
        "blockTargetPromotion": target_promotion_blocked,
        "blockAutoExecution": auto_execution_blocked,
        "useGenericSafeRangesOnly": "use_generic_safe_ranges_only" in actions,
        "blockAggressiveClimateAndIrrigationChanges": "block_aggressive_climate_and_irrigation_changes" in actions,
    }


def _crop_safety_rule_snapshot(*, season: dict, growth_rows: list[dict], pestRisk: dict, yieldPrediction: dict, latest_g: float, weekly_growth: float, control_rows: list[dict], settings: dict | None = None) -> dict:
    rules = {**CROP_SAFETY_RULE_DEFAULTS, **(settings or {})}
    latest = growth_rows[0] if growth_rows else {}
    crop_type = str(season.get("cropType") or latest.get("cropType") or "").strip().lower()
    supported = set(rules.get("supportedCropTypes") or [])
    latest_growth_age = _days_since(latest.get("date")) if latest else None
    latest_control_age = _days_since(control_rows[0].get("date")) if control_rows else None
    pest_level = str((pestRisk or {}).get("level") or "low").lower()
    confidence = str((yieldPrediction or {}).get("confidence") or "low").lower()
    growth_stale_days = int(rules.get("growthSurveyStaleDays") or 14)
    control_stale_days = int(rules.get("controlRecordStaleDays") or 21)
    min_g = float(rules.get("minGIndex", 0.0))
    max_g = float(rules.get("maxGIndex") or 120.0)
    max_weekly_growth = float(rules.get("maxWeeklyGrowthCm") or 80.0)

    metric_anomalies = []
    metric_bounds = rules.get("metricBoundsByKey") or {}
    metric_deltas = rules.get("maxMetricDeltaByKey") or {}
    previous = growth_rows[1] if len(growth_rows) > 1 else {}
    for key, bounds in metric_bounds.items():
        value = _growth_metric_value(latest, key, key) if latest else None
        prev_value = _growth_metric_value(previous, key, key) if previous else None
        if value is not None:
            min_value = bounds.get("min")
            max_value = bounds.get("max")
            if min_value is not None and float(value) < float(min_value):
                metric_anomalies.append({"metric": key, "type": "below_min", "value": value, "min": min_value})
            if max_value is not None and float(value) > float(max_value):
                metric_anomalies.append({"metric": key, "type": "above_max", "value": value, "max": max_value})
        if value is not None and prev_value is not None and key in metric_deltas:
            delta = float(value) - float(prev_value)
            threshold = float(metric_deltas[key])
            if abs(delta) > threshold:
                metric_anomalies.append({"metric": key, "type": "delta", "value": value, "previous": prev_value, "delta": round(delta, 3), "threshold": threshold})

    pesticide_entries = []
    for control in control_rows or []:
        for pesticide in control.get("pesticides") or []:
            pesticide_entries.append({**pesticide, "controlDate": control.get("date")})
    pls_risks = [p for p in pesticide_entries if p.get("pls") is False or p.get("plsWarning")]
    mix_forbidden = [p for p in pesticide_entries if p.get("mixable") is False or str(p.get("mixCheckStatus") or "").lower() in {"forbidden", "blocked", "danger"} or "혼용 불가" in str(p.get("mixCheckNote") or p.get("mixWarning") or "")]
    mix_unknown = [p for p in pesticide_entries if len(pesticide_entries) >= 2 and p.get("mixable") is None and str(p.get("mixCheckStatus") or "").lower() in {"", "unknown", "none"}]

    rule_results = [
        _crop_safety_rule_result(
            "crop_season_missing",
            not bool(crop_type and season.get("plantDate")),
            message="활성 작기 또는 정식일이 없어 모델 기반 자동화 차단",
            evidence={"cropType": crop_type, "plantDate": season.get("plantDate")},
        ),
        _crop_safety_rule_result(
            "crop_type_unknown",
            (not crop_type) or crop_type not in supported,
            message="지원 작물 종류를 확인할 수 없어 crop-specific 최적화 차단",
            evidence={"cropType": crop_type, "supportedCropTypes": sorted(supported)},
        ),
        _crop_safety_rule_result(
            "growth_survey_stale",
            latest_growth_age is None or latest_growth_age > growth_stale_days,
            severity="confirm",
            message="최신 생육조사가 오래되어 자동 목표 승격 차단",
            evidence={"latestGrowthSurveyAgeDays": latest_growth_age, "thresholdDays": growth_stale_days},
        ),
        _crop_safety_rule_result(
            "crop_pest_risk_high",
            pest_level == "high",
            message="병해 위험도가 높아 공격적 환경/관수 변경 차단",
            evidence={"pestRiskLevel": pest_level, "pestRiskScore": (pestRisk or {}).get("score")},
        ),
        _crop_safety_rule_result(
            "crop_growth_anomaly",
            float(latest_g or 0) < min_g or float(latest_g or 0) > max_g or abs(float(weekly_growth or 0)) > max_weekly_growth,
            message="G-Index 또는 주간 생장속도 이상치 감지",
            evidence={"gIndex": latest_g, "minGIndex": min_g, "maxGIndex": max_g, "weeklyGrowthCm": weekly_growth, "maxWeeklyGrowthCm": max_weekly_growth},
        ),
        _crop_safety_rule_result(
            "crop_metric_anomaly",
            bool(metric_anomalies),
            message="초장 외 생육조사 지표의 범위/급변 이상치 감지",
            evidence={"metricAnomalies": metric_anomalies, "metricBoundsByKey": metric_bounds, "maxMetricDeltaByKey": metric_deltas},
        ),
        _crop_safety_rule_result(
            "pesticide_pls_noncompliant",
            bool(pls_risks),
            message="PLS 부적합 또는 PLS 경고가 있는 약제가 방제 기록에 포함됨",
            evidence={"pesticides": pls_risks},
        ),
        _crop_safety_rule_result(
            "pesticide_mix_forbidden",
            bool(mix_forbidden),
            message="혼용 불가 또는 금지 상태의 약제 조합이 방제 기록에 포함됨",
            evidence={"pesticides": mix_forbidden},
        ),
        _crop_safety_rule_result(
            "pesticide_mix_unknown",
            bool(mix_unknown),
            severity="confirm",
            message="2개 이상 약제 사용 시 혼용 가능 여부가 확인되지 않은 약제가 있음",
            evidence={"pesticides": mix_unknown},
        ),
        _crop_safety_rule_result(
            "crop_control_record_stale",
            pest_level in {"medium", "high"} and (latest_control_age is None or latest_control_age > control_stale_days),
            severity="confirm",
            message="병해 위험 대비 최근 방제/관리 기록이 부족함",
            evidence={"latestControlAgeDays": latest_control_age, "thresholdDays": control_stale_days, "pestRiskLevel": pest_level},
        ),
        _crop_safety_rule_result(
            "crop_confidence_low",
            confidence == "low",
            severity="confirm",
            message="작물 모델 confidence가 낮아 자동화 차단 또는 운영자 확인 필요",
            evidence={"confidence": confidence, "confidenceReasons": (yieldPrediction or {}).get("confidenceReasons") or []},
        ),
    ]
    matched = [item for item in rule_results if item["matched"]]
    reasons = [item["reasonCode"] for item in matched]
    blocked = bool(matched)
    return {
        "cropSafetyRuleVersion": CROP_SAFETY_RULE_VERSION,
        "cropSafetyStatus": "blocked" if blocked else "clear",
        "cropSafetyBlocked": blocked,
        "cropSafetyReasons": reasons,
        "cropSafetyRules": rules,
        "cropSafetyRuleResults": rule_results,
        "automationAllowed": not blocked,
        "targetPromotionAllowed": not blocked,
    }


def _crop_stage_diagnosis_from_parts(season_id: int, season: dict, growth_rows: list[dict], control_rows: list[dict], calibration_response: dict | None = None) -> dict:
    latest = growth_rows[0] if growth_rows else {}
    crop_type = str(season.get("cropType") or latest.get("cropType") or "tomato").lower()
    method = str(season.get("method") or "hydro").lower()
    calibration_response = calibration_response or {"version": CROP_STAGE_CALIBRATION_VERSION, "calibrations": []}
    calibrations = calibration_response.get("calibrations") or []
    days_after_transplant = _days_since(season.get("plantDate"))
    selected = _stage_diagnosis_select_calibration(crop_type, calibrations, days_after_transplant, latest, control_rows) or {}
    latest_index = _growth_g_index(latest) if latest else 0.0
    threshold = selected.get("threshold") or {}
    boundary = selected.get("boundary") or {}
    evidence_status = _stage_diagnosis_entry_evidence_status(latest, selected) if selected else {"required": [], "available": [], "missing": []}
    missing_evidence = list(dict.fromkeys(list(boundary.get("missingEvidence") or []) + list(evidence_status.get("missing") or [])))
    stage_confidence = boundary.get("stageConfidence") or "low"
    if not latest:
        stage_confidence = "low"
        missing_evidence = list(dict.fromkeys(missing_evidence + ["latestGrowthSurvey"]))
    return {
        "stageId": selected.get("stageId") or "unknown",
        "stageLabel": selected.get("stageLabel") or "생육단계 미확정",
        "indexType": selected.get("indexType") or ("L-Index" if crop_type == "lettuce" else "G-Index"),
        "indexValue": latest_index,
        "indexBand": _stage_diagnosis_index_band(latest_index, threshold),
        "stageConfidence": stage_confidence,
        "entryEvidenceStatus": evidence_status,
        "missingEvidence": missing_evidence,
        "nextRequiredSurvey": boundary.get("nextRequiredSurvey") or "최신 생육조사와 단계 전환 증거를 기록하세요.",
        "threshold": threshold,
        "boundary": boundary,
        "source": selected.get("source") or {},
        "daysAfterTransplant": days_after_transplant,
        "calibrationVersion": calibration_response.get("version"),
    }


def _crop_model_snapshot_from_report_parts(hass, season_id: int, season: dict, growth_rows: list[dict], pest_rows: list[dict], control_rows: list[dict], stageDiagnosis: dict | None = None, approvalAudit: list[dict] | None = None, centerCropPolicy: dict | None = None) -> dict:
    latest = growth_rows[0] if growth_rows else {}
    oldest = growth_rows[-1] if growth_rows else latest
    height_now = _growth_metric_value(latest, "height", "height") or 0
    height_old = _growth_metric_value(oldest, "height", "height") or height_now
    days = _growth_days_between(oldest.get("date"), latest.get("date")) if growth_rows else 7
    weekly_growth = round((height_now - height_old) / days * 7, 2) if days else 0
    latest_g = _growth_g_index(latest) if latest else 0
    pestRisk = _growth_pest_risk(hass, pest_rows, control_rows)
    yieldPrediction = _growth_yield_prediction(season, latest, oldest, growth_rows, latest_g, weekly_growth)
    if stageDiagnosis is None:
        stageDiagnosis = _crop_stage_diagnosis_from_parts(season_id, season, growth_rows, control_rows)
    cropSafety = _crop_safety_rule_snapshot(season=season, growth_rows=growth_rows, pestRisk=pestRisk, yieldPrediction=yieldPrediction, latest_g=latest_g, weekly_growth=weekly_growth, control_rows=control_rows)
    cropInterlock = _crop_interlock_decision(cropSafety, stageDiagnosis=stageDiagnosis, control_rows=control_rows, approvalAudit=approvalAudit, centerCropPolicy=centerCropPolicy)
    growthStage = _crop_growth_stage(season, latest, growth_rows)
    cropProfile = _crop_profile_for_season(season, latest)
    confidenceReasons = list(dict.fromkeys(
        list(yieldPrediction.get("confidenceReasons") or [])
        + list(pestRisk.get("riskFactors") or [])
        + ([] if latest else ["최신 생육조사 없음"])
    ))
    return {
        "cropModelVersion": CROP_MODEL_VERSION,
        "seasonId": season_id,
        "season": season,
        "cropProfile": cropProfile,
        "growthStage": growthStage,
        "stageDiagnosis": stageDiagnosis,
        "centerCropPolicy": centerCropPolicy or {},
        "cropPolicyAppliedToModel": bool((centerCropPolicy or {}).get("cropPolicyAppliedToModel")),
        "cropPolicyAppliedToInterlock": bool((centerCropPolicy or {}).get("cropPolicyAppliedToInterlock")),
        "cropModelVariables": (centerCropPolicy or {}).get("cropModelVariables") or {},
        "cropInterlockVariables": (centerCropPolicy or {}).get("cropInterlockVariables") or {},
        "recommendationHints": (centerCropPolicy or {}).get("recommendationHints") or {},
        "policyStatus": (centerCropPolicy or {}).get("policyStatus"),
        "applyMode": (centerCropPolicy or {}).get("applyMode") or "recommend_only",
        "gIndex": latest_g,
        "weeklyGrowthCm": weekly_growth,
        "latestMetrics": latest,
        "yieldPrediction": yieldPrediction,
        "pestRisk": pestRisk,
        "cropSafety": cropSafety,
        "cropInterlock": cropInterlock,
        "modelAllowed": not (cropSafety.get("cropSafetyBlocked") or cropInterlock.get("cropInterlockBlocked")),
        "modelBlockedBySafety": bool(cropSafety.get("cropSafetyBlocked")),
        "modelBlockedByInterlock": bool(cropInterlock.get("cropInterlockBlocked")),
        "confidence": yieldPrediction.get("confidence") or "low",
        "confidenceReasons": confidenceReasons,
        "sourceTables": ["crop_seasons", "growth_surveys", "pest_surveys", "control_records"],
    }


async def _center_crop_policy_audit_key(
    *, season_id: int, farm_id: int, zone_id: int | None, policy_status: str, policy_version: str | None
) -> str:
    return f"{farm_id}:{season_id}:{zone_id or 0}:{policy_status}:{policy_version or 'none'}"


async def _record_center_crop_policy_status_audit(
    hass,
    *,
    season_id: int,
    farm_id: int,
    zone_id: int | None,
    policy_status: str,
    policy_version: str | None,
    reason_codes: list[str],
    recommendation_hints: dict | None = None,
) -> bool:
    """Record important Center crop policy status changes once per status/version.

    Home Assistant persistent notifications are intentionally not used in this baseline; panel alert + audit only.
    """
    if policy_status not in CENTER_CROP_POLICY_ALERT_STATUSES:
        return False
    key = await _center_crop_policy_audit_key(
        season_id=season_id,
        farm_id=farm_id,
        zone_id=zone_id,
        policy_status=policy_status,
        policy_version=policy_version,
    )
    domain_data = hass.data.setdefault("green_smart", {})
    dedupe = domain_data.setdefault("crop_policy_alert_audit_deduped", {})
    if dedupe.get(key):
        return False
    dedupe[key] = datetime.utcnow().isoformat()
    alert_severity = "error" if policy_status in {"fallback_safe", "rejected"} else "warning"
    await execute(
        hass,
        """
        INSERT INTO audit_logs (farm_id, actor, action, before_json, after_json)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (
            int(farm_id or 1),
            "edge_crop_policy_monitor",
            "crop_policy_status_change",
            json.dumps({"season_id": season_id, "zone_id": zone_id}, ensure_ascii=False, default=str),
            json.dumps(
                {
                    "version": CENTER_CROP_POLICY_ALERT_VERSION,
                    "season_id": season_id,
                    "zone_id": zone_id,
                    "policyStatus": policy_status,
                    "policyVersion": policy_version,
                    "reasonCodes": reason_codes,
                    "recommendationHints": recommendation_hints or {},
                    "alertSeverity": alert_severity,
                    "auditLogged": True,
                },
                ensure_ascii=False,
                default=str,
            ),
        ),
    )
    return True


def _crop_policy_notification_maps(hass) -> tuple[dict, dict]:
    domain_data = hass.data.setdefault("green_smart", {})
    settings = domain_data.setdefault(CROP_POLICY_NOTIFICATION_SETTINGS_KEY, {})
    state = domain_data.setdefault(CROP_POLICY_NOTIFICATION_STATE_KEY, {})
    return settings, state


def _crop_policy_notification_id(*, season_id: int, zone_id: int | None) -> str:
    return f"green_smart_crop_policy_{season_id}_{zone_id or 0}"


def _crop_policy_notification_enabled(settings: dict, season_id: int, policy_status: str) -> bool:
    season_settings = settings.get(str(season_id)) or {}
    if not season_settings:
        return policy_status in CENTER_CROP_POLICY_NOTIFICATION_DEFAULT_STATUSES
    if season_settings.get("enabled") is False:
        return False
    status_settings = season_settings.get("statuses") or {}
    if policy_status == "stale_restricted":
        return bool(status_settings.get("stale_restricted", False))
    return bool(status_settings.get(policy_status, policy_status in CENTER_CROP_POLICY_NOTIFICATION_DEFAULT_STATUSES))


def _crop_policy_notification_message(center_policy: dict, season_id: int, zone_id: int | None) -> str:
    status = center_policy.get("policyStatus") or "fallback_safe"
    reason_codes = center_policy.get("reasonCodes") or []
    next_action = (center_policy.get("recommendationHints") or {}).get("nextAction") or "monitor_crop_policy"
    return (
        f"작물 정책 알림: season={season_id}, zone={zone_id or 0}, status={status}. "
        f"reason={', '.join(str(r) for r in reason_codes) or 'none'}. nextAction={next_action}. "
        "Center 정책은 추천 전용이며 현장 Edge 작물 Safety/Interlock이 최종 판단합니다."
    )


async def _maybe_send_crop_policy_notification(hass, season_id: int, center_policy: dict, *, zone_id: int | None = None) -> dict:
    settings, state = _crop_policy_notification_maps(hass)
    status = str(center_policy.get("policyStatus") or "fallback_safe")
    notification_id = _crop_policy_notification_id(season_id=season_id, zone_id=zone_id)
    if status not in CENTER_CROP_POLICY_ALERT_STATUSES:
        await _clear_crop_policy_notification(hass, season_id=season_id, zone_id=zone_id, reason="policy_recovered")
        return {"sent": False, "dismissed": True, "reason": "policy_recovered", "notificationId": notification_id}
    if not _crop_policy_notification_enabled(settings, season_id, status):
        return {"sent": False, "reason": "crop_policy_notification_disabled", "notificationId": notification_id}
    policy_version = center_policy.get("policyVersion") or "none"
    key = f"{season_id}:{zone_id or 0}:{status}:{policy_version}"
    if state.get(key):
        hass.data.setdefault("green_smart", {})["crop_policy_notification_deduped"] = key
        return {"sent": False, "deduped": True, "reason": "crop_policy_notification_deduped", "notificationId": notification_id}
    state[key] = datetime.utcnow().isoformat()
    await hass.services.async_call(
        "persistent_notification",
        "create",
        {
            "title": "Green Smart 작물 정책 알림",
            "message": _crop_policy_notification_message(center_policy, season_id, zone_id),
            "notification_id": notification_id,
        },
        blocking=False,
    )  # persistent_notification.create
    hass.data.setdefault("green_smart", {})["crop_policy_notification_sent"] = key
    return {"sent": True, "reason": "crop_policy_notification_sent", "notificationId": notification_id}


async def _clear_crop_policy_notification(hass, *, season_id: int, zone_id: int | None = None, reason: str = "manual_dismiss") -> dict:
    _settings, state = _crop_policy_notification_maps(hass)
    notification_id = _crop_policy_notification_id(season_id=season_id, zone_id=zone_id)
    prefix = f"{season_id}:{zone_id or 0}:"
    removed = [key for key in list(state) if key.startswith(prefix)]
    for key in removed:
        state.pop(key, None)
    await hass.services.async_call(
        "persistent_notification",
        "dismiss",
        {"notification_id": notification_id},
        blocking=False,
    )  # persistent_notification.dismiss
    hass.data.setdefault("green_smart", {})["crop_policy_notification_dismissed"] = notification_id
    return {"notificationDismissed": True, "notificationId": notification_id, "dedupeKeysCleared": removed, "reason": reason}


async def _run_crop_policy_notification_tick(hass, now=None) -> None:
    seasons = await fetchall(hass, """
        SELECT id, zone_id AS zoneId
        FROM crop_seasons
        WHERE deleted_at IS NULL AND demolish_date IS NULL
        ORDER BY id DESC
        LIMIT 20
    """)
    for season in seasons:
        try:
            season_id = int(season.get("id"))
            zone_id = season.get("zoneId")
            center_policy = await _active_center_crop_policy(hass, season_id, farm_id=1, zone_id=zone_id)
            await _maybe_send_crop_policy_notification(hass, season_id, center_policy, zone_id=zone_id)
        except Exception as exc:
            _LOGGER.warning("Crop policy notification tick failed for season %s: %s", season.get("id"), exc)
    hass.data.setdefault("green_smart", {})["crop_policy_notification_checked"] = datetime.utcnow().isoformat()


async def _active_center_crop_policy(hass, season_id: int, farm_id: int = 1, zone_id: int | None = None) -> dict:
    """Read the latest validated Center crop policy candidate from Edge cache.

    Center policy may not unblock crop interlock; it is recommend_only model/interlock input.
    """
    row = await fetchone(
        hass,
        """
        SELECT policy_version, policy_json, status, received_at, validated_at, active_from, valid_until,
               stale_after_seconds, fallback_after_seconds, last_error
        FROM edge_crop_policy_cache
        WHERE farm_id = %s
          AND season_id = %s
          AND ((%s IS NULL AND zone_id IS NULL) OR zone_id = %s)
        ORDER BY FIELD(status, 'fresh', 'stale_usable', 'stale_restricted', 'fallback_safe', 'rejected'), received_at DESC
        LIMIT 1
        """,
        (int(farm_id or 1), int(season_id), zone_id, zone_id),
    )
    if not row:
        reason_codes = ["center_policy_fallback_safe"]
        audit_logged = await _record_center_crop_policy_status_audit(
            hass,
            season_id=season_id,
            farm_id=farm_id,
            zone_id=zone_id,
            policy_status="fallback_safe",
            policy_version=None,
            reason_codes=reason_codes,
            recommendation_hints={"nextAction": "wait_for_center_crop_policy"},
        )
        return {
            "version": CENTER_CROP_POLICY_INTEGRATION_VERSION,
            "policyStatus": "fallback_safe",
            "applyMode": "recommend_only",
            "reasonCodes": reason_codes,
            "cropModelVariables": {},
            "cropInterlockVariables": {},
            "recommendationHints": {"nextAction": "wait_for_center_crop_policy"},
            "cropPolicyAppliedToModel": False,
            "cropPolicyAppliedToInterlock": True,
            "auditLogged": audit_logged,
            "alertSeverity": "error",
            "message": "No cached Center crop policy; using local crop fallback policy.",
        }
    policy = _parse_json_object(row.get("policy_json"))
    status = str(row.get("status") or "fallback_safe")
    valid_until = row.get("valid_until")
    received_at = row.get("received_at")
    stale_after = int(row.get("stale_after_seconds") or policy.get("stale_after_seconds") or 600)
    fallback_after = int(row.get("fallback_after_seconds") or policy.get("fallback_after_seconds") or 1800)
    now = datetime.now()
    age_seconds = None
    if received_at:
        try:
            age_seconds = max(0, int((now - received_at.replace(tzinfo=None)).total_seconds()))
        except Exception:
            age_seconds = None
    if status == "rejected":
        reason_codes = ["center_policy_rejected"]
    elif age_seconds is not None and age_seconds >= fallback_after:
        status = "fallback_safe"
        reason_codes = ["center_policy_fallback_safe"]
    elif age_seconds is not None and age_seconds >= stale_after:
        status = "stale_restricted"
        reason_codes = ["center_policy_stale_restricted"]
    elif valid_until and valid_until.replace(tzinfo=None) < now:
        status = "stale_usable"
        reason_codes = ["center_policy_stale_usable"]
    else:
        status = "fresh"
        reason_codes = ["center_policy_recommend_only"]
    hints = policy.get("recommendation_hints") or {}
    if hints:
        reason_codes.append("center_policy_recommendation_hint")
    policy_version = policy.get("policy_version") or row.get("policy_version")
    audit_logged = await _record_center_crop_policy_status_audit(
        hass,
        season_id=season_id,
        farm_id=farm_id,
        zone_id=zone_id,
        policy_status=status,
        policy_version=policy_version,
        reason_codes=reason_codes,
        recommendation_hints=hints,
    )
    alert_severity = "error" if status in {"fallback_safe", "rejected"} else ("warning" if status == "stale_restricted" else "info")
    return {
        "version": CENTER_CROP_POLICY_INTEGRATION_VERSION,
        "policyVersion": policy_version,
        "policyStatus": status,
        "applyMode": policy.get("apply_mode") or "recommend_only",
        "reasonCodes": reason_codes,
        "cropModelVariables": policy.get("crop_model_variables") or {},
        "cropInterlockVariables": policy.get("crop_interlock_variables") or {},
        "recommendationHints": hints,
        "confidence": policy.get("confidence"),
        "validUntil": valid_until,
        "receivedAt": received_at,
        "ageSeconds": age_seconds,
        "staleAfterSeconds": stale_after,
        "fallbackAfterSeconds": fallback_after,
        "lastError": row.get("last_error"),
        "auditLogged": audit_logged,
        "alertSeverity": alert_severity,
        "cropPolicyAppliedToModel": status in {"fresh", "stale_usable", "stale_restricted"},
        "cropPolicyAppliedToInterlock": True,
        "message": "Center crop policy is recommend_only; Edge crop safety/interlock remains authoritative.",
    }


async def _crop_control_rows_with_pesticides(hass, season_id: int, *, limit: int = 10) -> list[dict]:
    rows = await fetchall(hass, """
        SELECT
            r.id, r.control_date AS date, r.notes AS note,
            p.id AS pId, p.sort_order AS pSort,
            p.pesticide_name AS name, p.reg_no AS regNo,
            p.mode_of_action AS moa, p.dilution_ratio AS dil,
            p.usage_amount AS amount, p.pls_compliant AS pls,
            p.mixable AS mixable, p.mix_check_status AS mixCheckStatus,
            p.mix_check_note AS mixCheckNote, p.pls_warning AS plsWarning
        FROM control_records r
        LEFT JOIN control_pesticides p ON p.control_id = r.id
        WHERE r.season_id = %s AND r.deleted_at IS NULL
        ORDER BY r.control_date DESC, p.sort_order ASC
        LIMIT %s
    """, (season_id, limit * 5))
    records: dict[int, dict] = {}
    for row in rows:
        rid = row["id"]
        if rid not in records:
            records[rid] = {"id": rid, "date": row["date"], "note": row["note"], "pesticides": []}
        if row.get("pId") is not None:
            records[rid]["pesticides"].append({
                "name": row["name"], "regNo": row["regNo"],
                "moa": row["moa"], "dil": row["dil"], "amount": row["amount"],
                "pls": bool(row["pls"]) if row["pls"] is not None else None,
                "mixable": bool(row["mixable"]) if row["mixable"] is not None else None,
                "mixCheckStatus": row["mixCheckStatus"],
                "mixCheckNote": row["mixCheckNote"],
                "plsWarning": row["plsWarning"],
            })
    return list(records.values())[:limit]


async def _crop_model_snapshot(hass, season_id: int) -> dict:
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
    control_rows = await _crop_control_rows_with_pesticides(hass, season_id, limit=10)
    crop_type = str(season.get("cropType") or (growth_rows[0].get("cropType") if growth_rows else "tomato")).lower()
    method = str(season.get("method") or "hydro").lower()
    calibration_response = await _crop_stage_calibrations_response(hass, farm_id=1, crop_type=crop_type, cultivation_method=method)
    stageDiagnosis = _crop_stage_diagnosis_from_parts(season_id, season, growth_rows, control_rows, calibration_response)
    approvalAudit = (await _crop_interlock_approval_response(hass, season_id, farm_id=1)).get("approvalAudit") or []
    centerCropPolicy = await _active_center_crop_policy(hass, season_id, farm_id=1, zone_id=season.get("zoneId"))
    return _crop_model_snapshot_from_report_parts(hass, season_id, season, growth_rows, pest_rows, control_rows, stageDiagnosis, approvalAudit, centerCropPolicy)


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
    control_rows = await _crop_control_rows_with_pesticides(hass, season_id, limit=10)
    crop_type = str(season.get("cropType") or (growth_rows[0].get("cropType") if growth_rows else "tomato")).lower()
    method = str(season.get("method") or "hydro").lower()
    calibration_response = await _crop_stage_calibrations_response(hass, farm_id=1, crop_type=crop_type, cultivation_method=method)
    stageDiagnosis = _crop_stage_diagnosis_from_parts(season_id, season, growth_rows, control_rows, calibration_response)
    approvalAudit = (await _crop_interlock_approval_response(hass, season_id, farm_id=1)).get("approvalAudit") or []
    centerCropPolicy = await _active_center_crop_policy(hass, season_id, farm_id=1, zone_id=season.get("zoneId"))
    cropModel = _crop_model_snapshot_from_report_parts(hass, season_id, season, growth_rows, pest_rows, control_rows, stageDiagnosis, approvalAudit, centerCropPolicy)
    latest = cropModel["latestMetrics"]
    oldest = growth_rows[-1] if growth_rows else latest
    weekly_growth = cropModel["weeklyGrowthCm"]
    pestRisk = cropModel["pestRisk"]
    yieldPrediction = cropModel["yieldPrediction"]
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
        "cropModel": cropModel,
        "yieldPrediction": cropModel["yieldPrediction"],
        "pestRisk": cropModel["pestRisk"],
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


class CropPolicyNotificationSettingsView(HomeAssistantView):
    """POST /api/green_smart/crop/seasons/{season_id}/crop-policy/notification-settings."""
    url  = "/api/green_smart/crop/seasons/{season_id}/crop-policy/notification-settings"
    name = "api:green_smart:crop:policy_notification_settings"

    async def post(self, request: web.Request, season_id: str) -> web.Response:
        hass = request.app["hass"]
        try:
            body = await request.json()
        except Exception:
            body = {}
        settings, _state = _crop_policy_notification_maps(hass)
        statuses = body.get("statuses") or {}
        settings[str(season_id)] = {
            "enabled": bool(body.get("enabled", True)),
            "statuses": {
                "fallback_safe": bool(statuses.get("fallback_safe", True)),
                "rejected": bool(statuses.get("rejected", True)),
                "stale_restricted": bool(statuses.get("stale_restricted", False)),
            },
            "version": CENTER_CROP_POLICY_NOTIFICATION_VERSION,
        }
        return _json({"ok": True, "seasonId": int(season_id), **settings[str(season_id)]})


class CropPolicyNotificationDismissView(HomeAssistantView):
    """POST /api/green_smart/crop/seasons/{season_id}/crop-policy/notification-dismiss."""
    url  = "/api/green_smart/crop/seasons/{season_id}/crop-policy/notification-dismiss"
    name = "api:green_smart:crop:policy_notification_dismiss"

    async def post(self, request: web.Request, season_id: str) -> web.Response:
        hass = request.app["hass"]
        try:
            body = await request.json()
        except Exception:
            body = {}
        zone_id = body.get("zoneId") or body.get("zone_id")
        result = await _clear_crop_policy_notification(
            hass,
            season_id=int(season_id),
            zone_id=int(zone_id) if zone_id not in (None, "") else None,
            reason="manual_dismiss",
        )
        return _json({"ok": True, "seasonId": int(season_id), **result})


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


# ── 작물 stage/index calibration ──────────────────────────────────────────────

async def _ensure_crop_stage_calibration_defaults(hass, *, farm_id: int = 1) -> None:
    for item in CROP_STAGE_CALIBRATION_DEFAULTS:
        await execute(hass, """
            INSERT INTO crop_stage_calibrations
                (farm_id, crop_type, cultivation_method, stage_id, stage_label,
                 index_type, threshold_json, boundary_json, source_json, enabled, version)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 1, %s)
            ON DUPLICATE KEY UPDATE
                stage_label = VALUES(stage_label),
                index_type = VALUES(index_type),
                source_json = VALUES(source_json),
                version = VALUES(version)
        """, (
            farm_id,
            item["cropType"],
            item.get("cultivationMethod") or "hydro",
            item["stageId"],
            item["stageLabel"],
            item["indexType"],
            json.dumps(item["threshold"], ensure_ascii=False),
            json.dumps(item["boundary"], ensure_ascii=False),
            json.dumps(item.get("source") or {}, ensure_ascii=False),
            CROP_STAGE_CALIBRATION_VERSION,
        ))


def _parse_json_field(value, fallback):
    if value is None:
        return fallback
    if isinstance(value, (dict, list)):
        return value
    try:
        return json.loads(value)
    except Exception:
        return fallback


def _parse_json_object(value) -> dict:
    parsed = _parse_json_field(value, {})
    return parsed if isinstance(parsed, dict) else {}


async def _crop_stage_calibrations_response(hass, *, farm_id: int = 1, crop_type: str | None = None, cultivation_method: str = "hydro") -> dict:
    await _ensure_crop_stage_calibration_defaults(hass, farm_id=farm_id)
    args: list = [farm_id, cultivation_method]
    where = "farm_id = %s AND cultivation_method = %s AND enabled = 1"
    if crop_type:
        where += " AND crop_type = %s"
        args.append(crop_type)
    rows = await fetchall(hass, f"""
        SELECT id, farm_id AS farmId, crop_type AS cropType,
               cultivation_method AS cultivationMethod,
               stage_id AS stageId, stage_label AS stageLabel,
               index_type AS indexType, threshold_json AS thresholdJson,
               boundary_json AS boundaryJson, source_json AS sourceJson,
               enabled, version, updated_at AS updatedAt
        FROM crop_stage_calibrations
        WHERE {where}
        ORDER BY crop_type ASC, id ASC
    """, tuple(args))
    calibrations = []
    for row in rows:
        threshold = _parse_json_object(row.pop("thresholdJson", None))
        stage_boundary = _parse_json_object(row.pop("boundaryJson", None))
        source = _parse_json_object(row.pop("sourceJson", None))
        row["threshold"] = threshold
        row["boundary"] = stage_boundary
        row["source"] = source
        # Explicit API shape required by real-use stage inference consumers.
        row["stageConfidence"] = stage_boundary.get("stageConfidence")
        row["entryEvidence"] = stage_boundary.get("entryEvidence") or []
        row["missingEvidence"] = stage_boundary.get("missingEvidence") or []
        row["nextRequiredSurvey"] = stage_boundary.get("nextRequiredSurvey")
        calibrations.append(row)
    return {
        "version": CROP_STAGE_CALIBRATION_VERSION,
        "farmId": farm_id,
        "cropType": crop_type,
        "cultivationMethod": cultivation_method,
        "calibrations": calibrations,
    }


def _stage_diagnosis_metric(latest: dict, *keys: str) -> float | None:
    for key in keys:
        value = _growth_metric_value(latest or {}, key, key)
        if value is not None:
            return value
    return None


def _stage_diagnosis_has_metric(latest: dict, *keys: str) -> bool:
    return _stage_diagnosis_metric(latest, *keys) is not None


def _stage_diagnosis_index_band(value: float, threshold: dict) -> str:
    def _in_range(rng) -> bool:
        if not isinstance(rng, list) or len(rng) != 2:
            return False
        low, high = rng
        if low is not None and value < float(low):
            return False
        if high is not None and value > float(high):
            return False
        return True

    for name in ("hardBlockRange", "problemRange", "cautionRange"):
        ranges = threshold.get(name) or []
        if any(_in_range(item) for item in ranges if isinstance(item, list)):
            return name.replace("Range", "")
    if _in_range(threshold.get("targetRange")):
        return "target"
    return "unknown"


def _stage_diagnosis_entry_evidence_status(latest: dict, calibration: dict) -> dict:
    boundary = calibration.get("boundary") or {}
    required = boundary.get("entryEvidence") or []
    available = []
    missing = []
    aliases = {
        "transplantDate": [],
        "plantHeight": ["height", "plantHeight"],
        "stemDiameter": ["stemDia", "stemDiameter"],
        "leafCount": ["leafCount"],
        "nodeCount": ["node", "nodeCount"],
        "clusterNo": ["clusterNo", "cluster", "truss"],
        "firstClusterStatus": ["firstClusterFloweringPercent", "firstClusterStatus"],
        "firstClusterFloweringPercent": ["firstClusterFloweringPercent"],
        "fruitSetCount": ["fruitSetCount"],
        "fruitAge": ["fruitAge", "fruitAgeDays"],
        "fruitDiameter": ["fruitDiameter"],
        "leafLength": ["leafLength"],
        "leafWidth": ["leafWidth"],
        "leafColor": ["leafColor", "spad"],
        "gIndex": ["gIndex"],
        "feedEc": ["feedEc"],
        "feedPh": ["feedPh"],
        "drainEc": ["drainEc"],
        "drainPh": ["drainPh"],
        "waterTemp": ["waterTemp"],
    }
    for item in required:
        keys = aliases.get(item, [item])
        if not keys or _stage_diagnosis_has_metric(latest, *keys):
            available.append(item)
        else:
            missing.append(item)
    return {"required": required, "available": available, "missing": missing}


def _stage_diagnosis_select_calibration(crop_type: str, calibrations: list[dict], days_after_transplant: int | None, latest: dict, control_rows: list[dict]) -> dict | None:
    by_id = {item.get("stageId"): item for item in calibrations}
    dat = days_after_transplant if days_after_transplant is not None else -1
    crop = (crop_type or "").lower()
    if crop == "lettuce":
        leaf_length = _stage_diagnosis_metric(latest, "leafLength")
        leaf_width = _stage_diagnosis_metric(latest, "leafWidth")
        harvest_recorded = bool(control_rows and any("수확" in str(row.get("note") or "") for row in control_rows[:5]))
        if harvest_recorded or dat >= 25 or ((leaf_length or 0) >= 15 and (leaf_width or 0) >= 5):
            return by_id.get("lettuce_harvest_window")
        if dat >= 21 or (leaf_length or 0) >= 15 or (leaf_width or 0) >= 5:
            return by_id.get("lettuce_pre_harvest_quality")
        if dat >= 14:
            return by_id.get("lettuce_leaf_expansion_main")
        if dat >= 3 or latest:
            return by_id.get("lettuce_leaf_expansion_early")
        return by_id.get("lettuce_transplant_establishment")

    cluster_no = _stage_diagnosis_metric(latest, "clusterNo", "cluster", "truss")
    first_flowering = _stage_diagnosis_metric(latest, "firstClusterFloweringPercent")
    fruit_set = _stage_diagnosis_metric(latest, "fruitSetCount")
    fruit_age = _stage_diagnosis_metric(latest, "fruitAge", "fruitAgeDays")
    fruit_diameter = _stage_diagnosis_metric(latest, "fruitDiameter")
    harvest_recorded = bool(control_rows and any("수확" in str(row.get("note") or "") for row in control_rows[:5]))
    termination_signal = bool(latest and str(latest.get("note") or "").lower().find("termination") >= 0)
    if termination_signal:
        return by_id.get("tomato_late_crop_termination")
    if harvest_recorded or (fruit_age or 0) >= 35:
        return by_id.get("tomato_continuous_harvest")
    if (fruit_diameter or 0) > 0 or (fruit_age or 0) >= 7:
        return by_id.get("tomato_fruit_expansion_quality")
    if (cluster_no or 0) >= 2 and (fruit_set or 0) > 0:
        return by_id.get("tomato_cluster_expansion_balance")
    if (first_flowering or 0) >= 10 or (fruit_set or 0) > 0:
        return by_id.get("tomato_first_cluster_flowering_fruit_set")
    if dat >= 4 or latest:
        return by_id.get("tomato_vegetative_build_up")
    return by_id.get("tomato_transplant_establishment") or (calibrations[0] if calibrations else None)


async def _crop_stage_diagnosis_response(hass, season_id: int, *, farm_id: int = 1) -> dict:
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
        LIMIT 30
    """, (season_id,))
    control_rows = await _crop_control_rows_with_pesticides(hass, season_id, limit=10)
    latest = growth_rows[0] if growth_rows else {}
    crop_type = str(season.get("cropType") or latest.get("cropType") or "tomato").lower()
    method = str(season.get("method") or "hydro").lower()
    calibration_response = await _crop_stage_calibrations_response(hass, farm_id=farm_id, crop_type=crop_type, cultivation_method=method)
    calibrations = calibration_response.get("calibrations") or []
    days_after_transplant = _days_since(season.get("plantDate"))
    selected = _stage_diagnosis_select_calibration(crop_type, calibrations, days_after_transplant, latest, control_rows) or {}
    latest_index = _growth_g_index(latest) if latest else 0.0
    threshold = selected.get("threshold") or {}
    boundary = selected.get("boundary") or {}
    evidence_status = _stage_diagnosis_entry_evidence_status(latest, selected) if selected else {"required": [], "available": [], "missing": []}
    missing_evidence = list(dict.fromkeys(list(boundary.get("missingEvidence") or []) + list(evidence_status.get("missing") or [])))
    stage_confidence = boundary.get("stageConfidence") or "low"
    if not latest:
        stage_confidence = "low"
        missing_evidence = list(dict.fromkeys(missing_evidence + ["latestGrowthSurvey"]))
    return {
        "ok": True,
        "version": CROP_STAGE_DIAGNOSIS_VERSION,
        "seasonId": season_id,
        "farmId": farm_id,
        "season": season,
        "cropType": crop_type,
        "cultivationMethod": method,
        "daysAfterTransplant": days_after_transplant,
        "latestMetrics": latest,
        "calibrationVersion": calibration_response.get("version"),
        "stageDiagnosis": {
            "stageId": selected.get("stageId") or "unknown",
            "stageLabel": selected.get("stageLabel") or "생육단계 미확정",
            "indexType": selected.get("indexType") or ("L-Index" if crop_type == "lettuce" else "G-Index"),
            "indexValue": latest_index,
            "indexBand": _stage_diagnosis_index_band(latest_index, threshold),
            "stageConfidence": stage_confidence,
            "entryEvidenceStatus": evidence_status,
            "missingEvidence": missing_evidence,
            "nextRequiredSurvey": boundary.get("nextRequiredSurvey") or "최신 생육조사와 단계 전환 증거를 기록하세요.",
            "threshold": threshold,
            "boundary": boundary,
            "source": selected.get("source") or {},
        },
        "sourceTables": ["crop_seasons", "growth_surveys", "control_records", "control_pesticides", "crop_stage_calibrations"],
    }


class CropStageDiagnosisView(HomeAssistantView):
    """GET /api/green_smart/crop/seasons/{season_id}/stage-diagnosis."""
    url  = "/api/green_smart/crop/seasons/{season_id}/stage-diagnosis"
    name = "api:green_smart:crop:stage_diagnosis"

    async def get(self, request: web.Request, season_id: str) -> web.Response:
        farm_id = int(request.query.get("farmId", 1))
        return _json(await _crop_stage_diagnosis_response(request.app["hass"], int(season_id), farm_id=farm_id))


class CropInterlockApprovalView(HomeAssistantView):
    """GET/POST /api/green_smart/crop/seasons/{season_id}/interlock-approval."""
    url  = "/api/green_smart/crop/seasons/{season_id}/interlock-approval"
    name = "api:green_smart:crop:interlock_approval"

    async def get(self, request: web.Request, season_id: str) -> web.Response:
        farm_id = int(request.query.get("farmId", 1))
        return _json(await _crop_interlock_approval_response(request.app["hass"], int(season_id), farm_id=farm_id))

    async def post(self, request: web.Request, season_id: str) -> web.Response:
        hass = request.app["hass"]
        try:
            body = await request.json()
        except Exception:
            return _err("Invalid JSON")
        farm_id = int(body.get("farmId") or 1)
        approval_type = str(body.get("approvalType") or "operator_confirm")
        if approval_type not in {"operator_confirm", "manager_approve", "admin_approve"}:
            return _err("approvalType must be operator_confirm, manager_approve, or admin_approve")
        actor = str(body.get("actor") or "operator")[:128]
        note = str(body.get("note") or "")
        reason_codes = body.get("reasonCodes") if isinstance(body.get("reasonCodes"), list) else []
        actions = body.get("actions") if isinstance(body.get("actions"), list) else []
        stage_diagnosis = body.get("stageDiagnosis") if isinstance(body.get("stageDiagnosis"), dict) else {}
        interlock = body.get("cropInterlock") if isinstance(body.get("cropInterlock"), dict) else {}
        expires_at = body.get("approvalExpiresAt") or body.get("expiresAt")
        await execute(hass, """
            INSERT INTO crop_interlock_approvals
                (farm_id, season_id, approval_type, actor, note, reason_codes_json,
                 actions_json, stage_diagnosis_json, interlock_json, expires_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                actor = VALUES(actor), note = VALUES(note), reason_codes_json = VALUES(reason_codes_json),
                actions_json = VALUES(actions_json), stage_diagnosis_json = VALUES(stage_diagnosis_json),
                interlock_json = VALUES(interlock_json), expires_at = VALUES(expires_at), updated_at = NOW()
        """, (
            farm_id, int(season_id), approval_type, actor, note,
            json.dumps(reason_codes, ensure_ascii=False),
            json.dumps(actions, ensure_ascii=False),
            json.dumps(stage_diagnosis, ensure_ascii=False),
            json.dumps(interlock, ensure_ascii=False),
            expires_at,
        ))
        await _record_crop_interlock_approval_audit(
            hass,
            farm_id=farm_id,
            season_id=int(season_id),
            actor=actor,
            approval_type=approval_type,
            before=None,
            after={
                "version": CROP_INTERLOCK_APPROVAL_VERSION,
                "approvalType": approval_type,
                "actor": actor,
                "note": note,
                "reasonCodes": reason_codes,
                "actions": actions,
                "approvalExpiresAt": expires_at,
                "stageDiagnosis": stage_diagnosis,
                "cropInterlock": interlock,
            },
        )
        return _json(await _crop_interlock_approval_response(hass, int(season_id), farm_id=farm_id))


async def _crop_interlock_approval_response(hass, season_id: int, *, farm_id: int = 1) -> dict:
    rows = await fetchall(hass, """
        SELECT id, farm_id AS farmId, season_id AS seasonId, approval_type AS approvalType,
               actor, note, reason_codes_json AS reasonCodesJson, actions_json AS actionsJson,
               stage_diagnosis_json AS stageDiagnosisJson, interlock_json AS interlockJson,
               expires_at AS approvalExpiresAt, created_at AS createdAt, updated_at AS updatedAt
        FROM crop_interlock_approvals
        WHERE farm_id = %s AND season_id = %s AND (expires_at IS NULL OR expires_at > NOW())
        ORDER BY updated_at DESC
    """, (farm_id, season_id))
    approvals = []
    for row in rows:
        row["reasonCodes"] = _parse_json_field(row.pop("reasonCodesJson", None), [])
        row["actions"] = _parse_json_field(row.pop("actionsJson", None), [])
        row["stageDiagnosis"] = _parse_json_object(row.pop("stageDiagnosisJson", None))
        row["cropInterlock"] = _parse_json_object(row.pop("interlockJson", None))
        approvals.append(row)
    return {
        "ok": True,
        "version": CROP_INTERLOCK_APPROVAL_VERSION,
        "farmId": farm_id,
        "seasonId": season_id,
        "approvalAudit": approvals,
        "approvals": approvals,
    }


async def _record_crop_interlock_approval_audit(hass, *, farm_id: int, season_id: int, actor: str, approval_type: str, before: dict | None, after: dict) -> None:
    await execute(hass, """
        INSERT INTO audit_logs (farm_id, actor, action, before_json, after_json)
        VALUES (%s, %s, %s, %s, %s)
    """, (
        farm_id,
        actor,
        f"crop_interlock_{approval_type}",
        json.dumps(before or {}, ensure_ascii=False),
        json.dumps({"seasonId": season_id, **after}, ensure_ascii=False),
    ))


class CropStageCalibrationView(HomeAssistantView):
    """GET/PATCH crop stage G-Index/L-Index calibration thresholds."""
    url  = "/api/green_smart/crop/stage-calibrations"
    name = "api:green_smart:crop:stage_calibrations"

    async def get(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        farm_id = int(request.query.get("farmId", 1))
        crop_type = request.query.get("cropType")
        cultivation_method = request.query.get("cultivationMethod") or "hydro"
        return _json(await _crop_stage_calibrations_response(hass, farm_id=farm_id, crop_type=crop_type, cultivation_method=cultivation_method))

    async def patch(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        try:
            body = await request.json()
        except Exception:
            return _err("Invalid JSON")
        farm_id = int(body.get("farmId") or 1)
        crop_type = body.get("cropType")
        stage_id = body.get("stageId")
        cultivation_method = body.get("cultivationMethod") or "hydro"
        if not crop_type or not stage_id:
            return _err("cropType, stageId 필수")
        await _ensure_crop_stage_calibration_defaults(hass, farm_id=farm_id)
        current = await fetchone(hass, """
            SELECT threshold_json AS thresholdJson, boundary_json AS boundaryJson
            FROM crop_stage_calibrations
            WHERE farm_id = %s AND crop_type = %s AND cultivation_method = %s AND stage_id = %s
        """, (farm_id, crop_type, cultivation_method, stage_id))
        threshold = body.get("threshold") if body.get("threshold") is not None else _parse_json_field((current or {}).get("thresholdJson"), {})
        boundary = body.get("boundary") if body.get("boundary") is not None else _parse_json_field((current or {}).get("boundaryJson"), {})
        await execute(hass, """
            UPDATE crop_stage_calibrations
            SET threshold_json = %s, boundary_json = %s, updated_by = %s,
                version = %s, updated_at = NOW()
            WHERE farm_id = %s AND crop_type = %s AND cultivation_method = %s AND stage_id = %s
        """, (
            json.dumps(threshold, ensure_ascii=False),
            json.dumps(boundary, ensure_ascii=False),
            body.get("updatedBy"),
            CROP_STAGE_CALIBRATION_VERSION,
            farm_id, crop_type, cultivation_method, stage_id,
        ))
        return _json(await _crop_stage_calibrations_response(hass, farm_id=farm_id, crop_type=crop_type, cultivation_method=cultivation_method))


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
                p.usage_amount AS amount, p.pls_compliant AS pls,
                p.mixable AS mixable, p.mix_check_status AS mixCheckStatus,
                p.mix_check_note AS mixCheckNote, p.pls_warning AS plsWarning
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
                    "mixable": bool(row["mixable"]) if row["mixable"] is not None else None,
                    "mixCheckStatus": row["mixCheckStatus"],
                    "mixCheckNote": row["mixCheckNote"],
                    "plsWarning": row["plsWarning"],
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
                     mode_of_action, dilution_ratio, usage_amount, pls_compliant,
                     mixable, mix_check_status, mix_check_note, pls_warning)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                control_id, idx,
                p.get("name") or "",
                p.get("regNo"),
                p.get("moa"),
                p.get("dil"),
                p.get("amount"),
                1 if p.get("pls") is True else (0 if p.get("pls") is False else None),
                1 if p.get("mixable") is True else (0 if p.get("mixable") is False else None),
                p.get("mixCheckStatus"),
                p.get("mixCheckNote"),
                p.get("plsWarning"),
            ))

        # 생성된 레코드 반환 (재조회)
        rows = await fetchall(hass, """
            SELECT
                r.id, r.control_date AS date,
                r.zone_description AS zone, r.notes AS note,
                p.id AS pId, p.sort_order AS pSort,
                p.pesticide_name AS name, p.reg_no AS regNo,
                p.mode_of_action AS moa, p.dilution_ratio AS dil,
                p.usage_amount AS amount, p.pls_compliant AS pls,
                p.mixable AS mixable, p.mix_check_status AS mixCheckStatus,
                p.mix_check_note AS mixCheckNote, p.pls_warning AS plsWarning
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
                    "mixable": bool(row["mixable"]) if row["mixable"] is not None else None,
                    "mixCheckStatus": row["mixCheckStatus"],
                    "mixCheckNote": row["mixCheckNote"],
                    "plsWarning": row["plsWarning"],
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
