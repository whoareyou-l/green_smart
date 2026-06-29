from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
CENTRAL = ROOT / "custom_components/green_smart/central_views.py"
UI_DOC = ROOT / "docs/design/current-ui-design-and-navigation.md"
PLAN = ROOT / "docs/plans/2026-06-24-crop-settings-ui-slice-plan.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _growth_report_card(panel: str) -> str:
    return panel.split("  _renderGrowthReportCard()", 1)[1].split("  async _fetchGrowthReport", 1)[0]


def _ai_tab(panel: str) -> str:
    return panel.split("  _renderCropAiStrategyTab()", 1)[1].split("  _renderCropPestTab", 1)[0]


def test_v1974_ai_strategy_has_primary_summary_next_action_and_boundary():
    panel = _read(PANEL)
    report = _growth_report_card(panel)
    docs = _read(UI_DOC)
    plan = _read(PLAN)

    for marker in (
        "data-crop-ai-primary-summary",
        "data-crop-ai-next-action",
        "data-crop-ai-readonly-boundary",
        "이번 주 모델을 통해서 출력된 작물 상태의 요약입니다.",
        "다음 행동",
        "자동 실행 없음",
        "자동 학습/배포 없음",
    ):
        assert marker in report
        assert marker in docs
        assert marker in plan

    assert "operatorWorkflow" in report
    assert "validationStatusLabel" in report
    assert "mlReady" in report
    assert "cropInterlock" in report


def test_v1974_ai_strategy_technical_evidence_is_collapsed_not_card_dumped():
    panel = _read(PANEL)
    report = _growth_report_card(panel)
    docs = _read(UI_DOC)
    plan = _read(PLAN)

    for marker in (
        "data-crop-ai-advanced-details",
        "data-crop-ai-technical-evidence-grid",
        "<details data-crop-ai-advanced-details",
        "<summary",
        "상세 모델 근거",
    ):
        assert marker in report
        assert marker in docs
        assert marker in plan

    technical_markers = (
        "data-crop-trainable-baseline-card",
        "data-crop-stage-prediction-score-card",
        "data-crop-kma-weather-stress-card",
        "data-crop-training-dataset-export-card",
        "data-crop-model-feature-sources-card",
        "data-center-crop-policy-card",
    )
    details_start = report.index("data-crop-ai-advanced-details")
    details_section = report[details_start:]
    for marker in technical_markers:
        assert marker in details_section


def test_v1974_ai_strategy_preserves_no_execution_forbidden_markers():
    panel = _read(PANEL)
    report = _growth_report_card(panel)
    ai_tab = _ai_tab(panel)
    docs = _read(UI_DOC)
    plan = _read(PLAN)

    forbidden = (
        "data-crop-ai-execute-device",
        "data-crop-ai-train-production-model",
        "centerPolicyAllowExecution",
        "cropAiAllowExecution",
        "autoDeployProductionModel",
    )
    for marker in forbidden:
        assert marker not in report
        assert marker not in ai_tab
        assert marker in docs
        assert marker in plan


def test_v1974_ai_strategy_version_markers_and_future_shift():
    manifest = _read(MANIFEST)
    panel = _read(PANEL)
    central = _read(CENTRAL)
    docs = _read(UI_DOC)
    plan = _read(PLAN)

    assert '"version": "1.12.62"' in manifest
    assert 'const VERSION = "1.12.62"' in panel
    assert 'v1.12.62' in panel[:200]
    assert 'EDGE_VERSION = "1.9.96"' in central
    assert '기준 버전: `v1.12.62`' in docs
    assert 'UI Slice 3 | v1.9.74 | AI 전략' in plan
    assert 'UI Slice 4 | v1.9.75 | 병해충 예찰' in plan
