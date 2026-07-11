from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
PLAN = ROOT / "docs/plans/2026-07-11-mobile-settings-event-delegation-plan.md"


def source() -> str:
    return PANEL.read_text()


def test_v1_15_21_declares_settings_delegated_event_helpers_and_markers():
    text = source()
    assert 'const REBUILD_VERSION = "1.15.36"' in text
    for marker in [
        '_handleR7SettingsDelegatedClick(event)',
        '_bindR7SettingsDelegatedEvents(root = this)',
        'data-r7-settings-delegated-events-bound',
        'data-r7-settings-event-mode',
        'delegated-single-listener',
        'addEventListener?.("click", (event) => this._handleR7SettingsDelegatedClick(event), { capture: true })',
    ]:
        assert marker in text


def test_v1_15_21_delegated_handler_routes_settings_subtabs_and_cached_actions():
    text = source()
    block = text[text.index('_handleR7SettingsDelegatedClick(event)'):text.index('_bindR7SettingsDelegatedEvents(root = this)', text.index('_handleR7SettingsDelegatedClick(event)'))]
    for marker in [
        'button[data-r7-domain-subtab][data-r7-domain-subtab-for="settings-admin"]',
        'setR7DomainSubtab("settings-admin"',
        '[data-r7-open-settings-modal]',
        '_openSettingsApprovalListModal()',
        '_openSettingsAuditLogModal()',
        '_openSettingsPermissionMatrixModal()',
        '_markR7SettingsPanelDirty("system-integration")',
    ]:
        assert marker in block


def test_v1_15_21_delegated_handler_routes_modal_close_and_selection_buttons():
    text = source()
    block = text[text.index('_handleR7SettingsDelegatedClick(event)'):text.index('_bindR7SettingsDelegatedEvents(root = this)', text.index('_handleR7SettingsDelegatedClick(event)'))]
    for marker in [
        '[data-r7-settings-approval-list-close-button]',
        '[data-r7-settings-audit-log-close-button]',
        '[data-r7-settings-permission-matrix-close-button]',
        '[data-r7-settings-approval-list-item-button]',
        '[data-r7-settings-audit-log-list-item-button]',
        '[data-r7-settings-permission-edit]',
        '[data-r7-settings-role-permission-list-item-button]',
    ]:
        assert marker in block


def test_v1_15_21_shell_and_modal_mount_bind_delegated_events():
    text = source()
    shell_block = text[text.index('_attachR7CachedSettingsDomainShell(workspace)'):text.index('_patchR7MobileActiveDomainPage()', text.index('_attachR7CachedSettingsDomainShell(workspace)'))]
    modal_block = text[text.index('_mountR7CachedSettingsModal(type)'):text.index('_hideR7CachedSettingsModal(type = "all")', text.index('_mountR7CachedSettingsModal(type)'))]
    assert 'this._bindR7SettingsDelegatedEvents(shell);' in shell_block
    assert 'this._bindR7SettingsDelegatedEvents(root);' in modal_block
    assert 'this._bindR7SettingsDelegatedEvents(modal);' in modal_block


def test_v1_15_21_plan_documents_delegation_scope():
    plan = PLAN.read_text()
    for marker in ['event delegation', 'delegated click handler', 'data-r7-settings-delegated-events-bound', 'GitHub Release v1.15.36']:
        assert marker in plan
