from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
PLAN = ROOT / "docs/plans/2026-07-11-mobile-settings-persistent-dom-cache-plan.md"


def source() -> str:
    return PANEL.read_text()


def test_v1_15_17_declares_persistent_settings_panel_cache_stores():
    text = source()
    assert 'const REBUILD_VERSION = "1.15.48"' in text
    for marker in [
        'this._r7SettingsPanelCache = new Map();',
        'this._r7SettingsPanelDirty = new Set',
        'this._r7ModalCache = new Map();',
        'this._r7SettingsPanelCacheStats = { hits: 0, misses: 0 };',
    ]:
        assert marker in text


def test_v1_15_17_settings_subtab_uses_cached_dom_show_hide_before_innerhtml_fallback():
    text = source()
    block = text[text.index('_patchR7MobileSubtabPanel(domain, tabKey)'):text.index('_patchR7MobileActiveDomainPage()', text.index('_patchR7MobileSubtabPanel(domain, tabKey)'))]
    settings_branch = block[block.index('if (domain === "settings-admin")'):block.index('panelSection.innerHTML = this._renderR7MobileLightSubtabPanel(domain, tabKey);')]
    assert '_showR7CachedSettingsPanel(panelSection, tabKey)' in settings_branch
    assert 'persistent-dom-cache-show-hide' in settings_branch
    assert 'return true;' in settings_branch
    assert 'panelSection.innerHTML' not in settings_branch


def test_v1_15_17_cache_helpers_hide_show_and_patch_dirty_values():
    text = source()
    for marker in [
        '_getOrCreateR7CachedSettingsPanel(tabKey)',
        'data-r7-settings-cached-panel',
        'data-r7-settings-panel-cache", "persistent-dom"',
        'data-r7-settings-panel-cache-hit',
        'data-r7-settings-panel-cache-miss',
        '_showR7CachedSettingsPanel(panelSection, tabKey)',
        'Array.from(panelSection.children || []).forEach',
        'panel.hidden = false;',
        '_patchR7CachedSettingsPanelData(tabKey)',
        'data-r7-settings-cached-count',
        'this._r7SettingsPanelDirty?.delete?.(tabKey);',
    ]:
        assert marker in text


def test_v1_15_17_settings_entry_attaches_cached_active_panel_after_workspace_patch():
    text = source()
    assert '_attachR7CachedSettingsDomainShell(workspace)' in text
    block = text[text.index('_attachR7CachedSettingsDomainShell(workspace)'):text.index('_patchR7MobileActiveDomainPage()', text.index('_attachR7CachedSettingsDomainShell(workspace)'))]
    assert '_showR7CachedSettingsPanel(panelSection, activeTab)' in block
    assert '_patchR7CachedSettingsPanelData(activeTab)' in block
    assert '_hydrateR7CachedSettingsPanel(activeTab)' in block


def test_v1_15_17_modal_cache_is_lazy_on_open_marker_and_plan_documents_it():
    text = source()
    assert '_getOrCreateR7CachedModal(type)' in text
    assert 'data-r7-settings-modal-cache", "lazy-on-open"' in text
    plan = PLAN.read_text()
    for marker in ['persistent DOM cache', 'show/hide', 'dirty patch', '모달 lazy cache', 'GitHub Release v1.15.48']:
        assert marker in plan
