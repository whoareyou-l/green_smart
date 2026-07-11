from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"


def source() -> str:
    return PANEL.read_text()


def test_v1_15_15_mobile_subtab_click_first_paints_light_real_panel():
    text = source()
    assert 'const REBUILD_VERSION = "1.15.19"' in text
    assert '_renderR7MobileLightSubtabPanel(domain, tabKey)' in text
    assert 'data-r7-mobile-light-subtab-panel="true"' in text
    assert 'data-r7-mobile-subtab-first-paint="summary"' in text
    assert '즉시 표시' in text
    assert 'panelSection.innerHTML = this._renderR7MobileLightSubtabPanel(domain, tabKey);' in text
    assert 'light-first-paint-then-full-hydrate' in text


def test_v1_15_15_mobile_subtab_full_panel_hydrates_after_first_paint():
    text = source()
    assert '_scheduleR7MobileFullSubtabHydration(domain, tabKey)' in text
    assert 'this._r7MobileSubtabHydrationTimer = setTimeout(() => {' in text
    assert 'const fullHtml = this._renderR7SubtabPanelForDomain(domain, tabKey);' in text
    assert 'panelSection.innerHTML = fullHtml;' in text
    assert 'data-r7-mobile-full-subtab-hydrated", "true"' in text
    assert 'delayed-full-after-light-first-paint' in text


def test_v1_15_15_settings_entry_uses_lightweight_landing_not_full_greenhouse_panel():
    text = source()
    assert 'this._renderR7MobileLightSubtabPanel("settings-admin", "greenhouse-zones")' in text
    fast_block = text[text.index('const panels = this._r7MobileSettingsFastLanding'):text.index(': this.renderR7PanelsForDomain("settings-admin"')]
    assert 'renderR7SettingsGreenhouseZonesSubtab' not in fast_block
    assert 'data-r7-mobile-settings-fast-landing="true"' in fast_block
