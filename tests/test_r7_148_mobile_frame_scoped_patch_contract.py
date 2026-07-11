from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"


def source() -> str:
    return PANEL.read_text()


def test_v1_15_14_settings_button_uses_workspace_patch_no_full_render_first():
    text = source()
    assert 'const REBUILD_VERSION = "1.15.25"' in text
    block = text[text.index('_openR7SettingsDomainFromMobile()'):text.index('_scheduleR7MobileActiveDomainButtonScroll()', text.index('_openR7SettingsDomainFromMobile()'))]
    assert 'data-r7-mobile-settings-render-mode", "workspace-patch-no-full-render"' in block
    assert 'if (this._patchR7MobileActiveDomainPage()) return;' in block
    assert block.index('if (this._patchR7MobileActiveDomainPage()) return;') < block.index('this.render();')


def test_v1_15_14_subtab_patch_is_frame_scoped_and_rerenders_tabbar_style():
    text = source()
    block = text[text.index('_patchR7MobileSubtabPanel(domain, tabKey)'):text.index('_patchR7MobileActiveDomainPage()', text.index('_patchR7MobileSubtabPanel(domain, tabKey)'))]
    assert 'data-r7-domain-visual-frame-domain="${domain}"' in block
    assert 'data-r7-domain-content-card-section="subtabs"' in block
    assert 'data-r7-domain-content-card-section="panel"' in block
    assert 'subtabSection.innerHTML = this.renderR7DomainSubtabs(domain, this._r7TabsForDomain(domain), tabKey, true);' in block
    assert 'panelSection.innerHTML = this._renderR7MobileLightSubtabPanel(domain, tabKey);' in block
    assert 'data-r7-mobile-frame-scoped-subtab-patch", "true"' in block
    assert 'light-first-paint-then-full-hydrate' in block


def test_v1_15_14_domain_tabs_helper_keeps_settings_labels_for_rerendered_mobile_tabbar():
    text = source()
    assert '_r7TabsForDomain(domain)' in text
    assert '["greenhouse-zones", "온실·구역"]' in text
    assert '["device-sensor-mapping", "장치 연결 작성"]' in text
    assert '["users-permissions", "사용자·권한"]' in text
    assert '["system-integration", "시스템·연동"]' in text
