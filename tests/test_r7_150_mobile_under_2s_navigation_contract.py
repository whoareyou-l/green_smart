from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
PLAN = ROOT / "docs/plans/2026-07-10-mobile-under-2s-navigation-plan.md"


def source() -> str:
    return PANEL.read_text()


def test_v1_15_16_subtab_click_does_not_build_full_panel_before_light_first_paint():
    text = source()
    assert 'const REBUILD_VERSION = "1.15.20"' in text
    block = text[text.index('_patchR7MobileSubtabPanel(domain, tabKey)'):text.index('_patchR7MobileActiveDomainPage()', text.index('_patchR7MobileSubtabPanel(domain, tabKey)'))]
    before_light = block[:block.index('panelSection.innerHTML = this._renderR7MobileLightSubtabPanel(domain, tabKey);')]
    assert '_renderR7SubtabPanelForDomain' not in before_light
    assert 'const panelHtml = this._renderR7SubtabPanelForDomain(domain, tabKey);' not in block
    assert 'data-r7-mobile-subtab-render-mode", "light-first-paint-then-full-hydrate"' in block


def test_v1_15_16_has_under_2s_sla_markers_for_first_paint_and_full_hydrate():
    text = source()
    assert 'data-r7-mobile-subtab-sla="under-2s"' in text
    assert 'data-r7-mobile-first-paint-target-ms="100"' in text
    assert 'data-r7-mobile-full-hydrate-target-ms", "2000"' in text
    assert 'data-r7-mobile-subtab-sla", "under-2s"' in text
    assert 'delayed-full-after-light-first-paint' in text


def test_v1_15_16_settings_data_load_refreshes_active_mobile_panel_without_full_render_when_possible():
    text = source()
    assert '_refreshR7MobileSettingsPanelAfterDataLoad()' in text
    assert 'data-r7-mobile-settings-data-refresh-mode", "active-panel-hydrate-no-full-render"' in text
    assert 'this._scheduleR7MobileFullSubtabHydration("settings-admin", activeTab);' in text
    assert 'if (!this._refreshR7MobileSettingsPanelAfterDataLoad()) this.render();' in text
    assert 'if (this.r7SettingsUsersPermissionsData()?.approvalRequired || !this._refreshR7MobileSettingsPanelAfterDataLoad()) this.render();' in text


def test_v1_15_16_plan_documents_measured_bottleneck_and_2s_target():
    plan = PLAN.read_text()
    for marker in ['2초 이내 체감 전환 계획', 'full panel HTML 생성 금지', '2초 SLA marker', '560KB', '43KB']:
        assert marker in plan
