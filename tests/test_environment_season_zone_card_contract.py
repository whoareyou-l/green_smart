from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
UI_DOC = ROOT / "docs/design/current-ui-design-and-navigation.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_v1999_environment_season_zone_card_versions_and_docs():
    panel = _read(PANEL)
    assert '"version": "1.9.99"' in _read(MANIFEST)
    assert 'const VERSION = "1.9.99"' in panel
    assert 'v1.9.99' in panel[:200]
    assert "v1.9.99 Environment season-zone card" in _read(UI_DOC)


def test_environment_uses_crop_season_selector_style_at_control_scope_position():
    panel = _read(PANEL)
    assert "_renderEnvironmentSeasonZoneCards(domain)" in panel
    assert 'data-env-season-zone-selector' in panel
    assert 'data-env-season-zone-card' in panel
    assert 'data-env-season-zone-cloned-from="crop-season-selector"' in panel
    assert '작기구역 선택' in panel
    assert '작물 설정의 작기 선택 카드와 같은 형식' in panel
    scope_bar = panel.split('_renderControlScopeBar(domain) {', 1)[1].split('  _cloneControlState', 1)[0]
    assert 'domain === "environment" ? this._renderEnvironmentSeasonZoneCards(domain) : this._renderControlZoneTabs(domain)' in scope_bar


def test_environment_season_zone_card_preserves_crop_card_visual_grammar():
    panel = _read(PANEL)
    required = [
        'data-env-season-zone-season-id',
        'data-env-season-zone-zone-id',
        'data-env-season-zone-crop-label',
        'data-env-season-zone-plant-date',
        'data-env-season-zone-status',
        'data-env-season-zone-save-summary',
        'flex-shrink:0;border:2px solid ${selected ?',
        'border-radius:12px;padding:10px 14px;cursor:pointer;min-width:148px;',
        'background:${selected ?',
    ]
    for marker in required:
        assert marker in panel


def test_environment_season_zone_card_binding_updates_season_and_zone_scope():
    panel = _read(PANEL)
    assert 'bar.querySelectorAll("[data-env-season-zone-card]")' in panel
    assert '_selectControlSeasonZoneFromCard(domain, card.dataset.envSeasonZoneSeasonId, card.dataset.envSeasonZoneZoneId)' in panel
    assert '_selectControlSeasonZoneFromCard(domain, seasonId, zoneId)' in panel
    assert 'this._activeSeasonId = numericSeasonId;' in panel
    assert 'this._controlScope = { ...this._controlScope, seasonId: String(seasonId), zoneId: numericZoneId };' in panel
    assert 'this._saveControlScope();' in panel
    assert 'this._requestZoneControlHydration(domain);' in panel


def test_environment_season_zone_card_keeps_scope_storage_contract():
    panel = _read(PANEL)
    assert '작기 + 구역 + 제어영역 → green_smart_zone_control_settings' in panel
    assert 'data-control-scope-storage-key' in panel
    assert 'data-control-scope-summary' in panel
    forbidden = [
        'data-env-season-zone-direct-execute',
        'environmentSeasonZoneAllowDirectExecution',
        'data-env-control-bypass-safety',
    ]
    for marker in forbidden:
        assert marker not in panel
