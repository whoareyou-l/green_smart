from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
UI_DOC = ROOT / "docs/design/current-ui-design-and-navigation.md"
MASTER = ROOT / "docs/PROJECT_MASTER_PLAN.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_v1101_zone_centric_versions_and_docs():
    panel = _read(PANEL)
    docs = _read(UI_DOC) + "\n" + _read(MASTER)
    assert '"version": "1.14.91"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.91"' in panel
    assert 'v1.14.91' in panel[:200]
    assert "v1.10.9 Environment zone card UI/UX alignment" in docs
    assert "구역이 부모, 작기는 구역에 연결되는 현재 재배 상태" in docs


def test_environment_scope_is_zone_centric_not_season_centric():
    panel = _read(PANEL)
    scope_bar = panel.split('_renderControlScopeBar(domain) {', 1)[1].split('  _cloneControlState', 1)[0]
    assert "_renderEnvironmentZoneSeasonCards(domain)" in panel
    assert 'domain === "environment" ? this._renderEnvironmentZoneSeasonCards(domain) : this._renderControlZoneTabs(domain)' in scope_bar
    assert "_renderEnvironmentSeasonZoneCards(domain)" not in panel
    assert "_selectControlSeasonZoneFromCard" not in panel
    assert 'data-env-zone-season-selector' in panel
    assert 'data-env-zone-season-card' in panel
    assert 'data-env-zone-season-zone-id' in panel
    assert 'data-env-zone-season-season-id' in panel
    assert 'data-env-season-zone-card' not in panel


def test_zone_card_visual_hierarchy_puts_zone_first_and_season_inside():
    panel = _read(PANEL)
    helper = panel.split('  _renderEnvironmentZoneSeasonCards(domain) {', 1)[1].split('  _selectControlZoneSeasonFromCard', 1)[0]
    for marker in (
        'data-env-zone-season-zone-label',
        'data-env-zone-season-current-crop',
        'data-env-zone-season-plant-date',
        'data-env-zone-season-status',
        'data-env-zone-season-primary-line',
        'data-env-zone-season-secondary-line',
        'data-env-zone-season-status-line',
        '구역 선택',
        'flex-shrink:0;border:2px solid ${selected ?',
        'border-radius:12px;padding:10px 14px;cursor:pointer;min-width:148px;',
        'background:${selected ?',
    ):
        assert marker in helper
    assert helper.index('data-env-zone-season-zone-label') < helper.index('data-env-zone-season-plant-date')


def test_zone_card_binding_selects_zone_first_then_attached_season():
    panel = _read(PANEL)
    assert 'bar.querySelectorAll("[data-env-zone-season-card]")' in panel
    assert '_selectControlZoneSeasonFromCard(domain, card.dataset.envZoneSeasonZoneId, card.dataset.envZoneSeasonSeasonId)' in panel
    assert '_selectControlZoneSeasonFromCard(domain, zoneId, seasonId)' in panel
    assert 'this._controlScope = { ...this._controlScope, zoneId: numericZoneId, seasonId: String(resolvedSeasonId) };' in panel
    assert 'if (Number.isFinite(numericSeasonId) && numericSeasonId > 0) this._activeSeasonId = numericSeasonId;' in panel
    assert 'this._saveControlScope();' in panel
    assert 'this._requestZoneControlHydration(domain);' in panel


def test_zone_centric_helper_maps_zone_to_current_active_season():
    panel = _read(PANEL)
    assert '_activeSeasonForZone(zoneId)' in panel
    helper = panel.split('  _activeSeasonForZone(zoneId) {', 1)[1].split('  _renderCropSeasonLikeControlScope', 1)[0]
    assert 'Number(s.zoneId ?? s.zone_id ?? s.zone ?? 0) === numericZoneId' in helper
    assert '!s.demolishDate' in helper
    assert 'matching.find((s) => !s.demolishDate)' in helper


def test_zone_centric_scope_keeps_storage_and_no_direct_execution():
    panel = _read(PANEL)
    assert '구역 + 현재 작기 + 제어영역 → green_smart_zone_control_settings' in panel
    assert 'data-control-scope-storage-key' in panel
    assert 'data-control-scope-summary' in panel
    for marker in (
        'data-env-zone-season-direct-execute',
        'environmentZoneSeasonAllowDirectExecution',
        'data-env-control-bypass-safety',
    ):
        assert marker not in panel
