"""green_smart integration."""

from __future__ import annotations

import logging

from .const import DOMAIN
from .frontend_panel import async_setup_panel

_LOGGER = logging.getLogger(__name__)

REQUIRED_KEYS = (
    "host",
    "port",
    "unit_id",
    "greenhouse_zones",
    "nutrient_zones",
    "stevenson_screens",
    "weatherflow_prefix",
)

PLATFORMS: list[str] = []


async def async_setup(hass, config):
    """컴포넌트 레벨 설정 — HTTP Views 등록."""
    from .weather_api import WeatherStore
    from .weather_views import (
        WeatherCurrentView, WeatherForecastView,
        WeatherConfigView, WeatherValidateKeyView, WeatherValidateMidKeyView,
        WeatherLocationSearchView, WeatherWeeklyView,
        PesticideSearchView, PesticideKeyConfigView, PesticideMixCheckView,
    )
    from .db import ensure_schema
    from .crop_views import (
        CropSeasonsView, CropSeasonDemolishView, CropSeasonDeleteView,
        CropGrowthListView, CropGrowthDeleteView,
        CropPestListView, CropPestDeleteView,
        CropControlListView, CropControlDeleteView,
    )
    from .central_views import CentralWeatherCurrentView, CentralWeatherForecastView, CentralWeatherMidView, CentralPesticideSearchView
    from .zone_control_views import (
        ZoneControlSettingsView, ZoneControlCopySettingsView, ZoneInterlockSettingsView, ZoneControlModeView,
        ZoneControlFinalTargetsView, ZoneControlLogsView,
        ZoneAiControlOutputsView, ZoneAiControlOutputApplyView, ZoneDeviceEntityMappingsView, ZoneEntityStateSummaryView, ZoneFinalTargetExecutionView,
        EnvironmentControlSettingsView, IrrigationControlSettingsView, DeviceControlSettingsView,
        EnvironmentAiControlOutputsView, IrrigationAiControlOutputsView, DeviceAiControlOutputsView,
        EnvironmentDeviceEntityMappingsView, IrrigationDeviceEntityMappingsView, DeviceEntityMappingsView,
        EnvironmentFinalTargetExecutionView, IrrigationFinalTargetExecutionView, DeviceFinalTargetExecutionView,
    )
    domain_data = hass.data.setdefault(DOMAIN, {})
    await ensure_schema(hass)
    if not domain_data.get("_views_registered"):
        store = WeatherStore(hass)
        domain_data["weather_store"] = store
        hass.http.register_view(WeatherCurrentView(store))
        hass.http.register_view(WeatherForecastView(store))
        hass.http.register_view(WeatherConfigView(store))
        hass.http.register_view(WeatherValidateKeyView(store))
        hass.http.register_view(WeatherValidateMidKeyView(store))
        hass.http.register_view(WeatherLocationSearchView())
        hass.http.register_view(WeatherWeeklyView(store))
        hass.http.register_view(PesticideSearchView(store))
        hass.http.register_view(PesticideKeyConfigView(store))
        hass.http.register_view(PesticideMixCheckView(store))
        hass.http.register_view(CentralWeatherCurrentView())
        hass.http.register_view(CentralWeatherForecastView())
        hass.http.register_view(CentralWeatherMidView())
        hass.http.register_view(CentralPesticideSearchView())
        hass.http.register_view(CropSeasonsView())
        hass.http.register_view(CropSeasonDemolishView())
        hass.http.register_view(CropSeasonDeleteView())
        hass.http.register_view(CropGrowthListView())
        hass.http.register_view(CropGrowthDeleteView())
        hass.http.register_view(CropPestListView())
        hass.http.register_view(CropPestDeleteView())
        hass.http.register_view(CropControlListView())
        hass.http.register_view(CropControlDeleteView())
        hass.http.register_view(ZoneControlSettingsView())
        hass.http.register_view(ZoneInterlockSettingsView())
        hass.http.register_view(ZoneControlModeView())
        hass.http.register_view(ZoneControlCopySettingsView())
        hass.http.register_view(ZoneControlFinalTargetsView())
        hass.http.register_view(ZoneControlLogsView())
        hass.http.register_view(ZoneAiControlOutputsView())
        hass.http.register_view(ZoneAiControlOutputApplyView())
        hass.http.register_view(ZoneDeviceEntityMappingsView())
        hass.http.register_view(ZoneEntityStateSummaryView())
        hass.http.register_view(ZoneFinalTargetExecutionView())
        hass.http.register_view(EnvironmentControlSettingsView())
        hass.http.register_view(IrrigationControlSettingsView())
        hass.http.register_view(DeviceControlSettingsView())
        hass.http.register_view(EnvironmentAiControlOutputsView())
        hass.http.register_view(IrrigationAiControlOutputsView())
        hass.http.register_view(DeviceAiControlOutputsView())
        hass.http.register_view(EnvironmentDeviceEntityMappingsView())
        hass.http.register_view(IrrigationDeviceEntityMappingsView())
        hass.http.register_view(DeviceEntityMappingsView())
        hass.http.register_view(EnvironmentFinalTargetExecutionView())
        hass.http.register_view(IrrigationFinalTargetExecutionView())
        hass.http.register_view(DeviceFinalTargetExecutionView())
        domain_data["_views_registered"] = True
    return True


async def async_setup_entry(hass, entry):
    """Set up green_smart from a config entry."""
    _LOGGER.warning("green_smart async_setup_entry started (entry_id=%s)", entry.entry_id)
    _LOGGER.warning("green_smart async_setup_panel call started")
    await async_setup_panel(hass)
    _LOGGER.warning("green_smart async_setup_panel call finished")

    if entry.data.get("virtual") or entry.data.get("host") == "virtual":
        _LOGGER.warning("green_smart virtual device mode: skipping real coordinator setup")
        _LOGGER.warning("green_smart async_setup_entry completed (virtual)")
        return True

    if not all(entry.data.get(key) for key in REQUIRED_KEYS):
        _LOGGER.warning("green_smart async_setup_entry completed (panel-only, no device config)")
        return True

    hass.data.setdefault(DOMAIN, {})[entry.entry_id] = {"entry": entry}
    if PLATFORMS:
        await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    _LOGGER.warning("green_smart async_setup_entry completed")
    return True


async def async_unload_entry(hass, entry):
    """Unload a green_smart config entry."""
    unload_ok = True
    if PLATFORMS:
        unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unload_ok:
        hass.data.get(DOMAIN, {}).pop(entry.entry_id, None)
        from .db import close_pool
        await close_pool()
    return unload_ok
