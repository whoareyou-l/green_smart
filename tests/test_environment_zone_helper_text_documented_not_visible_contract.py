from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
UI_DOC = ROOT / "docs/design/current-ui-design-and-navigation.md"
MASTER = ROOT / "docs/PROJECT_MASTER_PLAN.md"
PLAN = ROOT / "docs/design/environment-control-ui-dom-slice-plan.md"

HELPER_TEXT = "작기 선택 카드와 동일한 3줄 카드 문법으로 구역과 현재 작기를 함께 표시합니다."


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _section(text: str, start: str, end: str) -> str:
    return text.split(start, 1)[1].split(end, 1)[0]


def test_v1107_versions_and_docs_for_zone_helper_text_removed_from_ui():
    panel = _read(PANEL)
    docs = _read(UI_DOC) + "\n" + _read(MASTER) + "\n" + _read(PLAN)
    assert '"version": "1.15.11"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.11"' in panel
    assert 'v1.15.11' in panel[:200]
    assert "v1.10.9 Environment zone helper text moved to docs" in docs
    assert HELPER_TEXT in docs


def test_environment_zone_selector_no_longer_renders_helper_text():
    panel = _read(PANEL)
    zone_cards = _section(panel, '  _renderEnvironmentZoneSeasonCards(domain) {', '  _selectControlZoneSeasonFromCard(domain, zoneId, seasonId) {')
    assert f'<div style="font-size:11px;color:#7a9780;margin:-3px 0 8px;">{HELPER_TEXT}</div>' not in zone_cards
    assert 'data-env-zone-card-helper-doc-only' in zone_cards
    assert f'hidden data-env-zone-card-helper-doc-only="{HELPER_TEXT}"' in zone_cards


def test_environment_page_contract_keeps_unified_card_without_visible_helper_text():
    panel = _read(PANEL)
    env_page = _section(panel, '  _renderEnvSettingsPage() {', '  _cloneIrrigationDefaults() {')
    assert 'data-env-unified-scope-tab-card' in env_page
    assert '_renderControlScopeBar("environment")' in env_page
    assert HELPER_TEXT not in env_page
    assert 'data-env-zone-card-helper-doc-only' in panel


def test_zone_card_core_labels_remain_visible():
    panel = _read(PANEL)
    zone_cards = _section(panel, '  _renderEnvironmentZoneSeasonCards(domain) {', '  _selectControlZoneSeasonFromCard(domain, zoneId, seasonId) {')
    for marker in (
        'data-env-zone-season-card',
        'data-env-zone-season-primary-line',
        'data-env-zone-season-plant-date',
        'data-env-zone-season-status',
        '구역 선택',
        '작기 미연결',
    ):
        assert marker in zone_cards
