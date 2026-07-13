from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"


def source() -> str:
    return PANEL.read_text()


def test_v1_15_28_mobile_settings_is_anchor_hash_fallback_not_button_only():
    text = source()
    assert 'const REBUILD_VERSION = "1.15.59"' in text
    assert '<a href="#settings-admin" role="button" data-r7-mobile-settings-button="true"' in text
    assert 'data-r7-mobile-route-mode="dedicated-internal-anchor-hash-cache"' in text
    assert 'data-r7-sidebar-target="settings-admin"' in text
    assert 'dedicated-internal-button-no-hash' not in text


def test_v1_15_28_hashchange_routes_settings_to_cache_only_path():
    text = source()
    assert 'this._r7SettingsHashRouteHandler = () => this._handleR7SettingsHashRoute("hashchange");' in text
    assert 'globalThis.window?.addEventListener?.("hashchange", this._r7SettingsHashRouteHandler);' in text
    assert 'globalThis.window?.removeEventListener?.("hashchange", this._r7SettingsHashRouteHandler);' in text
    assert 'this._handleR7SettingsHashRoute("connected");' in text
    block = text[text.index('_handleR7SettingsHashRoute(source = "hashchange")'):text.index('_openR7SettingsDomainFromCache(source = "settings-navigation")')]
    assert 'globalThis.window?.location?.hash' in block
    assert 'hash !== "settings-admin"' in block
    assert 'data-r7-settings-hash-route' in block
    assert 'return this._openR7SettingsDomainFromCache(`hash-${source}`);' in block


def test_v1_15_28_hash_route_still_has_no_settings_render_fallback():
    text = source()
    assert 'settings-full-render-fallback' not in text
    assert 'workspace.innerHTML = this.renderR7ActiveDomainPage();' in text
    patch_block = text[text.index('_patchR7MobileActiveDomainPage()'):text.index('setR7DomainSubtab', text.index('_patchR7MobileActiveDomainPage()'))]
    settings_fail_block = patch_block[patch_block.index('} else if (this._activeR7Domain === "settings-admin")'):patch_block.index('} else {', patch_block.index('} else if (this._activeR7Domain === "settings-admin")'))]
    assert 'workspace.innerHTML = this.renderR7ActiveDomainPage();' not in settings_fail_block
