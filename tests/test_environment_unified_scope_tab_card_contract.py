from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
UI_DOC = ROOT / "docs/design/current-ui-design-and-navigation.md"
MASTER = ROOT / "docs/PROJECT_MASTER_PLAN.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _section(text: str, start: str, end: str) -> str:
    return text.split(start, 1)[1].split(end, 1)[0]


def test_v1105_versions_and_docs_for_env_unified_scope_tab_card():
    panel = _read(PANEL)
    docs = _read(UI_DOC) + "\n" + _read(MASTER)
    assert '"version": "1.10.25"' in _read(MANIFEST)
    assert 'const VERSION = "1.10.25"' in panel
    assert 'v1.10.25' in panel[:200]
    assert "v1.10.9 Environment unified scope/tab card" in docs


def test_environment_page_places_scope_bar_and_tab_bar_in_one_card_like_crop_settings():
    panel = _read(PANEL)
    env_page = _section(panel, '  _renderEnvSettingsPage() {', '  _cloneIrrigationDefaults() {')
    crop_page = _section(panel, '  _renderCropSettingsPage() {', '  _renderSeasonSelector() {')

    assert '<div class="gs-card" data-crop-ui-shell>' in crop_page
    assert '<div class="gs-card" data-env-ui-shell data-env-unified-scope-tab-card>' in env_page

    card_start = env_page.index('<div class="gs-card" data-env-ui-shell data-env-unified-scope-tab-card>')
    scope_call_pos = env_page.index('_renderControlScopeBar("environment")', card_start)
    tab_pos = env_page.index('_renderEnvStrategyTabBar()', card_start)
    content_pos = env_page.index('data-env-strategy-content', card_start)
    assert card_start < scope_call_pos < tab_pos < content_pos

    # Environment should not render the scope bar before/outside the unified card.
    before_card = env_page[:card_start]
    assert '_renderControlScopeBar("environment")' not in before_card


def test_environment_scope_bar_is_not_its_own_gs_card_but_other_control_domains_keep_card():
    panel = _read(PANEL)
    scope = _section(panel, '  _renderControlScopeBar(domain) {', '  _cloneControlState(domain, state) {')
    assert 'data-env-scope-inline' in scope
    assert 'domain === "environment" ? "control-scope-bar" : "gs-card control-scope-bar"' in scope
    assert 'domain === "environment" ? "padding:0;margin-bottom:14px;' in scope
    assert 'data-control-scope-domain="${domain}"' in scope


def test_environment_unified_card_preserves_existing_tab_and_save_contracts():
    panel = _read(PANEL)
    env_page = _section(panel, '  _renderEnvSettingsPage() {', '  _cloneIrrigationDefaults() {')
    for marker in (
        'data-env-legacy-tab="setpoints"',
        'data-env-legacy-tab="rules"',
        'data-env-strategy-tab',
        'data-env-strategy-content',
        'data-env-setvalue-save',
        'id="control-strategy-save"',
    ):
        assert marker in env_page
    assert 'data-env-control-bypass-safety' not in panel
