from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
UI_DOC = ROOT / "docs/design/current-ui-design-and-navigation.md"
MASTER = ROOT / "docs/PROJECT_MASTER_PLAN.md"
PLAN = ROOT / "docs/design/environment-control-ui-dom-slice-plan.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _section(text: str, start: str, end: str) -> str:
    return text.split(start, 1)[1].split(end, 1)[0]


def test_v1106_versions_and_docs_for_hidden_storage_scope():
    panel = _read(PANEL)
    docs = _read(UI_DOC) + "\n" + _read(MASTER) + "\n" + _read(PLAN)
    assert '"version": "1.10.26"' in _read(MANIFEST)
    assert 'const VERSION = "1.10.26"' in panel
    assert 'v1.10.26' in panel[:200]
    assert "v1.10.9 Environment storage target moved to docs" in docs
    assert "green_smart_zone_control_settings" in docs
    assert "crop_season_id + zone_id + domain" in docs


def test_environment_visible_scope_bar_does_not_render_storage_target_summary():
    panel = _read(PANEL)
    scope = _section(panel, '  _renderControlScopeBar(domain) {', '  _cloneControlState(domain, state) {')
    # Environment must render a hidden doc-only marker instead of the operator-facing storage summary.
    assert 'domain === "environment"' in scope
    assert 'data-env-storage-scope-doc-only' in scope
    assert 'data-control-scope-summary' in scope  # non-environment domains may keep their summary
    assert 'storageSummary' in scope
    assert '? `<span hidden data-env-storage-scope-doc-only' in scope
    assert ': `<div data-control-scope-summary' in scope


def test_environment_keeps_inline_unified_scope_shell_without_storage_summary():
    panel = _read(PANEL)
    env_page = _section(panel, '  _renderEnvSettingsPage() {', '  _cloneIrrigationDefaults() {')
    assert 'data-env-unified-scope-tab-card' in env_page
    assert '_renderControlScopeBar("environment")' in env_page
    assert 'data-env-strategy-content' in env_page
    assert 'green_smart_zone_control_settings' not in env_page
    assert '저장 대상' not in env_page


def test_storage_scope_is_retained_as_hidden_contract_and_api_model_not_removed():
    panel = _read(PANEL)
    # Keep implementation/API storage model; remove only the visible summary string.
    for marker in (
        "green_smart_zone_control_settings",
        "_loadZoneControlSettings",
        "_saveZoneControlSettings",
        "_setScopedControlState",
        "_scopedControlCacheKey",
    ):
        assert marker in panel
    assert 'data-env-storage-scope-doc-only' in panel
