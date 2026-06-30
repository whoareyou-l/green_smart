"""green_smart integration."""

from __future__ import annotations

import logging
from datetime import timedelta

from homeassistant.helpers.event import async_track_time_interval

from .const import DOMAIN
from .frontend_panel import async_setup_panel

_LOGGER = logging.getLogger(__name__)

EDGE_REALTIME_EVALUATION_INTERVAL_SECONDS = 60
CENTER_CROP_INTERLOCK_SNAPSHOT_SYNC_INTERVAL_SECONDS = 300
EDGE_ENVIRONMENT_TELEMETRY_SYNC_INTERVAL_SECONDS = 60
CENTER_CROP_POLICY_PULL_INTERVAL_SECONDS = 300

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


async def _run_crop_policy_notification_scheduler_tick(hass, now) -> None:
    from .crop_views import _run_crop_policy_notification_tick

    await _run_crop_policy_notification_tick(hass, now)


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


async def _setup_crop_policy_notification_scheduler(hass) -> None:
    domain_data = hass.data.setdefault(DOMAIN, {})
    if domain_data.get("unsub_crop_policy_notification"):
        return

    def _tick(now):
        hass.loop.call_soon_threadsafe(hass.async_create_task, _run_crop_policy_notification_scheduler_tick(hass, now))

    domain_data["unsub_crop_policy_notification"] = async_track_time_interval(hass, _tick, timedelta(minutes=5))
    domain_data["crop_policy_notification_scheduler_started"] = True


def _teardown_crop_policy_notification_scheduler(hass) -> None:
    domain_data = hass.data.setdefault(DOMAIN, {})
    unsub = domain_data.pop("unsub_crop_policy_notification", None)
    if unsub:
        unsub()
        domain_data["crop_policy_notification_scheduler_stopped"] = True


async def _run_center_crop_interlock_snapshot_sync_tick(hass, now) -> None:
    from .central_views import sync_crop_interlock_snapshot_for_season
    from .db import fetchall

    domain_data = hass.data.setdefault(DOMAIN, {})
    try:
        seasons = await fetchall(
            hass,
            """
            SELECT id, greenhouse_id AS farm_id, zone_id
            FROM crop_seasons
            WHERE deleted_at IS NULL AND demolish_date IS NULL
            ORDER BY updated_at DESC, id DESC
            LIMIT 20
            """,
        )
    except Exception as exc:  # pragma: no cover - HA runtime scheduler path
        _LOGGER.warning("Center crop interlock snapshot sync season lookup failed: %s", exc)
        return
    ok_count = 0
    fail_count = 0
    for season in seasons:
        try:
            await sync_crop_interlock_snapshot_for_season(
                hass,
                season_id=int(season["id"]),
                farm_id=int(season.get("farm_id") or 1),
                zone_id=int(season["zone_id"]) if season.get("zone_id") else None,
                trigger="scheduled_5m",
            )
            ok_count += 1
        except Exception as exc:  # pragma: no cover - HA runtime scheduler path
            fail_count += 1
            _LOGGER.warning("Center crop interlock snapshot sync failed for season=%s: %s", season.get("id"), exc)
    domain_data["last_center_crop_interlock_snapshot_sync"] = now
    domain_data["last_center_crop_interlock_snapshot_sync_ok_count"] = ok_count
    domain_data["last_center_crop_interlock_snapshot_sync_fail_count"] = fail_count


async def _setup_center_crop_interlock_snapshot_sync_scheduler(hass) -> None:
    domain_data = hass.data.setdefault(DOMAIN, {})
    if domain_data.get("unsub_center_crop_interlock_snapshot_sync"):
        return

    def _tick(now):
        hass.loop.call_soon_threadsafe(hass.async_create_task, _run_center_crop_interlock_snapshot_sync_tick(hass, now))

    domain_data["unsub_center_crop_interlock_snapshot_sync"] = async_track_time_interval(hass, _tick, timedelta(seconds=CENTER_CROP_INTERLOCK_SNAPSHOT_SYNC_INTERVAL_SECONDS))
    domain_data["center_crop_interlock_snapshot_sync_scheduler_started"] = True


def _teardown_center_crop_interlock_snapshot_sync_scheduler(hass) -> None:
    domain_data = hass.data.setdefault(DOMAIN, {})
    unsub = domain_data.pop("unsub_center_crop_interlock_snapshot_sync", None)
    if unsub:
        unsub()
        domain_data["center_crop_interlock_snapshot_sync_scheduler_stopped"] = True


async def _run_edge_environment_telemetry_sync_tick(hass, now) -> None:
    from .central_views import sync_environment_telemetry_snapshot
    from .db import fetchall

    domain_data = hass.data.setdefault(DOMAIN, {})
    try:
        zones = await fetchall(
            hass,
            """
            SELECT DISTINCT COALESCE(zone_id, 1) AS zone_id
            FROM sensor_readings
            WHERE captured_at >= DATE_SUB(NOW(), INTERVAL 10 MINUTE)
            ORDER BY zone_id ASC
            LIMIT 20
            """,
        )
    except Exception as exc:  # pragma: no cover - HA runtime scheduler path
        _LOGGER.warning("Edge environment telemetry zone lookup failed: %s", exc)
        return
    if not zones:
        zones = [{"zone_id": None}]
    ok_count = 0
    fail_count = 0
    for zone in zones:
        try:
            await sync_environment_telemetry_snapshot(
                hass,
                farm_id=1,
                zone_id=int(zone["zone_id"]) if zone.get("zone_id") else None,
                trigger="scheduled_1m",
            )
            ok_count += 1
        except Exception as exc:  # pragma: no cover - HA runtime scheduler path
            fail_count += 1
            _LOGGER.warning("Edge environment telemetry sync failed for zone=%s: %s", zone.get("zone_id"), exc)
    domain_data["last_edge_environment_telemetry_sync"] = now
    domain_data["last_edge_environment_telemetry_sync_ok_count"] = ok_count
    domain_data["last_edge_environment_telemetry_sync_fail_count"] = fail_count


async def _setup_edge_environment_telemetry_sync_scheduler(hass) -> None:
    domain_data = hass.data.setdefault(DOMAIN, {})
    if domain_data.get("unsub_edge_environment_telemetry_sync"):
        return

    def _tick(now):
        hass.loop.call_soon_threadsafe(hass.async_create_task, _run_edge_environment_telemetry_sync_tick(hass, now))

    domain_data["unsub_edge_environment_telemetry_sync"] = async_track_time_interval(hass, _tick, timedelta(seconds=EDGE_ENVIRONMENT_TELEMETRY_SYNC_INTERVAL_SECONDS))
    domain_data["edge_environment_telemetry_sync_scheduler_started"] = True


def _teardown_edge_environment_telemetry_sync_scheduler(hass) -> None:
    domain_data = hass.data.setdefault(DOMAIN, {})
    unsub = domain_data.pop("unsub_edge_environment_telemetry_sync", None)
    if unsub:
        unsub()
        domain_data["edge_environment_telemetry_sync_scheduler_stopped"] = True


async def _run_center_crop_policy_pull_tick(hass, now) -> None:
    from .central_views import pull_and_cache_crop_policy_bundle
    from .db import fetchall

    domain_data = hass.data.setdefault(DOMAIN, {})
    try:
        seasons = await fetchall(
            hass,
            """
            SELECT id, greenhouse_id AS farm_id, zone_id
            FROM crop_seasons
            WHERE deleted_at IS NULL AND demolish_date IS NULL
            ORDER BY updated_at DESC, id DESC
            LIMIT 20
            """,
        )
    except Exception as exc:  # pragma: no cover - HA runtime scheduler path
        _LOGGER.warning("Center crop policy pull season lookup failed: %s", exc)
        return
    ok_count = 0
    fail_count = 0
    for season in seasons:
        try:
            await pull_and_cache_crop_policy_bundle(
                hass,
                season_id=int(season["id"]),
                farm_id=int(season.get("farm_id") or 1),
                zone_id=int(season["zone_id"]) if season.get("zone_id") else None,
                recalculate=True,
            )
            ok_count += 1
        except Exception as exc:  # pragma: no cover - HA runtime scheduler path
            fail_count += 1
            _LOGGER.warning("Center crop policy pull failed for season=%s: %s", season.get("id"), exc)
    domain_data["last_center_crop_policy_pull"] = now
    domain_data["last_center_crop_policy_pull_ok_count"] = ok_count
    domain_data["last_center_crop_policy_pull_fail_count"] = fail_count


async def _setup_center_crop_policy_pull_scheduler(hass) -> None:
    domain_data = hass.data.setdefault(DOMAIN, {})
    if domain_data.get("unsub_center_crop_policy_pull"):
        return

    def _tick(now):
        hass.loop.call_soon_threadsafe(hass.async_create_task, _run_center_crop_policy_pull_tick(hass, now))

    domain_data["unsub_center_crop_policy_pull"] = async_track_time_interval(hass, _tick, timedelta(seconds=CENTER_CROP_POLICY_PULL_INTERVAL_SECONDS))
    domain_data["center_crop_policy_pull_scheduler_started"] = True


def _teardown_center_crop_policy_pull_scheduler(hass) -> None:
    domain_data = hass.data.setdefault(DOMAIN, {})
    unsub = domain_data.pop("unsub_center_crop_policy_pull", None)
    if unsub:
        unsub()
        domain_data["center_crop_policy_pull_scheduler_stopped"] = True


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
        CropGrowthListView, CropGrowthReportView, CropModelFeatureSourcesView, CropModelTrainingSnapshotView, CropModelTrainingReadinessView,
        CropModelTrainingDatasetView, CropModelOperatorWorkflowView,
        CropModelPredictionValidationView, CropModelPredictionValidationRunView,
        CropGrowthReportNotifyView, CropGrowthReportNotificationSettingsView,
        CropPolicyNotificationSettingsView, CropPolicyNotificationDismissView, CropGrowthDeleteView,
        CropStageCalibrationView, CropStageDiagnosisView, CropInterlockApprovalView,
        CropPestListView, CropPestDeleteView,
        CropControlListView, CropControlDeleteView,
    )
    from .central_views import CentralWeatherCurrentView, CentralWeatherForecastView, CentralWeatherMidView, CentralPesticideSearchView, CentralCropInterlockSnapshotSyncView, CentralCropInterlockAnalyticsSummaryView
    from .rebuild_views import RebuildHomeContextView
    from .rebuild_settings_views import RebuildSettingsUsersPermissionsView, RebuildSettingsApprovalRequestView, RebuildSettingsApprovalDecisionView
    from .rebuild_crop_records_views import RebuildCropRecordsHistoryView, RebuildCropRecordsWriteView
    from .rbac import GreenSmartAuthMeView, GreenSmartRoleAssignmentView
    from .zone_control_views import (
        ZoneControlSettingsView, ZoneControlCopySettingsView, ZoneInterlockSettingsView, ZoneControlModeView,
        ZoneControlFinalTargetsView, ZoneControlLogsView,
        ZoneCurrentSensorsView, GreenSmartCurrentSensorsView,
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
        hass.http.register_view(CentralCropInterlockSnapshotSyncView())
        hass.http.register_view(CentralCropInterlockAnalyticsSummaryView())
        hass.http.register_view(RebuildHomeContextView())
        hass.http.register_view(RebuildSettingsUsersPermissionsView())
        hass.http.register_view(RebuildSettingsApprovalRequestView())
        hass.http.register_view(RebuildSettingsApprovalDecisionView())
        hass.http.register_view(RebuildCropRecordsHistoryView())
        hass.http.register_view(RebuildCropRecordsWriteView())
        hass.http.register_view(GreenSmartAuthMeView())
        hass.http.register_view(GreenSmartRoleAssignmentView())
        hass.http.register_view(CropSeasonsView())
        hass.http.register_view(CropSeasonDemolishView())
        hass.http.register_view(CropSeasonDeleteView())
        hass.http.register_view(CropGrowthListView())
        hass.http.register_view(CropGrowthReportView())
        hass.http.register_view(CropModelFeatureSourcesView())
        hass.http.register_view(CropModelTrainingSnapshotView())
        hass.http.register_view(CropModelTrainingDatasetView())
        hass.http.register_view(CropModelOperatorWorkflowView())
        hass.http.register_view(CropModelTrainingReadinessView())
        hass.http.register_view(CropModelPredictionValidationView())
        hass.http.register_view(CropModelPredictionValidationRunView())
        hass.http.register_view(CropGrowthReportNotifyView())
        hass.http.register_view(CropGrowthReportNotificationSettingsView())
        hass.http.register_view(CropPolicyNotificationSettingsView())
        hass.http.register_view(CropPolicyNotificationDismissView())
        hass.http.register_view(CropGrowthDeleteView())
        hass.http.register_view(CropStageCalibrationView())
        hass.http.register_view(CropStageDiagnosisView())
        hass.http.register_view(CropInterlockApprovalView())
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
        hass.http.register_view(ZoneCurrentSensorsView())
        hass.http.register_view(GreenSmartCurrentSensorsView())
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
    await _setup_crop_policy_notification_scheduler(hass)
    await _setup_center_crop_interlock_snapshot_sync_scheduler(hass)
    await _setup_edge_environment_telemetry_sync_scheduler(hass)
    await _setup_center_crop_policy_pull_scheduler(hass)
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
        _teardown_crop_policy_notification_scheduler(hass)
        _teardown_center_crop_interlock_snapshot_sync_scheduler(hass)
        _teardown_edge_environment_telemetry_sync_scheduler(hass)
        _teardown_center_crop_policy_pull_scheduler(hass)
        hass.data.get(DOMAIN, {}).pop(entry.entry_id, None)
        from .db import close_pool
        await close_pool()
    return unload_ok
