from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"


def source() -> str:
    return PANEL.read_text()


def test_v1_15_34_declares_settings_post_modal_refresh_without_full_render():
    text = source()
    assert '"version": "1.15.40"' in MANIFEST.read_text()
    assert 'const REBUILD_VERSION = "1.15.40"' in text
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


def test_v1_15_35_settings_record_modal_x_close_uses_cache_only_refresh_route():
    text = source()
    assert 'const REBUILD_VERSION = "1.15.40"' in text
    assert '_closeR7SettingsRecordModalFromButton(button)' in text
    block = text[text.index('  _closeR7SettingsRecordModalFromButton'):text.index('  _openSettingsGreenhouseInfoSplitModal()', text.index('  _closeR7SettingsRecordModalFromButton'))]
    for marker in [
        '"greenhouse-create": "greenhouse"',
        '"zone-create": "zone"',
        '"device-create": "device"',
        '"device-group-create": "device-group"',
        '"device-sensor-mapping": "mapping"',
        '"system-center-connection": "system-action"',
        'data-r7-settings-record-modal-close-type',
        'this._closeSettingsDetailActionModal(closeKind || "all");',
    ]:
        assert marker in block
    close_block = text[text.index('  _closeSettingsDetailActionModal(kind = "all")'):text.index('  _closeR7SettingsRecordModalFromButton', text.index('  _closeSettingsDetailActionModal(kind = "all")'))]
    assert 'data-r7-settings-modal-close-route' in close_block
    assert 'this._renderOrRefreshR7SettingsPanel("settings-modal-close-cache-only");' in close_block


def test_v1_15_35_both_direct_and_delegated_record_close_bindings_use_settings_cache_close():
    text = source()
    delegated = text[text.index('  _handleR7SettingsDelegatedClick(event)'):text.index('  _bindR7SettingsDelegatedEvents', text.index('  _handleR7SettingsDelegatedClick(event)'))]
    direct = text[text.index('  _bindSettingsApprovalActions()'):text.index('  _bindR7DomainNavigation()', text.index('  _bindSettingsApprovalActions()'))]
    assert "closest('[data-r7-record-modal-close]')" in delegated
    assert 'this._closeR7SettingsRecordModalFromButton(settingsRecordClose)' in delegated
    assert 'this.querySelectorAll("[data-r7-record-modal-close]")' in direct
    assert 'this._closeR7SettingsRecordModalFromButton(button)' in direct
    assert 'event.stopPropagation();' in direct
    record_start = text.index('  _bindR7RecordWorkflowActions()')
    record_block = text[record_start:text.index('  renderR7RecordCommonModalShell', record_start)]
    assert 'button.closest?.(\'[data-r7-record-modal-mode="settings-create"]\')' in record_block
    assert 'this.closeR7RecordWorkflowModal();' in record_block
    assert 'data-r7-record-modal-type=\\"system-center-connection\\"' not in direct
