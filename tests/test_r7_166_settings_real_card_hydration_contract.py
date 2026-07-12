from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"


def source() -> str:
    return PANEL.read_text()


def test_v1_15_32_settings_hydrate_uses_real_detail_subpage_not_summary_patch():
    text = source()
    assert 'const REBUILD_VERSION = "1.15.50"' in text
    start = text.index('  _hydrateR7CachedSettingsPanel(tabKey)')
    block = text[start:text.index('  _ensureR7SettingsModalRoot()', start)]
    assert 'const fullHtml = this._renderR7SubtabPanelForDomain("settings-admin", tabKey);' in block
    assert 'template.innerHTML = fullHtml;' in block
    assert 'panel.replaceChildren(...Array.from(template.content.childNodes));' in block
    assert 'real-settings-detail-card' in block
    assert 'real-detail-subpage-html' in block
    assert 'data-r7-settings-panel-summary-patch-replaced' in block
    assert '_buildR7CachedSettingsPanelPatchNode(tabKey)' not in block
    assert '_patchR7CachedSettingsPanelMetricValues(tabKey)' not in block
    assert 'compact-node-dirty-patch' not in block


def test_v1_15_32_summary_patch_builder_remains_unused_by_hydration_path():
    text = source()
    hydrate_start = text.index('  _hydrateR7CachedSettingsPanel(tabKey)')
    hydrate_block = text[hydrate_start:text.index('  _ensureR7SettingsModalRoot()', hydrate_start)]
    assert '캐시 패치' in text
    assert 'summary-card-dirty-patch' in text
    assert '캐시 패치' not in hydrate_block
    assert 'summary-card-dirty-patch' not in hydrate_block


def test_v1_15_32_real_settings_cards_markers_are_available_after_hydrate():
    text = source()
    assert 'data-r7-settings-admin-detail-absorbed="true"' in text
    assert 'data-r7-settings-admin-subtab="${tabKey}"' in text
    assert 'renderR7SettingsDeviceSensorMappingSubtab(zones)' in text
    assert 'data-r7-settings-admin-detail-absorbed="true"' in text
    assert 'data-r7-settings-admin-subtab="${tabKey}"' in text
