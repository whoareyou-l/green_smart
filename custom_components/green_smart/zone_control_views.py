"""Zone-scoped control settings HTTP views."""
from __future__ import annotations

import asyncio
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


def _interlock_failsafe_decision(final_target: dict, mapping: dict, call: dict, pre_state: dict | None) -> dict:
    targets = final_target.get("targets") or {}
    policy = targets.get("_safety") or targets.get("safety") or {}
    emergency_stop = bool(policy.get("emergency_stop") or policy.get("emergencyStop") or False)
    block_on_unavailable = policy.get("block_on_unavailable", policy.get("blockOnUnavailable", True))
    apply_safe_state_on_block = policy.get("apply_safe_state_on_block", policy.get("applySafeStateOnBlock", True))
    reasons = []
    if emergency_stop:
        reasons.append("emergency_stop")
    if block_on_unavailable and pre_state and not pre_state.get("available", True):
        reasons.append("entity_unavailable")
    for rule in policy.get("rules") or []:
        role = rule.get("control_role") or rule.get("controlRole")
        device_type = rule.get("device_type") or rule.get("deviceType")
        entity_id = rule.get("entity_id") or rule.get("entityId")
        if role and role != mapping.get("controlRole"):
            continue
        if device_type and device_type != mapping.get("deviceType"):
            continue
        if entity_id and entity_id != mapping.get("entityId"):
            continue
        if rule.get("block", True):
            reasons.append(rule.get("reason") or "interlock_rule")
    safe_state_call = _safe_state_service_call_for_mapping(mapping) if reasons and apply_safe_state_on_block else None
    return {
        "blockedByInterlock": bool(reasons),
        "failSafeApplied": bool(safe_state_call),
        "interlockReasons": reasons,
        "safetyStatus": "blocked" if reasons else "clear",
        "safeStateCall": safe_state_call,
        "safeStateResult": None,
        "originalCall": call,
    }


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
        if not final_target or not isinstance(final_target.get("targets"), dict):
            return _err("final targets not found", status=404)
        mappings = await _enabled_entity_mappings(hass, farm_id=farm_id, crop_season_id=crop_season_id, zone_id=zone_id, domain=domain)
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
            safety_decision = _interlock_failsafe_decision(final_target, mapping, call, pre_state)
            call["blockedByInterlock"] = safety_decision["blockedByInterlock"]
            call["failSafeApplied"] = safety_decision["failSafeApplied"]
            call["interlockReasons"] = safety_decision["interlockReasons"]
            call["safetyStatus"] = safety_decision["safetyStatus"]
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
            action = "interlock_blocked"
        elif not state_reports:
            action = "final_targets_executed"
        elif state_failures:
            action = "state_verification_failed"
        else:
            action = "state_verification_passed"
        if blocked_calls and not safe_state_calls:
            action = "execution_safety_blocked"
        result = "failed" if errors or state_failures or (blocked_calls and not safe_state_calls) else "success"
        response = {"ok": not errors and not state_failures and not (blocked_calls and not safe_state_calls), "dryRun": dry_run, "executedCount": 0 if dry_run else len(calls) - len(errors), "plannedCount": len(calls) + len(blocked_calls), "calls": calls, "errors": errors, "stateReports": state_reports, "stateMatched": state_matched, "stateVerification": "passed" if state_matched else "failed", "blockedCalls": blocked_calls, "safeStateCalls": safe_state_calls, "blockedByInterlock": bool(blocked_calls), "failSafeApplied": bool(safe_state_calls), "safetyStatus": "blocked" if blocked_calls and not safe_state_calls else ("failsafe" if safe_state_calls else "clear")}
        if response.get("stateMatched") and not blocked_calls:
            action = "state_verification_passed"
        await _insert_log(hass, farm_id=farm_id, crop_season_id=crop_season_id, zone_id=zone_id, domain=domain, actor=_actor(request), action=action, before={"preState": [r.get("preState") for r in state_reports], "blockedCalls": blocked_calls}, after={"postState": [r.get("postState") for r in state_reports], "dry_run": dry_run, "calls": calls, "errors": errors, "stateReports": state_reports, "blockedCalls": blocked_calls, "safeStateCalls": safe_state_calls, "safetyStatus": response["safetyStatus"]}, result=result, message="final targets executed via Home Assistant services with interlock/fail safe and pre/post state verification")
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
    }


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
