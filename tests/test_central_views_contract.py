from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CENTRAL_VIEWS = ROOT / "custom_components" / "green_smart" / "central_views.py"
INIT = ROOT / "custom_components" / "green_smart" / "__init__.py"
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"


def _source(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_central_views_register_explicit_allowlisted_adapter_routes():
    source = _source(CENTRAL_VIEWS)
    init_source = _source(INIT)

    assert "CentralWeatherCurrentView" in source
    assert "CentralWeatherMidView" in source
    assert "CentralPesticideSearchView" in source
    assert 'url = "/api/green_smart/central/weather/current"' in source
    assert 'url = "/api/green_smart/central/weather/mid"' in source
    assert 'url = "/api/green_smart/central/pesticide/search"' in source
    assert "ensure_access_token" in source
    assert "get_weather" in source
    assert "get_pesticide_data" in source
    assert "central/proxy" not in source
    assert "CentralWeatherCurrentView" in init_source
    assert "CentralWeatherMidView" in init_source
    assert "CentralPesticideSearchView" in init_source


def test_panel_uses_explicit_central_routes_and_keeps_crop_pest_data_separate():
    source = _source(PANEL)

    assert "green_smart/central/weather/current" in source
    assert "green_smart/central/weather/mid" in source
    assert "green_smart/central/pesticide/search" in source
    assert "centralMidWeather" in source
    assert "_weatherMidData" in source
    assert "weather_mid_land_reg_id" in source
    assert "weather_mid_ta_reg_id" in source
    assert 'id="weather_mid_land_reg_id"' in source
    assert 'id="weather_mid_ta_reg_id"' in source
    assert 'land_reg_id: cfg.weather_mid_land_reg_id' in source
    assert 'ta_reg_id: cfg.weather_mid_ta_reg_id' in source
    assert "green_smart/central/proxy" not in source
    assert "_pesticideSearchData" in source
    assert "this._pestData = pest" not in source
    assert "_renderPesticideCard" in source


def test_panel_weather_card_keeps_four_summary_metrics_and_marks_api_weather_info_realtime():
    source = _source(PANEL)

    assert '<div class="tw-label">외기온도</div>' in source
    assert '<div class="tw-label">외기습도</div>' in source
    assert '<div class="tw-label">풍속</div>' in source
    assert '<div class="tw-label">날씨 상태</div>' in source
    assert "data-weather-summary" in source
    assert "data-weather-info" in source
    assert "날씨 정보" in source
    assert "data-mid-weather-mode" in source
    assert "예보 실시간" in source
    assert "data.mode === \"real\"" in source
