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


def _report() -> str:
    panel = _read(PANEL)
    return _section(panel, "  _renderGrowthReportCard()", "  _renderCenterCropInterlockAnalyticsCard")


def _interlock_summary() -> str:
    return _section(_report(), "data-crop-ai-safety-interlock-summary", "data-crop-ai-model-status-summary")


def test_v11025_interlock_summary_replaces_redundant_note():
    summary = _interlock_summary()
    assert "상태 요약" in summary
    assert "현재 작물 모델 적용 전 확인이 필요한 안전·승인 상태입니다." in summary
    assert "안전/인터록 확인" not in summary
    assert "안전상태 · 인터록 상태 · 오류건수를 먼저 확인합니다." not in summary


def test_v11025_approval_gate_and_buttons_are_not_visible_in_summary():
    summary = _interlock_summary()
    before_modal = summary.split("data-crop-ai-interlock-detail-modal", 1)[0]
    for text in (
        "승인 gate:",
        "승인으로 해소",
        "미해소 차단",
        "운영자 확인",
        "농장주 승인",
        "관리자 승인",
    ):
        assert text not in before_modal
    assert "data-crop-interlock-approval-gate" not in before_modal
    assert "data-crop-interlock-approve" not in before_modal
    assert "data-crop-ai-interlock-actions" not in before_modal


def test_v11025_error_count_opens_detail_modal_and_modal_keeps_approval_actions():
    summary = _interlock_summary()
    assert "data-crop-ai-error-count-open" in summary
    assert "data-crop-ai-interlock-detail-modal" in summary
    assert "data-crop-ai-interlock-detail-close" in summary
    modal = _section(summary, "data-crop-ai-interlock-detail-modal", "data-crop-ai-main-card-chip-group")
    for marker in (
        "data-crop-ai-interlock-modal-gate",
        "data-crop-ai-interlock-modal-resolved",
        "data-crop-ai-interlock-modal-unresolved",
        "data-crop-ai-interlock-modal-actions",
        "data-crop-interlock-approval-gate",
        "data-crop-interlock-approve",
    ):
        assert marker in modal
    for text in ("승인 gate", "승인으로 해소", "미해소 차단", "운영자 확인", "농장주 승인", "관리자 승인"):
        assert text in modal


def test_v11025_error_count_modal_binding_exists():
    panel = _read(PANEL)
    assert "data-crop-ai-error-count-open" in panel
    assert "data-crop-ai-interlock-detail-modal" in panel
    assert "data-crop-ai-interlock-detail-close" in panel
    assert "querySelectorAll(\"[data-crop-ai-error-count-open]\")" in panel
    assert "querySelectorAll(\"[data-crop-ai-interlock-detail-close]\")" in panel
    assert "hidden = false" in panel
    assert "hidden = true" in panel


def test_v11026_interlock_detail_modal_is_hidden_until_error_count_click():
    summary = _interlock_summary()
    modal_open = summary.split("data-crop-ai-interlock-detail-modal", 1)[1].split(">", 1)[0]
    assert "display:none" in modal_open
    assert "display:flex" not in modal_open
    panel = _read(PANEL)
    assert "modal.style.display = \"flex\"" in panel
    assert "modal.style.display = \"none\"" in panel


def test_v11025_versions_and_docs_record_interlock_modal():
    panel = _read(PANEL)
    manifest = _read(MANIFEST)
    docs = _read(UI_DOC) + "\n" + _read(MASTER)
    assert '"version": "1.12.25"' in manifest
    assert 'const VERSION = "1.12.25"' in panel
    assert "v1.10.25 Interlock detail modal" in docs
    assert "v1.12.25 Interlock detail modal hidden hotfix" in docs
    for marker in (
        "data-crop-ai-error-count-open",
        "data-crop-ai-interlock-detail-modal",
        "data-crop-ai-interlock-modal-gate",
        "data-crop-ai-interlock-modal-actions",
    ):
        assert marker in panel
        assert marker in docs
