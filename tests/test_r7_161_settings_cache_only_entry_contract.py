from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"


def source() -> str:
    return PANEL.read_text()


def test_v1_15_27_settings_entry_uses_one_cache_function_for_mobile_pc_and_profile():
    text = source()
    assert 'const REBUILD_VERSION = "1.15.34"' in text
    assert '_openR7SettingsDomainFromCache(source = "settings-navigation")' in text
    assert 'return this._openR7SettingsDomainFromCache("mobile-settings-button");' in text
    assert 'return this._openR7SettingsDomainFromCache("set-active-domain");' in text
    assert 'return this._openR7SettingsDomainFromCache("user-profile-settings");' in text
    assert 'data-r7-settings-domain-entry-source' in text
    assert 'cache-shell-no-render-fallback' in text


def test_v1_15_27_settings_admin_has_no_render_or_innerhtml_fallback_in_patch_path():
    text = source()
    block = text[text.index('_patchR7MobileActiveDomainPage()'):text.index('setR7DomainSubtab', text.index('_patchR7MobileActiveDomainPage()'))]
    assert 'this._activeR7Domain === "settings-admin" && this._attachR7CachedSettingsDomainShell(workspace)' in block
    assert 'attach-failed-no-render-fallback' in block
    assert 'settings-cache-attach-failed' in block
    assert 'settings-full-render-fallback' not in block
    settings_fail_block = block[block.index('} else if (this._activeR7Domain === "settings-admin")'):block.index('} else {', block.index('} else if (this._activeR7Domain === "settings-admin")'))]
    assert 'workspace.innerHTML = this.renderR7ActiveDomainPage();' not in settings_fail_block
    assert 'this.render();' not in settings_fail_block


def test_v1_15_33_non_settings_domains_use_domain_cache_before_fragment_fallback_outside_settings_branch():
    text = source()
    block = text[text.index('_patchR7MobileActiveDomainPage()'):text.index('setR7DomainSubtab', text.index('_patchR7MobileActiveDomainPage()'))]
    assert 'this._attachR7CachedDomainShell(workspace, this._activeR7Domain)' in block
    assert 'data-r7-mobile-domain-render-mode", "domain-shell-cache-show-hide"' in block
    assert 'workspace.replaceChildren?.(document.createRange().createContextualFragment(this.renderR7ActiveDomainPage()))' in block
    assert 'data-r7-mobile-domain-render-mode", "workspace-replace-fragment-fallback"' in block
    assert block.index('} else if (this._activeR7Domain === "settings-admin")') < block.index('workspace.replaceChildren?.(document.createRange().createContextualFragment(this.renderR7ActiveDomainPage()))')
