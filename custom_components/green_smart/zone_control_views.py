"""Zone-scoped control settings HTTP views."""
from __future__ import annotations

import json
from aiohttp import web
from homeassistant.components.http import HomeAssistantView

from .db import execute, fetchall, fetchone

VALID_DOMAINS = {"environment", "irrigation", "device"}


def _json(data, status: int = 200) -> web.Response:
    return web.Response(
        text=json.dumps(data, ensure_ascii=False, default=str),
        content_type="application/json",
        status=status,
    )


def _err(msg: str, status: int = 400) -> web.Response:
    return _json({"error": msg}, status=status)


def _validate_domain(domain: str | None) -> str:
    value = (domain or "").strip()
    if value not in VALID_DOMAINS:
        raise ValueError("domain must be one of environment, irrigation, device")
    return value


def _json_loads(value, default):
    if value is None:
        return default
    if isinstance(value, (dict, list)):
        return value
    try:
        return json.loads(value)
    except Exception:
        return default


def _actor(request: web.Request) -> str | None:
    user = getattr(request, "user", None)
    if user is not None:
        return getattr(user, "name", None) or getattr(user, "id", None)
    return None


def _query_int(request: web.Request, key: str, default: int | None = None) -> int | None:
    raw = request.query.get(key)
    if raw in (None, ""):
        return default
    return int(raw)


async def _settings_response(hass, *, farm_id: int, crop_season_id: int, zone_id: int, domain: str) -> dict:
    row = await fetchone(
        hass,
        """
        SELECT id, farm_id AS farmId, crop_season_id AS cropSeasonId, zone_id AS zoneId,
               domain, settings_json AS settingsJson, version, updated_at AS updatedAt
        FROM zone_control_settings
        WHERE farm_id = %s AND crop_season_id = %s AND zone_id = %s AND domain = %s
        """,
        (farm_id, crop_season_id, zone_id, domain),
    )
    if not row:
        return {"farmId": farm_id, "cropSeasonId": crop_season_id, "zoneId": zone_id, "domain": domain, "settings": None, "found": False}
    row["settings"] = _json_loads(row.pop("settingsJson", None), {})
    row["found"] = True
    return row


async def _upsert_settings(hass, *, farm_id: int, crop_season_id: int, zone_id: int, domain: str, settings: dict, actor: str | None) -> dict:
    before = await _settings_response(hass, farm_id=farm_id, crop_season_id=crop_season_id, zone_id=zone_id, domain=domain)
    settings_json = json.dumps(settings, ensure_ascii=False)
    await execute(
        hass,
        """
        INSERT INTO zone_control_settings
            (farm_id, crop_season_id, zone_id, domain, settings_json, created_by, updated_by)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            settings_json = VALUES(settings_json),
            updated_by = VALUES(updated_by),
            version = version + 1,
            updated_at = NOW()
        """,
        (farm_id, crop_season_id, zone_id, domain, settings_json, actor, actor),
    )
    await _insert_log(
        hass,
        farm_id=farm_id,
        crop_season_id=crop_season_id,
        zone_id=zone_id,
        domain=domain,
        actor=actor,
        action="save_control_settings",
        before=before.get("settings"),
        after=settings,
        result="success",
        message="zone scoped control settings saved",
    )
    return await _settings_response(hass, farm_id=farm_id, crop_season_id=crop_season_id, zone_id=zone_id, domain=domain)


async def _insert_log(hass, *, farm_id: int, crop_season_id: int, zone_id: int, domain: str, actor: str | None, action: str, before, after, result: str, message: str) -> None:
    await execute(
        hass,
        """
        INSERT INTO zone_control_logs
            (farm_id, crop_season_id, zone_id, domain, actor, action, before_json, after_json, result, message)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            farm_id,
            crop_season_id,
            zone_id,
            domain,
            actor,
            action,
            json.dumps(before, ensure_ascii=False) if before is not None else None,
            json.dumps(after, ensure_ascii=False) if after is not None else None,
            result,
            message,
        ),
    )


class ZoneControlSettingsView(HomeAssistantView):
    """GET/POST /api/green_smart/zones/control-settings."""

    url = "/api/green_smart/zones/control-settings"
    name = "api:green_smart:zones:control_settings"

    async def get(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        try:
            domain = _validate_domain(request.query.get("domain"))
            farm_id = _query_int(request, "farm_id", 1) or 1
            crop_season_id = _query_int(request, "crop_season_id")
            zone_id = _query_int(request, "zone_id")
            if not crop_season_id or not zone_id:
                return _err("crop_season_id and zone_id are required")
        except Exception as exc:
            return _err(str(exc))
        return _json(await _settings_response(hass, farm_id=farm_id, crop_season_id=crop_season_id, zone_id=zone_id, domain=domain))

    async def post(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        try:
            body = await request.json()
            domain = _validate_domain(body.get("domain"))
            farm_id = int(body.get("farm_id") or body.get("farmId") or 1)
            crop_season_id = int(body.get("crop_season_id") or body.get("cropSeasonId"))
            zone_id = int(body.get("zone_id") or body.get("zoneId"))
            settings = body.get("settings")
            if not isinstance(settings, dict):
                return _err("settings must be an object")
        except Exception as exc:
            return _err(str(exc))
        return _json(await _upsert_settings(hass, farm_id=farm_id, crop_season_id=crop_season_id, zone_id=zone_id, domain=domain, settings=settings, actor=_actor(request)))


class ZoneControlCopySettingsView(HomeAssistantView):
    """POST /api/green_smart/zones/copy-control-settings."""

    url = "/api/green_smart/zones/copy-control-settings"
    name = "api:green_smart:zones:copy_control_settings"

    async def post(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        try:
            body = await request.json()
            domain = _validate_domain(body.get("domain"))
            farm_id = int(body.get("farm_id") or body.get("farmId") or 1)
            crop_season_id = int(body.get("crop_season_id") or body.get("cropSeasonId"))
            from_zone_id = int(body.get("from_zone_id") or body.get("fromZoneId"))
            to_zone_ids = body.get("to_zone_ids") or body.get("toZoneIds")
            if not isinstance(to_zone_ids, list) or not to_zone_ids:
                return _err("to_zone_ids must be a non-empty list")
            to_zone_ids = [int(z) for z in to_zone_ids if int(z) != from_zone_id]
            if not to_zone_ids:
                return _err("target zones must differ from source zone")
        except Exception as exc:
            return _err(str(exc))

        source = await _settings_response(hass, farm_id=farm_id, crop_season_id=crop_season_id, zone_id=from_zone_id, domain=domain)
        settings = source.get("settings")
        if not source.get("found") or not isinstance(settings, dict):
            return _err("source settings not found", status=404)

        actor = _actor(request)
        for zone_id in to_zone_ids:
            await _upsert_settings(hass, farm_id=farm_id, crop_season_id=crop_season_id, zone_id=zone_id, domain=domain, settings=settings, actor=actor)
        await execute(
            hass,
            """
            INSERT INTO zone_control_copy_jobs
                (farm_id, crop_season_id, domain, from_zone_id, to_zone_ids, copied_settings_json, actor, result)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (farm_id, crop_season_id, domain, from_zone_id, json.dumps(to_zone_ids, ensure_ascii=False), json.dumps(settings, ensure_ascii=False), actor, "success"),
        )
        return _json({"ok": True, "farmId": farm_id, "cropSeasonId": crop_season_id, "domain": domain, "fromZoneId": from_zone_id, "toZoneIds": to_zone_ids})


class ZoneControlFinalTargetsView(HomeAssistantView):
    """GET/POST /api/green_smart/zones/final-targets."""

    url = "/api/green_smart/zones/final-targets"
    name = "api:green_smart:zones:final_targets"

    async def get(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        try:
            domain = _validate_domain(request.query.get("domain"))
            farm_id = _query_int(request, "farm_id", 1) or 1
            crop_season_id = _query_int(request, "crop_season_id")
            zone_id = _query_int(request, "zone_id")
            if not crop_season_id or not zone_id:
                return _err("crop_season_id and zone_id are required")
        except Exception as exc:
            return _err(str(exc))
        row = await fetchone(
            hass,
            """
            SELECT id, farm_id AS farmId, crop_season_id AS cropSeasonId, zone_id AS zoneId,
                   domain, targets_json AS targetsJson, source_ai_output_id AS sourceAiOutputId,
                   source_settings_id AS sourceSettingsId, calculated_by AS calculatedBy, created_at AS createdAt
            FROM zone_final_control_targets
            WHERE farm_id = %s AND crop_season_id = %s AND zone_id = %s AND domain = %s
            ORDER BY created_at DESC, id DESC
            LIMIT 1
            """,
            (farm_id, crop_season_id, zone_id, domain),
        )
        if not row:
            return _json({"found": False, "farmId": farm_id, "cropSeasonId": crop_season_id, "zoneId": zone_id, "domain": domain, "targets": None})
        row["targets"] = _json_loads(row.pop("targetsJson", None), {})
        row["found"] = True
        return _json(row)

    async def post(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        try:
            body = await request.json()
            domain = _validate_domain(body.get("domain"))
            farm_id = int(body.get("farm_id") or body.get("farmId") or 1)
            crop_season_id = int(body.get("crop_season_id") or body.get("cropSeasonId"))
            zone_id = int(body.get("zone_id") or body.get("zoneId"))
            targets = body.get("targets")
            if not isinstance(targets, dict):
                return _err("targets must be an object")
            source_ai_output_id = body.get("source_ai_output_id") or body.get("sourceAiOutputId")
            source_settings_id = body.get("source_settings_id") or body.get("sourceSettingsId")
            calculated_by = body.get("calculated_by") or body.get("calculatedBy") or "system"
        except Exception as exc:
            return _err(str(exc))
        targets_json = json.dumps(targets, ensure_ascii=False)
        new_id = await execute(
            hass,
            """
            INSERT INTO zone_final_control_targets
                (farm_id, crop_season_id, zone_id, domain, targets_json, source_ai_output_id, source_settings_id, calculated_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (farm_id, crop_season_id, zone_id, domain, targets_json, source_ai_output_id, source_settings_id, calculated_by),
        )
        await _insert_log(hass, farm_id=farm_id, crop_season_id=crop_season_id, zone_id=zone_id, domain=domain, actor=_actor(request), action="final_targets_saved", before=None, after=targets, result="success", message="final targets saved")
        return _json({"ok": True, "id": new_id, "farmId": farm_id, "cropSeasonId": crop_season_id, "zoneId": zone_id, "domain": domain, "targets": targets})


class ZoneAiControlOutputsView(HomeAssistantView):
    """GET/POST /api/green_smart/zones/ai-control-outputs."""

    url = "/api/green_smart/zones/ai-control-outputs"
    name = "api:green_smart:zones:ai_control_outputs"

    async def get(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        try:
            domain = _validate_domain(request.query.get("domain"))
            farm_id = _query_int(request, "farm_id", 1) or 1
            crop_season_id = _query_int(request, "crop_season_id")
            zone_id = _query_int(request, "zone_id")
            limit = min(_query_int(request, "limit", 50) or 50, 200)
            if not crop_season_id or not zone_id:
                return _err("crop_season_id and zone_id are required")
        except Exception as exc:
            return _err(str(exc))
        rows = await fetchall(
            hass,
            """
            SELECT id, farm_id AS farmId, crop_season_id AS cropSeasonId, zone_id AS zoneId,
                   domain, model_name AS modelName, strategy_json AS strategyJson,
                   explanation, safety_status AS safetyStatus, applied AS `applied TINYINT`, created_at AS createdAt
            FROM ai_zone_control_outputs
            WHERE farm_id = %s AND crop_season_id = %s AND zone_id = %s AND domain = %s
            ORDER BY created_at DESC, id DESC
            LIMIT %s
            """,
            (farm_id, crop_season_id, zone_id, domain, limit),
        )
        for row in rows:
            row["strategy"] = _json_loads(row.pop("strategyJson", None), {})
            row["applied"] = bool(row.pop("applied TINYINT", 0))
        return _json({"items": rows})

    async def post(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        try:
            body = await request.json()
            domain = _validate_domain(body.get("domain"))
            farm_id = int(body.get("farm_id") or body.get("farmId") or 1)
            crop_season_id = int(body.get("crop_season_id") or body.get("cropSeasonId"))
            zone_id = int(body.get("zone_id") or body.get("zoneId"))
            strategy = body.get("strategy") or body.get("strategy_json") or body.get("strategyJson")
            if not isinstance(strategy, dict):
                return _err("strategy must be an object")
            model_name = body.get("model_name") or body.get("modelName")
            explanation = body.get("explanation")
            safety_status = body.get("safety_status") or body.get("safetyStatus") or "pending"
        except Exception as exc:
            return _err(str(exc))
        strategy_json = json.dumps(strategy, ensure_ascii=False)
        new_id = await execute(
            hass,
            """
            INSERT INTO ai_zone_control_outputs
                (farm_id, crop_season_id, zone_id, domain, model_name, strategy_json, explanation, safety_status, applied)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 0)
            """,
            (farm_id, crop_season_id, zone_id, domain, model_name, strategy_json, explanation, safety_status),
        )
        await _insert_log(hass, farm_id=farm_id, crop_season_id=crop_season_id, zone_id=zone_id, domain=domain, actor=_actor(request), action="ai_output_saved", before=None, after=strategy, result="success", message="AI control output saved")
        return _json({"ok": True, "id": new_id, "farmId": farm_id, "cropSeasonId": crop_season_id, "zoneId": zone_id, "domain": domain, "strategy": strategy, "safetyStatus": safety_status})


class ZoneAiControlOutputApplyView(HomeAssistantView):
    """POST /api/green_smart/zones/ai-control-outputs/{output_id}/apply."""

    url = "/api/green_smart/zones/ai-control-outputs/{output_id}/apply"
    name = "api:green_smart:zones:ai_control_output_apply"

    async def post(self, request: web.Request, output_id: str) -> web.Response:
        hass = request.app["hass"]
        output = await fetchone(
            hass,
            """
            SELECT id, farm_id AS farmId, crop_season_id AS cropSeasonId, zone_id AS zoneId,
                   domain, strategy_json AS strategyJson
            FROM ai_zone_control_outputs
            WHERE id = %s
            """,
            (int(output_id),),
        )
        if not output:
            return _err("AI output not found", status=404)
        try:
            body = await request.json()
        except Exception:
            body = {}
        targets = body.get("targets") or _json_loads(output.get("strategyJson"), {})
        if not isinstance(targets, dict):
            return _err("targets must be an object")
        source_settings_id = body.get("source_settings_id") or body.get("sourceSettingsId")
        targets_json = json.dumps(targets, ensure_ascii=False)
        final_id = await execute(
            hass,
            """
            INSERT INTO zone_final_control_targets
                (farm_id, crop_season_id, zone_id, domain, targets_json, source_ai_output_id, source_settings_id, calculated_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (output["farmId"], output["cropSeasonId"], output["zoneId"], output["domain"], targets_json, int(output_id), source_settings_id, "ai_agent"),
        )
        await execute(hass, "UPDATE ai_zone_control_outputs SET applied = 1 WHERE id = %s", (int(output_id),))
        await _insert_log(hass, farm_id=output["farmId"], crop_season_id=output["cropSeasonId"], zone_id=output["zoneId"], domain=output["domain"], actor=_actor(request), action="ai_output_applied_to_final_targets", before=None, after=targets, result="success", message="AI output applied to final targets")
        return _json({"ok": True, "aiOutputId": int(output_id), "finalTargetId": final_id, "targets": targets})


class ZoneControlLogsView(HomeAssistantView):
    """GET /api/green_smart/zones/control-logs."""

    url = "/api/green_smart/zones/control-logs"
    name = "api:green_smart:zones:control_logs"

    async def get(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        try:
            domain = _validate_domain(request.query.get("domain"))
            farm_id = _query_int(request, "farm_id", 1) or 1
            crop_season_id = _query_int(request, "crop_season_id")
            zone_id = _query_int(request, "zone_id")
            limit = min(_query_int(request, "limit", 100) or 100, 500)
            if not crop_season_id or not zone_id:
                return _err("crop_season_id and zone_id are required")
        except Exception as exc:
            return _err(str(exc))
        rows = await fetchall(
            hass,
            """
            SELECT id, farm_id AS farmId, crop_season_id AS cropSeasonId, zone_id AS zoneId,
                   domain, actor, actor_role AS actorRole, action, before_json AS beforeJson,
                   after_json AS afterJson, result, message, created_at AS createdAt
            FROM zone_control_logs
            WHERE farm_id = %s AND crop_season_id = %s AND zone_id = %s AND domain = %s
            ORDER BY created_at DESC, id DESC
            LIMIT %s
            """,
            (farm_id, crop_season_id, zone_id, domain, limit),
        )
        for row in rows:
            row["before"] = _json_loads(row.pop("beforeJson", None), None)
            row["after"] = _json_loads(row.pop("afterJson", None), None)
        return _json({"items": rows})


async def _domain_get(request: web.Request, domain: str) -> web.Response:
    hass = request.app["hass"]
    try:
        farm_id = _query_int(request, "farm_id", 1) or 1
        crop_season_id = _query_int(request, "crop_season_id")
        zone_id = _query_int(request, "zone_id")
        if not crop_season_id or not zone_id:
            return _err("crop_season_id and zone_id are required")
    except Exception as exc:
        return _err(str(exc))
    return _json(await _settings_response(hass, farm_id=farm_id, crop_season_id=crop_season_id, zone_id=zone_id, domain=domain))


async def _domain_post(request: web.Request, domain: str) -> web.Response:
    hass = request.app["hass"]
    try:
        body = await request.json()
        farm_id = int(body.get("farm_id") or body.get("farmId") or 1)
        crop_season_id = int(body.get("crop_season_id") or body.get("cropSeasonId"))
        zone_id = int(body.get("zone_id") or body.get("zoneId"))
        settings = body.get("settings")
        if not isinstance(settings, dict):
            return _err("settings must be an object")
    except Exception as exc:
        return _err(str(exc))
    return _json(await _upsert_settings(hass, farm_id=farm_id, crop_season_id=crop_season_id, zone_id=zone_id, domain=domain, settings=settings, actor=_actor(request)))


async def _domain_ai_get(request: web.Request, domain: str) -> web.Response:
    request = request.clone(rel_url=request.rel_url.with_query({**request.query, "domain": domain}))
    return await ZoneAiControlOutputsView().get(request)


async def _domain_ai_post(request: web.Request, domain: str) -> web.Response:
    try:
        body = await request.json()
    except Exception:
        return _err("Invalid JSON")
    body["domain"] = domain
    # aiohttp caches json body from _read_bytes; this domain wrapper exists for explicit route contracts.
    request._read_bytes = json.dumps(body).encode()
    return await ZoneAiControlOutputsView().post(request)


class EnvironmentControlSettingsView(HomeAssistantView):
    """Domain wrapper for Environment Control settings."""

    url = "/api/green_smart/environment/control-settings"
    name = "api:green_smart:environment:control_settings"

    async def get(self, request: web.Request) -> web.Response:
        return await _domain_get(request, "environment")

    async def post(self, request: web.Request) -> web.Response:
        return await _domain_post(request, "environment")


class IrrigationControlSettingsView(HomeAssistantView):
    """Domain wrapper for Irrigation Control settings."""

    url = "/api/green_smart/irrigation/control-settings"
    name = "api:green_smart:irrigation:control_settings"

    async def get(self, request: web.Request) -> web.Response:
        return await _domain_get(request, "irrigation")

    async def post(self, request: web.Request) -> web.Response:
        return await _domain_post(request, "irrigation")


class DeviceControlSettingsView(HomeAssistantView):
    """Domain wrapper for Device Control settings."""

    url = "/api/green_smart/devices/control-settings"
    name = "api:green_smart:devices:control_settings"

    async def get(self, request: web.Request) -> web.Response:
        return await _domain_get(request, "device")

    async def post(self, request: web.Request) -> web.Response:
        return await _domain_post(request, "device")


class EnvironmentAiControlOutputsView(HomeAssistantView):
    """Domain wrapper for Environment AI outputs."""

    url = "/api/green_smart/environment/ai-control-outputs"
    name = "api:green_smart:environment:ai_control_outputs"

    async def get(self, request: web.Request) -> web.Response:
        return await _domain_ai_get(request, "environment")

    async def post(self, request: web.Request) -> web.Response:
        return await _domain_ai_post(request, "environment")


class IrrigationAiControlOutputsView(HomeAssistantView):
    """Domain wrapper for Irrigation AI outputs."""

    url = "/api/green_smart/irrigation/ai-control-outputs"
    name = "api:green_smart:irrigation:ai_control_outputs"

    async def get(self, request: web.Request) -> web.Response:
        return await _domain_ai_get(request, "irrigation")

    async def post(self, request: web.Request) -> web.Response:
        return await _domain_ai_post(request, "irrigation")


class DeviceAiControlOutputsView(HomeAssistantView):
    """Domain wrapper for Device AI outputs."""

    url = "/api/green_smart/devices/ai-control-outputs"
    name = "api:green_smart:devices:ai_control_outputs"

    async def get(self, request: web.Request) -> web.Response:
        return await _domain_ai_get(request, "device")

    async def post(self, request: web.Request) -> web.Response:
        return await _domain_ai_post(request, "device")
