"""Sidebar panel registration for green_smart."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

_PANEL_URL_PATH = "green_smart"
_PANEL_COMPONENT = "green-smart-rebuild-panel"
_PANEL_TITLE = "Green Smart"
_PANEL_ICON = "mdi:greenhouse"
_PANEL_STATIC_DIR = Path(__file__).parent / "panel"

def _get_panel_js_url() -> str:
    """Return main rebuild JS URL with version query string for cache busting."""
    try:
        manifest = json.loads((Path(__file__).parent / "manifest.json").read_text())
        version = manifest.get("version", "0")
    except Exception:
        version = "0"
    return f"/green_smart_panel/rebuild/green-smart-rebuild-panel.js?v={version}"


async def async_setup_panel(hass: HomeAssistant) -> None:
    """Register sidebar panel and static path (idempotent)."""
    _LOGGER.warning("green_smart panel setup started")
    domain_data = hass.data.setdefault(DOMAIN, {})
    _register_ws_commands(hass, domain_data)
    if domain_data.get("_panel_registered"):
        return
    domain_data["_panel_registered"] = True
    await _register_static_path(hass)
    # URL을 setup 시마다 새로 계산 — Python 모듈 캐시 문제 방지.
    # manifest.json sync read는 executor에서 실행해 HA event loop blocking 경고를 피한다.
    panel_js_url = await hass.async_add_executor_job(_get_panel_js_url)
    await _register_panel(hass, panel_js_url)


async def _register_static_path(hass: HomeAssistant) -> None:
    static_url = "/green_smart_panel"
    static_path = str(_PANEL_STATIC_DIR)
    try:
        from homeassistant.components.http import StaticPathConfig
        await hass.http.async_register_static_paths(
            [StaticPathConfig(static_url, static_path, cache_headers=False)]
        )
        return
    except (ImportError, AttributeError):
        pass
    try:
        hass.http.register_static_path(static_url, static_path, False)
    except Exception as exc:
        _LOGGER.warning("Could not register static path: %s", exc)


async def _register_panel(hass: HomeAssistant, module_url: str) -> None:
    try:
        from homeassistant.components.panel_custom import async_register_panel
        await async_register_panel(
            hass,
            webcomponent_name=_PANEL_COMPONENT,
            frontend_url_path=_PANEL_URL_PATH,
            sidebar_title=_PANEL_TITLE,
            sidebar_icon=_PANEL_ICON,
            module_url=module_url,
            require_admin=False,
        )
        _LOGGER.warning(
            "green_smart main rebuild panel registered successfully at url_path=%s", _PANEL_URL_PATH
        )
    except Exception:
        _LOGGER.exception("green_smart main rebuild panel registration FAILED")



def _register_ws_commands(hass: HomeAssistant, domain_data: dict[str, Any]) -> None:
    """Register websocket commands once."""
    if domain_data.get("_ws_registered"):
        return
    websocket_api.async_register_command(hass, ws_is_configured)
    websocket_api.async_register_command(hass, ws_get_config)
    websocket_api.async_register_command(hass, ws_save_config)
    domain_data["_ws_registered"] = True


def _get_entry(hass: HomeAssistant):
    entries = hass.config_entries.async_entries(DOMAIN)
    return entries[0] if entries else None


@websocket_api.websocket_command({vol.Required("type"): "green_smart/is_configured"})
@websocket_api.async_response
async def ws_is_configured(hass: HomeAssistant, connection, msg) -> None:
    """Return whether the Green Smart entry has real wizard configuration."""
    entry = _get_entry(hass)
    connection.send_result(
        msg["id"],
        {
            "configured": bool(entry and entry.data.get("host")),
            "entry_id": entry.entry_id if entry else None,
            "state": getattr(entry, "state", None) if entry else None,
        },
    )


@websocket_api.websocket_command({vol.Required("type"): "green_smart/get_config"})
@websocket_api.async_response
async def ws_get_config(hass: HomeAssistant, connection, msg) -> None:
    """Return saved Green Smart configuration."""
    entry = _get_entry(hass)
    if entry is None:
        connection.send_error(msg["id"], "not_found", "green_smart not configured")
        return
    connection.send_result(
        msg["id"],
        {
            "entry_id": entry.entry_id,
            "state": getattr(entry, "state", None),
            "data": dict(entry.data),
        },
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): "green_smart/save_config",
        vol.Required("host"): str,
        vol.Required("port"): int,
        vol.Required("unit_id"): int,
        vol.Required("greenhouse_zones"): int,
        vol.Required("nutrient_zones"): int,
        vol.Required("stevenson_screens"): int,
        vol.Required("weatherflow_prefix"): str,
        vol.Optional("virtual", default=False): bool,
        vol.Optional("greenhouse_address", default=""): str,
        vol.Optional("location_name", default=""): str,
        vol.Optional("nx", default=60): int,
        vol.Optional("ny", default=127): int,
        vol.Optional("land_regid", default="11H10000"): str,
        vol.Optional("ta_regid", default="11H10701"): str,
        vol.Optional("weather_mid_land_reg_id", default="11H10000"): str,
        vol.Optional("weather_mid_ta_reg_id", default="11H10701"): str,
        vol.Optional("central_base_url", default="http://127.0.0.1:18000"): str,
        vol.Optional("central_installation_id", default=""): str,
    }
)
@websocket_api.async_response
async def ws_save_config(hass: HomeAssistant, connection, msg) -> None:
    """Save wizard configuration into the existing Green Smart entry."""
    entry = _get_entry(hass)
    if entry is None:
        connection.send_error(msg["id"], "not_found", "green_smart not configured")
        return
    new_data = {
        "host": msg["host"],
        "port": msg["port"],
        "unit_id": msg["unit_id"],
        "greenhouse_zones": msg["greenhouse_zones"],
        "nutrient_zones": msg["nutrient_zones"],
        "stevenson_screens": msg["stevenson_screens"],
        "weatherflow_prefix": msg["weatherflow_prefix"],
        "virtual": msg["virtual"],
        "greenhouse_address": msg.get("greenhouse_address", ""),
        "location_name": msg.get("location_name", ""),
        "nx": msg.get("nx", 60),
        "ny": msg.get("ny", 127),
        "land_regid": msg.get("land_regid", "11H10000"),
        "ta_regid": msg.get("ta_regid", "11H10701"),
        "weather_mid_land_reg_id": msg.get("weather_mid_land_reg_id", msg.get("land_regid", "11H10000")),
        "weather_mid_ta_reg_id": msg.get("weather_mid_ta_reg_id", msg.get("ta_regid", "11H10701")),
        "central_base_url": msg.get("central_base_url", "http://127.0.0.1:18000"),
        "central_installation_id": msg.get("central_installation_id", ""),
    }
    hass.config_entries.async_update_entry(entry, data=new_data)
    connection.send_result(msg["id"], {"success": True})
