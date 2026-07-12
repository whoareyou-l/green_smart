from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
UI_DOC = ROOT / "docs/design/current-ui-design-and-navigation.md"
MASTER = ROOT / "docs/PROJECT_MASTER_PLAN.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_v1101_zone_selection_card_versions_and_docs():
    panel = _read(PANEL)
    docs = _read(UI_DOC) + "\n" + _read(MASTER)
    assert '"version": "1.15.48"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.48"' in panel
    assert 'v1.15.48' in panel[:200]
    assert "v1.10.9 Environment zone card UI/UX alignment" in docs
    assert "구역 선택 카드" in docs
    assert "작기 선택 카드와 동일한 3줄 카드 문법" in docs


def test_environment_selector_title_is_plain_zone_selection():
    panel = _read(PANEL)
    scope_bar = panel.split('_renderControlScopeBar(domain) {', 1)[1].split('  _cloneControlState', 1)[0]
    assert 'const scopeTitle = "구역 선택";' in scope_bar
    assert '구역별 현재 작기 선택' not in scope_bar
    helper = panel.split('  _renderEnvironmentZoneSeasonCards(domain) {', 1)[1].split('  _selectControlZoneSeasonFromCard', 1)[0]
    assert '>구역 선택</div>' in helper
    assert '구역별 현재 작기 선택' not in helper


def test_zone_card_matches_crop_season_selector_three_line_card_grammar():
    panel = _read(PANEL)
    crop_selector = panel.split('  _renderSeasonSelector()', 1)[1].split('  _renderCropTabContent', 1)[0]
    zone_helper = panel.split('  _renderEnvironmentZoneSeasonCards(domain) {', 1)[1].split('  _selectControlZoneSeasonFromCard', 1)[0]
    for style_marker in (
        'flex-shrink:0;border:2px solid ${selected ?',
        'border-radius:12px;padding:10px 14px;cursor:pointer;min-width:148px;',
        'background:${selected ?',
    ):
        assert style_marker in crop_selector
        assert style_marker in zone_helper
    assert 'data-env-zone-season-primary-line' in zone_helper
    assert 'data-env-zone-season-secondary-line' in zone_helper
    assert 'data-env-zone-season-status-line' in zone_helper
    assert 'data-env-zone-season-save-summary' not in zone_helper
    assert '마지막 저장:' not in zone_helper


def test_zone_card_visible_text_is_zone_first_without_extra_jargon():
    panel = _read(PANEL)
    helper = panel.split('  _renderEnvironmentZoneSeasonCards(domain) {', 1)[1].split('  _selectControlZoneSeasonFromCard', 1)[0]
    assert 'data-env-zone-season-zone-label' in helper
    assert 'data-env-zone-season-current-crop' in helper
    assert '${this._esc(z.label)} · ${emoji} ${this._esc(cropLabel)}' in helper
    assert '구역 중심' not in helper
    assert '현재 작기:' not in helper
    assert '환경 제어</div>' not in helper
    assert "${active ? '● 재배 중' : (season ? '○ 철거완료' : '○ 작기 미연결')}" in helper


def test_zone_centric_model_and_binding_are_preserved():
    panel = _read(PANEL)
    assert '_activeSeasonForZone(zoneId)' in panel
    assert '_selectControlZoneSeasonFromCard(domain, zoneId, seasonId)' in panel
    assert 'this._controlScope = { ...this._controlScope, zoneId: numericZoneId, seasonId: String(resolvedSeasonId) };' in panel
    assert 'data-env-zone-season-model="zone-parent-season-child"' in panel
    assert 'data-env-season-zone-card' not in panel
    assert 'data-env-zone-season-direct-execute' not in panel
