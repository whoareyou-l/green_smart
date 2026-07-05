from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VIEWS = ROOT / "custom_components/green_smart/rebuild_settings_write_views.py"
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
INIT = ROOT / "custom_components/green_smart/__init__.py"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_121_settings_snapshot_includes_system_integration_watchdog_payload():
    source = _read(VIEWS)
    for marker in (
        "system_integration_watchdog_response",
        "_ha_version_status",
        "_hacs_version_status",
        "_db_watchdog_status",
        "_api_watchdog_status",
        "SELECT VERSION() AS version",
        "systemIntegration",
        '"dbUse": "MariaDB"',
        '"dbVersion"',
        '"dbStatus"',
        '"centerConnectionStatus"',
        '"centerApiStatus"',
        '"edgeApiStatus"',
    ):
        assert marker in source


def test_r7_121_frontend_reads_system_integration_watchdog_values_from_snapshot():
    source = _read(PANEL)
    for marker in (
        "systemIntegration: response?.systemIntegration",
        "const system = this.r7SettingsGreenhouseZoneData().systemIntegration || {};",
        "system.haVersion",
        "system.hacsVersion",
        "system.gsVersion",
        "system.dbUse",
        "system.dbVersion",
        "system.dbStatus",
        "system.centerConnectionStatus",
        "system.centerApiStatus",
        "system.edgeApiStatus",
    ):
        assert marker in source
    for old_literal in (
        'this._r7SettingsGreenhouseValueRow("HA 버전", "Home Assistant")',
        'this._r7SettingsGreenhouseValueRow("HACS 버전", "HACS")',
        'this._r7SettingsGreenhouseValueRow("DB 상태", "정상")',
        'this._r7SettingsGreenhouseValueRow("Center 연결 상태", "분석/동기화")',
        'this._r7SettingsGreenhouseValueRow("Center API 상태", "센터 API")',
        'this._r7SettingsGreenhouseValueRow("Edge API 상태", "실시간 판단")',
    ):
        assert old_literal not in source


def test_r7_121_system_watchdog_scheduler_is_registered_for_periodic_refresh():
    init_source = _read(INIT)
    for marker in (
        "_run_system_integration_watchdog_tick",
        "_setup_system_integration_watchdog_scheduler",
        "SYSTEM_INTEGRATION_WATCHDOG_INTERVAL_SECONDS",
        "system_integration_watchdog_snapshot",
        "async_track_time_interval",
    ):
        assert marker in init_source
