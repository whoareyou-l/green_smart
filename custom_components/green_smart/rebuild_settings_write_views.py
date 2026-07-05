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


async def list_settings_devices(hass, farm_id: int = 1) -> list[dict[str, Any]]:
    rows = await fetchall(hass, """
        SELECT id, farm_id, device_name, device_type, entity_id, vendor_model, note, status, created_at, updated_at
        FROM green_smart_settings_devices
        WHERE farm_id = %s
        ORDER BY updated_at DESC, id DESC
        """, (farm_id,))
    return [_device_dto(row) for row in rows]


async def create_settings_device(hass, payload: dict[str, Any], actor: str = "operator", farm_id: int = 1) -> dict[str, Any]:
    device_name = _str(payload, "deviceName", "device_name", "name", default="신규 장치")
    entity_id = _str(payload, "entityId", "entity_id", default="switch.greenhouse_device")
    await execute(hass, """
        INSERT INTO green_smart_settings_devices
            (farm_id, device_name, device_type, entity_id, vendor_model, note, status, created_by, updated_by)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            device_name = VALUES(device_name), device_type = VALUES(device_type), vendor_model = VALUES(vendor_model),
            note = VALUES(note), status = VALUES(status), updated_by = VALUES(updated_by), updated_at = CURRENT_TIMESTAMP
        """, (farm_id, device_name, _str(payload, "deviceType", "device_type", default="환기창"), entity_id, _str(payload, "vendorModel", "vendor_model"), _str(payload, "note"), _zone_status_label(payload, "status", "state", default="정상"), actor, actor))
    rows = await list_settings_devices(hass, farm_id)
    return next((row for row in rows if row["entityId"] == entity_id), rows[0] if rows else {"entityId": entity_id})


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


def _manifest_version(path: Path, default: str = "미설치") -> str:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return str(data.get("version") or default)
    except Exception:
        return default


def _ha_version_status(hass) -> str:
    return str(HA_VERSION or "unknown")


def _hacs_version_status(hass) -> str:
    hacs_manifest = Path(hass.config.path("custom_components", "hacs", "manifest.json")) if hasattr(hass, "config") else Path("/config/custom_components/hacs/manifest.json")
    return _manifest_version(hacs_manifest, default="미설치")


def _gs_version_status(hass) -> str:
    gs_manifest = Path(__file__).with_name("manifest.json")
    return _manifest_version(gs_manifest, default="unknown")


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
    center_base_url = os.environ.get("GREENITY_CENTER_BASE_URL") or os.environ.get("GREEN_SMART_CENTER_BASE_URL") or "http://127.0.0.1:18000"
    center_connected = False
    try:
        session = async_get_clientsession(hass)
        async with session.get(f"{center_base_url.rstrip('/')}/health", timeout=ClientTimeout(total=3)) as response:
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
        "centerConnectionStatus": "연결" if center_connected and not center_errors else "미연결",
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
        "hacsVersion": _hacs_version_status(hass),
        "gsVersion": _gs_version_status(hass),
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
    return {"ok": True, "source": "green_smart_settings_db", "greenhouses": greenhouses, "zones": zones, "deviceSensorMappings": mappings, "devices": devices, "deviceGroups": device_groups, "systemIntegration": system_integration}


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
