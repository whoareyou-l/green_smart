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


ZONE_PURPOSE_LABELS = {
    "cultivation": "재배 구역",
    "nursery": "육묘 구역",
    "office": "사무 구역",
    "experiment": "실험 구역",
    "storage": "자재 보관 구역",
    "quarantine": "격리·검역 구역",
    "재배": "재배 구역",
    "재배 구역": "재배 구역",
    "육묘 구역": "육묘 구역",
    "사무 구역": "사무 구역",
    "실험 구역": "실험 구역",
    "자재 보관 구역": "자재 보관 구역",
    "격리·검역 구역": "격리·검역 구역",
}


def _zone_purpose_label(payload: dict[str, Any]) -> str:
    raw = _str(payload, "purpose", "zonePurpose", default="재배 구역")
    return ZONE_PURPOSE_LABELS.get(raw, raw if raw.endswith("구역") else "재배 구역")


ZONE_STATUS_LABELS = {
    "active": "정상",
    "normal": "정상",
    "ok": "정상",
    "정상": "정상",
    "활성": "정상",
    "inactive": "비활성",
    "disabled": "비활성",
    "비활성": "비활성",
    "deleted": "삭제됨",
    "삭제": "삭제됨",
    "삭제됨": "삭제됨",
    "maintenance": "점검중",
    "점검": "점검중",
    "점검중": "점검중",
}


def _zone_status_label(payload: dict[str, Any] | None = None, *keys: str, default: str = "정상") -> str:
    payload = payload or {}
    raw = _str(payload, *(keys or ("status", "state")), default=default)
    return ZONE_STATUS_LABELS.get(raw, ZONE_STATUS_LABELS.get(raw.lower(), raw or default))


def _zone_bed_label(value: Any) -> str:
    if value is None or value == "":
        return "미등록"
    text = str(value).strip()
    if not text:
        return "미등록"
    if text.endswith("개"):
        return text
    if text.lower().endswith("bed"):
        text = text[:-3].strip()
    return f"{text}개" if text.replace(".", "", 1).isdigit() else text


GREENHOUSE_OPERATING_STATUS_LABELS = {
    "active": "운영중",
    "운영중": "운영중",
    "standby": "대기",
    "대기": "대기",
    "maintenance": "점검중",
    "점검중": "점검중",
    "inactive": "비활성",
    "비활성": "비활성",
}
GREENHOUSE_STATUS_LABELS = {
    "active": "정상",
    "normal": "정상",
    "정상": "정상",
    "inactive": "비활성",
    "비활성": "비활성",
    "deleted": "삭제됨",
    "삭제됨": "삭제됨",
}


def _greenhouse_operating_status_label(payload: dict[str, Any] | None = None, *keys: str, default: str = "운영중") -> str:
    payload = payload or {}
    raw = _str(payload, *(keys or ("operatingStatus", "operating_status")), default=default)
    return GREENHOUSE_OPERATING_STATUS_LABELS.get(raw, GREENHOUSE_OPERATING_STATUS_LABELS.get(raw.lower(), raw or default))


def _greenhouse_status_label(payload: dict[str, Any] | None = None, *keys: str, default: str = "정상") -> str:
    payload = payload or {}
    raw = _str(payload, *(keys or ("status", "state")), default=default)
    return GREENHOUSE_STATUS_LABELS.get(raw, GREENHOUSE_STATUS_LABELS.get(raw.lower(), raw or default))


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
        "operatingStatus": _greenhouse_operating_status_label({"operatingStatus": row.get("operating_status") or row.get("status")}),
        "timezone": row.get("timezone") or "Asia/Seoul",
        "approvalScope": row.get("approval_scope") or "",
        "note": row.get("note") or row.get("creation_reason") or "",
        "creationReason": row.get("creation_reason") or row.get("note") or "",
        "status": _greenhouse_status_label({"status": row.get("status")}),
        "createdAt": row.get("created_at"),
        "updatedAt": row.get("updated_at"),
    }


def _zone_dto(row: dict[str, Any]) -> dict[str, Any]:
    zone_id = row.get("id")
    status = _zone_status_label({"status": row.get("status")})
    return {
        "id": zone_id,
        "zoneId": f"settings-zone-{zone_id}" if zone_id else row.get("name"),
        "farmId": row.get("farm_id"),
        "greenhouseId": row.get("greenhouse_id"),
        "name": row.get("name") or "1구역",
        "zoneName": row.get("name") or "1구역",
        "purpose": row.get("purpose") or "재배 구역",
        "area": row.get("area") or "",
        "bedCount": _zone_bed_label(row.get("bed_count") or 0),
        "bedCountRaw": row.get("bed_count") or 0,
        "note": row.get("note") or "",
        "status": status,
        "dataAvailability": {"state": "fresh" if status == "정상" else "unknown"},
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
        SELECT id, farm_id, name, location, operating_status, install_type, timezone, approval_scope, note, creation_reason, status, created_at, updated_at
        FROM green_smart_settings_greenhouses
        WHERE farm_id = %s AND status NOT IN ('삭제됨', 'deleted')
        ORDER BY updated_at DESC, id DESC
        """, (farm_id,))
    return [_greenhouse_dto(row) for row in rows]


async def create_settings_greenhouse(hass, payload: dict[str, Any], actor: str = "operator", farm_id: int = 1) -> dict[str, Any]:
    name = _str(payload, "name", "greenhouseName", default="제1온실")
    creation_reason = _str(payload, "creationReason", "creation_reason", "note")
    await execute(hass, """
        INSERT INTO green_smart_settings_greenhouses
            (farm_id, name, location, operating_status, install_type, timezone, approval_scope, note, creation_reason, status, created_by, updated_by)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            location = VALUES(location), operating_status = VALUES(operating_status),
            install_type = VALUES(install_type), timezone = VALUES(timezone), approval_scope = VALUES(approval_scope),
            note = VALUES(note), creation_reason = VALUES(creation_reason), status = VALUES(status),
            updated_by = VALUES(updated_by), updated_at = CURRENT_TIMESTAMP
        """, (
            farm_id,
            name,
            _str(payload, "location"),
            _greenhouse_operating_status_label(payload, "operatingStatus", "operating_status", default="운영중"),
            _str(payload, "installType", "install_type"),
            _str(payload, "timezone", "defaultTimezone", default="Asia/Seoul"),
            _str(payload, "approvalScope", "approval_scope"),
            creation_reason,
            creation_reason,
            _greenhouse_status_label(payload, "status", "state", default="정상"),
            actor,
            actor,
        ))
    rows = await list_settings_greenhouses(hass, farm_id)
    return next((row for row in rows if row["name"] == name), rows[0] if rows else {"name": name})


async def update_settings_greenhouse(hass, greenhouse_id: int, payload: dict[str, Any], actor: str = "operator", farm_id: int = 1) -> dict[str, Any]:
    creation_reason = _str(payload, "creationReason", "creation_reason", "note")
    await execute(hass, """
        UPDATE green_smart_settings_greenhouses
        SET name = %s, location = %s, operating_status = %s, install_type = %s, timezone = %s,
            approval_scope = %s, note = %s, creation_reason = %s,
            status = %s, updated_by = %s, updated_at = CURRENT_TIMESTAMP
        WHERE farm_id = %s AND id = %s
        """, (
            _str(payload, "name", "greenhouseName", default="제1온실"),
            _str(payload, "location"),
            _greenhouse_operating_status_label(payload, "operatingStatus", "operating_status", default="운영중"),
            _str(payload, "installType", "install_type"),
            _str(payload, "timezone", "defaultTimezone", default="Asia/Seoul"),
            _str(payload, "approvalScope", "approval_scope"),
            creation_reason,
            creation_reason,
            _greenhouse_status_label(payload, "status", "state", default="정상"),
            actor,
            farm_id,
            greenhouse_id,
        ))
    rows = await list_settings_greenhouses(hass, farm_id)
    return next((row for row in rows if str(row.get("id")) == str(greenhouse_id)), {"id": greenhouse_id, "status": "updated"})


async def delete_settings_greenhouse(hass, greenhouse_id: int, actor: str = "operator", farm_id: int = 1) -> dict[str, Any]:
    await execute(hass, """
        DELETE FROM green_smart_settings_greenhouses
        WHERE farm_id = %s AND id = %s
        """, (farm_id, greenhouse_id))
    return {"id": greenhouse_id, "status": "삭제됨", "deleted": True}


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
    status = _zone_status_label(payload, "status", "state", default="정상")
    await execute(hass, """
        INSERT INTO green_smart_settings_zones
            (farm_id, greenhouse_id, name, purpose, area, bed_count, note, status, created_by, updated_by)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            purpose = VALUES(purpose), area = VALUES(area), bed_count = VALUES(bed_count), note = VALUES(note),
            status = VALUES(status), updated_by = VALUES(updated_by), updated_at = CURRENT_TIMESTAMP
        """, (farm_id, _int(payload, "greenhouseId", "greenhouse_id", default=0) or None, name, _zone_purpose_label(payload), _str(payload, "area"), _int(payload, "bedCount", "bed_count"), _str(payload, "note"), status, actor, actor))
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


class RebuildSettingsGreenhouseItemView(HomeAssistantView):
    url = "/api/green_smart/rebuild/settings/greenhouses/{greenhouse_id}"
    name = "api:green_smart:rebuild:settings:greenhouse_item"
    requires_auth = True

    async def patch(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        greenhouse_id = int(request.match_info["greenhouse_id"])
        item = await update_settings_greenhouse(hass, greenhouse_id, await _settings_payload(request), actor=_request_actor(request))
        return self.json({"ok": True, "kind": "greenhouse", "saved": True, "approvalRequired": False, "greenhouse": item, "settingsSnapshot": await settings_snapshot_response(hass)})

    async def delete(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        greenhouse_id = int(request.match_info["greenhouse_id"])
        item = await delete_settings_greenhouse(hass, greenhouse_id, actor=_request_actor(request))
        return self.json({"ok": True, "kind": "greenhouse", "deleted": True, "approvalRequired": False, "greenhouse": item, "settingsSnapshot": await settings_snapshot_response(hass)})


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
