from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"


def source() -> str:
    return PANEL.read_text()


def test_v1_15_31_settings_domain_replaces_workspace_not_appends_below_old_page():
    text = source()
    assert 'const REBUILD_VERSION = "1.15.47"' in text
    start = text.index('  _attachR7CachedSettingsDomainShell(workspace)')
    block = text[start:text.index('  _patchR7MobileActiveDomainPage()', start)]
    assert 'workspace.replaceChildren?.(shell);' in block
    assert 'workspace.appendChild(shell);' in block  # fallback only after children removal
    assert 'Array.from(workspace.children || []).forEach((node) => node.remove?.());' in block
    assert 'data-r7-settings-domain-shell-attach-mode", "replace-children-single-settings-shell"' in block
    assert 'workspace.appendChild(shell);\n    shell.hidden = false;' not in block


def test_v1_15_31_settings_panel_removes_full_detail_children_before_cached_panel():
    text = source()
    block = text[text.index('_showR7CachedSettingsPanel(panelSection, tabKey)'):text.index('_r7CachedSettingsPanelMetricModel(tabKey)')]
    assert "if (!node.matches?.('[data-r7-settings-cached-panel]'))" in block
    assert 'node.remove?.();' in block
    assert 'node.style && (node.style.display = "none");' in block
    assert 'panel.style && (panel.style.display = "");' in block
    assert 'data-r7-settings-panel-host-content", "cached-panels-only-no-full-detail-children"' in block


def test_v1_15_31_settings_entry_still_cache_only_and_prewarmed():
    text = source()
    assert 'settings-full-render-fallback' not in text
    assert '_scheduleR7SettingsCachePrewarm("connected-idle")' in text
    assert 'hit-prewarmed' in text
    assert 'settings-shell-cache-show-hide' in text
