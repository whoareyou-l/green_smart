from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-001-main-dashboard-redesign.md"
R7_000_DOC = ROOT / "docs/rebuild/r7-000-main-dashboard-sidebar-detail-ia-blueprint.md"
CURRENT_UI = ROOT / "docs/design/current-ui-design-and-navigation.md"
PRODUCT_PLAN = ROOT / "docs/plans/2026-06-28-green-smart-product-first-rebuild-plan.md"
TARGET_ARCH = ROOT / "docs/rebuild/target-architecture.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_001_version_surfaces_are_1_12_35():
    assert '"version": "1.12.79"' in _read(MANIFEST)
    assert 'const VERSION = "1.12.79"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.12.79"' in _read(REBUILD_PANEL)
    for path in (DOC, R7_000_DOC, CURRENT_UI, PRODUCT_PLAN, TARGET_ARCH):
        assert "v1.12.79" in _read(path)


def test_r7_001_doc_declares_runtime_scope_and_boundaries():
    text = _read(DOC)
    for marker in (
        "# R7-001 Main Dashboard Redesign",
        "Status: R7-001 complete",
        "implements the first operator-visible crop-centered dashboard",
        "render from existing GET /api/green_smart/rebuild/home/context shape",
        "No fixture-only cards in R7-001",
        "No API route change in R7-001",
        "No DB migration in R7-001",
        "No execution authority in R7-001",
        "No approval/override release in R7-001",
        "No SafetyGuard/Interlock runtime behavior change in R7-001",
    ):
        assert marker in text


def test_r7_001_panel_has_explicit_dashboard_and_source_shape_markers():
    text = _read(REBUILD_PANEL)
    for marker in (
        "R7-001 Main dashboard redesign",
        "data-r7-main-dashboard",
        "data-r7-dashboard-hero",
        "data-r7-source-shapes",
        "data-r7-readonly-boundary",
        "data-r7-stage-grid",
        "data-r7-stage-card",
        "data-r7-stage-card=\"crop-status\"",
        "data-r7-stage-card=\"growth-goal\"",
        "data-r7-stage-card=\"environment-impact\"",
        "data-r7-stage-card=\"recommend-act\"",
        "data-r7-detail-page-shell",
        "detailHeader → evidenceSummary → zoneTabs → selectedZonePanel → optionalDetailModal",
    ):
        assert marker in text


def test_r7_001_panel_uses_r6_readonly_shapes_for_each_stage():
    text = _read(REBUILD_PANEL)
    for marker in (
        "currentCropAssignment",
        "monitoringReadOnlyAdapter",
        "safetyInterlockReadOnlyAdapter",
        "environmentImpactProjection",
        "recommendationReviewProjection",
        "virtualExecutionRehearsalScaffold",
        "sourceMonitoringReadOnlyAdapter",
        "sourceSafetyInterlockReadOnlyAdapter",
        "data-r7-source-current-crop-assignment",
        "data-r7-source-monitoring-readonly-adapter",
        "data-r7-source-safety-interlock-readonly-adapter",
        "data-r7-source-environment-impact-projection",
        "data-r7-source-recommendation-review-projection",
        "data-r7-source-virtual-execution-rehearsal-scaffold",
    ):
        assert marker in text


def test_r7_001_recommend_act_stage_renders_recommendation_projection_cards():
    text = _read(REBUILD_PANEL)
    assert "renderRecommendationReviewProjection(zone, stageKey)" in text
    assert "renderOperatorApprovalScaffold(zone, stageKey)" in text
    assert "renderSafetyInterlockPreflightProjection(zone, stageKey)" in text
    assert "renderVirtualExecutionRehearsalScaffold(zone, stageKey)" in text
    # R7-001 uses REBUILD_PAGES key recommend-act; projection helpers must match it.
    assert 'if (!["recommend-act"].includes(stageKey)) return "";' in text
    assert 'if (!["recommendation-execution"].includes(stageKey)) return "";' not in text


def test_r7_001_keeps_zone_drilldown_inside_stages_and_avoids_standalone_zone_section():
    text = _read(REBUILD_PANEL)
    assert "data-crop-os-stage-zone-detail" in text
    assert "data-zone-detail-stage" in text
    assert "data-zone-detail-modal-button" in text
    assert "data-cba-layout=\"single-column-stage-flow\"" in text
    assert "구역별 작물 운영" not in text
    assert "data-crop-os-zone-contexts" not in text


def test_r7_001_keeps_no_execution_authority_in_panel():
    text = _read(REBUILD_PANEL)
    forbidden = (
        "data-r7-execute",
        "data-r7-approve-override",
        "callService(",
        ".callService",
        "hass.services",
        "mqttEnabled\": true",
        "deviceCommandEnabled\": true",
        "executionDecisionEnabled\": true",
        "approvalOverrideEnabled\": true",
    )
    for marker in forbidden:
        assert marker not in text


def test_r7_001_source_docs_link_dashboard_slice():
    for path in (R7_000_DOC, CURRENT_UI, PRODUCT_PLAN, TARGET_ARCH):
        text = _read(path)
        assert "R7-001 Main Dashboard Redesign" in text
        assert "docs/rebuild/r7-001-main-dashboard-redesign.md" in text
        assert "No execution authority in R7-001" in text
