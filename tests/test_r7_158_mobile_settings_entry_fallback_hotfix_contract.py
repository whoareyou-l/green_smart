from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"


def source() -> str:
    return PANEL.read_text()


def test_v1_15_24_settings_shell_cache_is_built_from_direct_settings_detail_subpage():
    text = source()
    assert 'const REBUILD_VERSION = "1.15.48"' in text
    start = text.index('  _getOrCreateR7CachedSettingsDomainShell()')
    block = text[start:text.index('  _attachR7CachedSettingsDomainShell(workspace)', start)]
    assert 'R7_DETAIL_SUBPAGES.find((item) => item.key === "settings-admin")' in block
    assert 'template.innerHTML = this.renderR7DomainPageShell(subpage, this.renderR7DetailSubpage(subpage));' in block
    assert 'data-r7-settings-domain-shell-source", "direct-settings-detail-subpage"' in block
    assert 'template.innerHTML = this.renderR7ActiveDomainPage();' not in block


def test_v1_15_24_settings_shell_cache_validates_frame_and_panel_before_success():
    text = source()
    start = text.index('  _attachR7CachedSettingsDomainShell(workspace)')
    block = text[start:text.index('  _patchR7MobileActiveDomainPage()', start)]
    assert 'const frame = shell.querySelector?.(\'[data-r7-domain-visual-frame-domain="settings-admin"]\')' in block
    assert 'const panelSection = frame?.querySelector?.(\'[data-r7-domain-content-card-section="panel"]\')' in block
    assert 'if (!frame || !panelSection)' in block
    assert 'this._r7DomainShellCache?.delete?.("domain:settings-admin")' in block
    assert 'data-r7-settings-domain-shell-cache-fallback' in block
    assert 'return false;' in block
    assert block.index('if (!frame || !panelSection)') < block.index('return true;')


def test_v1_15_24_settings_mobile_entry_prefers_fixed_cache_shell_not_fallback():
    text = source()
    block = text[text.index('_patchR7MobileActiveDomainPage()'):text.index('setR7DomainSubtab', text.index('_patchR7MobileActiveDomainPage()'))]
    assert 'const usedSettingsShellCache = this._activeR7Domain === "settings-admin" && this._attachR7CachedSettingsDomainShell(workspace);' in block
    assert 'settings-shell-cache-show-hide' in block
    assert 'settings-full-render-fallback' not in block
    assert 'attach-failed-no-render-fallback' in block
    settings_fail_block = block[block.index('} else if (this._activeR7Domain === "settings-admin")'):block.index('} else {', block.index('} else if (this._activeR7Domain === "settings-admin")'))]
    assert 'workspace.innerHTML = this.renderR7ActiveDomainPage();' not in settings_fail_block
