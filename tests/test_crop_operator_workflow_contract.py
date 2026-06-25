from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CROP = ROOT / "custom_components" / "green_smart" / "crop_views.py"
INIT = ROOT / "custom_components" / "green_smart" / "__init__.py"
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
MANIFEST = ROOT / "custom_components" / "green_smart" / "manifest.json"
CENTRAL = ROOT / "custom_components" / "green_smart" / "central_views.py"
PLAN = ROOT / "docs" / "plans" / "2026-06-24-crop-model-slice-execution-plan.md"
DESIGN = ROOT / "docs" / "plans" / "2026-06-23-crop-model-design-decisions.md"


def test_v1967_operator_workflow_documented_contract():
    plan = PLAN.read_text(encoding="utf-8")
    design = DESIGN.read_text(encoding="utf-8")
    for marker in (
        "Slice 8 — v1.9.67 Panel Operator Workflow",
        "GET /api/green_smart/crop/seasons/{season_id}/operator-workflow",
        "operatorWorkflowVersion",
        "weeklyInputStatus",
        "missingInputs",
        "nextSurveyChecklist",
        "lastValidationSummary",
        "timeSeriesReadiness",
        "이번 주 입력 완료 여부",
        "부족한 입력",
        "다음 생육조사 때 확인할 것",
        "지난 예측 검증 결과",
        "시계열 모델 확장 가능 여부",
        "data-crop-operator-workflow-card",
        "farm owners/staff who are not crop-model or software specialists",
        "primary operator summary",
        "Existing technical cards may remain only as `상세 근거`/audit evidence",
        "mobile and PC responsive",
    ):
        assert marker in plan
    for marker in (
        "Confirmed decision 16 — operator workflow summarizes model development state in Korean",
        "operatorWorkflowVersion",
        "weeklyInputStatus",
        "nextSurveyChecklist",
        "timeSeriesReadiness",
    ):
        assert marker in design


def test_v1967_backend_operator_workflow_contract():
    crop = CROP.read_text(encoding="utf-8")
    for marker in (
        'CROP_OPERATOR_WORKFLOW_VERSION = "crop_operator_workflow_v1"',
        "_crop_operator_workflow_response(",
        '"operatorWorkflowVersion"',
        '"weeklyInputStatus"',
        '"missingInputs"',
        '"nextSurveyChecklist"',
        '"lastValidationSummary"',
        '"timeSeriesReadiness"',
        '"operatorWarnings"',
        '"read-only workflow; no device execution"',
        '"operatorWorkflow": operatorWorkflow',
    ):
        assert marker in crop


def test_v1967_operator_workflow_api_registered_contract():
    crop = CROP.read_text(encoding="utf-8")
    init = INIT.read_text(encoding="utf-8")
    assert "class CropModelOperatorWorkflowView(HomeAssistantView):" in crop
    assert 'url = "/api/green_smart/crop/seasons/{season_id}/operator-workflow"' in crop
    assert 'name = "api:green_smart:crop:operator_workflow"' in crop
    assert "CropModelOperatorWorkflowView" in init
    assert "hass.http.register_view(CropModelOperatorWorkflowView())" in init


def test_v1967_panel_operator_workflow_read_only_contract():
    panel = PANEL.read_text(encoding="utf-8")
    for marker in (
        "data-crop-operator-workflow-card",
        "data-crop-operator-weekly-input-status",
        "data-crop-operator-missing-inputs",
        "data-crop-operator-next-survey-checklist",
        "data-crop-operator-last-validation-summary",
        "data-crop-operator-time-series-readiness",
        "operatorWorkflowVersion",
        "이번 주 입력 완료 여부",
        "부족한 입력",
        "다음 생육조사 때 확인할 것",
        "지난 예측 검증 결과",
        "시계열 모델 확장 가능 여부",
        "실행 권한 없음",
        "농장주/직원용 요약",
        "상세 근거",
        "grid-template-columns:repeat(auto-fit,minmax(220px,1fr))",
        "모바일/PC 반응형",
    ):
        assert marker in panel
    for forbidden in (
        "data-crop-operator-execute-device",
        "data-crop-operator-train-model",
        "data-crop-operator-replace-production-model",
        "operatorWorkflowRawJson",
    ):
        assert forbidden not in panel


def test_v1967_version_markers_contract():
    manifest = MANIFEST.read_text(encoding="utf-8")
    panel = PANEL.read_text(encoding="utf-8")
    central = CENTRAL.read_text(encoding="utf-8")
    assert '"version": "1.10.15"' in manifest
    assert 'const VERSION = "1.10.15"' in panel
    assert "v1.10.15" in panel[:200]
    assert 'EDGE_VERSION = "1.9.96"' in central
