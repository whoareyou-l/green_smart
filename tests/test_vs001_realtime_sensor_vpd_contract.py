from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VIEWS = ROOT / "custom_components" / "green_smart" / "zone_control_views.py"
INIT = ROOT / "custom_components" / "green_smart" / "__init__.py"
DB = ROOT / "custom_components" / "green_smart" / "db.py"
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
MASTER = ROOT / "docs" / "master" / "README.md"
INTERFACE = ROOT / "docs" / "master" / "02-interface-spec.md"


def test_vs001_backend_exposes_normalized_current_sensor_endpoint_contract():
    views = VIEWS.read_text(encoding="utf-8")
    init = INIT.read_text(encoding="utf-8")

    for marker in (
        "ZoneCurrentSensorsView",
        'url = "/api/v1/sensors/current"',
        "_current_sensor_response",
        "_calculate_vpd_kpa_soft_for_sensor_summary",
        "temperature_c",
        "relative_humidity_pct",
        "vpd_kpa",
        "co2_ppm",
        "light_umol",
        "quality",
        "source_status",
        "sensor_readings",
        "hass.states.get",
    ):
        assert marker in views

    assert "ZoneCurrentSensorsView" in init
    assert "hass.http.register_view(ZoneCurrentSensorsView())" in init


def test_vs001_db_bootstrap_supports_sensor_quality_metadata_contract():
    db = DB.read_text(encoding="utf-8")

    for marker in (
        "sensor_readings",
        "quality VARCHAR(32) NULL",
        "raw_payload JSON NULL",
        "received_at TIMESTAMP NULL",
        '_ensure_column(cur, "sensor_readings", "quality"',
        '_ensure_column(cur, "sensor_readings", "raw_payload"',
        '_ensure_column(cur, "sensor_readings", "received_at"',
    ):
        assert marker in db


def test_vs001_panel_has_sensor_service_and_dashboard_card_contract():
    panel = PANEL.read_text(encoding="utf-8")

    for marker in (
        "async _fetchCurrentSensorSummary",
        "green_smart/sensors/current",
        "data-vs001-sensor-summary-card",
        "data-vs001-temperature-c",
        "data-vs001-relative-humidity-pct",
        "data-vs001-vpd-kpa",
        "data-vs001-source-status",
        "실시간 온도·습도·VPD",
        "sensorService.getCurrentSensors",
    ):
        assert marker in panel


def test_vs001_master_docs_define_vertical_slice_contract():
    master = MASTER.read_text(encoding="utf-8")
    interface = INTERFACE.read_text(encoding="utf-8")

    assert "VS-001 실시간 온도/습도/VPD 모니터링" in master
    for marker in (
        "temperature_c",
        "relative_humidity_pct",
        "vpd_kpa",
        "GET | `/api/v1/sensors/current?greenhouse_id=&zone_id=`",
    ):
        assert marker in interface
