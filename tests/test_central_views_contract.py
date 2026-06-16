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


def test_panel_weather_card_keeps_summary_only_and_modal_uses_realtime_central_weather():
    source = _source(PANEL)

    assert '<div class="tw-label">외기온도</div>' in source
    assert '<div class="tw-label">외기습도</div>' in source
    assert '<div class="tw-label">풍속</div>' in source
    assert '<div class="tw-label">날씨 상태</div>' in source
    assert "data-weather-summary" in source
    assert "${this._renderMidWeatherRows" not in source
    assert "data-mid-weather-mode" not in source
    assert "예보 실시간" not in source
    assert 'green_smart/central/weather/current' in source
    assert "centralModalWeather" in source
    assert "cur.mode === \"real\"" in source
    assert "wm-hero-badge" in source


def test_panel_weather_modal_limits_daily_forecast_through_d7_and_never_shows_blank_status():
    source = _source(PANEL)

    assert "items = items.slice(0, 8)" in source
    assert "_resolvedWeatherStatus" in source
    assert "강수량 우선" in source
    assert "humidity >= 85" in source
    assert "humidity <= 60" in source
    assert "return \"구름많음\"" in source
    assert "this._resolvedWeatherStatus(data)" in source
    assert "this._resolvedWeatherStatus(cur)" in source
    assert 'return sky === "--" ? "—" : sky' not in source


def test_panel_weather_modal_merges_realtime_central_mid_forecast_through_d7():
    source = _source(PANEL)

    assert 'green_smart/central/weather/mid' in source
    assert "centralModalMidWeather" in source
    assert "_dailyItemsFromForecasts" in source
    assert "items = this._mergeDailyItems(this._dailyItemsFromForecasts(forecasts), weeklyItems)" in source
    assert "items = this._mergeCentralMidDaily(items, centralMid)" in source
    assert "items = items.slice(0, 8)" in source
    assert "day_dt.setDate(today.getDate() + Number(d.day))" in source
    assert "pm_weather || d.am_weather" in source
    assert 'const rainKey = "am_" + "rain_" + "probability"' in source
    assert "Math.max(Number(d[rainKey]" in source


def test_panel_auto_matches_greenhouse_address_to_kma_location_codes_and_uses_them_for_weather():
    source = _source(PANEL)
    frontend_source = _source(ROOT / "custom_components" / "green_smart" / "frontend_panel.py")

    assert "greenhouse_address" in source
    assert 'id="greenhouse_address"' in source
    assert "_matchGreenhouseAddress" in source
    assert 'green_smart/weather/search-location' in source
    assert "location_match_status" in source
    assert "weather_location_match" in source
    assert "nx: Number(cfg.nx || 60)" in source
    assert "ny: Number(cfg.ny || 127)" in source
    assert "weather_mid_land_reg_id: (f.weather_mid_land_reg_id || f.land_regid" in source
    assert "weather_mid_ta_reg_id: (f.weather_mid_ta_reg_id || f.ta_regid" in source
    assert "land_regid: (f.weather_mid_land_reg_id || f.land_regid" in source
    assert "ta_regid: (f.weather_mid_ta_reg_id || f.ta_regid" in source
    assert "온실 주소" in source
    assert "nx ${nx} · ny ${ny}" in source
    assert "중기예보 ${this._esc(landReg)} / ${this._esc(taReg)}" in source

    for field in [
        "greenhouse_address", "location_name", "nx", "ny", "ta_regid", "land_regid",
        "weather_mid_land_reg_id", "weather_mid_ta_reg_id",
        "central_base_url", "central_installation_id",
    ]:
        assert field in frontend_source


def test_save_config_websocket_allows_panel_normalized_central_fields():
    frontend_source = _source(ROOT / "custom_components" / "green_smart" / "frontend_panel.py")

    assert 'vol.Optional("central_base_url"' in frontend_source
    assert 'vol.Optional("central_installation_id"' in frontend_source
    assert '"central_base_url": msg.get("central_base_url"' in frontend_source
    assert '"central_installation_id": msg.get("central_installation_id"' in frontend_source
