"""Zone-scoped control settings HTTP views."""
from __future__ import annotations

import asyncio
import json
from aiohttp import web
from homeassistant.components.http import HomeAssistantView
from homeassistant.util import dt as dt_util

from .db import execute, fetchall, fetchone

VALID_DOMAINS = {"environment", "irrigation", "device"}
VALID_CONTROL_MODES = {"manual", "auto", "assist", "disabled"}


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


async def _interlock_settings_response(hass, *, farm_id: int, crop_season_id: int, zone_id: int, domain: str) -> dict:
    row = await fetchone(
        hass,
        """
        SELECT id, farm_id AS farmId, crop_season_id AS cropSeasonId, zone_id AS zoneId,
               domain, settings_json AS settingsJson, enabled, updated_at AS updatedAt
        FROM zone_interlock_settings
        WHERE farm_id = %s AND crop_season_id = %s AND zone_id = %s AND domain = %s
        """,
        (farm_id, crop_season_id, zone_id, domain),
    )
    if not row:
        return {
            "farmId": farm_id,
            "cropSeasonId": crop_season_id,
            "zoneId": zone_id,
            "domain": domain,
            "enabled": True,
            "settings": {},
            "found": False,
        }
    row["settings"] = _json_loads(row.pop("settingsJson", None), {})
    row["enabled"] = bool(row.get("enabled"))
    row["found"] = True
    return row


async def _upsert_interlock_settings(hass, *, farm_id: int, crop_season_id: int, zone_id: int, domain: str, settings: dict, enabled: bool, actor: str | None) -> dict:
    before = await _interlock_settings_response(hass, farm_id=farm_id, crop_season_id=crop_season_id, zone_id=zone_id, domain=domain)
    settings_json = json.dumps(settings, ensure_ascii=False)
    await execute(
        hass,
        """
        INSERT INTO zone_interlock_settings
            (farm_id, crop_season_id, zone_id, domain, settings_json, enabled, created_by, updated_by)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            settings_json = VALUES(settings_json),
            enabled = VALUES(enabled),
            updated_by = VALUES(updated_by),
            updated_at = NOW()
        """,
        (farm_id, crop_season_id, zone_id, domain, settings_json, 1 if enabled else 0, actor, actor),
    )
    await _insert_log(
        hass,
        farm_id=farm_id,
        crop_season_id=crop_season_id,
        zone_id=zone_id,
        domain=domain,
        actor=actor,
        action="interlock_settings_saved",
        before={"enabled": before.get("enabled"), "settings": before.get("settings")},
        after={"enabled": enabled, "settings": settings},
        result="success",
        message="zone interlock settings saved",
    )
    return await _interlock_settings_response(hass, farm_id=farm_id, crop_season_id=crop_season_id, zone_id=zone_id, domain=domain)


async def _control_mode_response(hass, *, farm_id: int, crop_season_id: int, zone_id: int, domain: str) -> dict:
    row = await fetchone(
        hass,
        """
        SELECT id, farm_id AS farmId, crop_season_id AS cropSeasonId, zone_id AS zoneId,
               domain, mode, allow_auto_execution AS allowAutoExecution,
               override_reason AS overrideReason, override_expires_at AS overrideExpiresAt,
               updated_at AS updatedAt
        FROM zone_control_modes
        WHERE farm_id = %s AND crop_season_id = %s AND zone_id = %s AND domain = %s
        """,
        (farm_id, crop_season_id, zone_id, domain),
    )
    if not row:
        return {
            "farmId": farm_id,
            "cropSeasonId": crop_season_id,
            "zoneId": zone_id,
            "domain": domain,
            "mode": "manual",
            "allowAutoExecution": False,
            "overrideReason": None,
            "overrideExpiresAt": None,
            "found": False,
        }
    row["allowAutoExecution"] = bool(row.get("allowAutoExecution"))
    row["found"] = True
    return row


async def _upsert_control_mode(hass, *, farm_id: int, crop_season_id: int, zone_id: int, domain: str, mode: str, allow_auto_execution: bool, override_reason: str | None, override_expires_at: str | None, actor: str | None) -> dict:
    if mode not in VALID_CONTROL_MODES:
        raise ValueError("mode must be one of manual, auto, assist, disabled")
    before = await _control_mode_response(hass, farm_id=farm_id, crop_season_id=crop_season_id, zone_id=zone_id, domain=domain)
    await execute(
        hass,
        """
        INSERT INTO zone_control_modes
            (farm_id, crop_season_id, zone_id, domain, mode, allow_auto_execution, override_reason, override_expires_at, created_by, updated_by)
        VALUES (%s, %s, %s, %s, %s, %s, %s, NULLIF(%s, ''), %s, %s)
        ON DUPLICATE KEY UPDATE
            mode = VALUES(mode),
            allow_auto_execution = VALUES(allow_auto_execution),
            override_reason = VALUES(override_reason),
            override_expires_at = VALUES(override_expires_at),
            updated_by = VALUES(updated_by),
            updated_at = NOW()
        """,
        (farm_id, crop_season_id, zone_id, domain, mode, 1 if allow_auto_execution else 0, override_reason, override_expires_at, actor, actor),
    )
    after = await _control_mode_response(hass, farm_id=farm_id, crop_season_id=crop_season_id, zone_id=zone_id, domain=domain)
    await _insert_log(
        hass,
        farm_id=farm_id,
        crop_season_id=crop_season_id,
        zone_id=zone_id,
        domain=domain,
        actor=actor,
        action="control_mode_saved",
        before={"mode": before.get("mode"), "allowAutoExecution": before.get("allowAutoExecution"), "overrideReason": before.get("overrideReason"), "overrideExpiresAt": before.get("overrideExpiresAt")},
        after={"mode": after.get("mode"), "allowAutoExecution": after.get("allowAutoExecution"), "overrideReason": after.get("overrideReason"), "overrideExpiresAt": after.get("overrideExpiresAt")},
        result="success",
        message="zone control mode saved",
    )
    return after


async def _control_mode_decision(mode_row: dict, *, dry_run: bool) -> dict:
    mode = mode_row.get("mode") or "manual"
    allow_auto = bool(mode_row.get("allowAutoExecution"))
    allow_execution = bool(dry_run or (mode in {"auto", "assist"} and allow_auto))
    reason = None if allow_execution else "manual override required before execution"
    if mode == "disabled" and not dry_run:
        reason = "control mode disabled"
    return {"mode": mode, "allowAutoExecution": allow_auto, "allowExecution": allow_execution, "reason": reason, "modeRow": mode_row}


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


class ZoneInterlockSettingsView(HomeAssistantView):
    """GET/POST /api/green_smart/zones/interlock-settings."""

    url = "/api/green_smart/zones/interlock-settings"
    name = "api:green_smart:zones:interlock_settings"

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
        return _json(await _interlock_settings_response(hass, farm_id=farm_id, crop_season_id=crop_season_id, zone_id=zone_id, domain=domain))

    async def post(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        try:
            body = await request.json()
            domain = _validate_domain(body.get("domain"))
            farm_id = int(body.get("farm_id") or body.get("farmId") or 1)
            crop_season_id = int(body.get("crop_season_id") or body.get("cropSeasonId"))
            zone_id = int(body.get("zone_id") or body.get("zoneId"))
            settings = body.get("settings") or {}
            if not isinstance(settings, dict):
                return _err("settings must be an object")
            enabled = bool(body.get("enabled", True))
        except Exception as exc:
            return _err(str(exc))
        return _json(await _upsert_interlock_settings(hass, farm_id=farm_id, crop_season_id=crop_season_id, zone_id=zone_id, domain=domain, settings=settings, enabled=enabled, actor=_actor(request)))


class ZoneControlModeView(HomeAssistantView):
    """GET/POST /api/green_smart/zones/control-mode."""

    url = "/api/green_smart/zones/control-mode"
    name = "api:green_smart:zones:control_mode"

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
        return _json(await _control_mode_response(hass, farm_id=farm_id, crop_season_id=crop_season_id, zone_id=zone_id, domain=domain))

    async def post(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        try:
            body = await request.json()
            domain = _validate_domain(body.get("domain"))
            farm_id = int(body.get("farm_id") or body.get("farmId") or 1)
            crop_season_id = int(body.get("crop_season_id") or body.get("cropSeasonId"))
            zone_id = int(body.get("zone_id") or body.get("zoneId"))
            mode = (body.get("mode") or "manual").strip()
            allow_auto_execution = bool(body.get("allow_auto_execution") or body.get("allowAutoExecution") or False)
            override_reason = body.get("override_reason") or body.get("overrideReason")
            override_expires_at = body.get("override_expires_at") or body.get("overrideExpiresAt")
        except Exception as exc:
            return _err(str(exc))
        try:
            data = await _upsert_control_mode(
                hass,
                farm_id=farm_id,
                crop_season_id=crop_season_id,
                zone_id=zone_id,
                domain=domain,
                mode=mode,
                allow_auto_execution=allow_auto_execution,
                override_reason=override_reason,
                override_expires_at=override_expires_at,
                actor=_actor(request),
            )
        except Exception as exc:
            return _err(str(exc))
        return _json(data)


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


async def _latest_final_target_response(hass, *, farm_id: int, crop_season_id: int, zone_id: int, domain: str) -> dict | None:
    row = await fetchone(
        hass,
        """
        SELECT id, farm_id AS farmId, crop_season_id AS cropSeasonId, zone_id AS zoneId,
               domain, targets_json AS targetsJson, created_at AS createdAt
        FROM zone_final_control_targets
        WHERE farm_id = %s AND crop_season_id = %s AND zone_id = %s AND domain = %s
        ORDER BY created_at DESC, id DESC
        LIMIT 1
        """,
        (farm_id, crop_season_id, zone_id, domain),
    )
    if not row:
        return None
    row["targets"] = _json_loads(row.pop("targetsJson", None), {})
    return row


async def _enabled_entity_mappings(hass, *, farm_id: int, crop_season_id: int, zone_id: int, domain: str) -> list[dict]:
    return await fetchall(
        hass,
        """
        SELECT id, device_type AS deviceType, entity_id AS entityId,
               control_role AS controlRole, safe_state AS safeState, enabled
        FROM zone_device_entity_mappings
        WHERE farm_id = %s AND crop_season_id = %s AND zone_id = %s AND domain = %s AND enabled = 1
        ORDER BY device_type ASC, control_role ASC, entity_id ASC
        """,
        (farm_id, crop_season_id, zone_id, domain),
    )


def _target_value_for_mapping(targets: dict, mapping: dict):
    keys = (
        mapping.get("controlRole"),
        mapping.get("deviceType"),
        mapping.get("entityId"),
        str(mapping.get("entityId", "")).replace(".", "_"),
    )
    for key in keys:
        if key and key in targets:
            return targets[key]
    return None


def _split_entity_domain(entity_id: str) -> str:
    return entity_id.split(".", 1)[0] if "." in entity_id else "homeassistant"


def _service_call_for_mapping(mapping: dict, target_value) -> dict | None:
    entity_id = mapping.get("entityId") or mapping.get("entity_id")
    if not entity_id or target_value is None:
        return None
    entity_domain = _split_entity_domain(str(entity_id))
    if isinstance(target_value, dict):
        if target_value.get("service"):
            service_domain, service = str(target_value["service"]).split(".", 1)
            service_data = dict(target_value.get("service_data") or target_value.get("serviceData") or {})
            service_data.setdefault("entity_id", entity_id)
            return {"domain": service_domain, "service": service, "serviceData": service_data, "targetValue": target_value}
        if "value" in target_value:
            target_value = target_value["value"]
    service_data = {"entity_id": entity_id}
    if entity_domain in {"switch", "input_boolean", "fan"}:
        service = "turn_on" if str(target_value).lower() in {"on", "open", "true", "1", "start"} or target_value is True else "turn_off"
    elif entity_domain == "cover":
        text = str(target_value).lower()
        if isinstance(target_value, (int, float)):
            service = "set_cover_position"; service_data["position"] = int(target_value)
        elif text in {"open", "on"}:
            service = "open_cover"
        elif text in {"close", "closed", "off"}:
            service = "close_cover"
        else:
            service = "stop_cover"
    elif entity_domain == "light":
        service = "turn_on" if str(target_value).lower() in {"on", "true", "1"} or target_value is True else "turn_off"
    elif entity_domain == "climate":
        service = "set_temperature"; service_data["temperature"] = float(target_value)
    elif entity_domain in {"number", "input_number"}:
        service = "set_value"; service_data["value"] = float(target_value)
    else:
        safe_state = mapping.get("safeState") or mapping.get("safe_state") or "off"
        service = "turn_on" if str(target_value or safe_state).lower() in {"on", "true", "1"} else "turn_off"
    return {"domain": entity_domain, "service": service, "serviceData": service_data, "targetValue": target_value}


def _entity_state_snapshot(hass, entity_id: str | None) -> dict | None:
    if not entity_id:
        return None
    state = hass.states.get(entity_id)
    if state is None:
        return {"entityId": entity_id, "state": "unavailable", "attributes": {}, "available": False}
    return {
        "entityId": entity_id,
        "state": state.state,
        "attributes": dict(state.attributes or {}),
        "available": True,
        "lastChanged": state.last_changed.isoformat() if getattr(state, "last_changed", None) else None,
        "lastUpdated": state.last_updated.isoformat() if getattr(state, "last_updated", None) else None,
    }


def _entity_state_summary_item(hass, mapping: dict) -> dict:
    entity_id = mapping.get("entityId") or mapping.get("entity_id")
    snapshot = _entity_state_snapshot(hass, entity_id) or {"entityId": entity_id, "state": "unavailable", "attributes": {}, "available": False}
    state_text = str(snapshot.get("state") or "unknown").lower()
    unavailable = (not snapshot.get("available")) or state_text == "unavailable"
    unknown = state_text == "unknown"
    # Phase 1B only surfaces current HA state. Stale threshold policy belongs to Phase 2 interlock settings.
    stale = False
    return {
        "mappingId": mapping.get("id"),
        "deviceType": mapping.get("deviceType"),
        "controlRole": mapping.get("controlRole"),
        "entityId": entity_id,
        "state": snapshot.get("state"),
        "available": not unavailable,
        "unknown": unknown,
        "stale": stale,
        "lastChanged": snapshot.get("lastChanged"),
        "lastUpdated": snapshot.get("lastUpdated"),
        "attributes": snapshot.get("attributes") or {},
        "safeState": mapping.get("safeState"),
        "enabled": bool(mapping.get("enabled", True)),
    }


async def _entity_state_summary_response(hass, *, farm_id: int, crop_season_id: int, zone_id: int, domain: str) -> dict:
    mappings = await _enabled_entity_mappings(hass, farm_id=farm_id, crop_season_id=crop_season_id, zone_id=zone_id, domain=domain)
    items = [_entity_state_summary_item(hass, mapping) for mapping in mappings]
    total = len(items)
    available_count = sum(1 for item in items if item.get("available"))
    unknown_count = sum(1 for item in items if item.get("unknown"))
    unavailable_count = sum(1 for item in items if not item.get("available"))
    stale_count = sum(1 for item in items if item.get("stale"))
    return {
        "ok": True,
        "farmId": farm_id,
        "cropSeasonId": crop_season_id,
        "zoneId": zone_id,
        "domain": domain,
        "summary": {
            "totalCount": total,
            "availableCount": available_count,
            "unavailableCount": unavailable_count,
            "unknownCount": unknown_count,
            "staleCount": stale_count,
            "hasBlockingState": unavailable_count > 0 or unknown_count > 0 or stale_count > 0,
        },
        "items": items,
    }


def _states_match_expected_target(post_state: dict | None, expected_target) -> bool:
    if post_state is None or not post_state.get("available"):
        return False
    actual = str(post_state.get("state", "")).lower()
    if isinstance(expected_target, dict):
        expected_target = expected_target.get("value") or expected_target.get("expected_state") or expected_target.get("expectedState") or expected_target.get("state")
    if isinstance(expected_target, (int, float)):
        attrs = post_state.get("attributes") or {}
        actual_num = attrs.get("current_position") or attrs.get("position") or attrs.get("temperature") or attrs.get("value")
        if actual_num is None:
            return False
        try:
            return abs(float(actual_num) - float(expected_target)) <= 1.0
        except Exception:
            return False
    expected = str(expected_target).lower()
    if expected in {"on", "open", "true", "1", "start"}:
        return actual in {"on", "open", "opening"}
    if expected in {"off", "close", "closed", "false", "0", "stop"}:
        return actual in {"off", "closed", "closing", "stopped"}
    return actual == expected


def _execution_state_report(call: dict, pre_state: dict | None, post_state: dict | None) -> dict:
    expected_target = call.get("targetValue")
    state_matched = _states_match_expected_target(post_state, expected_target)
    return {
        "mappingId": call.get("mappingId"),
        "entityId": call.get("entityId"),
        "expectedTarget": expected_target,
        "actualState": post_state.get("state") if post_state else None,
        "preState": pre_state,
        "postState": post_state,
        "stateMatched": state_matched,
        "stateVerification": "passed" if state_matched else "failed",
    }


def _safe_state_service_call_for_mapping(mapping: dict) -> dict | None:
    safe_state = mapping.get("safeState") or mapping.get("safe_state") or "off"
    return _service_call_for_mapping(mapping, safe_state)


SAFETY_GUARD_WATCHDOG_INTERVAL_SECONDS = 60
SAFETY_GUARD_LAST_NOTIFIED_KEY = "safety_guard_last_notified"
SAFETY_GUARD_EVENT_ACTIONS = {"safety_guard_critical_event", "safety_guard_watchdog_checked", "safety_guard_blocked", "execution_safety_blocked", "failsafe_applied"}

SAFETY_GUARD_RULE_PRESETS = {
    "wind_speed_above": {"label": "강풍 초과", "attribute": "wind_speed", "entityClass": "weather.wind_speed", "reasonCode": "wind_speed_above"},
    "temperature_below": {"label": "저온 미만", "attribute": "temperature", "entityClass": "sensor.temperature", "reasonCode": "temperature_below"},
    "temperature_above": {"label": "고온 초과", "attribute": "temperature", "entityClass": "sensor.temperature", "reasonCode": "temperature_above"},
    "vwc_below": {"label": "VWC 미만", "attribute": "vwc", "entityClass": "sensor.vwc", "reasonCode": "vwc_below"},
    "vwc_above": {"label": "VWC 초과", "attribute": "vwc", "entityClass": "sensor.vwc", "reasonCode": "vwc_above"},
    "ec_below": {"label": "EC 미만", "attribute": "ec", "entityClass": "sensor.ec", "reasonCode": "ec_below"},
    "ec_above": {"label": "EC 초과", "attribute": "ec", "entityClass": "sensor.ec", "reasonCode": "ec_above"},
    "sensor_integrity": {"label": "센서 무결성", "attribute": None, "entityClass": "sensor.integrity", "reasonCode": "sensor_integrity"},
}


def _safety_guard_policy(final_target, interlock_settings) -> dict:
    """Merge persisted interlock settings with final-target _safety overrides."""
    targets = final_target.get("targets") or {}
    target_policy = targets.get("_safety") or targets.get("safety") or {}
    interlock_policy = (interlock_settings or {}).get("settings") or {}
    enabled = (interlock_settings or {}).get("enabled", True) is not False
    if not enabled:
        interlock_policy = {}
    merged = {
        "emergency_stop": False,
        "block_on_unavailable": True,
        "apply_safe_state_on_block": True,
        "rules": [],
        **interlock_policy,
        **target_policy,
    }
    merged["rules"] = list(interlock_policy.get("rules") or []) + list(target_policy.get("rules") or [])
    return merged


def _safety_guard_numeric_value(pre_state, rule):
    attrs = (pre_state or {}).get("attributes") or {}
    condition = str(rule.get("condition") or "").lower()
    preset = SAFETY_GUARD_RULE_PRESETS.get(condition) or {}
    candidates = [
        rule.get("attribute"),
        rule.get("attributeName"),
        preset.get("attribute"),
        "value",
        "temperature",
        "current_temperature",
        "wind_speed",
        "windSpeed",
        "vwc",
        "ec",
        "current_position",
    ]
    for key in candidates:
        if key and attrs.get(key) is not None:
            return attrs.get(key)
    return (pre_state or {}).get("state")


def _safety_guard_reason_code(rule, default_code):
    condition = str(rule.get("condition") or default_code or "interlock_rule").lower()
    preset = SAFETY_GUARD_RULE_PRESETS.get(condition) or {}
    return rule.get("reasonCode") or rule.get("reason_code") or preset.get("reasonCode") or default_code


def _safety_guard_rule_matches(rule, mapping, pre_state, call) -> dict:
    role = rule.get("control_role") or rule.get("controlRole")
    device_type = rule.get("device_type") or rule.get("deviceType")
    entity_id = rule.get("entity_id") or rule.get("entityId")
    if role and role != mapping.get("controlRole"):
        return {"matched": False, "reason": "role_mismatch", "reasonCode": "role_mismatch", "rule": rule}
    if device_type and device_type != mapping.get("deviceType"):
        return {"matched": False, "reason": "device_type_mismatch", "reasonCode": "device_type_mismatch", "rule": rule}
    if entity_id and entity_id != mapping.get("entityId"):
        return {"matched": False, "reason": "entity_mismatch", "reasonCode": "entity_mismatch", "rule": rule}
    condition = str(rule.get("condition") or "unavailable").lower()
    state = str((pre_state or {}).get("state") or "unknown").lower()
    threshold = rule.get("threshold")
    actual_value = _safety_guard_numeric_value(pre_state, rule)
    matched = False
    if condition == "unavailable":
        matched = (not (pre_state or {}).get("available", True)) or state == "unavailable"
    elif condition == "unknown":
        matched = state == "unknown"
    elif condition == "sensor_integrity":
        matched = (not (pre_state or {}).get("available", True)) or state in {"unavailable", "unknown", "none", "nan", ""}
    elif condition == "equals":
        matched = state == str(threshold or rule.get("value") or "").lower()
    elif condition in {"above", "wind_speed_above", "temperature_above", "vwc_above", "ec_above"}:
        try:
            matched = float(actual_value) > float(threshold)
        except Exception:
            matched = False
    elif condition in {"below", "temperature_below", "vwc_below", "ec_below"}:
        try:
            matched = float(actual_value) < float(threshold)
        except Exception:
            matched = False
    else:
        matched = bool(rule.get("block", True))
    reason_code = _safety_guard_reason_code(rule, condition if matched else "safety_guard_rule_not_matched")
    return {"matched": matched, "condition": condition, "state": state, "reason": "safety_guard_rule_matched" if matched else "safety_guard_rule_not_matched", "reasonCode": reason_code, "actualValue": actual_value, "threshold": threshold, "rule": rule, "call": call}


def _safety_guard_result_schema(*, status: str, blocked: bool, fail_safe_required: bool, reasons: list[str], rule_results: list[dict], safe_state_call: dict | None) -> dict:
    return {
        "status": status,
        "blocked": blocked,
        "failSafeRequired": fail_safe_required,
        "reasons": reasons,
        "ruleResults": rule_results,
        "safeStateCall": safe_state_call,
    }


def _safety_guard_decision(final_target, interlock_settings, mapping, call, pre_state) -> dict:
    policy = _safety_guard_policy(final_target, interlock_settings)
    emergency_stop = bool(policy.get("emergency_stop") or policy.get("emergencyStop") or False)
    block_on_unavailable = policy.get("block_on_unavailable", policy.get("blockOnUnavailable", True))
    apply_safe_state_on_block = policy.get("apply_safe_state_on_block", policy.get("applySafeStateOnBlock", True))
    reasons = []
    rule_results = []
    if emergency_stop:
        reasons.append("emergency_stop")
    if block_on_unavailable and pre_state and not pre_state.get("available", True):
        reasons.append("entity_unavailable")
    for rule in policy.get("rules") or []:
        result = _safety_guard_rule_matches(rule, mapping, pre_state, call)
        rule_results.append(result)
        if result.get("matched") and rule.get("block", True) and str(rule.get("action") or "block") != "warn":
            reasons.append(result.get("reasonCode") or rule.get("message") or rule.get("reason") or "interlock_rule")
    safe_state_call = _safe_state_service_call_for_mapping(mapping) if reasons and apply_safe_state_on_block else None
    status = "failsafe" if safe_state_call else ("blocked" if reasons else "clear")
    safety_guard = _safety_guard_result_schema(status=status, blocked=bool(reasons), fail_safe_required=bool(safe_state_call), reasons=reasons, rule_results=rule_results, safe_state_call=safe_state_call)
    return {
        "blockedByInterlock": bool(reasons),
        "failSafeApplied": bool(safe_state_call),
        "interlockReasons": reasons,
        "safetyStatus": status,
        "safeStateCall": safe_state_call,
        "safeStateResult": None,
        "originalCall": call,
        "safetyGuard": safety_guard,
    }


def _interlock_failsafe_decision(final_target: dict, mapping: dict, call: dict, pre_state: dict | None) -> dict:
    """Legacy wrapper kept for Phase 12 contracts; Phase 2A uses SafetyGuard directly."""
    return _safety_guard_decision(final_target, {"enabled": True, "settings": {}}, mapping, call, pre_state)


def _safety_guard_state_age_seconds(pre_state) -> float | None:
    timestamp = (pre_state or {}).get("lastUpdated") or (pre_state or {}).get("lastChanged")
    if not timestamp:
        return None
    try:
        updated = dt_util.parse_datetime(timestamp) if isinstance(timestamp, str) else timestamp
        if updated is None:
            return None
        now = dt_util.utcnow()
        if getattr(updated, "tzinfo", None) is not None and getattr(now, "tzinfo", None) is None:
            now = dt_util.as_utc(now)
        return max(0.0, (now - updated).total_seconds())
    except Exception:
        return None


def _safety_guard_is_stale(pre_state, stale_threshold_seconds) -> bool:
    age_seconds = _safety_guard_state_age_seconds(pre_state)
    return age_seconds is not None and age_seconds > stale_threshold_seconds


def _notify_safety_guard_critical(hass, *, farm_id: int, crop_season_id: int, zone_id: int, domain: str, critical_events: list[dict]) -> None:
    if not critical_events:
        return
    notification_key = f"{crop_season_id}:{zone_id}:{domain}:{','.join(sorted(str(e.get('entityId')) for e in critical_events))}"
    domain_data = hass.data.setdefault("green_smart", {})
    last_notified = domain_data.setdefault(SAFETY_GUARD_LAST_NOTIFIED_KEY, {})
    if last_notified.get(notification_key):
        domain_data["safety_guard_notification_deduped"] = notification_key
        return
    last_notified[notification_key] = dt_util.utcnow().isoformat()
    message = f"SafetyGuard critical safety event: farm={farm_id}, cropSeason={crop_season_id}, zone={zone_id}, domain={domain}, events={len(critical_events)}"
    hass.async_create_task(hass.services.async_call("persistent_notification", "create", {"title": "Green Smart SafetyGuard", "message": message, "notification_id": f"green_smart_safety_guard_{crop_season_id}_{zone_id}_{domain}"}, blocking=False))  # persistent_notification.create


def _safety_guard_watchdog_item(hass, *, final_target: dict, interlock_settings: dict, mapping: dict, stale_threshold_seconds: int) -> dict:
    pre_state = _entity_state_snapshot(hass, mapping.get("entityId"))
    target_value = _target_value_for_mapping(final_target.get("targets") or {}, mapping)
    call = _service_call_for_mapping(mapping, target_value) or _safe_state_service_call_for_mapping(mapping) or {"domain": "homeassistant", "service": "turn_off", "serviceData": {"entity_id": mapping.get("entityId")}, "targetValue": target_value}
    call["mappingId"] = mapping.get("id")
    call["entityId"] = mapping.get("entityId")
    decision = _safety_guard_decision(final_target, interlock_settings, mapping, call, pre_state)
    state_text = str((pre_state or {}).get("state") or "unknown").lower()
    stale = _safety_guard_is_stale(pre_state, stale_threshold_seconds)
    age_seconds = _safety_guard_state_age_seconds(pre_state)
    critical = bool(decision.get("blockedByInterlock")) or state_text in {"unavailable", "unknown"} or stale
    return {"mappingId": mapping.get("id"), "entityId": mapping.get("entityId"), "controlRole": mapping.get("controlRole"), "deviceType": mapping.get("deviceType"), "preState": pre_state, "dryRun": True, "watchdog": True, "stale": stale, "ageSeconds": age_seconds, "staleThresholdSeconds": stale_threshold_seconds, "watchdogStatus": "critical" if critical else "clear", "safetyGuard": decision.get("safetyGuard"), "critical": critical}


async def _safety_guard_watchdog_response(hass, *, farm_id: int, crop_season_id: int, zone_id: int, domain: str, notify: bool = False, stale_threshold_seconds: int = SAFETY_GUARD_WATCHDOG_INTERVAL_SECONDS * 2) -> dict:
    # Watchdog baseline intentionally evaluates current state via _entity_state_snapshot and _safety_guard_decision(final_target, interlock_settings, mapping, call, pre_state) in _safety_guard_watchdog_item; it is dryRun/watchdog only.
    final_target = await _latest_final_target_response(hass, farm_id=farm_id, crop_season_id=crop_season_id, zone_id=zone_id, domain=domain) or {"targets": {}}
    interlock_settings = await _interlock_settings_response(hass, farm_id=farm_id, crop_season_id=crop_season_id, zone_id=zone_id, domain=domain)
    mappings = await _enabled_entity_mappings(hass, farm_id=farm_id, crop_season_id=crop_season_id, zone_id=zone_id, domain=domain)
    items = [_safety_guard_watchdog_item(hass, final_target=final_target, interlock_settings=interlock_settings, mapping=mapping, stale_threshold_seconds=stale_threshold_seconds) for mapping in mappings]
    critical_events = [item for item in items if item.get("critical")]
    if notify and critical_events:
        _notify_safety_guard_critical(hass, farm_id=farm_id, crop_season_id=crop_season_id, zone_id=zone_id, domain=domain, critical_events=critical_events)
    checked_at = dt_util.utcnow().isoformat()
    return {"ok": True, "farmId": farm_id, "cropSeasonId": crop_season_id, "zoneId": zone_id, "domain": domain, "watchdogStatus": "critical" if critical_events else "clear", "checkedAt": checked_at, "lastCheckedAt": checked_at, "staleThresholdSeconds": stale_threshold_seconds, "intervalSeconds": SAFETY_GUARD_WATCHDOG_INTERVAL_SECONDS, "criticalEvents": critical_events, "items": items}


class ZoneSafetyGuardWatchdogView(HomeAssistantView):
    """GET /api/green_smart/zones/safety-guard-watchdog."""

    url = "/api/green_smart/zones/safety-guard-watchdog"
    name = "api:green_smart:zones:safety_guard_watchdog"

    async def get(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        try:
            domain = _validate_domain(request.query.get("domain"))
            farm_id = _query_int(request, "farm_id", 1) or 1
            crop_season_id = _query_int(request, "crop_season_id")
            zone_id = _query_int(request, "zone_id")
            notify = str(request.query.get("notify") or "false").lower() in {"1", "true", "yes"}
            stale_threshold_seconds = _query_int(request, "stale_threshold_seconds", SAFETY_GUARD_WATCHDOG_INTERVAL_SECONDS * 2) or SAFETY_GUARD_WATCHDOG_INTERVAL_SECONDS * 2
            if not crop_season_id or not zone_id:
                return _err("crop_season_id and zone_id are required")
        except Exception as exc:
            return _err(str(exc))
        scope = {"farm_id": farm_id, "crop_season_id": crop_season_id, "zone_id": zone_id, "domain": domain}
        domain_data = hass.data.setdefault("green_smart", {})
        scopes = domain_data.setdefault("safety_guard_watchdog_scopes", [])
        if scope not in scopes:
            scopes.append(scope)
        response = await _safety_guard_watchdog_response(hass, farm_id=farm_id, crop_season_id=crop_season_id, zone_id=zone_id, domain=domain, notify=notify, stale_threshold_seconds=stale_threshold_seconds)
        await _insert_log(hass, farm_id=farm_id, crop_season_id=crop_season_id, zone_id=zone_id, domain=domain, actor=_actor(request), action="safety_guard_critical_event" if response.get("criticalEvents") else "safety_guard_watchdog_checked", before=None, after=response, result="critical" if response.get("criticalEvents") else "success", message="SafetyGuard watchdog checked")
        return _json(response)


class ZoneFinalTargetExecutionView(HomeAssistantView):
    """POST /api/green_smart/zones/execute-final-targets."""

    url = "/api/green_smart/zones/execute-final-targets"
    name = "api:green_smart:zones:execute_final_targets"

    async def post(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        try:
            body = await request.json()
            domain = _validate_domain(body.get("domain"))
            farm_id = int(body.get("farm_id") or body.get("farmId") or 1)
            crop_season_id = int(body.get("crop_season_id") or body.get("cropSeasonId"))
            zone_id = int(body.get("zone_id") or body.get("zoneId"))
            dry_run = bool(body.get("dry_run") or body.get("dryRun") or False)
            post_state_delay = float(body.get("post_state_delay") or body.get("postStateDelay") or 0.4)
        except Exception as exc:
            return _err(str(exc))
        final_target = await _latest_final_target_response(hass, farm_id=farm_id, crop_season_id=crop_season_id, zone_id=zone_id, domain=domain)
        mode_row = await _control_mode_response(hass, farm_id=farm_id, crop_season_id=crop_season_id, zone_id=zone_id, domain=domain)
        modeDecision = await _control_mode_decision(mode_row, dry_run=dry_run)  # Phase 1D: manual/auto/override gate
        if not modeDecision.get("allowExecution"):
            await _insert_log(hass, farm_id=farm_id, crop_season_id=crop_season_id, zone_id=zone_id, domain=domain, actor=_actor(request), action="blocked_by_control_mode", before=mode_row, after=modeDecision, result="blocked", message=modeDecision.get("reason") or "manual override required before execution")
            return _json({"ok": False, "dryRun": dry_run, "controlMode": modeDecision, "safetyStatus": "blocked", "blockedByControlMode": True, "message": modeDecision.get("reason") or "manual override required before execution"}, status=409)
        if not final_target or not isinstance(final_target.get("targets"), dict):
            return _err("final targets not found", status=404)
        mappings = await _enabled_entity_mappings(hass, farm_id=farm_id, crop_season_id=crop_season_id, zone_id=zone_id, domain=domain)
        interlock_settings = await _interlock_settings_response(hass, farm_id=farm_id, crop_season_id=crop_season_id, zone_id=zone_id, domain=domain)
        calls = []
        errors = []
        state_reports = []
        blocked_calls = []
        safe_state_calls = []
        for mapping in mappings:
            target_value = _target_value_for_mapping(final_target["targets"], mapping)
            call = _service_call_for_mapping(mapping, target_value)
            if not call:
                continue
            call["mappingId"] = mapping.get("id")
            call["entityId"] = mapping.get("entityId")
            pre_state = _entity_state_snapshot(hass, call["entityId"])
            call["preState"] = pre_state
            safety_decision = _safety_guard_decision(final_target, interlock_settings, mapping, call, pre_state)
            call["blockedByInterlock"] = safety_decision["blockedByInterlock"]
            call["failSafeApplied"] = safety_decision["failSafeApplied"]
            call["interlockReasons"] = safety_decision["interlockReasons"]
            call["safetyStatus"] = safety_decision["safetyStatus"]
            call["safetyGuard"] = safety_decision["safetyGuard"]
            if safety_decision["blockedByInterlock"]:
                blocked_calls.append(call)
                safe_state_call = safety_decision.get("safeStateCall")
                if safe_state_call:
                    safe_state_call["mappingId"] = mapping.get("id")
                    safe_state_call["entityId"] = mapping.get("entityId")
                    safe_state_call["blockedByInterlock"] = True
                    safe_state_call["failSafeApplied"] = True
                    safe_state_call["interlockReasons"] = safety_decision["interlockReasons"]
                    safe_state_call["safetyStatus"] = "failsafe"
                    safe_state_calls.append(safe_state_call)
                    if not dry_run:
                        try:
                            await hass.services.async_call(safe_state_call["domain"], safe_state_call["service"], safe_state_call["serviceData"], blocking=True)
                            safety_decision["safeStateResult"] = "success"  # failsafe_applied
                        except Exception as exc:  # pragma: no cover - HA runtime path
                            safety_decision["safeStateResult"] = "failed"
                            errors.append({"entityId": call["entityId"], "error": str(exc), "action": "fail_safe_service_call_failed", "preState": pre_state})
                call["safeStateCall"] = safe_state_call
                call["safeStateResult"] = safety_decision.get("safeStateResult")
                continue
            calls.append(call)
            if dry_run:
                call["postState"] = pre_state
                call["stateMatched"] = None
                call["stateVerification"] = "dry_run"
                continue
            try:
                await hass.services.async_call(call["domain"], call["service"], call["serviceData"], blocking=True)
                await hass.services.async_call("homeassistant", "update_entity", {"entity_id": call["entityId"]}, blocking=True)  # async_update_entity
                if post_state_delay > 0:
                    await asyncio.sleep(min(post_state_delay, 3.0))
                post_state = _entity_state_snapshot(hass, call["entityId"])
                report = _execution_state_report(call, pre_state, post_state)
                state_reports.append(report)
                call["postState"] = post_state
                call["stateMatched"] = report["stateMatched"]
                call["stateVerification"] = report["stateVerification"]
            except Exception as exc:  # pragma: no cover - HA runtime path
                errors.append({"entityId": call["entityId"], "error": str(exc), "preState": pre_state})
        state_matched = all(r.get("stateMatched") for r in state_reports) if state_reports else False
        state_failures = [r for r in state_reports if not r.get("stateMatched")]
        if errors:
            action = "final_target_execution_failed"
        elif blocked_calls and safe_state_calls:
            action = "failsafe_applied"
        elif blocked_calls:
            action = "safety_guard_blocked"  # legacy marker: interlock_blocked
        elif not state_reports:
            action = "final_targets_executed"
        elif state_failures:
            action = "state_verification_failed"
        else:
            action = "state_verification_passed"
        if blocked_calls and not safe_state_calls:
            action = "execution_safety_blocked"
        result = "failed" if errors or state_failures or (blocked_calls and not safe_state_calls) else "success"
        safety_guard_summary = {"status": "blocked" if blocked_calls and not safe_state_calls else ("failsafe" if safe_state_calls else "clear"), "blockedCount": len(blocked_calls), "failSafeCount": len(safe_state_calls), "ruleResults": [r for c in blocked_calls + calls for r in ((c.get("safetyGuard") or {}).get("ruleResults") or [])], "reasons": [reason for c in blocked_calls + calls for reason in (c.get("interlockReasons") or [])]}
        response = {"ok": not errors and not state_failures and not (blocked_calls and not safe_state_calls), "dryRun": dry_run, "executedCount": 0 if dry_run else len(calls) - len(errors), "plannedCount": len(calls) + len(blocked_calls), "calls": calls, "errors": errors, "stateReports": state_reports, "stateMatched": state_matched, "stateVerification": "passed" if state_matched else "failed", "blockedCalls": blocked_calls, "safeStateCalls": safe_state_calls, "blockedByInterlock": bool(blocked_calls), "failSafeApplied": bool(safe_state_calls), "safetyStatus": safety_guard_summary["status"], "safetyGuard": safety_guard_summary}
        if response.get("stateMatched") and not blocked_calls:
            action = "state_verification_passed"
        await _insert_log(hass, farm_id=farm_id, crop_season_id=crop_season_id, zone_id=zone_id, domain=domain, actor=_actor(request), action=action, before={"preState": [r.get("preState") for r in state_reports], "blockedCalls": blocked_calls}, after={"postState": [r.get("postState") for r in state_reports], "dry_run": dry_run, "calls": calls, "errors": errors, "stateReports": state_reports, "blockedCalls": blocked_calls, "safeStateCalls": safe_state_calls, "safetyStatus": response["safetyStatus"], "safetyGuard": response["safetyGuard"]}, result=result, message="final targets executed via Home Assistant services with SafetyGuard/interlock/fail safe and pre/post state verification")
        return _json(response)


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


class ZoneEntityStateSummaryView(HomeAssistantView):
    """GET /api/green_smart/zones/entity-state-summary."""

    url = "/api/green_smart/zones/entity-state-summary"
    name = "api:green_smart:zones:entity_state_summary"

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
        return _json(await _entity_state_summary_response(hass, farm_id=farm_id, crop_season_id=crop_season_id, zone_id=zone_id, domain=domain))


class ZoneDeviceEntityMappingsView(HomeAssistantView):
    """GET/POST/DELETE /api/green_smart/zones/device-entity-mappings."""

    url = "/api/green_smart/zones/device-entity-mappings"
    name = "api:green_smart:zones:device_entity_mappings"

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
        rows = await fetchall(
            hass,
            """
            SELECT id, farm_id AS farmId, crop_season_id AS cropSeasonId, zone_id AS zoneId,
                   domain, device_type AS deviceType, entity_id AS entityId,
                   control_role AS controlRole, safe_state AS safeState, enabled,
                   note, updated_at AS updatedAt
            FROM zone_device_entity_mappings
            WHERE farm_id = %s AND crop_season_id = %s AND zone_id = %s AND domain = %s
            ORDER BY enabled DESC, device_type ASC, control_role ASC, entity_id ASC
            """,
            (farm_id, crop_season_id, zone_id, domain),
        )
        for row in rows:
            row["enabled"] = bool(row.get("enabled"))
        return _json({"items": rows, "farmId": farm_id, "cropSeasonId": crop_season_id, "zoneId": zone_id, "domain": domain})

    async def post(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        try:
            body = await request.json()
            domain = _validate_domain(body.get("domain"))
            farm_id = int(body.get("farm_id") or body.get("farmId") or 1)
            crop_season_id = int(body.get("crop_season_id") or body.get("cropSeasonId"))
            zone_id = int(body.get("zone_id") or body.get("zoneId"))
            device_type = str(body.get("device_type") or body.get("deviceType") or "").strip()
            entity_id = str(body.get("entity_id") or body.get("entityId") or "").strip()
            control_role = str(body.get("control_role") or body.get("controlRole") or "").strip()
            safe_state = body.get("safe_state") if "safe_state" in body else body.get("safeState")
            enabled = 1 if body.get("enabled", True) else 0
            note = body.get("note")
            if not device_type or not entity_id or not control_role:
                return _err("device_type, entity_id and control_role are required")
        except Exception as exc:
            return _err(str(exc))
        actor = _actor(request)
        new_id = await execute(
            hass,
            """
            INSERT INTO zone_device_entity_mappings
                (farm_id, crop_season_id, zone_id, domain, device_type, entity_id, control_role, safe_state, enabled, note, created_by, updated_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                device_type = VALUES(device_type),
                safe_state = VALUES(safe_state),
                enabled = VALUES(enabled),
                note = VALUES(note),
                updated_by = VALUES(updated_by),
                updated_at = NOW()
            """,
            (farm_id, crop_season_id, zone_id, domain, device_type, entity_id, control_role, safe_state, enabled, note, actor, actor),
        )
        mapping = {"deviceType": device_type, "entity_id": entity_id, "entityId": entity_id, "control_role": control_role, "controlRole": control_role, "safe_state": safe_state, "safeState": safe_state, "enabled": bool(enabled), "note": note}
        await _insert_log(hass, farm_id=farm_id, crop_season_id=crop_season_id, zone_id=zone_id, domain=domain, actor=actor, action="device_entity_mapping_saved", before=None, after=mapping, result="success", message="device entity mapping saved")
        return _json({"ok": True, "id": new_id, "farmId": farm_id, "cropSeasonId": crop_season_id, "zoneId": zone_id, "domain": domain, **mapping})

    async def delete(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        try:
            domain = _validate_domain(request.query.get("domain"))
            mapping_id = _query_int(request, "id")
            farm_id = _query_int(request, "farm_id", 1) or 1
            crop_season_id = _query_int(request, "crop_season_id")
            zone_id = _query_int(request, "zone_id")
            if not mapping_id or not crop_season_id or not zone_id:
                return _err("id, crop_season_id and zone_id are required")
        except Exception as exc:
            return _err(str(exc))
        await execute(
            hass,
            "DELETE FROM zone_device_entity_mappings WHERE id = %s AND farm_id = %s AND crop_season_id = %s AND zone_id = %s AND domain = %s",
            (mapping_id, farm_id, crop_season_id, zone_id, domain),
        )
        await _insert_log(hass, farm_id=farm_id, crop_season_id=crop_season_id, zone_id=zone_id, domain=domain, actor=_actor(request), action="device_entity_mapping_deleted", before={"id": mapping_id}, after=None, result="success", message="device entity mapping deleted")
        return _json({"ok": True, "id": mapping_id})


def _summarize_control_log_row(row: dict) -> dict:
    before = row.get("before") or {}
    after = row.get("after") or {}
    state_reports = after.get("stateReports") or []
    blocked_calls = after.get("blockedCalls") or before.get("blockedCalls") or []
    safe_state_calls = after.get("safeStateCalls") or []
    latest_report = state_reports[0] if state_reports else {}
    return {
        "blockedCallCount": len(blocked_calls),
        "safeStateCallCount": len(safe_state_calls),
        "stateReportCount": len(state_reports),
        "errorCount": len(after.get("errors") or []),
        "callCount": len(after.get("calls") or []),
        "safetyStatus": after.get("safetyStatus") or ("blocked" if blocked_calls else "clear"),
        "blockedByInterlock": bool(blocked_calls),
        "failSafeApplied": bool(safe_state_calls),
        "latestActualState": latest_report.get("actualState"),
        "latestExpectedTarget": latest_report.get("expectedTarget"),
        "interlockReasons": sorted({reason for call in blocked_calls for reason in (call.get("interlockReasons") or [])}),
        "safetyGuard": after.get("safetyGuard") or {"status": after.get("safetyStatus") or ("blocked" if blocked_calls else "clear"), "ruleResults": [r for call in blocked_calls for r in ((call.get("safetyGuard") or {}).get("ruleResults") or [])]},
    }


async def _safety_guard_event_history_response(hass, *, farm_id: int, crop_season_id: int, zone_id: int, domain: str, limit: int = 50) -> dict:
    rows = await fetchall(
        hass,
        """
        SELECT id, farm_id AS farmId, crop_season_id AS cropSeasonId, zone_id AS zoneId,
               domain, actor, actor_role AS actorRole, action, before_json AS beforeJson,
               after_json AS afterJson, result, message, created_at AS createdAt
        FROM zone_control_logs
        WHERE farm_id = %s AND crop_season_id = %s AND zone_id = %s AND domain = %s
          AND action IN ('safety_guard_critical_event', 'safety_guard_watchdog_checked', 'safety_guard_blocked', 'execution_safety_blocked', 'failsafe_applied', 'safety_guard_event_acknowledged', 'safety_guard_event_cleared')
        ORDER BY created_at DESC, id DESC
        LIMIT %s
        """,
        (farm_id, crop_season_id, zone_id, domain, limit),
    )
    acknowledgedEventIds = set()
    clearedEventIds = set()
    items = []
    for row in rows:
        row["before"] = _json_loads(row.pop("beforeJson", None), None)
        row["after"] = _json_loads(row.pop("afterJson", None), None)
        lifecycle = (row.get("after") or {}).get("eventLifecycle") or {}
        target_id = lifecycle.get("eventId")
        if row.get("action") == "safety_guard_event_acknowledged" and target_id:
            acknowledgedEventIds.add(int(target_id))
        if row.get("action") == "safety_guard_event_cleared" and target_id:
            clearedEventIds.add(int(target_id))
        row["eventLifecycle"] = lifecycle or {"state": "active" if row.get("action") in SAFETY_GUARD_EVENT_ACTIONS else row.get("action")}
        items.append(row)
    activeEvents = [row for row in items if row.get("action") in SAFETY_GUARD_EVENT_ACTIONS and int(row.get("id")) not in clearedEventIds]
    for row in items:
        if int(row.get("id")) in clearedEventIds:
            row["eventLifecycle"] = {**(row.get("eventLifecycle") or {}), "state": "cleared", "cleared": True}
        elif int(row.get("id")) in acknowledgedEventIds:
            row["eventLifecycle"] = {**(row.get("eventLifecycle") or {}), "state": "acknowledged", "acknowledged": True}
    return {"ok": True, "farmId": farm_id, "cropSeasonId": crop_season_id, "zoneId": zone_id, "domain": domain, "items": items, "activeEvents": activeEvents, "acknowledgedEventIds": sorted(acknowledgedEventIds), "clearedEventIds": sorted(clearedEventIds)}


async def _safety_guard_event_lifecycle_post(request: web.Request, lifecycle_action: str) -> web.Response:
    hass = request.app["hass"]
    try:
        body = await request.json()
        domain = _validate_domain(body.get("domain"))
        farm_id = int(body.get("farm_id") or body.get("farmId") or 1)
        crop_season_id = int(body.get("crop_season_id") or body.get("cropSeasonId"))
        zone_id = int(body.get("zone_id") or body.get("zoneId"))
        event_id = int(body.get("event_id") or body.get("eventId"))
        note = body.get("note") or body.get("message") or ""
    except Exception as exc:
        return _err(str(exc))
    state = "acknowledged" if lifecycle_action == "ack" else "cleared"
    action = "safety_guard_event_acknowledged" if lifecycle_action == "ack" else "safety_guard_event_cleared"
    after = {"eventLifecycle": {"eventId": event_id, "state": state, state: True, "note": note}}
    await _insert_log(hass, farm_id=farm_id, crop_season_id=crop_season_id, zone_id=zone_id, domain=domain, actor=_actor(request), action=action, before={"eventId": event_id}, after=after, result="success", message=f"SafetyGuard event {state}")
    return _json({"ok": True, "eventId": event_id, "eventLifecycle": after["eventLifecycle"]})


class ZoneSafetyGuardEventsView(HomeAssistantView):
    """GET /api/green_smart/zones/safety-guard-events."""

    url = "/api/green_smart/zones/safety-guard-events"
    name = "api:green_smart:zones:safety_guard_events"

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
        return _json(await _safety_guard_event_history_response(hass, farm_id=farm_id, crop_season_id=crop_season_id, zone_id=zone_id, domain=domain, limit=limit))


class ZoneSafetyGuardEventAckView(HomeAssistantView):
    """POST /api/green_smart/zones/safety-guard-events/ack."""

    url = "/api/green_smart/zones/safety-guard-events/ack"
    name = "api:green_smart:zones:safety_guard_event_ack"

    async def post(self, request: web.Request) -> web.Response:
        return await _safety_guard_event_lifecycle_post(request, "ack")


class ZoneSafetyGuardEventClearView(HomeAssistantView):
    """POST /api/green_smart/zones/safety-guard-events/clear."""

    url = "/api/green_smart/zones/safety-guard-events/clear"
    name = "api:green_smart:zones:safety_guard_event_clear"

    async def post(self, request: web.Request) -> web.Response:
        return await _safety_guard_event_lifecycle_post(request, "clear")


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
            row["executionSummary"] = _summarize_control_log_row(row)
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


async def _domain_entity_mapping_get(request: web.Request, domain: str) -> web.Response:
    request = request.clone(rel_url=request.rel_url.with_query({**request.query, "domain": domain}))
    return await ZoneDeviceEntityMappingsView().get(request)


async def _domain_entity_mapping_post(request: web.Request, domain: str) -> web.Response:
    try:
        body = await request.json()
    except Exception:
        return _err("Invalid JSON")
    body["domain"] = domain
    request._read_bytes = json.dumps(body).encode()
    return await ZoneDeviceEntityMappingsView().post(request)


async def _domain_final_target_execution_post(request: web.Request, domain: str) -> web.Response:
    try:
        body = await request.json()
    except Exception:
        return _err("Invalid JSON")
    body["domain"] = domain
    request._read_bytes = json.dumps(body).encode()
    return await ZoneFinalTargetExecutionView().post(request)


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


class EnvironmentDeviceEntityMappingsView(HomeAssistantView):
    """Domain wrapper for Environment device/entity mappings."""

    url = "/api/green_smart/environment/device-entity-mappings"
    name = "api:green_smart:environment:device_entity_mappings"

    async def get(self, request: web.Request) -> web.Response:
        return await _domain_entity_mapping_get(request, "environment")

    async def post(self, request: web.Request) -> web.Response:
        return await _domain_entity_mapping_post(request, "environment")


class IrrigationDeviceEntityMappingsView(HomeAssistantView):
    """Domain wrapper for Irrigation device/entity mappings."""

    url = "/api/green_smart/irrigation/device-entity-mappings"
    name = "api:green_smart:irrigation:device_entity_mappings"

    async def get(self, request: web.Request) -> web.Response:
        return await _domain_entity_mapping_get(request, "irrigation")

    async def post(self, request: web.Request) -> web.Response:
        return await _domain_entity_mapping_post(request, "irrigation")


class DeviceEntityMappingsView(HomeAssistantView):
    """Domain wrapper for Device Control device/entity mappings."""

    url = "/api/green_smart/devices/device-entity-mappings"
    name = "api:green_smart:devices:device_entity_mappings"

    async def get(self, request: web.Request) -> web.Response:
        return await _domain_entity_mapping_get(request, "device")

    async def post(self, request: web.Request) -> web.Response:
        return await _domain_entity_mapping_post(request, "device")


class EnvironmentFinalTargetExecutionView(HomeAssistantView):
    """Domain wrapper for Environment final target execution."""

    url = "/api/green_smart/environment/execute-final-targets"
    name = "api:green_smart:environment:execute_final_targets"

    async def post(self, request: web.Request) -> web.Response:
        return await _domain_final_target_execution_post(request, "environment")


class IrrigationFinalTargetExecutionView(HomeAssistantView):
    """Domain wrapper for Irrigation final target execution."""

    url = "/api/green_smart/irrigation/execute-final-targets"
    name = "api:green_smart:irrigation:execute_final_targets"

    async def post(self, request: web.Request) -> web.Response:
        return await _domain_final_target_execution_post(request, "irrigation")


class DeviceFinalTargetExecutionView(HomeAssistantView):
    """Domain wrapper for Device final target execution."""

    url = "/api/green_smart/devices/execute-final-targets"
    name = "api:green_smart:devices:execute_final_targets"

    async def post(self, request: web.Request) -> web.Response:
        return await _domain_final_target_execution_post(request, "device")
