from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
UI_DOC = ROOT / "docs/design/current-ui-design-and-navigation.md"
MASTER = ROOT / "docs/PROJECT_MASTER_PLAN.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _section(text: str, start: str, end: str) -> str:
    return text.split(start, 1)[1].split(end, 1)[0]


def _crop_summary() -> str:
    panel = _read(PANEL)
    report = _section(panel, "  _renderGrowthReportCard()", "  _renderCenterCropInterlockAnalyticsCard")
    return _section(report, "data-crop-ai-crop-summary", "data-crop-ai-safety-interlock-summary")


def test_v11023_environment_summary_never_uses_stable_fallback_and_subline_is_score_confidence_only():
    panel = _read(PANEL)
    summary = _crop_summary()
    env = _section(summary, "data-crop-ai-summary-environment-risk", "data-crop-ai-summary-irrigation-risk")
    assert "환경요약" in env
    assert 'environmentRiskLabelMap[environmentRiskKey] || "환경 정보 부족"' in panel
    assert 'environmentRiskScore > 0 ? "환경 변동" : "안정"' not in panel
    assert "data-crop-ai-summary-environment-label" in env
    assert "data-crop-ai-summary-environment-score" in env
    assert "data-crop-ai-summary-environment-confidence" in env
    assert "고온 · 저온 · 온도급변 기준" not in env
    assert "스코어" in env and "신뢰" in env


def test_v11023_irrigation_summary_never_uses_stable_fallback_and_subline_is_score_confidence_only():
    panel = _read(PANEL)
    summary = _crop_summary()
    irr = _section(summary, "data-crop-ai-summary-irrigation-risk", "data-crop-ai-summary-pest-risk")
    assert "관수요약" in irr
    assert 'irrigationRiskLabelMap[irrigationRiskKey] || "관수 정보 부족"' in panel
    assert 'irrigationRiskScore > 0 ? "관수 변동" : "안정"' not in panel
    assert "data-crop-ai-summary-irrigation-label" in irr
    assert "data-crop-ai-summary-irrigation-score" in irr
    assert "data-crop-ai-summary-irrigation-confidence" in irr
    assert "높은 EC · 과관수 기준" not in irr
    assert "스코어" in irr and "신뢰" in irr


def test_v11023_pest_summary_main_value_is_severity_text_and_subline_has_score_confidence():
    panel = _read(PANEL)
    summary = _crop_summary()
    pest = _section(summary, "data-crop-ai-summary-pest-risk", "data-crop-ai-main-note")
    assert "병충해요약" in pest
    assert "data-crop-ai-summary-pest-label" in pest
    assert "data-crop-ai-summary-pest-score" in pest
    assert "data-crop-ai-summary-pest-confidence" in pest
    for label in ("매우심각", "심각", "보통"):
        assert label in panel
    assert "data-crop-ai-summary-pest-score data-crop-ai-main-metric-value" not in pest
    assert "스코어" in pest and "신뢰" in pest


def test_v11023_growth_state_direction_emoji_shows_direction_not_crop_icon():
    panel = _read(PANEL)
    summary = _crop_summary()
    growth = _section(summary, "data-crop-ai-summary-growth-state", "data-crop-ai-summary-environment-risk")
    assert "data-crop-ai-summary-growth-direction-emoji" in growth
    assert '"↗️"' in panel
    assert '"↘️"' in panel
    assert '"⏫"' in panel
    assert '"⏬"' in panel
    assert '"🍅"' not in panel
    assert '"🌿"' not in panel


def test_v11023_versions_and_docs_record_operator_label_hotfix():
    panel = _read(PANEL)
    manifest = _read(MANIFEST)
    docs = _read(UI_DOC) + "\n" + _read(MASTER)
    assert '"version": "1.14.17"' in manifest
    assert 'const VERSION = "1.14.17"' in panel
    assert "v1.10.23 Crop summary operator labels" in docs
    for marker in (
        "data-crop-ai-summary-environment-label",
        "data-crop-ai-summary-irrigation-label",
        "data-crop-ai-summary-pest-label",
        "data-crop-ai-summary-growth-direction-emoji",
    ):
        assert marker in panel
        assert marker in docs
