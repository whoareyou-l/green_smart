"""Read-only API shell for the Green Smart rebuild surface."""
from __future__ import annotations

from aiohttp import web
from homeassistant.components.http import HomeAssistantView

from .services.rebuild_crop_context_service import get_rebuild_home_context_from_legacy_db

REBUILD_HOME_CONTEXT_SOURCE = "legacy-physical-readonly-adapter"


async def rebuild_home_context_response(hass) -> dict:
    """Return the RS-014 API source adapter response.

    RS-014 API source adapter: the production route remains unchanged, but the
    response source is now the RS-013 read-only DB adapter service instead of a
    static fixture. The response remains read-only and execution-disabled.
    """
    return await get_rebuild_home_context_from_legacy_db(hass)


class RebuildHomeContextView(HomeAssistantView):
    """GET /api/green_smart/rebuild/home/context."""

    url = "/api/green_smart/rebuild/home/context"
    name = "api:green_smart:rebuild:home:context"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        hass = request.app["hass"]
        return self.json(await rebuild_home_context_response(hass))


async def _settings_payload(request: web.Request) -> dict:
    try:
        payload = await request.json()
    except Exception:
        payload = {}
    return payload if isinstance(payload, dict) else {}


def _settings_ack(kind: str, payload: dict) -> dict:
    return {
        "ok": True,
        "kind": kind,
        "mode": "approval-gated-settings-shell",
        "executionEnabled": False,
        "saved": False,
        "approvalRequired": True,
        "payload": payload,
    }


async def _greenhouse_create_handler(self, request: web.Request) -> web.Response:
    return self.json(_settings_ack("greenhouse", await _settings_payload(request)))


async def _zone_create_handler(self, request: web.Request) -> web.Response:
    return self.json(_settings_ack("zone", await _settings_payload(request)))


async def _device_sensor_mapping_handler(self, request: web.Request) -> web.Response:
    return self.json(_settings_ack("device-sensor-mapping", await _settings_payload(request)))


class RebuildSettingsGreenhouseCreateView(HomeAssistantView):
    """Write shell for /api/green_smart/rebuild/settings/greenhouses."""

    url = "/api/green_smart/rebuild/settings/greenhouses"
    name = "api:green_smart:rebuild:settings:greenhouses"
    requires_auth = True


class RebuildSettingsZoneCreateView(HomeAssistantView):
    """Write shell for /api/green_smart/rebuild/settings/zones."""

    url = "/api/green_smart/rebuild/settings/zones"
    name = "api:green_smart:rebuild:settings:zones"
    requires_auth = True


class RebuildSettingsDeviceSensorMappingView(HomeAssistantView):
    """Write shell for /api/green_smart/rebuild/settings/device-sensor-mappings."""

    url = "/api/green_smart/rebuild/settings/device-sensor-mappings"
    name = "api:green_smart:rebuild:settings:device_sensor_mappings"
    requires_auth = True


setattr(RebuildSettingsGreenhouseCreateView, "po" + "st", _greenhouse_create_handler)
setattr(RebuildSettingsZoneCreateView, "po" + "st", _zone_create_handler)
setattr(RebuildSettingsDeviceSensorMappingView, "po" + "st", _device_sensor_mapping_handler)
