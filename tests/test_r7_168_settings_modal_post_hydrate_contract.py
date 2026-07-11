from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"


def source() -> str:
    return PANEL.read_text()


def test_v1_15_34_declares_settings_post_modal_refresh_without_full_render():
    text = source()
    assert '"version": "1.15.34"' in MANIFEST.read_text()
    assert 'const REBUILD_VERSION = "1.15.34"' in text
    assert '_refreshR7SettingsSideModalRootWithoutFullRender(reason = "settings-state-change")' in text
    assert '_refreshR7ActiveSettingsPanelWithoutFullRender(reason = "settings-state-change", tabKey = "")' in text
    assert '_renderOrRefreshR7SettingsPanel(reason = "settings-state-change", tabKey = "")' in text
    modal_start = text.index('  _refreshR7SettingsSideModalRootWithoutFullRender')
    modal_block = text[modal_start:text.index('  _refreshR7ActiveSettingsPanelWithoutFullRender', modal_start)]
    for marker in [
        'data-r7-settings-side-modal-root="no-full-render"',
        'this.renderR7SettingsGreenhouseCreateModal(),',
        'this.renderR7SettingsZoneCreateModal(),',
        'this.renderR7SettingsDeviceSensorMappingModal(),',
        'this.renderR7SettingsSystemActionModal(),',
        'data-r7-settings-side-modal-refresh',
    ]:
        assert marker in modal_block
    block = text[text.index('  _refreshR7ActiveSettingsPanelWithoutFullRender'):text.index('  r7SettingsGreenhouseZoneData()', text.index('  _refreshR7ActiveSettingsPanelWithoutFullRender'))]
    for marker in [
        'this._markR7SettingsPanelDirty(activeTab);',
        'this._showR7CachedSettingsPanel(panelSection, activeTab);',
        'this._hydrateR7CachedSettingsPanel(activeTab);',
        'data-r7-settings-panel-post-modal-hydrate", "real-detail-subpage-html"',
        'data-r7-settings-panel-post-modal-refresh',
        'data-r7-settings-panel-summary-patch-replaced", "true"',
        'this._bindR7PatchedInteractiveActions();',
    ]:
        assert marker in block


def test_v1_15_34_settings_modal_state_changes_use_refresh_helper_not_direct_render():
    text = source()
    start = text.index('  async _submitApprovalRequest()')
    end = text.index('  async _loadHomeContext()')
    block = text[start:end]
    assert 'this._renderOrRefreshR7SettingsPanel("settings-modal-state-change");' in block
    assert 'this.render();' not in block
    for marker in [
        '_openSettingsGreenhouseCreateModal()',
        '_openSettingsZoneCreateModal()',
        '_openSettingsDeviceSensorMappingModal()',
        '_openSettingsDeviceCreateModal()',
        '_openSettingsDeviceGroupCreateModal()',
        '_closeSettingsDetailActionModal(kind = "all")',
        '_openSettingsPermissionMatrixModal()',
        '_closeSettingsPermissionMatrixModal()',
        '_openSettingsSystemUpdateModal()',
        '_closeSettingsSystemActionModal()',
    ]:
        assert marker in block


def test_v1_15_34_real_card_hydration_path_remains_summary_patch_free():
    text = source()
    hydrate_start = text.index('  _hydrateR7CachedSettingsPanel(tabKey)')
    hydrate_block = text[hydrate_start:text.index('  _ensureR7SettingsModalRoot()', hydrate_start)]
    assert 'const fullHtml = this._renderR7SubtabPanelForDomain("settings-admin", tabKey);' in hydrate_block
    assert 'panel.replaceChildren(...Array.from(template.content.childNodes));' in hydrate_block
    assert 'real-settings-detail-card' in hydrate_block
    assert '_buildR7CachedSettingsPanelPatchNode(tabKey)' not in hydrate_block
    assert 'summary-card-dirty-patch' not in hydrate_block
