"""Real DB-backed settings API for Green Smart rebuild greenhouse/zone modals."""
from __future__ import annotations

from typing import Any

from aiohttp import web
from homeassistant.components.http import HomeAssistantView

from .db import execute, fetchall


def _request_actor(request: web.Request) -> str:
    user = getattr(request, "user", None)
    return getattr(user, "name", None) or getattr(user, "id", None) or "operator"


def _str(payload: dict[str, Any], *keys: str, default: str = "") -> str:
    for key in keys:
        value = payload.get(key)
        if value is not None and str(value).strip():
            return str(value).strip()
    return default


def _int(payload: dict[str, Any], *keys: str, default: int = 0) -> int:
    for key in keys:
        value = payload.get(key)
        if value is None or value == "":
            continue
        try:
            return int(float(str(value).replace("㎡", "").strip()))
        except Exception:
            continue
    return default


async def _settings_payload(request: web.Request) -> dict[str, Any]:
    try:
        payload = await request.json()
    except Exception:
        payload = {}
    return payload if isinstance(payload, dict) else {}


def _greenhouse_dto(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row.get("id"),
        "farmId": row.get("farm_id"),
        "name": row.get("name") or "제1온실",
        "location": row.get("location") or "",
        "installType": row.get("install_type") or "",
        "approvalScope": row.get("approval_scope") or "",
        "note": row.get("note") or "",
        "status": row.get("status") or "active",
        "createdAt": row.get("created_at"),
        "updatedAt": row.get("updated_at"),
    }


def _zone_dto(row: dict[str, Any]) -> dict[str, Any]:
    zone_id = row.get("id")
    return {
        "id": zone_id,
        "zoneId": f"settings-zone-{zone_id}" if zone_id else row.get("name"),
        "farmId": row.get("farm_id"),
        "greenhouseId": row.get("greenhouse_id"),
        "name": row.get("name") or "1구역",
        "zoneName": row.get("name") or "1구역",
        "purpose": row.get("purpose") or "재배",
        "area": row.get("area") or "",
        "bedCount": row.get("bed_count") or 0,
        "note": row.get("note") or "",
        "status": row.get("status") or "active",
        "dataAvailability": {"state": "fresh" if (row.get("status") or "active") == "active" else "unknown"},
        "equipmentProfile": {"labels": []},
        "createdAt": row.get("created_at"),
        "updatedAt": row.get("updated_at"),
    }


def _mapping_dto(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row.get("id"),
        "farmId": row.get("farm_id"),
        "zoneId": row.get("zone_id") or "zone-1",
        "sensorEntity": row.get("sensor_entity") or "",
        "deviceEntity": row.get("device_entity") or "",
        "mappingRole": row.get("mapping_role") or "",
        "note": row.get("note") or "",
        "status": row.get("status") or "active",
        "createdAt": row.get("created_at"),
        "updatedAt": row.get("updated_at"),
    }


async def list_settings_greenhouses(hass, farm_id: int = 1) -> list[dict[str, Any]]:
    rows = await fetchall(hass, """
        SELECT id, farm_id, name, location, install_type, approval_scope, note, status, created_at, updated_at
        FROM green_smart_settings_greenhouses
        WHERE farm_id = %s
        ORDER BY updated_at DESC, id DESC
        """, (farm_id,))
    return [_greenhouse_dto(row) for row in rows]


async def create_settings_greenhouse(hass, payload: dict[str, Any], actor: str = "operator", farm_id: int = 1) -> dict[str, Any]:
    name = _str(payload, "name", "greenhouseName", default="제1온실")
    await execute(hass, """
        INSERT INTO green_smart_settings_greenhouses
            (farm_id, name, location, install_type, approval_scope, note, created_by, updated_by)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            location = VALUES(location), install_type = VALUES(install_type), approval_scope = VALUES(approval_scope),
            note = VALUES(note), status = 'active', updated_by = VALUES(updated_by), updated_at = CURRENT_TIMESTAMP
        """, (farm_id, name, _str(payload, "location"), _str(payload, "installType", "install_type"), _str(payload, "approvalScope", "approval_scope"), _str(payload, "note"), actor, actor))
    rows = await list_settings_greenhouses(hass, farm_id)
    return next((row for row in rows if row["name"] == name), rows[0] if rows else {"name": name})


async def list_settings_zones(hass, farm_id: int = 1) -> list[dict[str, Any]]:
    rows = await fetchall(hass, """
        SELECT id, farm_id, greenhouse_id, name, purpose, area, bed_count, note, status, created_at, updated_at
        FROM green_smart_settings_zones
        WHERE farm_id = %s
        ORDER BY updated_at DESC, id DESC
        """, (farm_id,))
    return [_zone_dto(row) for row in rows]


async def create_settings_zone(hass, payload: dict[str, Any], actor: str = "operator", farm_id: int = 1) -> dict[str, Any]:
    name = _str(payload, "name", "zoneName", default="신규 구역")
    await execute(hass, """
        INSERT INTO green_smart_settings_zones
            (farm_id, greenhouse_id, name, purpose, area, bed_count, note, created_by, updated_by)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            purpose = VALUES(purpose), area = VALUES(area), bed_count = VALUES(bed_count), note = VALUES(note),
            status = 'active', updated_by = VALUES(updated_by), updated_at = CURRENT_TIMESTAMP
        """, (farm_id, _int(payload, "greenhouseId", "greenhouse_id", default=0) or None, name, _str(payload, "purpose", default="재배"), _str(payload, "area"), _int(payload, "bedCount", "bed_count"), _str(payload, "note"), actor, actor))
    rows = await list_settings_zones(hass, farm_id)
    return next((row for row in rows if row["name"] == name), rows[0] if rows else {"name": name})


async def list_settings_device_sensor_mappings(hass, farm_id: int = 1) -> list[dict[str, Any]]:
    rows = await fetchall(hass, """
        SELECT id, farm_id, zone_id, sensor_entity, device_entity, mapping_role, note, status, created_at, updated_at
        FROM green_smart_settings_device_sensor_mappings
        WHERE farm_id = %s
        ORDER BY updated_at DESC, id DESC
        """, (farm_id,))
    return [_mapping_dto(row) for row in rows]


async def create_settings_device_sensor_mapping(hass, payload: dict[str, Any], actor: str = "operator", farm_id: int = 1) -> dict[str, Any]:
    zone_id = _str(payload, "zoneId", "zone_id", default="zone-1")
    sensor_entity = _str(payload, "sensorEntity", "sensor_entity")
    device_entity = _str(payload, "deviceEntity", "device_entity")
    mapping_role = _str(payload, "mappingRole", "mapping_role", default="환경 센서/장비")
    await execute(hass, """
        INSERT INTO green_smart_settings_device_sensor_mappings
            (farm_id, zone_id, sensor_entity, device_entity, mapping_role, note, created_by, updated_by)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            note = VALUES(note), status = 'active', updated_by = VALUES(updated_by), updated_at = CURRENT_TIMESTAMP
        """, (farm_id, zone_id, sensor_entity, device_entity, mapping_role, _str(payload, "note"), actor, actor))
    rows = await list_settings_device_sensor_mappings(hass, farm_id)
    return next((row for row in rows if row["zoneId"] == zone_id and row["sensorEntity"] == sensor_entity and row["deviceEntity"] == device_entity), rows[0] if rows else {"zoneId": zone_id})


async def settings_snapshot_response(hass, farm_id: int = 1) -> dict[str, Any]:
    greenhouses = await list_settings_greenhouses(hass, farm_id)
    zones = await list_settings_zones(hass, farm_id)
    mappings = await list_settings_device_sensor_mappings(hass, farm_id)
    zone_by_id = {str(zone.get("id")): zone for zone in zones}
    zone_by_key = {str(zone.get("zoneId")): zone for zone in zones}
    for mapping in mappings:
        zone = zone_by_id.get(str(mapping.get("zoneId"))) or zone_by_key.get(str(mapping.get("zoneId")))
        label = mapping.get("sensorEntity") or mapping.get("deviceEntity") or mapping.get("mappingRole")
        if zone is not None and label:
            zone.setdefault("equipmentProfile", {}).setdefault("labels", []).append(label)
    return {"ok": True, "source": "green_smart_settings_db", "greenhouses": greenhouses, "zones": zones, "deviceSensorMappings": mappings}


class RebuildSettingsSnapshotView(HomeAssistantView):
    url = "/api/green_smart/rebuild/settings/snapshot"
    name = "api:green_smart:rebuild:settings:snapshot"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        return self.json(await settings_snapshot_response(request.app["hass"]))


class RebuildSettingsGreenhouseCreateView(HomeAssistantView):
    url = "/api/green_smart/rebuild/settings/greenhouses"
    name = "api:green_smart:rebuild:settings:greenhouses"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        return self.json({"ok": True, "greenhouses": await list_settings_greenhouses(hass)})

    async def post(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        item = await create_settings_greenhouse(hass, await _settings_payload(request), actor=_request_actor(request))
        return self.json({"ok": True, "kind": "greenhouse", "saved": True, "approvalRequired": False, "greenhouse": item, "settingsSnapshot": await settings_snapshot_response(hass)})


class RebuildSettingsZoneCreateView(HomeAssistantView):
    url = "/api/green_smart/rebuild/settings/zones"
    name = "api:green_smart:rebuild:settings:zones"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        return self.json({"ok": True, "zones": await list_settings_zones(hass)})

    async def post(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        item = await create_settings_zone(hass, await _settings_payload(request), actor=_request_actor(request))
        return self.json({"ok": True, "kind": "zone", "saved": True, "approvalRequired": False, "zone": item, "settingsSnapshot": await settings_snapshot_response(hass)})


class RebuildSettingsDeviceSensorMappingView(HomeAssistantView):
    url = "/api/green_smart/rebuild/settings/device-sensor-mappings"
    name = "api:green_smart:rebuild:settings:device_sensor_mappings"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        return self.json({"ok": True, "deviceSensorMappings": await list_settings_device_sensor_mappings(hass)})

    async def post(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        item = await create_settings_device_sensor_mapping(hass, await _settings_payload(request), actor=_request_actor(request))
        return self.json({"ok": True, "kind": "device-sensor-mapping", "saved": True, "approvalRequired": False, "deviceSensorMapping": item, "settingsSnapshot": await settings_snapshot_response(hass)})
