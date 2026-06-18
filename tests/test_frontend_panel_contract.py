from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FRONTEND_PANEL = ROOT / "custom_components" / "green_smart" / "frontend_panel.py"


def _source() -> str:
    return FRONTEND_PANEL.read_text(encoding="utf-8")


def test_panel_manifest_version_read_runs_in_executor_not_event_loop():
    source = _source()
    setup_section = source.split("async def async_setup_panel", 1)[1].split("async def _register_static_path", 1)[0]

    assert "async_add_executor_job(_get_panel_js_url)" in setup_section
    assert "panel_js_url = _get_panel_js_url()" not in setup_section
    assert "read_text" in source  # sync file read is allowed only inside executor target


def test_crop_basic_tab_uses_zone_id_name_not_legacy_zone_placeholder():
    panel = (ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js").read_text(encoding="utf-8")
    seasons_list = panel.split("_renderCropSeasonsList()", 1)[1].split("_renderCropGrowthTab()", 1)[0]

    assert "_seasonZoneLabel(s)" in seasons_list
    assert 'Zone ${s.zone || "?"}' not in seasons_list
    assert "s.zoneName" in panel
    assert "s.zoneId" in panel


def test_crop_basic_add_popup_renders_configured_zone_groups_with_collapse_and_multi_save():
    panel = (ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js").read_text(encoding="utf-8")
    popup = panel.split("_openCropBasicAddPopup()", 1)[1].split("// ── CSV 내보내기", 1)[0]

    assert "const cfg = this._normalizedForm()" in popup
    assert "cfg.greenhouse_zones" in popup
    assert "data-basic-zone-toggle" in popup
    assert "data-basic-zone-body" in popup
    assert "_basicZoneCollapsed" in panel
    assert "Promise.all" in popup
    assert "selectedZones.map" in popup
    assert "zoneId: zone.id" in popup
