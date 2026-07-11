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


def test_v11024_crop_summary_visible_subtitle_is_model_output_summary():
    summary = _crop_summary()
    assert "이번 주 모델을 통해서 출력된 작물 상태의 요약입니다." in summary
    assert "이번 주 작물 판단 요약" not in summary
    assert "농장주/직원이 먼저 확인할 작물 상태입니다" not in summary


def test_v11024_crop_summary_removes_internal_hint_chips_from_visible_ui():
    summary = _crop_summary()
    for removed in (
        ">작물 요약</span>",
        "상세 근거는 모델 상태 카드",
        "농장주/직원용 요약 우선 · read-only · 자동 실행 없음",
    ):
        assert removed not in summary
    assert "data-crop-ai-main-action-row" not in summary
    assert "data-crop-ai-main-card-chip-group" not in summary


def test_v11024_internal_boundary_notes_are_documented_not_visible_in_crop_summary():
    docs = _read(UI_DOC) + "\n" + _read(MASTER)
    summary = _crop_summary()
    for internal_text in (
        "read-only",
        "자동 실행 없음",
        "상세 근거는 모델 상태 카드",
        "농장주/직원용 요약 우선",
    ):
        assert internal_text not in summary
        assert internal_text in docs


def test_v11024_versions_and_docs_record_visible_text_cleanup():
    panel = _read(PANEL)
    manifest = _read(MANIFEST)
    docs = _read(UI_DOC) + "\n" + _read(MASTER)
    assert '"version": "1.15.32"' in manifest
    assert 'const VERSION = "1.15.32"' in panel
    assert "v1.10.24 Crop summary visible text cleanup" in docs
