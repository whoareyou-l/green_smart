from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"


def source() -> str:
    return PANEL.read_text()


def test_v1_15_25_mobile_settings_button_is_also_sidebar_target_for_primary_nav_binding():
    text = source()
    assert 'const REBUILD_VERSION = "1.15.28"' in text
    button_start = text.index('data-r7-mobile-settings-button="true"')
    button = text[button_start:button_start + 700]
    assert 'data-r7-mobile-settings-action="open-settings-domain"' in button
    assert 'data-r7-sidebar-target="settings-admin"' in button
    assert 'data-r7-sidebar-active="${this._activeR7Domain === "settings-admin" ? "true" : "false"}"' in button


def test_v1_15_25_domain_navigation_routes_settings_target_to_cached_settings_entry():
    text = source()
    block = text[text.index('_bindR7DomainNavigation()'):text.index('_bindZoneTabs()', text.index('_bindR7DomainNavigation()'))]
    assert 'const target = link.dataset.r7SidebarTarget;' in block
    assert 'if (target === "settings-admin") this._openR7SettingsDomainFromMobile();' in block
    assert 'else this._activateR7DomainFromNavigation(target);' in block
    assert 'data-r7-domain-navigation-bound' in block


def test_v1_15_25_legacy_mobile_settings_binding_skips_sidebar_target_button_to_avoid_double_click():
    text = source()
    block = text[text.index('this.querySelectorAll(\'[data-r7-mobile-settings-action="open-settings-domain"]\')'):text.index('this.querySelectorAll("[data-r7-sidebar-user-profile-button]"', text.index('this.querySelectorAll(\'[data-r7-mobile-settings-action="open-settings-domain"]\')'))]
    assert 'if (button.getAttribute("data-r7-sidebar-target") === "settings-admin") return;' in block
    assert 'data-r7-mobile-settings-bound' in block
    assert 'this._openR7SettingsDomainFromMobile();' in block
