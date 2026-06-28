from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REBUILD_PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "rebuild" / "green-smart-rebuild-panel.js"
CBA_DOC = ROOT / "docs" / "master" / "01-cba-ui-ux-spec.md"
RESEARCH_DOC = ROOT / "docs" / "rebuild" / "rs-002-home-dashboard-research.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_rs006_home_context_source_shape_is_explicit_before_api_hookup():
    source = _read(REBUILD_PANEL)
    for marker in (
        "REBUILD_HOME_CONTEXT",
        "contextSource: \"static-fixture-before-api\"",
        "greenhouseId",
        "greenhouseName",
        "generatedAt",
        "zones:",
        "currentCrop",
        "cropSeasonId",
        "cropType",
        "cropLabelKo",
        "growthStage",
        "equipmentProfile",
        "dataAvailability",
    ):
        assert marker in source


def test_rs006_adapter_normalizes_context_and_keeps_static_fallback_without_execution_calls():
    source = _read(REBUILD_PANEL)
    for marker in (
        "normalizeRebuildHomeContext",
        "getRebuildHomeContext",
        "this._homeContext = getRebuildHomeContext()",
        "this._zonesForRender()",
        "this._contextMetaForRender()",
        "data-rebuild-context-source",
        "data-rebuild-greenhouse-id",
        "data-rebuild-context-generated-at",
        "REBUILD_HOME_CONTEXT",
        "static-fixture-before-api",
    ):
        assert marker in source

    for forbidden in (
        "fetch(",
        "callService(",
        "executeFinalTargets",
        "data-zone-execute-button",
    ):
        assert forbidden not in source

    assert "hass.callApi" in source  # RS-015 allows protected read-only API loading.


def test_rs006_render_uses_context_zones_not_legacy_flat_constants_directly():
    source = _read(REBUILD_PANEL)
    for marker in (
        "this._zonesForRender().map((zone)",
        "this._findZoneForRender(zoneId)",
        "zone.currentCrop?.cropLabelKo",
        "zone.currentCrop?.growthStage",
        "zone.equipmentProfile?.labels",
        "zone.dataAvailability",
        "data-zone-current-crop",
        "data-zone-growth-stage",
        "data-zone-equipment-profile",
    ):
        assert marker in source

    assert "REBUILD_ZONE_CONTEXTS.map((zone)" not in source
    assert "REBUILD_ZONE_CONTEXTS.find((item)" not in source


def test_rs006_docs_record_context_source_vertical_slice():
    doc = _read(RESEARCH_DOC)
    for marker in (
        "RS-006 context source vertical slice",
        "zone parent + currentCrop attached",
        "static-fixture-before-api",
        "normalizeRebuildHomeContext",
        "read-only context adapter",
        "no fetch/API/service execution in RS-006",
    ):
        assert marker in doc


def test_rs006_master_cba_records_home_context_data_source():
    doc = _read(CBA_DOC)
    for marker in (
        "REBUILD_HOME_CONTEXT",
        "zone parent + currentCrop attached",
        "contextSource",
        "greenhouseId",
        "currentCrop",
        "equipmentProfile",
        "dataAvailability",
    ):
        assert marker in doc
