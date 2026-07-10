from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-000-main-dashboard-sidebar-detail-ia-blueprint.md"
CURRENT_UI = ROOT / "docs/design/current-ui-design-and-navigation.md"
PRODUCT_PLAN = ROOT / "docs/plans/2026-06-28-green-smart-product-first-rebuild-plan.md"
TARGET_ARCH = ROOT / "docs/rebuild/target-architecture.md"
FRONTEND_PLAN = ROOT / "docs/rebuild/frontend-decomposition-plan.md"
R6_003_DOC = ROOT / "docs/rebuild/r6-003-safety-interlock-readonly-adapter.md"
SERVICE = ROOT / "custom_components/green_smart/services/rebuild_crop_context_service.py"
VIEW = ROOT / "custom_components/green_smart/rebuild_views.py"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_000_version_surfaces_are_1_12_34():
    assert '"version": "1.15.12"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.12"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.12"' in _read(REBUILD_PANEL)
    for path in (DOC, CURRENT_UI, PRODUCT_PLAN, TARGET_ARCH):
        assert "v1.15.12" in _read(path)


def test_r7_000_blueprint_declares_r6_to_r7_transition_and_no_runtime_change():
    text = _read(DOC)
    for marker in (
        "# R7-000 Main Dashboard / Sidebar / Detail Page IA Blueprint",
        "Status: R7-000 complete",
        "R6-001 Crop cycle read-only adapter ✅",
        "R6-002 Monitoring read-only adapter ✅",
        "R6-003 Safety/Interlock read-only adapter ✅",
        "R7-000 is an IA blueprint only",
        "No panel DOM implementation change in R7-000",
        "No API route change in R7-000",
        "No DB migration in R7-000",
        "No execution authority in R7-000",
        "No SafetyGuard/Interlock runtime behavior change in R7-000",
        "question gates must use clarify tool",
    ):
        assert marker in text


def test_r7_000_blueprint_locks_crop_centered_main_flow_and_zone_drilldown():
    text = _read(DOC)
    for marker in (
        "crop-centered operating frame",
        "작물상태 → 생육목표 → 환경/관수/장치 영향 → 추천/실행",
        "zone drilldown lives inside each crop-centered stage",
        "do not create standalone 구역별 작물 운영",
        "PAGE-CropCenteredHome",
        "MOD-CropStageZoneDetail",
        "COM-ZoneTabs",
        "COM-ZonePanel",
        "COM-ZoneDetailModal",
        "one-card-per-row stage flow",
        "data-cba-layout=\"single-column-stage-flow\"",
    ):
        assert marker in text


def test_r7_000_blueprint_defines_sidebar_detail_and_subpage_grammar():
    text = _read(DOC)
    for marker in (
        "R7 sidebar primary groups",
        "운영 홈",
        "작물 중심 운영",
        "현장 상태",
        "추천·실행 검토",
        "설정",
        "detail page shell",
        "detailHeader → evidenceSummary → zoneTabs → selectedZonePanel → optionalDetailModal",
        "subpage grammar",
        "read-only evidence first",
        "operator summary before technical evidence",
        "mobile 360px 기준",
        "PC sidebar + detail workspace",
    ):
        assert marker in text


def test_r7_000_blueprint_uses_r6_readonly_shapes_as_ui_sources():
    text = _read(DOC)
    for marker in (
        "R6 read-only source shapes",
        "currentCropAssignment",
        "monitoringReadOnlyAdapter",
        "safetyInterlockReadOnlyAdapter",
        "environmentImpactProjection",
        "recommendationReviewProjection",
        "virtualExecutionRehearsalScaffold",
        "render from existing GET /api/green_smart/rebuild/home/context shape",
        "No fixture-only cards in R7 UI implementation slices",
    ):
        assert marker in text


def test_r7_000_current_docs_link_blueprint_and_preserve_boundaries():
    for path in (CURRENT_UI, PRODUCT_PLAN, TARGET_ARCH, FRONTEND_PLAN, R6_003_DOC):
        text = _read(path)
        assert "R7-000 Main Dashboard / Sidebar / Detail Page IA Blueprint" in text
        assert "docs/rebuild/r7-000-main-dashboard-sidebar-detail-ia-blueprint.md" in text
        assert "작물상태 → 생육목표 → 환경/관수/장치 영향 → 추천/실행" in text
        assert "No execution authority in R7-000" in text


def test_r7_000_does_not_change_runtime_or_panel_implementation_yet():
    doc = _read(DOC)
    service_text = _read(SERVICE)
    view_text = _read(VIEW)
    rebuild_panel = _read(REBUILD_PANEL)
    assert "R7-000 runtime code remains unchanged" in doc
    assert "safetyInterlockReadOnlyAdapter" in service_text
    assert "GET /api/green_smart/rebuild/home/context" in view_text
    assert "requires_auth = True" in view_text
    # R7-000 itself was blueprint-only. Later R7-001 is allowed to introduce
    # concrete R7 dashboard markers while preserving the same API/runtime bounds.
    assert "data-r7-main-dashboard" in rebuild_panel
    assert "data-r7-detail-page-shell" in rebuild_panel
    assert "callService(" not in rebuild_panel
    assert ".callService" not in rebuild_panel
