from pathlib import Path
import importlib.util
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
ADAPTER = ROOT / "custom_components/green_smart/panel/rebuild/current-crop-adapter.js"
SERVICE = ROOT / "custom_components/green_smart/services/rebuild_crop_context_service.py"
DOC = ROOT / "docs/rebuild/recommendation-review-readonly-projection.md"
INTERFACE_SPEC = ROOT / "docs/master/02-interface-spec.md"
PRODUCT_PLAN = ROOT / "docs/plans/2026-06-28-green-smart-product-first-rebuild-plan.md"
LEGACY_INVENTORY = ROOT / "docs/rebuild/legacy-direction-inventory.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _load_service():
    spec = importlib.util.spec_from_file_location("rs020_rebuild_crop_context_service", SERVICE)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_rs020_version_surfaces_are_aligned_to_1_12_19():
    assert '"version": "1.15.45"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.45"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.45"' in _read(REBUILD_PANEL)
    for path in (DOC, INTERFACE_SPEC, PRODUCT_PLAN, LEGACY_INVENTORY):
        assert "v1.15.45" in _read(path)


def test_rs020_document_records_recommendation_review_projection_boundary():
    text = _read(DOC)
    for marker in (
        "# RS-020 Recommendation Review Read-only Projection",
        "Status: recommendation review read-only projection",
        "recommendationReviewProjection",
        "currentCropAssignment + growthTargetProjection + environmentImpactProjection → recommendationReviewProjection",
        "추천·실행",
        "reviewState",
        "reviewSummary",
        "reviewInputs",
        "approvalRequired",
        "No production route removal in RS-020",
        "No DB migration in RS-020",
        "No write/mutation in RS-020",
        "No real-device hookup in RS-020",
    ):
        assert marker in text


def test_service_maps_prior_projections_to_recommendation_review_projection():
    service = _load_service()
    row = {
        "zone_id": 2,
        "zone_name": "B구역",
        "crop_cycle_id": 18,
        "compatibility_crop_season_id": 18,
        "crop_type": "lettuce",
        "variety": "버터헤드",
        "growth_stage": "엽채 생육 관찰",
        "plant_date": "2026-06-03",
        "updated_at": "2026-06-28T22:00:00+09:00",
    }
    zone = service.crop_cycle_row_to_zone_context(row)
    projection = zone["recommendationReviewProjection"]
    assert projection["reviewState"] == "ready"
    assert projection["reviewSummary"] == "추천 검토 대기: 생육목표와 환경 영향 projection 확인 필요"
    assert projection["reviewInputs"]["assignment"] == zone["currentCropAssignment"]
    assert projection["reviewInputs"]["growthTargetProjection"] == zone["growthTargetProjection"]
    assert projection["reviewInputs"]["environmentImpactProjection"] == zone["environmentImpactProjection"]
    assert projection["approvalRequired"] is True
    assert projection["readOnly"] is True
    assert projection["executionEnabled"] is False


def test_frontend_adapter_normalizes_recommendation_review_projection_from_api_context():
    source = _read(ADAPTER)
    for marker in (
        "normalizeRecommendationReviewProjection",
        "recommendationReviewProjection",
        "reviewState",
        "reviewSummary",
        "reviewInputs",
        "approvalRequired",
        "readOnly: true",
        "executionEnabled: false",
    ):
        assert marker in source

    script = f"""
      import {{ normalizeRebuildHomeContext }} from {str(ADAPTER)!r};
      const ctx = normalizeRebuildHomeContext({{
        contextSource: 'legacy-physical-readonly-adapter',
        zones: [{{
          id: 'zone-2', zone_id: 2, name: 'B구역',
          currentCrop: {{ crop_cycle_id: 18, crop_type: 'lettuce', crop_label_ko: '상추', growth_stage: '엽채 생육 관찰' }},
          currentCropAssignment: {{ assignmentState: 'assigned', sourceRowId: 18, readOnly: true, executionEnabled: false }},
          growthTargetProjection: {{ projectionState: 'ready', targetStageLabel: '엽채 생육 관찰', targetFocus: '엽채 생장 균일화', targetBasis: {{ crop_cycle_id: 18 }}, readOnly: true, executionEnabled: false }},
          environmentImpactProjection: {{ impactState: 'ready', impactFocus: '환경 영향 확인', impactFactors: ['천창'], freshnessLabel: '3분 전 갱신', readOnly: true, executionEnabled: false }},
          recommendationReviewProjection: {{ reviewState: 'ready', reviewSummary: '추천 검토 대기', approvalRequired: true, readOnly: true, executionEnabled: false }}
        }}]
      }});
      const projection = ctx.zones[0].recommendationReviewProjection;
      console.log(JSON.stringify(projection));
      if (projection.reviewState !== 'ready') process.exit(1);
      if (!projection.approvalRequired) process.exit(2);
      if (projection.reviewInputs.growthTargetProjection.targetFocus !== '엽채 생장 균일화') process.exit(3);
      if (projection.reviewInputs.environmentImpactProjection.impactFactors.length !== 1) process.exit(4);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_rebuild_panel_renders_recommendation_review_projection_only_for_recommendation_stage_without_mutation():
    source = _read(REBUILD_PANEL)
    for marker in (
        "RS-020 recommendation review read-only projection",
        "renderRecommendationReviewProjection(zone, stageKey)",
        "data-recommendation-review-projection-card",
        "data-recommendation-review-state",
        "data-recommendation-review-summary",
        "data-recommendation-review-approval-required",
        "data-recommendation-review-readonly",
        "data-recommendation-review-execution-enabled",
        "추천·실행 projection",
    ):
        assert marker in source
    assert '["recommend-act"].includes(stageKey)' in source

    for forbidden in (
        "data-recommendation-review-approve-button",
        "data-recommendation-review-execute-button",
        "data-recommendation-review-save-button",
        "hass.callService",
        "executeFinalTargets",
        "POST",
        "PUT",
        "DELETE",
    ):
        assert forbidden not in source


def test_rebuild_panel_recommendation_review_node_smoke_uses_normalized_context():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ contextSource: 'legacy-physical-readonly-adapter', zones: [{{ id: 'zone-2', zone_id: 2, name: 'B구역', currentCrop: {{ crop_cycle_id: 18, crop_type: 'lettuce', crop_label_ko: '상추', growth_stage: '엽채 생육 관찰' }}, currentCropAssignment: {{ assignmentState: 'assigned', sourceRowId: 18, readOnly: true, executionEnabled: false }}, growthTargetProjection: {{ projectionState: 'ready', targetStageLabel: '엽채 생육 관찰', targetFocus: '엽채 생장 균일화', targetBasis: {{ crop_cycle_id: 18 }}, readOnly: true, executionEnabled: false }}, environmentImpactProjection: {{ impactState: 'ready', impactFocus: '환경 영향 확인', impactFactors: ['천창'], freshnessLabel: '3분 전 갱신', readOnly: true, executionEnabled: false }}, recommendationReviewProjection: {{ reviewState: 'ready', reviewSummary: '추천 검토 대기', approvalRequired: true, readOnly: true, executionEnabled: false }} }}] }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      const html = panel.renderRecommendationReviewProjection(panel._homeContext.zones[0], 'recommend-act');
      const hidden = panel.renderRecommendationReviewProjection(panel._homeContext.zones[0], 'influence-map');
      console.log(html);
      if (!html.includes('data-recommendation-review-projection-card')) process.exit(1);
      if (!html.includes('data-recommendation-review-state="ready"')) process.exit(2);
      if (!html.includes('추천 검토 대기')) process.exit(3);
      if (!html.includes('엽채 생장 균일화')) process.exit(4);
      if (hidden !== '') process.exit(5);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_docs_specs_plan_and_inventory_record_rs020_and_next_step():
    spec = _read(INTERFACE_SPEC)
    plan = _read(PRODUCT_PLAN)
    inventory = _read(LEGACY_INVENTORY)
    for marker in (
        "Recommendation review read-only projection",
        "recommendationReviewProjection",
        "currentCropAssignment + growthTargetProjection + environmentImpactProjection → recommendationReviewProjection",
        "추천·실행",
        "No write/mutation in RS-020",
    ):
        assert marker in spec
    for marker in (
        "Phase R4.16 — Recommendation review read-only projection",
        "Status:** `v1.15.45`에서 추천·실행 read-only projection 완료",
        "No production route removal in RS-020",
        "No DB migration in RS-020",
        "No write/mutation in RS-020",
    ):
        assert marker in plan
    assert "RS-020" in inventory
    assert "Recommendation review read-only projection completed" in inventory
    assert "RS-021" in inventory
    assert "Operator approval scaffold" in inventory
