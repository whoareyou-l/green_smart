from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
PLAN = ROOT / "docs/plans/2026-07-11-mobile-settings-domain-shell-cache-plan.md"


def source() -> str:
    return PANEL.read_text()


def test_v1_15_20_declares_domain_shell_cache_store_and_helpers():
    text = source()
    assert 'const REBUILD_VERSION = "1.15.28"' in text
    for marker in [
        'this._r7DomainShellCache = new Map();',
        'this._r7DomainShellCacheStats = { hits: 0, misses: 0 };',
        '_getOrCreateR7CachedSettingsDomainShell()',
        '_attachR7CachedSettingsDomainShell(workspace)',
        'data-r7-settings-domain-shell-cache", "persistent-dom"',
        'data-r7-settings-domain-shell-cache-hit',
        'data-r7-settings-domain-shell-cache-miss',
    ]:
        assert marker in text


def test_v1_15_20_settings_domain_patch_uses_shell_cache_before_workspace_innerhtml_fallback():
    text = source()
    block = text[text.index('_patchR7MobileActiveDomainPage()'):text.index('setR7DomainSubtab', text.index('_patchR7MobileActiveDomainPage()'))]
    assert 'this._activeR7Domain === "settings-admin" && this._attachR7CachedSettingsDomainShell(workspace)' in block
    assert 'data-r7-mobile-domain-render-mode", "settings-shell-cache-show-hide"' in block
    assert 'workspace.innerHTML = this.renderR7ActiveDomainPage();' in block
    assert block.index('_attachR7CachedSettingsDomainShell(workspace)') < block.index('workspace.innerHTML = this.renderR7ActiveDomainPage();')


def test_v1_15_20_attach_shell_reuses_panel_cache_and_dirty_patch():
    text = source()
    block = text[text.index('_attachR7CachedSettingsDomainShell(workspace)'):text.index('_patchR7MobileActiveDomainPage()', text.index('_attachR7CachedSettingsDomainShell(workspace)'))]
    for marker in [
        'workspace.appendChild(shell)',
        'persistent-dom-show-hide',
        '_showR7CachedSettingsPanel(panelSection, activeTab)',
        '_patchR7CachedSettingsPanelData(activeTab)',
        '_hydrateR7CachedSettingsPanel(activeTab)',
        'settings-shell-cache-show-hide',
    ]:
        assert marker in block


def test_v1_15_20_plan_documents_workspace_innerhtml_replacement_removed_for_settings():
    plan = PLAN.read_text()
    for marker in ['모바일 설정 domain shell cache 계획', 'workspace.innerHTML', 'cached shell attach', 'GitHub Release v1.15.28']:
        assert marker in plan
