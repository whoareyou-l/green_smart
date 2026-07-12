"""Real DB-backed settings API for Green Smart rebuild greenhouse/zone modals."""
from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from aiohttp import ClientTimeout, web
from homeassistant.components.http import HomeAssistantView
try:
    from homeassistant.const import __version__ as HA_VERSION
except Exception:  # isolated contract tests may stub homeassistant as a non-package
    HA_VERSION = "unknown"
try:
    from homeassistant.helpers.aiohttp_client import async_get_clientsession
except Exception:  # isolated contract tests may stub homeassistant as a non-package
    def async_get_clientsession(hass):
        raise RuntimeError("Home Assistant aiohttp client session unavailable")
try:
    from homeassistant.helpers.storage import Store
except Exception:  # isolated contract tests may stub homeassistant as a non-package
    Store = None
try:
    from homeassistant.helpers import device_registry as dr, entity_registry as er
except Exception:  # isolated contract tests may stub homeassistant as a non-package
    dr = None
    er = None

try:
    from .const import DOMAIN
except Exception:  # isolated contract tests may stub package modules
    DOMAIN = "green_smart"
from .db import execute, fetchall
try:
    from .db import fetchone
except Exception:  # older isolated stubs only expose fetchall/execute
    async def fetchone(hass, sql: str, args: tuple = ()):  # type: ignore[no-redef]
        rows = await fetchall(hass, sql, args)
        return rows[0] if rows else None


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
        "greenhouseName": row.get("greenhouse_name") or "",
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


def _device_dto(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row.get("id"),
        "farmId": row.get("farm_id"),
        "haDeviceId": row.get("ha_device_id") or "",
        "deviceName": row.get("device_name") or "신규 장치",
        "deviceType": row.get("device_type") or "환기창",
        "entityId": row.get("entity_id") or "",
        "vendorModel": row.get("vendor_model") or "",
        "note": row.get("note") or "",
        "status": row.get("status") or "정상",
        "createdAt": row.get("created_at"),
        "updatedAt": row.get("updated_at"),
    }


def _device_group_dto(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row.get("id"),
        "farmId": row.get("farm_id"),
        "zoneId": row.get("zone_id") or "zone-1",
        "groupName": row.get("group_name") or "신규 장치 그룹",
        "groupType": row.get("group_type") or "환경 그룹",
        "linkPolicy": row.get("link_policy") or "다중 그룹 연결 허용",
        "note": row.get("note") or "",
        "status": row.get("status") or "정상",
        "createdAt": row.get("created_at"),
        "updatedAt": row.get("updated_at"),
    }

async def list_settings_greenhouses(hass, farm_id: int = 1) -> list[dict[str, Any]]:

    rows = await fetchall(hass, """
        SELECT id, farm_id, name, location, operating_status, install_type, timezone, approval_scope, note, creation_reason, status, created_at, updated_at
        FROM green_smart_settings_greenhouses
        WHERE farm_id = %s AND status NOT IN ('삭제됨', 'deleted')
        ORDER BY id ASC
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
        SELECT z.id, z.farm_id, z.greenhouse_id, gh.name AS greenhouse_name, z.name, z.purpose, z.area, z.bed_count, z.note, z.status, z.created_at, z.updated_at
        FROM green_smart_settings_zones z
        LEFT JOIN green_smart_settings_greenhouses gh ON gh.farm_id = z.farm_id AND gh.id = z.greenhouse_id
        WHERE z.farm_id = %s
        ORDER BY z.id ASC
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


async def update_settings_zone(hass, zone_id: int, payload: dict[str, Any], actor: str = "operator", farm_id: int = 1) -> dict[str, Any]:
    await execute(hass, """
        UPDATE green_smart_settings_zones
        SET greenhouse_id = %s, name = %s, purpose = %s, area = %s, bed_count = %s,
            note = %s, status = %s, updated_by = %s, updated_at = CURRENT_TIMESTAMP
        WHERE farm_id = %s AND id = %s
        """, (_int(payload, "greenhouseId", "greenhouse_id", default=0) or None, _str(payload, "name", "zoneName", default="신규 구역"), _zone_purpose_label(payload), _str(payload, "area"), _int(payload, "bedCount", "bed_count"), _str(payload, "note"), _zone_status_label(payload, "status", "state", default="정상"), actor, farm_id, zone_id))
    rows = await list_settings_zones(hass, farm_id)
    return next((row for row in rows if str(row.get("id")) == str(zone_id)), {"id": zone_id, "status": "updated"})


async def delete_settings_zone(hass, zone_id: int, actor: str = "operator", farm_id: int = 1) -> dict[str, Any]:
    await execute(hass, """
        DELETE FROM green_smart_settings_zones
        WHERE farm_id = %s AND id = %s
        """, (farm_id, zone_id))
    return {"id": zone_id, "status": "삭제됨", "deleted": True}


async def list_settings_device_sensor_mappings(hass, farm_id: int = 1) -> list[dict[str, Any]]:
    rows = await fetchall(hass, """
        SELECT id, farm_id, zone_id, sensor_entity, device_entity, mapping_role, note, status, created_at, updated_at
        FROM green_smart_settings_device_sensor_mappings
        WHERE farm_id = %s
        ORDER BY updated_at DESC, id DESC
        """, (farm_id,))
    return [_mapping_dto(row) for row in rows]


async def ensure_settings_device_ha_device_fk_schema(hass) -> None:
    try:
        await execute(hass, "ALTER TABLE green_smart_settings_devices ADD COLUMN ha_device_id VARCHAR(255) NOT NULL DEFAULT '' AFTER farm_id")
    except Exception:
        pass
    try:
        await execute(hass, "ALTER TABLE green_smart_settings_devices ADD KEY idx_settings_device_ha_device_id (farm_id, ha_device_id)")
    except Exception:
        pass


async def list_ha_device_registry_summary(hass) -> list[dict[str, Any]]:
    if dr is None:
        return []
    try:
        device_registry = dr.async_get(hass)
        entity_registry = er.async_get(hass) if er is not None else None
        entity_counts: dict[str, int] = {}
        if entity_registry is not None:
            for entity in getattr(entity_registry, "entities", {}).values():
                device_id = getattr(entity, "device_id", None)
                if device_id:
                    entity_counts[device_id] = entity_counts.get(device_id, 0) + 1
        devices = []
        for device in getattr(device_registry, "devices", {}).values():
            device_id = getattr(device, "id", "") or ""
            if not device_id:
                continue
            name = getattr(device, "name_by_user", None) or getattr(device, "name", None) or getattr(device, "model", None) or device_id
            devices.append({
                "haDeviceId": device_id,
                "deviceName": name,
                "name": name,
                "manufacturer": getattr(device, "manufacturer", None) or "",
                "model": getattr(device, "model", None) or "",
                "areaId": getattr(device, "area_id", None) or "",
                "entryType": str(getattr(device, "entry_type", None) or "device"),
                "entityCount": entity_counts.get(device_id, 0),
            })
        return sorted(devices, key=lambda item: (str(item.get("deviceName") or ""), str(item.get("haDeviceId") or "")))
    except Exception:
        return []


async def list_settings_devices(hass, farm_id: int = 1) -> list[dict[str, Any]]:
    await ensure_settings_device_ha_device_fk_schema(hass)
    rows = await fetchall(hass, """
        SELECT id, farm_id, ha_device_id, device_name, device_type, entity_id, vendor_model, note, status, created_at, updated_at
        FROM green_smart_settings_devices
        WHERE farm_id = %s
        ORDER BY updated_at DESC, id DESC
        """, (farm_id,))
    return [_device_dto(row) for row in rows]


async def create_settings_device(hass, payload: dict[str, Any], actor: str = "operator", farm_id: int = 1) -> dict[str, Any]:
    await ensure_settings_device_ha_device_fk_schema(hass)
    device_name = _str(payload, "deviceName", "device_name", "name", default="신규 장치")
    ha_device_id = _str(payload, "haDeviceId", "ha_device_id", "deviceId", "device_id", default="")
    entity_id = _str(payload, "entityId", "entity_id", default=ha_device_id or "switch.greenhouse_device")
    await execute(hass, """
        INSERT INTO green_smart_settings_devices
            (farm_id, ha_device_id, device_name, device_type, entity_id, vendor_model, note, status, created_by, updated_by)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            ha_device_id = VALUES(ha_device_id), device_name = VALUES(device_name), device_type = VALUES(device_type), vendor_model = VALUES(vendor_model),
            note = VALUES(note), status = VALUES(status), updated_by = VALUES(updated_by), updated_at = CURRENT_TIMESTAMP
        """, (farm_id, ha_device_id, device_name, _str(payload, "deviceType", "device_type", default="환기창"), entity_id, _str(payload, "vendorModel", "vendor_model"), _str(payload, "note"), _zone_status_label(payload, "status", "state", default="정상"), actor, actor))
    rows = await list_settings_devices(hass, farm_id)
    return next((row for row in rows if row.get("haDeviceId") == ha_device_id and ha_device_id), next((row for row in rows if row["entityId"] == entity_id), rows[0] if rows else {"entityId": entity_id, "haDeviceId": ha_device_id}))


async def list_settings_device_groups(hass, farm_id: int = 1) -> list[dict[str, Any]]:
    rows = await fetchall(hass, """
        SELECT id, farm_id, zone_id, group_name, group_type, link_policy, note, status, created_at, updated_at
        FROM green_smart_settings_device_groups
        WHERE farm_id = %s
        ORDER BY updated_at DESC, id DESC
        """, (farm_id,))
    return [_device_group_dto(row) for row in rows]


async def create_settings_device_group(hass, payload: dict[str, Any], actor: str = "operator", farm_id: int = 1) -> dict[str, Any]:
    zone_id = _str(payload, "zoneId", "zone_id", default="zone-1")
    group_name = _str(payload, "groupName", "group_name", "name", default="신규 장치 그룹")
    await execute(hass, """
        INSERT INTO green_smart_settings_device_groups
            (farm_id, zone_id, group_name, group_type, link_policy, note, status, created_by, updated_by)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            group_type = VALUES(group_type), link_policy = VALUES(link_policy), note = VALUES(note),
            status = VALUES(status), updated_by = VALUES(updated_by), updated_at = CURRENT_TIMESTAMP
        """, (farm_id, zone_id, group_name, _str(payload, "groupType", "group_type", default="환경 그룹"), _str(payload, "linkPolicy", "link_policy", default="다중 그룹 연결 허용"), _str(payload, "note"), _zone_status_label(payload, "status", "state", default="정상"), actor, actor))
    rows = await list_settings_device_groups(hass, farm_id)
    return next((row for row in rows if row["zoneId"] == zone_id and row["groupName"] == group_name), rows[0] if rows else {"zoneId": zone_id, "groupName": group_name})


async def create_settings_device_sensor_mapping(hass, payload: dict[str, Any], actor: str = "operator", farm_id: int = 1) -> dict[str, Any]:
    zone_id = _str(payload, "zoneId", "zone_id", default="zone-1")
    ha_device_id = _str(payload, "haDeviceId", "ha_device_id", "deviceId", "device_id")
    sensor_entity = _str(payload, "sensorEntity", "sensor_entity", "entityId", "entity_id")
    device_entity = _str(payload, "deviceEntity", "device_entity", default=ha_device_id)
    mapping_role = _str(payload, "mappingRole", "mapping_role", "deviceType", "device_type", default="환경 센서/장비")
    if ha_device_id:
        await create_settings_device(hass, {**payload, "haDeviceId": ha_device_id, "entityId": sensor_entity or ha_device_id, "deviceType": mapping_role}, actor=actor, farm_id=farm_id)
    await execute(hass, """
        INSERT INTO green_smart_settings_device_sensor_mappings
            (farm_id, zone_id, sensor_entity, device_entity, mapping_role, note, created_by, updated_by)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            note = VALUES(note), status = 'active', updated_by = VALUES(updated_by), updated_at = CURRENT_TIMESTAMP
        """, (farm_id, zone_id, sensor_entity, device_entity, mapping_role, _str(payload, "note"), actor, actor))
    rows = await list_settings_device_sensor_mappings(hass, farm_id)
    return next((row for row in rows if row["zoneId"] == zone_id and row["sensorEntity"] == sensor_entity and row["deviceEntity"] == device_entity), rows[0] if rows else {"zoneId": zone_id})


def _entity_domain(entity_id: str) -> str:
    return str(entity_id or "").split(".", 1)[0] if "." in str(entity_id or "") else ""


def infer_green_smart_read_write_mode(domain: str) -> str:
    domain = str(domain or "").lower()
    if domain in {"sensor", "binary_sensor"}:
        return "readonly"
    if domain in {"number", "select", "input_number", "input_select"}:
        return "setpoint"
    if domain in {"button", "scene", "script"}:
        return "command"
    if domain in {"switch", "cover", "fan", "valve", "climate", "light"}:
        return "controllable"
    return "readonly"


def infer_green_smart_entity_role(entity_id: str = "", *, domain: str = "", unit: str = "", device_class: str = "", name: str = "") -> dict[str, str]:
    text = " ".join(str(v or "").lower() for v in (entity_id, unit, device_class, name))
    device_class = str(device_class or "").lower()
    unit = str(unit or "")
    domain = str(domain or _entity_domain(entity_id) or "").lower()
    rules = [
        (("temperature", "temp", "온도"), "온도", "temperature"),
        (("humidity", "humid", "습도"), "습도", "humidity"),
        (("carbon_dioxide", "co2", "carbon", "ppm"), "CO₂", "co2"),
        (("illuminance", "lux", "light", "광량"), "광량", "light"),
        (("moisture", "soil", "vwc", "수분", "배지"), "배지수분", "substrate_moisture"),
        (("ec",), "EC", "ec"),
        (("ph",), "pH", "ph"),
        (("wind_speed", "풍속", "m/s"), "풍속", "wind_speed"),
        (("rain", "강우", "mm"), "강우", "rain"),
        (("battery", "배터리"), "배터리", "battery"),
        (("fan", "순환팬", "배기팬"), "순환팬", "actuator_state"),
        (("roof", "window", "천창"), "천창", "actuator_position"),
        (("side", "sidewall", "측창"), "측창", "actuator_position"),
        (("curtain", "screen", "커튼"), "커튼", "actuator_position"),
        (("valve", "밸브"), "관수밸브", "actuator_state"),
        (("pump", "펌프"), "펌프", "actuator_state"),
    ]
    for needles, role, value_kind in rules:
        if any(needle and needle in text for needle in needles) or any(needle == device_class for needle in needles):
            return {"entityRole": role, "valueKind": value_kind, "readWriteMode": infer_green_smart_read_write_mode(domain)}
    fallback = {
        "sensor": ("측정값", "measurement"),
        "binary_sensor": ("감지 상태", "binary_state"),
        "switch": ("스위치", "actuator_state"),
        "cover": ("개폐 장치", "actuator_position"),
        "number": ("설정값", "setpoint"),
        "select": ("모드", "mode"),
        "button": ("명령 버튼", "command"),
        "fan": ("팬", "actuator_state"),
        "valve": ("밸브", "actuator_state"),
    }
    role, value_kind = fallback.get(domain, ("기타", "unknown"))
    return {"entityRole": role, "valueKind": value_kind, "readWriteMode": infer_green_smart_read_write_mode(domain)}


def _safe_json(value: Any) -> str:
    try:
        return json.dumps(value, ensure_ascii=False, default=str)
    except Exception:
        return "{}"


def _state_numeric(value: Any) -> float | None:
    try:
        text = str(value).strip()
        if text.lower() in {"", "unknown", "unavailable", "none"}:
            return None
        return float(text)
    except Exception:
        return None


def _state_bool(value: Any) -> int | None:
    text = str(value or "").lower()
    if text in {"on", "open", "true", "home", "detected"}:
        return 1
    if text in {"off", "closed", "false", "not_home", "clear"}:
        return 0
    return None


def _dt_text(value: Any) -> str | None:
    if not value:
        return None
    try:
        if hasattr(value, "isoformat"):
            return value.isoformat(sep=" ")[:19]
    except Exception:
        pass
    return str(value).replace("T", " ")[:19]


async def _connected_green_smart_ha_device_ids(hass, farm_id: int = 1) -> set[str]:
    try:
        rows = await fetchall(hass, """
            SELECT ha_device_id
            FROM green_smart_devices
            WHERE farm_id = %s AND ha_device_id <> '' AND status NOT IN ('deleted', 'inactive', '삭제됨', '비활성')
        """, (farm_id,))
        return {str(row.get("ha_device_id") or "") for row in rows if row.get("ha_device_id")}
    except Exception:
        return set()


async def list_green_smart_unlinked_ha_devices(hass, farm_id: int = 1) -> list[dict[str, Any]]:
    if dr is None:
        return []
    connected = await _connected_green_smart_ha_device_ids(hass, farm_id)
    try:
        device_registry = dr.async_get(hass)
        entity_registry = er.async_get(hass) if er is not None else None
        entity_counts: dict[str, int] = {}
        if entity_registry is not None:
            for entity in getattr(entity_registry, "entities", {}).values():
                device_id = getattr(entity, "device_id", None)
                if device_id:
                    entity_counts[device_id] = entity_counts.get(device_id, 0) + 1
        devices: list[dict[str, Any]] = []
        for device in getattr(device_registry, "devices", {}).values():
            ha_device_id = getattr(device, "id", "") or ""
            if not ha_device_id or ha_device_id in connected:
                continue
            config_entries = list(getattr(device, "config_entries", []) or [])
            device_name = getattr(device, "name_by_user", None) or getattr(device, "name", None) or getattr(device, "model", None) or ha_device_id
            devices.append({
                "haDeviceId": ha_device_id,
                "deviceName": device_name,
                "name": device_name,
                "manufacturer": getattr(device, "manufacturer", None) or "",
                "model": getattr(device, "model", None) or "",
                "modelId": getattr(device, "model_id", None) or "",
                "swVersion": getattr(device, "sw_version", None) or "",
                "hwVersion": getattr(device, "hw_version", None) or "",
                "serialNumber": getattr(device, "serial_number", None) or "",
                "areaId": getattr(device, "area_id", None) or "",
                "configEntryId": config_entries[0] if config_entries else "",
                "integrationDomain": "",
                "entityCount": entity_counts.get(ha_device_id, 0),
            })
        return sorted(devices, key=lambda item: (str(item.get("deviceName") or ""), str(item.get("haDeviceId") or "")))
    except Exception:
        return []


async def list_green_smart_ha_device_entities(hass, ha_device_id: str) -> list[dict[str, Any]]:
    if er is None or not ha_device_id:
        return []
    try:
        entity_registry = er.async_get(hass)
        entities: list[dict[str, Any]] = []
        for entry in getattr(entity_registry, "entities", {}).values():
            if getattr(entry, "device_id", None) != ha_device_id:
                continue
            entity_id = getattr(entry, "entity_id", "") or ""
            domain = _entity_domain(entity_id)
            state = hass.states.get(entity_id) if hasattr(hass, "states") else None
            attrs = getattr(state, "attributes", {}) or {}
            unit = attrs.get("unit_of_measurement") or getattr(entry, "unit_of_measurement", "") or ""
            device_class = attrs.get("device_class") or getattr(entry, "device_class", "") or getattr(entry, "original_device_class", "") or ""
            state_class = attrs.get("state_class") or getattr(entry, "state_class", "") or ""
            name = getattr(entry, "name", None) or getattr(entry, "original_name", None) or attrs.get("friendly_name") or entity_id
            inferred = infer_green_smart_entity_role(entity_id, domain=domain, unit=unit, device_class=device_class, name=name)
            entities.append({
                "entityId": entity_id,
                "domain": domain,
                "unitOfMeasurement": unit,
                "deviceClass": str(device_class or ""),
                "stateClass": str(state_class or ""),
                "state": str(getattr(state, "state", "") or "") if state is not None else "",
                "platform": getattr(entry, "platform", "") or "",
                "uniqueId": getattr(entry, "unique_id", "") or "",
                "originalName": getattr(entry, "original_name", "") or "",
                "name": name,
                "entityCategory": str(getattr(entry, "entity_category", "") or ""),
                "disabledBy": str(getattr(entry, "disabled_by", "") or ""),
                "hiddenBy": str(getattr(entry, "hidden_by", "") or ""),
                **inferred,
            })
        return sorted(entities, key=lambda item: str(item.get("entityId") or ""))
    except Exception:
        return []


async def list_green_smart_devices(hass, farm_id: int = 1) -> list[dict[str, Any]]:
    rows = await fetchall(hass, """
        SELECT id, farm_id, zone_id, equipment_kind, device_name, ha_device_id, ha_device_name, manufacturer, model, model_id,
               sw_version, hw_version, serial_number, area_id, config_entry_id, integration_domain, entities_snapshot_json,
               status, connection_status, last_seen_at, note, created_at, updated_at
        FROM green_smart_devices
        WHERE farm_id = %s AND status NOT IN ('deleted', '삭제됨')
        ORDER BY updated_at DESC, id DESC
    """, (farm_id,))
    devices: list[dict[str, Any]] = []
    for row in rows:
        item = dict(row)
        devices.append({
            **item,
            "id": item.get("id"),
            "farmId": item.get("farm_id"),
            "zoneId": item.get("zone_id") or "",
            "equipmentKind": item.get("equipment_kind") or "",
            "deviceName": item.get("device_name") or "",
            "haDeviceId": item.get("ha_device_id") or "",
            "haDeviceName": item.get("ha_device_name") or "",
            "modelId": item.get("model_id") or "",
            "swVersion": item.get("sw_version") or "",
            "hwVersion": item.get("hw_version") or "",
            "serialNumber": item.get("serial_number") or "",
            "areaId": item.get("area_id") or "",
            "configEntryId": item.get("config_entry_id") or "",
            "integrationDomain": item.get("integration_domain") or "",
            "entitiesSnapshotJson": item.get("entities_snapshot_json"),
            "connectionStatus": item.get("connection_status") or "unknown",
            "lastSeenAt": _dt_text(item.get("last_seen_at")),
            "createdAt": _dt_text(item.get("created_at")),
            "updatedAt": _dt_text(item.get("updated_at")),
        })
    return devices


async def list_green_smart_device_entities_map(hass, farm_id: int = 1) -> dict[str, list[dict[str, Any]]]:
    rows = await fetchall(hass, """
        SELECT id, green_smart_device_id, ha_device_id, entity_id, entity_domain, platform, unique_id, original_name, display_name,
               device_class, state_class, unit_of_measurement, entity_category, disabled_by, hidden_by, entity_role, value_kind, read_write_mode, status
        FROM green_smart_device_entities
        WHERE farm_id = %s AND status NOT IN ('deleted', '삭제됨')
        ORDER BY green_smart_device_id, entity_role, entity_id
    """, (farm_id,))
    by_device: dict[str, list[dict[str, Any]]] = {}
    for row in rows:
        item = dict(row)
        key = str(item.get("green_smart_device_id") or "")
        by_device.setdefault(key, []).append({
            **item,
            "greenSmartDeviceId": item.get("green_smart_device_id"),
            "haDeviceId": item.get("ha_device_id") or "",
            "entityId": item.get("entity_id") or "",
            "entityDomain": item.get("entity_domain") or "",
            "uniqueId": item.get("unique_id") or "",
            "originalName": item.get("original_name") or "",
            "displayName": item.get("display_name") or "",
            "deviceClass": item.get("device_class") or "",
            "stateClass": item.get("state_class") or "",
            "unitOfMeasurement": item.get("unit_of_measurement") or "",
            "entityCategory": item.get("entity_category") or "",
            "disabledBy": item.get("disabled_by") or "",
            "hiddenBy": item.get("hidden_by") or "",
            "entityRole": item.get("entity_role") or "",
            "valueKind": item.get("value_kind") or "",
            "readWriteMode": item.get("read_write_mode") or "readonly",
        })
    return by_device


async def list_green_smart_device_latest_values_map(hass, farm_id: int = 1) -> dict[str, list[dict[str, Any]]]:
    rows = await fetchall(hass, """
        SELECT green_smart_device_id, entity_id, state_value, state_numeric, state_bool, unit_of_measurement, device_class, entity_domain, entity_role, sampled_at, freshness_state
        FROM green_smart_device_entity_latest_values
        WHERE farm_id = %s
        ORDER BY green_smart_device_id, entity_role, entity_id
    """, (farm_id,))
    by_device: dict[str, list[dict[str, Any]]] = {}
    for row in rows:
        item = dict(row)
        key = str(item.get("green_smart_device_id") or "")
        by_device.setdefault(key, []).append({
            **item,
            "greenSmartDeviceId": item.get("green_smart_device_id"),
            "entityId": item.get("entity_id") or "",
            "state": item.get("state_value") or "",
            "stateNumeric": item.get("state_numeric"),
            "stateBool": item.get("state_bool"),
            "unitOfMeasurement": item.get("unit_of_measurement") or "",
            "deviceClass": item.get("device_class") or "",
            "entityDomain": item.get("entity_domain") or "",
            "entityRole": item.get("entity_role") or "",
            "sampledAt": _dt_text(item.get("sampled_at")),
            "freshnessState": item.get("freshness_state") or "unknown",
        })
    return by_device


async def refresh_green_smart_device_latest_values(hass, device_id: int, farm_id: int = 1, *, write_sample: bool = False) -> list[dict[str, Any]]:
    entity_rows = await fetchall(hass, """
        SELECT id, green_smart_device_id, ha_device_id, entity_id, entity_domain, unit_of_measurement, device_class, entity_role
        FROM green_smart_device_entities
        WHERE farm_id = %s AND green_smart_device_id = %s AND status = 'active'
    """, (farm_id, device_id))
    latest: list[dict[str, Any]] = []
    for row in entity_rows:
        entity_id = row.get("entity_id") or ""
        state = hass.states.get(entity_id) if hasattr(hass, "states") else None
        attrs = dict(getattr(state, "attributes", {}) or {}) if state is not None else {}
        state_value = str(getattr(state, "state", "") or "") if state is not None else ""
        unit = attrs.get("unit_of_measurement") or row.get("unit_of_measurement") or ""
        device_class = attrs.get("device_class") or row.get("device_class") or ""
        sampled_at = datetime.now(timezone.utc).replace(tzinfo=None).isoformat(sep=" ")[:19]
        freshness_state = "fresh" if state is not None and state_value not in {"unknown", "unavailable"} else "unavailable"
        args = (
            farm_id, row.get("green_smart_device_id"), row.get("id"), row.get("ha_device_id"), entity_id, state_value,
            _state_numeric(state_value), _state_bool(state_value), unit, device_class, row.get("entity_domain") or _entity_domain(entity_id),
            row.get("entity_role") or "", _safe_json(attrs), _dt_text(getattr(state, "last_changed", None)), _dt_text(getattr(state, "last_updated", None)),
            sampled_at, freshness_state, "ha_state",
        )
        await execute(hass, """
            INSERT INTO green_smart_device_entity_latest_values
                (farm_id, green_smart_device_id, green_smart_entity_id, ha_device_id, entity_id, state_value, state_numeric, state_bool,
                 unit_of_measurement, device_class, entity_domain, entity_role, attributes_json, ha_last_changed, ha_last_updated, sampled_at, freshness_state, source)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                green_smart_device_id = VALUES(green_smart_device_id), green_smart_entity_id = VALUES(green_smart_entity_id),
                state_value = VALUES(state_value), state_numeric = VALUES(state_numeric), state_bool = VALUES(state_bool),
                unit_of_measurement = VALUES(unit_of_measurement), device_class = VALUES(device_class), entity_domain = VALUES(entity_domain),
                entity_role = VALUES(entity_role), attributes_json = VALUES(attributes_json), ha_last_changed = VALUES(ha_last_changed),
                ha_last_updated = VALUES(ha_last_updated), sampled_at = VALUES(sampled_at), freshness_state = VALUES(freshness_state), source = VALUES(source),
                updated_at = CURRENT_TIMESTAMP
        """, args)
        if write_sample:
            await execute(hass, """
                INSERT INTO green_smart_device_entity_samples
                    (farm_id, green_smart_device_id, green_smart_entity_id, ha_device_id, entity_id, sampled_at, state_value, state_numeric, state_bool,
                     unit_of_measurement, device_class, entity_domain, entity_role, attributes_json, ha_last_changed, ha_last_updated, freshness_state, source)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (farm_id, row.get("green_smart_device_id"), row.get("id"), row.get("ha_device_id"), entity_id, sampled_at, state_value,
                  _state_numeric(state_value), _state_bool(state_value), unit, device_class, row.get("entity_domain") or _entity_domain(entity_id),
                  row.get("entity_role") or "", _safe_json(attrs), _dt_text(getattr(state, "last_changed", None)), _dt_text(getattr(state, "last_updated", None)), freshness_state, "ha_state"))
        latest.append({"entityId": entity_id, "state": state_value, "unitOfMeasurement": unit, "entityRole": row.get("entity_role") or "", "freshnessState": freshness_state, "sampledAt": sampled_at})
    return latest


async def create_green_smart_device_connection(hass, payload: dict[str, Any], actor: str = "operator", farm_id: int = 1) -> dict[str, Any]:
    ha_device_id = _str(payload, "haDeviceId", "ha_device_id", "deviceId", "device_id")
    entities = payload.get("entities") if isinstance(payload.get("entities"), list) else []
    if not ha_device_id:
        return {"ok": False, 'saved': False, "error": "ha_device_id_required"}
    if not entities:
        return {"ok": False, 'saved': False, "error": "entities_required"}
    device_name = _str(payload, "deviceName", "device_name", "name", default=ha_device_id)
    equipment_kind = _str(payload, "equipmentKind", "equipment_kind", "deviceType", "device_type", default="기타")
    zone_id = _str(payload, "zoneId", "zone_id", default="zone-1")
    snapshot = [{**entity} for entity in entities if isinstance(entity, dict)]
    await execute(hass, """
        INSERT INTO green_smart_devices
            (farm_id, zone_id, equipment_kind, device_name, ha_device_id, ha_device_name, manufacturer, model, model_id, sw_version, hw_version,
             serial_number, area_id, config_entry_id, integration_domain, entities_snapshot_json, status, connection_status, last_seen_at, note, created_by, updated_by)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'active', 'connected', CURRENT_TIMESTAMP, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            zone_id = VALUES(zone_id), equipment_kind = VALUES(equipment_kind), device_name = VALUES(device_name), ha_device_name = VALUES(ha_device_name),
            manufacturer = VALUES(manufacturer), model = VALUES(model), model_id = VALUES(model_id), sw_version = VALUES(sw_version), hw_version = VALUES(hw_version),
            serial_number = VALUES(serial_number), area_id = VALUES(area_id), config_entry_id = VALUES(config_entry_id), integration_domain = VALUES(integration_domain),
            entities_snapshot_json = VALUES(entities_snapshot_json), status = 'active', connection_status = 'connected', last_seen_at = CURRENT_TIMESTAMP,
            note = VALUES(note), updated_by = VALUES(updated_by), updated_at = CURRENT_TIMESTAMP
    """, (farm_id, zone_id, equipment_kind, device_name, ha_device_id, _str(payload, "haDeviceName", "ha_device_name", default=device_name),
          _str(payload, "manufacturer"), _str(payload, "model"), _str(payload, "modelId", "model_id"), _str(payload, "swVersion", "sw_version"),
          _str(payload, "hwVersion", "hw_version"), _str(payload, "serialNumber", "serial_number"), _str(payload, "areaId", "area_id"),
          _str(payload, "configEntryId", "config_entry_id"), _str(payload, "integrationDomain", "integration_domain"), _safe_json(snapshot), _str(payload, "note"), actor, actor))
    device_row = await fetchone(hass, "SELECT id, farm_id, zone_id, equipment_kind, device_name, ha_device_id FROM green_smart_devices WHERE farm_id = %s AND ha_device_id = %s LIMIT 1", (farm_id, ha_device_id))
    green_smart_device_id = int((device_row or {}).get("id") or 0)
    saved_entities: list[dict[str, Any]] = []
    for entity in snapshot:
        entity_id = _str(entity, "entityId", "entity_id")
        if not entity_id:
            continue
        domain = _str(entity, "domain", "entityDomain", "entity_domain", default=_entity_domain(entity_id))
        unit = _str(entity, "unitOfMeasurement", "unit_of_measurement", "unit")
        device_class = _str(entity, "deviceClass", "device_class")
        inferred = infer_green_smart_entity_role(entity_id, domain=domain, unit=unit, device_class=device_class, name=_str(entity, "name", "displayName", "display_name"))
        entity_role = _str(entity, "entityRole", "entity_role", "role", default=inferred["entityRole"])
        value_kind = _str(entity, "valueKind", "value_kind", default=inferred["valueKind"])
        read_write_mode = _str(entity, "readWriteMode", "read_write_mode", default=inferred["readWriteMode"])
        await execute(hass, """
            INSERT INTO green_smart_device_entities
                (farm_id, green_smart_device_id, ha_device_id, entity_id, entity_domain, platform, unique_id, original_name, display_name,
                 device_class, state_class, unit_of_measurement, entity_category, disabled_by, hidden_by, entity_role, value_kind, read_write_mode, status, created_by, updated_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'active', %s, %s)
            ON DUPLICATE KEY UPDATE
                green_smart_device_id = VALUES(green_smart_device_id), ha_device_id = VALUES(ha_device_id), entity_domain = VALUES(entity_domain),
                platform = VALUES(platform), unique_id = VALUES(unique_id), original_name = VALUES(original_name), display_name = VALUES(display_name),
                device_class = VALUES(device_class), state_class = VALUES(state_class), unit_of_measurement = VALUES(unit_of_measurement),
                entity_category = VALUES(entity_category), disabled_by = VALUES(disabled_by), hidden_by = VALUES(hidden_by), entity_role = VALUES(entity_role),
                value_kind = VALUES(value_kind), read_write_mode = VALUES(read_write_mode), status = 'active', updated_by = VALUES(updated_by), updated_at = CURRENT_TIMESTAMP
        """, (farm_id, green_smart_device_id, ha_device_id, entity_id, domain, _str(entity, "platform"), _str(entity, "uniqueId", "unique_id"),
              _str(entity, "originalName", "original_name"), _str(entity, "name", "displayName", "display_name", default=entity_id), device_class,
              _str(entity, "stateClass", "state_class"), unit, _str(entity, "entityCategory", "entity_category"), _str(entity, "disabledBy", "disabled_by"),
              _str(entity, "hiddenBy", "hidden_by"), entity_role, value_kind, read_write_mode, actor, actor))
        saved_entities.append({"entityId": entity_id, "domain": domain, "unitOfMeasurement": unit, "entityRole": entity_role, "valueKind": value_kind, "readWriteMode": read_write_mode})
    latest = await refresh_green_smart_device_latest_values(hass, green_smart_device_id, farm_id)
    return {"ok": True, "saved": True, "kind": "device-connection", "device": {"id": green_smart_device_id, "haDeviceId": ha_device_id, "deviceName": device_name, "equipmentKind": equipment_kind, "zoneId": zone_id}, "entities": saved_entities, "latestValues": latest}


async def latest_green_smart_device_values(hass, device_id: int, farm_id: int = 1) -> list[dict[str, Any]]:
    rows = await fetchall(hass, """
        SELECT entity_id, state_value, state_numeric, state_bool, unit_of_measurement, device_class, entity_domain, entity_role, sampled_at, freshness_state
        FROM green_smart_device_entity_latest_values
        WHERE farm_id = %s AND green_smart_device_id = %s
        ORDER BY entity_role, entity_id
    """, (farm_id, device_id))
    return [dict(row) for row in rows]


async def sample_green_smart_device_values(hass, device_id: int, farm_id: int = 1, limit: int = 500) -> list[dict[str, Any]]:
    rows = await fetchall(hass, """
        SELECT entity_id, sampled_at, state_value, state_numeric, state_bool, unit_of_measurement, device_class, entity_domain, entity_role, freshness_state
        FROM green_smart_device_entity_samples
        WHERE farm_id = %s AND green_smart_device_id = %s
        ORDER BY sampled_at DESC, entity_id
        LIMIT %s
    """, (farm_id, device_id, limit))
    return [dict(row) for row in rows]


def _manifest_version(path: Path, default: str = "미설치") -> str:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return str(data.get("version") or default)
    except Exception:
        return default


async def _manifest_version_async(hass, path: Path, default: str = "미설치") -> str:
    if hasattr(hass, "async_add_executor_job"):
        return await hass.async_add_executor_job(_manifest_version, path, default)
    return _manifest_version(path, default)


def _ha_version_status(hass) -> str:
    return str(HA_VERSION or "unknown")


async def _hacs_version_status(hass) -> str:
    hacs_manifest = Path(hass.config.path("custom_components", "hacs", "manifest.json")) if hasattr(hass, "config") else Path("/config/custom_components/hacs/manifest.json")
    return await _manifest_version_async(hass, hacs_manifest, default="미설치")


async def _gs_version_status(hass) -> str:
    gs_manifest = Path(__file__).with_name("manifest.json")
    return await _manifest_version_async(hass, gs_manifest, default="unknown")


async def _db_watchdog_status(hass) -> dict[str, Any]:
    errors: list[str] = []
    version = "확인 실패"
    try:
        row = await fetchone(hass, "SELECT VERSION() AS version")
        version = str((row or {}).get("version") or "unknown")
    except Exception as exc:
        errors.append(exc.__class__.__name__)
    return {
        "dbUse": "MariaDB",
        "dbVersion": version,
        "dbStatus": "정상" if not errors else f"오류 {len(errors)}건",
        "dbErrorCount": len(errors),
        "dbErrors": errors[:3],
    }


async def _api_watchdog_status(hass) -> dict[str, Any]:
    center_errors: list[str] = []
    edge_errors: list[str] = []
    center_config = await _load_center_connection(hass)
    center_base_url = (
        center_config.get("baseUrl")
        or center_config.get("base_url")
        or os.environ.get("GREENITY_CENTER_BASE_URL")
        or os.environ.get("GREEN_SMART_CENTER_BASE_URL")
        or "http://127.0.0.1:18000"
    )
    center_configured = bool(center_config.get("credential")) or bool(center_config.get("token"))
    center_connected = False
    try:
        session = async_get_clientsession(hass)
        async with session.get(f"{str(center_base_url).rstrip('/')}/health", timeout=ClientTimeout(total=3)) as response:
            center_connected = response.status < 500
            if response.status >= 400:
                center_errors.append(f"http_{response.status}")
    except Exception as exc:
        center_errors.append(exc.__class__.__name__)
    try:
        await list_settings_greenhouses(hass)
    except Exception as exc:
        edge_errors.append(exc.__class__.__name__)
    return {
        "centerConnectionStatus": "연결" if center_connected and not center_errors else ("설정됨" if center_configured else "미연결"),
        "centerReachabilityStatus": "연결" if center_connected and not center_errors else "미연결",
        "centerConfigured": center_configured,
        "centerBaseUrl": str(center_base_url or ""),
        "centerApiStatus": "정상" if not center_errors else f"오류 {len(center_errors)}건",
        "edgeApiStatus": "정상" if not edge_errors else f"오류 {len(edge_errors)}건",
        "centerApiErrorCount": len(center_errors),
        "edgeApiErrorCount": len(edge_errors),
        "centerApiErrors": center_errors[:3],
        "edgeApiErrors": edge_errors[:3],
    }


def _update_status_label(entities: list[dict[str, Any]], unavailable_label: str = "확인 불가") -> str:
    if not entities:
        return unavailable_label
    state = str(entities[0].get("state") or "unknown").lower()
    if state in {"off", "idle", "latest", "up_to_date", "unknown"}:
        return "최신"
    if state in {"on", "update_available"}:
        return "업데이트 가능"
    return "확인 중"


async def system_integration_watchdog_response(hass) -> dict[str, Any]:
    db_status = await _db_watchdog_status(hass)
    api_status = await _api_watchdog_status(hass)
    update_entities = _discover_update_entities(hass)
    snapshot = {
        "haVersion": _ha_version_status(hass),
        "hacsVersion": await _hacs_version_status(hass),
        "gsVersion": await _gs_version_status(hass),
        "gsUpdateStatus": _update_status_label(update_entities.get("gs", [])),
        "hacsUpdateStatus": _update_status_label(update_entities.get("hacs", [])),
        "haDbUpdateStatus": "Update Agent 도입 후",
        **db_status,
        **api_status,
        "checkedAt": datetime.now(timezone.utc).isoformat(),
        "source": "green_smart_system_watchdog",
    }
    hass.data.setdefault(DOMAIN, {})["system_integration_watchdog_snapshot"] = snapshot
    return snapshot


def _update_entity_dto(entity_id: str, state_obj: Any) -> dict[str, Any]:
    attrs = getattr(state_obj, "attributes", {}) or {}
    return {
        "entityId": entity_id,
        "state": getattr(state_obj, "state", "unknown"),
        "installedVersion": attrs.get("installed_version") or attrs.get("installedVersion") or "",
        "latestVersion": attrs.get("latest_version") or attrs.get("latestVersion") or "",
        "title": attrs.get("friendly_name") or entity_id,
    }


def _discover_update_entities(hass) -> dict[str, list[dict[str, Any]]]:
    states = getattr(hass, "states", None)
    async_all = getattr(states, "async_all", None)
    all_states = async_all("update") if callable(async_all) else []
    targets = {"gs": [], "hacs": []}
    for state_obj in all_states or []:
        entity_id = str(getattr(state_obj, "entity_id", ""))
        attrs = getattr(state_obj, "attributes", {}) or {}
        haystack = " ".join([entity_id, str(attrs.get("friendly_name", "")), str(attrs.get("title", ""))]).lower()
        dto = _update_entity_dto(entity_id, state_obj)
        if "green_smart" in haystack or "green smart" in haystack:
            targets["gs"].append(dto)
        if "hacs" in haystack:
            targets["hacs"].append(dto)
    return targets


async def system_update_response(hass, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    """GS/HACS only update status/action response; HA/DB stay deferred until Update Agent.

    HA service contracts used here: homeassistant.update_entity and update.install.
    """
    payload = payload or {}
    action = str(payload.get("action") or "status")
    target = str(payload.get("target") or "").lower()
    discovered = _discover_update_entities(hass)
    components = [
        {"target": "gs", "label": "GS", "supported": bool(discovered["gs"]), "entities": discovered["gs"], "state": "ready" if discovered["gs"] else "deferred"},
        {"target": "hacs", "label": "HACS", "supported": bool(discovered["hacs"]), "entities": discovered["hacs"], "state": "ready" if discovered["hacs"] else "deferred"},
        {"target": "ha", "label": "Home Assistant", "supported": False, "state": "deferred", "reason": "Update Agent required"},
        {"target": "db", "label": "MariaDB", "supported": False, "state": "deferred", "reason": "Update Agent required"},
    ]
    if action in {"check", "install"} and target in {"gs", "hacs"}:
        entities = discovered.get(target) or []
        if not entities:
            return {"ok": True, "target": target, "action": action, "supported": False, "state": "deferred", "message": "GS/HACS only via HA update entity; no matching update entity found", "components": components}
        entity_id = entities[0]["entityId"]
        try:
            if action == "check":
                await hass.services.async_call("homeassistant", "update_entity", {"entity_id": entity_id}, blocking=True)
            else:
                await hass.services.async_call("update", "install", {"entity_id": entity_id}, blocking=True)
        except Exception as err:
            return {"ok": False, "target": target, "action": action, "supported": True, "state": "error", "message": str(err) or "system-update-action-failed", "entityId": entity_id, "components": components}
        return {"ok": True, "target": target, "action": action, "supported": True, "state": "requested", "entityId": entity_id, "components": components}
    return {"ok": True, "source": "system_update_response", "components": components, "note": "GS/HACS only; HA/DB updates are deferred to Update Agent"}


def _error_row(scope: str, status: str, count: int, hints: list[str]) -> dict[str, Any]:
    return {"scope": scope, "status": status, "count": int(count or 0), "hints": hints}


async def system_errors_response(hass, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    payload = payload or {}
    action = str(payload.get("action") or "inspect")
    snapshot = await system_integration_watchdog_response(hass) if action == "refresh-watchdog" else (hass.data.setdefault(DOMAIN, {}).get("system_integration_watchdog_snapshot") or await system_integration_watchdog_response(hass))
    errors = [
        _error_row("db", snapshot.get("dbStatus") or "확인 중", int(snapshot.get("dbErrorCount") or 0), ["DB 컨테이너 상태 확인", "SELECT VERSION() 재검사", "MariaDB 연결 환경변수 확인"]),
        _error_row("center", snapshot.get("centerApiStatus") or "확인 중", int(snapshot.get("centerApiErrorCount") or 0), ["Center 연결 설정 확인", "허용 토큰 재연결", "Center /health 응답 확인"]),
        _error_row("edge", snapshot.get("edgeApiStatus") or "확인 중", int(snapshot.get("edgeApiErrorCount") or 0), ["settings snapshot API 재호출", "Home Assistant 로그 확인", "Green Smart API route 등록 확인"]),
    ]
    return {"ok": True, "checkedAt": snapshot.get("checkedAt"), "actions": ["refresh-watchdog", "inspect-center", "inspect-db", "inspect-edge"], "errors": errors, "snapshot": {k: snapshot.get(k) for k in ("dbStatus", "centerConnectionStatus", "centerApiStatus", "edgeApiStatus")}}


def _center_connection_store(hass):
    if Store is None:
        return None
    return Store(hass, 1, "green_smart_center_connection")


async def _load_center_connection(hass) -> dict[str, Any]:
    store = _center_connection_store(hass)
    if store is None:
        return hass.data.setdefault(DOMAIN, {}).get("center_connection_config") or {}
    data = await store.async_load()
    return data if isinstance(data, dict) else {}


async def _save_center_connection(hass, data: dict[str, Any]) -> None:
    hass.data.setdefault(DOMAIN, {})["center_connection_config"] = data
    store = _center_connection_store(hass)
    if store is not None:
        await store.async_save(data)


def _redacted_center_connection(data: dict[str, Any], status: str = "미연결", reachability: str = "미검증") -> dict[str, Any]:
    configured = bool(data.get("credential"))
    connection_status = "설정됨" if configured else status
    # UI contract marker: "connectionStatus": "설정됨" when credential is stored; reachabilityStatus carries 실제 연결성.
    return {"baseUrl": data.get("baseUrl") or data.get("base_url") or "", "enabled": bool(data.get("enabled", True)), "credentialState": "configured" if configured else "missing", "connectionStatus": connection_status, "reachabilityStatus": reachability, "reachable": reachability == "연결", "configured": configured, "credentialPreview": "[REDACTED]" if configured else "", "allowedCredentialPreview": "[REDACTED]" if configured else ""}


async def system_center_connection_response(hass, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    payload = payload or {}
    current = await _load_center_connection(hass)
    if payload:
        base_url = str(payload.get("baseUrl") or payload.get("base_url") or current.get("baseUrl") or "http://127.0.0.1:18000").rstrip("/")
        credential_payload = str(payload.get("allowedCredential") or payload.get("credential") or "")
        credential = current.get("credential") if credential_payload == "[REDACTED]" else (credential_payload or current.get("credential") or "")
        current = {"baseUrl": base_url, "credential": credential, "enabled": bool(payload.get("enabled", True))}
        await _save_center_connection(hass, current)
        if credential:
            try:
                from .central_store import CentralTokenStore
                await CentralTokenStore(hass).save_token_pair(base_url=base_url, installation_id="settings-center-connection", access_token=credential, refresh_token=credential, token_type="bearer", expires_in=31536000)
            except Exception:
                pass
    status = "미연결"
    reachability = "미검증"
    if current.get("baseUrl"):
        headers = {"Authorization": f"Bearer {current['credential']}"} if current.get("credential") else {}
        try:
            session = async_get_clientsession(hass)
            for path in ("/health", "/status"):
                async with session.get(f"{str(current['baseUrl']).rstrip('/')}{path}", headers=headers, timeout=ClientTimeout(total=3)) as response:
                    if response.status < 500:
                        status = "연결"
                        reachability = "연결"
                        break
        except Exception:
            status = "미연결"
            reachability = "미연결"
    redacted = _redacted_center_connection(current, status, reachability)
    hass.data.setdefault(DOMAIN, {})["center_connection"] = redacted
    return {"ok": True, "centerConnection": redacted}


async def settings_snapshot_response(hass, farm_id: int = 1) -> dict[str, Any]:
    greenhouses = await list_settings_greenhouses(hass, farm_id)
    zones = await list_settings_zones(hass, farm_id)
    mappings = await list_settings_device_sensor_mappings(hass, farm_id)
    devices = await list_settings_devices(hass, farm_id)
    canonical_devices = await list_green_smart_devices(hass, farm_id)
    canonical_device_entities = await list_green_smart_device_entities_map(hass, farm_id)
    canonical_device_latest_values = await list_green_smart_device_latest_values_map(hass, farm_id)
    ha_devices = await list_ha_device_registry_summary(hass)
    device_groups = await list_settings_device_groups(hass, farm_id)
    zone_by_id = {str(zone.get("id")): zone for zone in zones}
    zone_by_key = {str(zone.get("zoneId")): zone for zone in zones}
    for mapping in mappings:
        zone = zone_by_id.get(str(mapping.get("zoneId"))) or zone_by_key.get(str(mapping.get("zoneId")))
        label = mapping.get("sensorEntity") or mapping.get("deviceEntity") or mapping.get("mappingRole")
        if zone is not None and label:
            zone.setdefault("equipmentProfile", {}).setdefault("labels", []).append(label)
    for device_group in device_groups:
        zone = zone_by_id.get(str(device_group.get("zoneId"))) or zone_by_key.get(str(device_group.get("zoneId")))
        label = device_group.get("groupName") or device_group.get("groupType")
        if zone is not None and label:
            zone.setdefault("equipmentProfile", {}).setdefault("labels", []).append(label)
    system_integration = await system_integration_watchdog_response(hass)
    return {"ok": True, "source": "green_smart_settings_db", "greenhouses": greenhouses, "zones": zones, "deviceSensorMappings": mappings, "devices": devices, "canonicalDevices": canonical_devices, "canonicalDeviceEntities": canonical_device_entities, "canonicalDeviceLatestValues": canonical_device_latest_values, "haDevices": ha_devices, "deviceGroups": device_groups, "systemIntegration": system_integration}


class GreenSmartHaUnlinkedDevicesView(HomeAssistantView):
    url = "/api/green_smart/devices/ha/unlinked"
    name = "api:green_smart:devices:ha_unlinked"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        return self.json({"ok": True, "devices": await list_green_smart_unlinked_ha_devices(hass)})


class GreenSmartHaDeviceEntitiesView(HomeAssistantView):
    url = "/api/green_smart/devices/ha/{ha_device_id}/entities"
    name = "api:green_smart:devices:ha_device_entities"
    requires_auth = True

    async def get(self, request: web.Request, ha_device_id=None) -> web.Response:
        hass = request.app["hass"]
        ha_device_id = ha_device_id or request.match_info["ha_device_id"]
        return self.json({"ok": True, "haDeviceId": ha_device_id, "entities": await list_green_smart_ha_device_entities(hass, ha_device_id)})


class GreenSmartDevicesView(HomeAssistantView):
    url = "/api/green_smart/devices"
    name = "api:green_smart:devices"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        return self.json({"ok": True, "devices": await list_green_smart_devices(hass)})

    async def post(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        result = await create_green_smart_device_connection(hass, await _settings_payload(request), actor=_request_actor(request))
        status_code = 200 if result.get("ok") else 400
        return self.json({**result, "settingsSnapshot": await settings_snapshot_response(hass) if result.get("ok") else {}}, status_code=status_code)


class GreenSmartDeviceItemView(HomeAssistantView):
    url = "/api/green_smart/devices/{device_id}"
    name = "api:green_smart:device_item"
    requires_auth = True

    async def get(self, request: web.Request, device_id=None) -> web.Response:
        hass = request.app["hass"]
        device_id = int(device_id or request.match_info["device_id"])
        devices = await list_green_smart_devices(hass)
        device = next((row for row in devices if int(row.get("id") or 0) == device_id), None)
        return self.json({"ok": bool(device), "device": device or {}, "latestValues": await latest_green_smart_device_values(hass, device_id) if device else []}, status_code=200 if device else 404)


class GreenSmartDeviceLatestDataView(HomeAssistantView):
    url = "/api/green_smart/devices/{device_id}/data/latest"
    name = "api:green_smart:device_latest_data"
    requires_auth = True

    async def get(self, request: web.Request, device_id=None) -> web.Response:
        hass = request.app["hass"]
        device_id = int(device_id or request.match_info["device_id"])
        return self.json({"ok": True, "deviceId": device_id, "values": await latest_green_smart_device_values(hass, device_id)})


class GreenSmartDeviceDataRefreshView(HomeAssistantView):
    url = "/api/green_smart/devices/{device_id}/data/refresh"
    name = "api:green_smart:device_data_refresh"
    requires_auth = True

    async def post(self, request: web.Request, device_id=None) -> web.Response:
        hass = request.app["hass"]
        device_id = int(device_id or request.match_info["device_id"])
        payload = await _settings_payload(request)
        values = await refresh_green_smart_device_latest_values(hass, device_id, write_sample=bool(payload.get("writeSample", True)))
        return self.json({"ok": True, "deviceId": device_id, "refreshed": True, "values": values})


class GreenSmartDeviceSamplesView(HomeAssistantView):
    url = "/api/green_smart/devices/{device_id}/data/samples"
    name = "api:green_smart:device_samples"
    requires_auth = True

    async def get(self, request: web.Request, device_id=None) -> web.Response:
        hass = request.app["hass"]
        device_id = int(device_id or request.match_info["device_id"])
        limit = int(request.query.get("limit", 500)) if hasattr(request, "query") else 500
        return self.json({"ok": True, "deviceId": device_id, "samples": await sample_green_smart_device_values(hass, device_id, limit=max(1, min(limit, 2000)))})


class RebuildSettingsSnapshotView(HomeAssistantView):
    url = "/api/green_smart/rebuild/settings/snapshot"
    name = "api:green_smart:rebuild:settings:snapshot"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        return self.json(await settings_snapshot_response(request.app["hass"]))


class RebuildSettingsSystemUpdateView(HomeAssistantView):
    url = "/api/green_smart/rebuild/settings/system/update"
    name = "api:green_smart:rebuild:settings:system_update"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        return self.json(await system_update_response(request.app["hass"]))

    async def post(self, request: web.Request) -> web.Response:
        return self.json(await system_update_response(request.app["hass"], await _settings_payload(request)))


class RebuildSettingsSystemErrorsView(HomeAssistantView):
    url = "/api/green_smart/rebuild/settings/system/errors"
    name = "api:green_smart:rebuild:settings:system_errors"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        return self.json(await system_errors_response(request.app["hass"]))

    async def post(self, request: web.Request) -> web.Response:
        return self.json(await system_errors_response(request.app["hass"], await _settings_payload(request)))


class RebuildSettingsSystemCenterConnectionView(HomeAssistantView):
    url = "/api/green_smart/rebuild/settings/system/center-connection"
    name = "api:green_smart:rebuild:settings:system_center_connection"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        return self.json(await system_center_connection_response(request.app["hass"]))

    async def post(self, request: web.Request) -> web.Response:
        return self.json(await system_center_connection_response(request.app["hass"], await _settings_payload(request)))


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

    async def patch(self, request: web.Request, greenhouse_id=None) -> web.Response:
        hass = request.app["hass"]
        greenhouse_id = int(greenhouse_id or request.match_info["greenhouse_id"])
        item = await update_settings_greenhouse(hass, greenhouse_id, await _settings_payload(request), actor=_request_actor(request))
        return self.json({"ok": True, "kind": "greenhouse", "saved": True, "approvalRequired": False, "greenhouse": item, "settingsSnapshot": await settings_snapshot_response(hass)})

    async def delete(self, request: web.Request, greenhouse_id=None) -> web.Response:
        hass = request.app["hass"]
        greenhouse_id = int(greenhouse_id or request.match_info["greenhouse_id"])
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


class RebuildSettingsZoneItemView(HomeAssistantView):
    url = "/api/green_smart/rebuild/settings/zones/{zone_id}"
    name = "api:green_smart:rebuild:settings:zone_item"
    requires_auth = True

    async def patch(self, request: web.Request, zone_id=None) -> web.Response:
        hass = request.app["hass"]
        zone_id = int(zone_id or request.match_info["zone_id"])
        item = await update_settings_zone(hass, zone_id, await _settings_payload(request), actor=_request_actor(request))
        return self.json({"ok": True, "kind": "zone", "saved": True, "approvalRequired": False, "zone": item, "settingsSnapshot": await settings_snapshot_response(hass)})

    async def delete(self, request: web.Request, zone_id=None) -> web.Response:
        hass = request.app["hass"]
        zone_id = int(zone_id or request.match_info["zone_id"])
        item = await delete_settings_zone(hass, zone_id, actor=_request_actor(request))
        return self.json({"ok": True, "kind": "zone", "deleted": True, "approvalRequired": False, "zone": item, "settingsSnapshot": await settings_snapshot_response(hass)})


class RebuildSettingsDeviceCreateView(HomeAssistantView):
    url = "/api/green_smart/rebuild/settings/devices"
    name = "api:green_smart:rebuild:settings:devices"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        return self.json({"ok": True, "devices": await list_settings_devices(hass)})

    async def post(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        item = await create_settings_device(hass, await _settings_payload(request), actor=_request_actor(request))
        return self.json({"ok": True, "kind": "device", "saved": True, "approvalRequired": False, "device": item, "settingsSnapshot": await settings_snapshot_response(hass)})


class RebuildSettingsDeviceGroupCreateView(HomeAssistantView):
    url = "/api/green_smart/rebuild/settings/device-groups"
    name = "api:green_smart:rebuild:settings:device_groups"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        return self.json({"ok": True, "deviceGroups": await list_settings_device_groups(hass)})

    async def post(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        item = await create_settings_device_group(hass, await _settings_payload(request), actor=_request_actor(request))
        return self.json({"ok": True, "kind": "device-group", "saved": True, "approvalRequired": False, "deviceGroup": item, "settingsSnapshot": await settings_snapshot_response(hass)})


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
