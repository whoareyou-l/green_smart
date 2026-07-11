from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
PLAN = ROOT / "docs/plans/2026-07-11-mobile-settings-panel-dirty-patch-plan.md"


def source() -> str:
    return PANEL.read_text()


def test_v1_15_19_cached_settings_hydrate_uses_compact_node_not_full_html():
    text = source()
    assert 'const REBUILD_VERSION = "1.15.23"' in text
    block = text[text.index('_hydrateR7CachedSettingsPanel(tabKey)'):text.index('_ensureR7SettingsModalRoot()', text.index('_hydrateR7CachedSettingsPanel(tabKey)'))]
    assert '_buildR7CachedSettingsPanelPatchNode(tabKey)' in block
    assert 'panel.replaceChildren(patchNode);' in block
    assert 'compact-node-dirty-patch' in block
    assert '_renderR7SubtabPanelForDomain("settings-admin", tabKey)' not in block
    assert 'panel.innerHTML = fullHtml;' not in block


def test_v1_15_19_compact_patch_builds_summary_metric_cards_and_actions():
    text = source()
    for marker in [
        '_r7CachedSettingsPanelMetricModel(tabKey)',
        '_buildR7CachedSettingsPanelPatchNode(tabKey)',
        'data-r7-settings-panel-patch-mode',
        'summary-card-dirty-patch',
        'data-r7-settings-panel-full-hydrate',
        'not-used-compact-patch',
        'data-r7-settings-cached-metric-value',
        'data-r7-settings-cached-action',
        'data-r7-open-settings-modal',
    ]:
        assert marker in text


def test_v1_15_19_dirty_patch_updates_cached_metric_values_without_full_render():
    text = source()
    block = text[text.index('_patchR7CachedSettingsPanelMetricValues(tabKey)'):text.index('_patchR7CachedSettingsPanelData(tabKey)', text.index('_patchR7CachedSettingsPanelMetricValues(tabKey)'))]
    assert 'value.textContent = item.value;' in block
    assert 'data-r7-settings-panel-compact-dirty-patch' in block
    assert 'innerHTML' not in block
    assert 'renderR7SettingsAdminSubtabPanel' not in block


def test_v1_15_19_cached_action_buttons_are_bound_to_lazy_modal_or_dirty_patch():
    text = source()
    bind_block = text[text.index('_bindSettingsApprovalActions()'):text.index('this.querySelectorAll("[data-r7-approval-request-button]"', text.index('_bindSettingsApprovalActions()'))]
    for marker in [
        'data-r7-open-settings-modal',
        'data-r7-cached-action-bound',
        '_openSettingsApprovalListModal()',
        '_openSettingsAuditLogModal()',
        '_openSettingsPermissionMatrixModal()',
        '_markR7SettingsPanelDirty("system-integration")',
    ]:
        assert marker in bind_block


def test_v1_15_19_plan_documents_no_full_panel_hydrate():
    plan = PLAN.read_text()
    for marker in ['full hydrate 분해', 'panel.innerHTML = fullHtml', 'summary-card-dirty-patch', 'not-used-compact-patch', 'GitHub Release v1.15.23']:
        assert marker in plan
