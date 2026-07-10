from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
UI_DOC = ROOT / "docs/design/current-ui-design-and-navigation.md"
MASTER = ROOT / "docs/PROJECT_MASTER_PLAN.md"
PLAN = ROOT / "docs/plans/2026-06-25-crop-summary-card-labels-v1-10-22.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _section(text: str, start: str, end: str) -> str:
    return text.split(start, 1)[1].split(end, 1)[0]


def _crop_summary() -> str:
    panel = _read(PANEL)
    report = _section(panel, "  _renderGrowthReportCard()", "  _renderCenterCropInterlockAnalyticsCard")
    return _section(report, "data-crop-ai-crop-summary", "data-crop-ai-safety-interlock-summary")


def test_v11022_crop_stage_summary_uses_text_main_and_score_confidence_subline():
    summary = _crop_summary()
    stage = _section(summary, "data-crop-ai-summary-stage", "data-crop-ai-summary-growth-state")
    assert "작물단계" in stage
    assert "stageLabel" in stage or "predictedStage7d.stageLabel" in stage
    assert "data-crop-ai-summary-stage-score" in stage
    assert "data-crop-ai-summary-stage-confidence" in stage
    assert "스코어" in stage
    assert "신뢰" in stage


def test_v11022_growth_state_summary_uses_text_main_direction_emoji_and_score_confidence():
    summary = _crop_summary()
    growth = _section(summary, "data-crop-ai-summary-growth-state", "data-crop-ai-summary-environment-risk")
    assert "작물상태" in growth
    assert "data-crop-ai-summary-growth-state-label" in growth
    assert "data-crop-ai-summary-growth-direction-emoji" in growth
    assert "data-crop-ai-summary-growth-state-score" in growth
    assert "data-crop-ai-summary-growth-state-confidence" in growth
    assert "강한 생식생장" in growth or "영양생장" in growth or "balanced" not in growth
    assert "스코어" in growth
    assert "신뢰" in growth


def test_v11022_environment_and_irrigation_are_summary_text_with_factor_score_confidence():
    summary = _crop_summary()
    env = _section(summary, "data-crop-ai-summary-environment-risk", "data-crop-ai-summary-irrigation-risk")
    irr = _section(summary, "data-crop-ai-summary-irrigation-risk", "data-crop-ai-summary-pest-risk")
    assert "환경요약" in env
    assert "환경리스크" not in env
    assert "data-crop-ai-summary-environment-label" in env
    assert "data-crop-ai-summary-environment-score" in env
    assert "data-crop-ai-summary-environment-confidence" in env
    assert "스코어" in env and "신뢰" in env
    for sample in ("고온", "저온", "온도급변"):
        assert sample in _read(PANEL)

    assert "관수요약" in irr
    assert "관수리스크" not in irr
    assert "data-crop-ai-summary-irrigation-label" in irr
    assert "data-crop-ai-summary-irrigation-score" in irr
    assert "data-crop-ai-summary-irrigation-confidence" in irr
    assert "스코어" in irr and "신뢰" in irr
    assert "높은 EC" in _read(PANEL) or "과관수" in _read(PANEL)


def test_v11022_pest_summary_main_value_is_score_and_subline_confidence():
    summary = _crop_summary()
    pest = _section(summary, "data-crop-ai-summary-pest-risk", "data-crop-ai-main-note")
    assert "병충해요약" in pest
    assert "병충해리스크" not in pest
    assert "data-crop-ai-summary-pest-score" in pest
    assert "data-crop-ai-summary-pest-confidence" in pest
    assert "신뢰" in pest
    assert "data-crop-ai-main-metric-value" in pest


def test_v11022_versions_and_docs_record_crop_summary_labels():
    panel = _read(PANEL)
    manifest = _read(MANIFEST)
    docs = _read(UI_DOC) + "\n" + _read(MASTER) + "\n" + _read(PLAN)
    assert '"version": "1.15.11"' in manifest
    assert 'const VERSION = "1.15.11"' in panel
    assert "v1.10.22 Crop summary card labels" in docs
    for marker in (
        "data-crop-ai-summary-stage-score",
        "data-crop-ai-summary-stage-confidence",
        "data-crop-ai-summary-growth-direction-emoji",
        "data-crop-ai-summary-environment-label",
        "data-crop-ai-summary-irrigation-label",
        "data-crop-ai-summary-pest-score",
    ):
        assert marker in panel
        assert marker in docs
