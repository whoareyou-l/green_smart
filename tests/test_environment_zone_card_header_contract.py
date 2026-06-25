from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
UI_DOC = ROOT / "docs/design/current-ui-design-and-navigation.md"
MASTER = ROOT / "docs/PROJECT_MASTER_PLAN.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_v1102_zone_card_header_versions_and_docs():
    panel = _read(PANEL)
    docs = _read(UI_DOC) + "\n" + _read(MASTER)
    assert '"version": "1.10.15"' in _read(MANIFEST)
    assert 'const VERSION = "1.10.15"' in panel
    assert 'v1.10.15' in panel[:200]
    assert "v1.10.9 Environment zone card header cleanup" in docs


def test_environment_scope_bar_removes_duplicate_top_zone_title():
    panel = _read(PANEL)
    scope_bar = panel.split('_renderControlScopeBar(domain) {', 1)[1].split('  _cloneControlState', 1)[0]
    assert 'data-control-scope-header' in scope_bar
    assert 'data-control-scope-title' in scope_bar
    assert '${domain === "environment" ? "" : scopeTitle}' in scope_bar
    assert 'data-control-scope-title style="display:${domain === "environment" ? "none" : "block"};' in scope_bar
    assert 'const scopeTitle = "구역 선택";' in scope_bar


def test_green_subtitle_is_the_only_visible_environment_zone_text():
    panel = _read(PANEL)
    helper = panel.split('  _renderEnvironmentZoneSeasonCards(domain) {', 1)[1].split('  _selectControlZoneSeasonFromCard', 1)[0]
    assert '>구역 선택</div>' in helper
    assert 'data-env-zone-season-selector-title' in helper
    scope_bar = panel.split('_renderControlScopeBar(domain) {', 1)[1].split('  _cloneControlState', 1)[0]
    assert '작기 선택 카드와 동일한 UI로 구역을 선택합니다' not in scope_bar


def test_preset_button_is_compact_and_aligned_with_green_subtitle():
    panel = _read(PANEL)
    helper = panel.split('  _renderEnvironmentZoneSeasonCards(domain) {', 1)[1].split('  _selectControlZoneSeasonFromCard', 1)[0]
    binder = panel.split('  _bindControlScopeInputs(root) {', 1)[1].split('  // ── Dashboard event binding', 1)[0]
    assert 'data-env-zone-season-selector-header' in helper
    assert 'data-control-preset-open' in helper
    assert 'data-control-preset-compact' in helper
    assert 'font-size:11px' in helper
    assert 'padding:6px 10px' in helper
    assert 'border-radius:999px' in helper
    assert 'justify-content:space-between' in helper
    assert 'bar.querySelectorAll("[data-control-preset-open]")' in binder


def test_zone_card_body_still_matches_crop_season_three_line_grammar():
    panel = _read(PANEL)
    helper = panel.split('  _renderEnvironmentZoneSeasonCards(domain) {', 1)[1].split('  _selectControlZoneSeasonFromCard', 1)[0]
    for marker in (
        'data-env-zone-season-primary-line',
        'data-env-zone-season-secondary-line',
        'data-env-zone-season-status-line',
        'border-radius:12px;padding:10px 14px;cursor:pointer;min-width:148px;',
    ):
        assert marker in helper
    for forbidden in (
        '구역별 현재 작기 선택',
        '현재 작기:',
        'data-env-zone-season-save-summary',
        'data-env-season-zone-card',
    ):
        assert forbidden not in panel
