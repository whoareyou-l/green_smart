from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEPLOY = ROOT.parent / "green_smart-deploy"
CENTRAL_MAIN = DEPLOY / "central" / "api" / "app" / "main.py"
DESIGN = ROOT / "docs" / "plans" / "2026-06-23-crop-safety-interlock-real-use-design.md"
BACKEND_DOC = ROOT / "docs" / "design" / "current-backend-api-db-ha-contract.md"


def _source(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_center_crop_interlock_analytics_api_contract():
    source = _source(CENTRAL_MAIN)
    for marker in (
        "class CropInterlockAnalyticsSummaryResponse(BaseModel)",
        '@app.get("/analytics/crop-interlock/summary")',
        "crop_interlock_snapshots",
        "reason_counts",
        "approval_gate_counts",
        "approval_type_counts",
        "harvest_safety_unknown_count",
        "stage_index_problem_count",
        "stage_index_hard_block_count",
        "analytics/reporting only",
        "not real-time safety decision",
        "jsonb_array_elements_text",
        "approvalGateStatus",
        "stage_harvest_phi_rei_unknown",
        "stage_index_problem",
        "stage_index_hard_block",
    ):
        assert marker in source


def test_center_crop_interlock_analytics_docs_contract():
    design = _source(DESIGN)
    backend = _source(BACKEND_DOC)
    combined = design + "\n" + backend
    for marker in (
        "GET /analytics/crop-interlock/summary",
        "reason_counts",
        "approval_gate_counts",
        "approval_type_counts",
        "harvest_safety_unknown_count",
        "센터 분석 API는 analytics/reporting only",
        "실시간 safety/interlock 최종 판단자가 아니다",
    ):
        assert marker in combined
