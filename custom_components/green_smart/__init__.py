"""green_smart integration."""

from __future__ import annotations

import logging
from datetime import timedelta

from homeassistant.helpers.event import async_track_time_interval

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

PLATFORMS: list[str] = ["sensor", "binary_sensor", "switch", "cover"]


async def _run_safety_guard_watchdog_tick(hass, now) -> None:
    from .zone_control_views import _safety_guard_watchdog_response

    domain_data = hass.data.setdefault(DOMAIN, {})
    scopes = list(domain_data.get("safety_guard_watchdog_scopes") or [])
    for scope in scopes:
        try:
            await _safety_guard_watchdog_response(hass, farm_id=int(scope.get("farm_id", 1)), crop_season_id=int(scope["crop_season_id"]), zone_id=int(scope["zone_id"]), domain=scope["domain"], notify=True)
        except Exception as exc:  # pragma: no cover - HA runtime scheduler path
            _LOGGER.warning("SafetyGuard watchdog scheduler tick failed: %s", exc)
    domain_data["last_safety_guard_watchdog_tick"] = now


async def _setup_safety_guard_watchdog_scheduler(hass) -> None:
    from .zone_control_views import SAFETY_GUARD_WATCHDOG_INTERVAL_SECONDS

    domain_data = hass.data.setdefault(DOMAIN, {})
    if domain_data.get("unsub_safety_guard_watchdog"):
        return

    def _tick(now):
        hass.loop.call_soon_threadsafe(hass.async_create_task, _run_safety_guard_watchdog_tick(hass, now))

    domain_data["unsub_safety_guard_watchdog"] = async_track_time_interval(hass, _tick, timedelta(seconds=SAFETY_GUARD_WATCHDOG_INTERVAL_SECONDS))
    domain_data["safety_guard_watchdog_scheduler_started"] = True


def _teardown_safety_guard_watchdog_scheduler(hass) -> None:
    domain_data = hass.data.setdefault(DOMAIN, {})
    unsub = domain_data.pop("unsub_safety_guard_watchdog", None)
    if unsub:
        unsub()
        domain_data["safety_guard_watchdog_scheduler_stopped"] = True


async def _run_growth_report_notification_scheduler_tick(hass, now) -> None:
    from .crop_views import _run_growth_report_notification_tick

    await _run_growth_report_notification_tick(hass, now)


async def _setup_growth_report_notification_scheduler(hass) -> None:
    domain_data = hass.data.setdefault(DOMAIN, {})
    if domain_data.get("unsub_growth_report_notification"):
        return

    def _tick(now):
        hass.loop.call_soon_threadsafe(hass.async_create_task, _run_growth_report_notification_scheduler_tick(hass, now))

    domain_data["unsub_growth_report_notification"] = async_track_time_interval(hass, _tick, timedelta(hours=1))
    domain_data["growth_report_notification_scheduler_started"] = True


def _teardown_growth_report_notification_scheduler(hass) -> None:
    domain_data = hass.data.setdefault(DOMAIN, {})
    unsub = domain_data.pop("unsub_growth_report_notification", None)
    if unsub:
        unsub()
        domain_data["growth_report_notification_scheduler_stopped"] = True


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
        CropGrowthListView, CropGrowthReportView, CropGrowthReportNotifyView, CropGrowthReportNotificationSettingsView, CropGrowthDeleteView,
        CropStageCalibrationView,
        CropPestListView, CropPestDeleteView,
        CropControlListView, CropControlDeleteView,
    )
    from .central_views import CentralWeatherCurrentView, CentralWeatherForecastView, CentralWeatherMidView, CentralPesticideSearchView
    from .rbac import GreenSmartAuthMeView
    from .zone_control_views import (
        ZoneControlSettingsView, ZoneControlCopySettingsView, ZoneInterlockSettingsView, ZoneControlModeView,
        ZoneControlFinalTargetsView, ZoneControlLogsView,
        ZoneAiControlOutputsView, ZoneAiControlOutputApplyView, ZoneDeviceEntityMappingsView, ZoneEntityMappingValidationView, ZoneRehearsalReadinessView, ZoneVirtualRehearsalView, ZoneEntityStateSummaryView, ZoneFinalTargetExecutionView, ZoneSafetyGuardWatchdogView, ZoneSafetyGuardEventsView, ZoneSafetyGuardEventAckView, ZoneSafetyGuardEventClearView, ZoneEnvironmentStrategyPreviewView, ZoneIrrigationStrategyPreviewView, ZoneLimitedAutoPolicyView, ZoneAlertResumeView,
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
        hass.http.register_view(GreenSmartAuthMeView())
        hass.http.register_view(CropSeasonsView())
        hass.http.register_view(CropSeasonDemolishView())
        hass.http.register_view(CropSeasonDeleteView())
        hass.http.register_view(CropGrowthListView())
        hass.http.register_view(CropGrowthReportView())
        hass.http.register_view(CropGrowthReportNotifyView())
        hass.http.register_view(CropGrowthReportNotificationSettingsView())
        hass.http.register_view(CropGrowthDeleteView())
        hass.http.register_view(CropStageCalibrationView())
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
        hass.http.register_view(ZoneEntityMappingValidationView())
        hass.http.register_view(ZoneRehearsalReadinessView())
        hass.http.register_view(ZoneVirtualRehearsalView())
        hass.http.register_view(ZoneEntityStateSummaryView())
        hass.http.register_view(ZoneFinalTargetExecutionView())
        hass.http.register_view(ZoneSafetyGuardWatchdogView())
        hass.http.register_view(ZoneSafetyGuardEventsView())
        hass.http.register_view(ZoneSafetyGuardEventAckView())
        hass.http.register_view(ZoneSafetyGuardEventClearView())
        hass.http.register_view(ZoneEnvironmentStrategyPreviewView())
        hass.http.register_view(ZoneIrrigationStrategyPreviewView())
        hass.http.register_view(ZoneLimitedAutoPolicyView())
        hass.http.register_view(ZoneAlertResumeView())
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
    await _setup_safety_guard_watchdog_scheduler(hass)
    await _setup_growth_report_notification_scheduler(hass)
    return True


async def async_setup_entry(hass, entry):
    """Set up green_smart from a config entry."""
    _LOGGER.warning("green_smart async_setup_entry started (entry_id=%s)", entry.entry_id)
    _LOGGER.warning("green_smart async_setup_panel call started")
    await async_setup_panel(hass)
    _LOGGER.warning("green_smart async_setup_panel call finished")

    if entry.data.get("virtual") or entry.data.get("host") == "virtual":
        _LOGGER.warning("green_smart virtual device mode: forwarding virtual entity platforms")
        hass.data.setdefault(DOMAIN, {})[entry.entry_id] = {"entry": entry, "virtual": True}
        await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
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
        _teardown_safety_guard_watchdog_scheduler(hass)
        _teardown_growth_report_notification_scheduler(hass)
        hass.data.get(DOMAIN, {}).pop(entry.entry_id, None)
        from .db import close_pool
        await close_pool()
    return unload_ok
