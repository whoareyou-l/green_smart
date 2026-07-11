from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
PLAN = ROOT / "docs/plans/2026-07-11-mobile-settings-performance-instrumentation-plan.md"


def source() -> str:
    return PANEL.read_text()


def test_v1_15_22_declares_lightweight_perf_helpers_and_state():
    text = source()
    assert 'const REBUILD_VERSION = "1.15.22"' in text
    for marker in [
        'this._r7SettingsPerf = { eventKind: "idle", startedAt: 0 };',
        '_nowR7Perf()',
        '_startR7SettingsPerf(kind = "interaction")',
        '_recordR7SettingsPerf(label, targetMs = 2000)',
        'globalThis.performance?.now',
        'data-r7-perf-settings-event-kind',
        'data-r7-perf-settings-start-ms',
        'data-r7-perf-settings-last-label',
    ]:
        assert marker in text


def test_v1_15_22_records_subtab_panel_dirty_patch_and_complete_slas():
    text = source()
    for marker in [
        '_startR7SettingsPerf("subtab")',
        '_recordR7SettingsPerf("tab-active", 100)',
        '_recordR7SettingsPerf("panel-visible", 150)',
        '_recordR7SettingsPerf("dirty-patch", 500)',
        '_recordR7SettingsPerf("interaction-complete", 2000)',
        'under-${targetMs}ms',
        'over-${targetMs}ms',
    ]:
        assert marker in text


def test_v1_15_22_records_modal_and_shell_visible_slas():
    text = source()
    assert '_recordR7SettingsPerf("modal-open", 500)' in text
    assert '_recordR7SettingsPerf("shell-visible", 150)' in text
    assert '_startR7SettingsPerf(kind || "cached-action")' in text
    for marker in ['approval-list-button', 'audit-log-button', 'permission-matrix-button']:
        assert f'_startR7SettingsPerf("{marker}")' in text


def test_v1_15_22_plan_documents_perf_markers_and_targets():
    plan = PLAN.read_text()
    for marker in [
        '성능 계측 계획',
        '100ms 이내',
        '150ms 이내',
        '500ms 이내',
        '2000ms 이내',
        'data-r7-perf-settings-panel-visible-ms',
        'data-r7-perf-settings-interaction-complete-sla',
    ]:
        assert marker in plan
