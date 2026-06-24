from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATTERN_DOC = ROOT / "docs/design/crop-ai-strategy-ui-dom-pattern.md"
CURRENT_UI = ROOT / "docs/design/current-ui-design-and-navigation.md"
MASTER = ROOT / "docs/PROJECT_MASTER_PLAN.md"
PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_ai_strategy_ui_dom_pattern_doc_exists_and_is_linked():
    pattern = _read(PATTERN_DOC)
    current = _read(CURRENT_UI)
    master = _read(MASTER)
    assert "Crop AI Strategy 하위탭 UI/DOM 표준 패턴" in pattern
    assert "crop-ai-strategy-ui-dom-pattern.md" in current
    assert "crop-ai-strategy-ui-dom-pattern.md" in master
    assert "Source-of-truth UI/DOM pattern" in current


def test_ai_strategy_pattern_doc_records_main_card_contract():
    pattern = _read(PATTERN_DOC)
    for marker in (
        'data-crop-ai-main-card="crop-status"',
        'data-crop-ai-main-card="interlock-status"',
        'data-crop-ai-main-card="model-status"',
        "data-crop-ai-main-card-header",
        "data-crop-ai-main-card-body",
        "data-crop-ai-main-card-chip-group",
        "data-crop-ai-main-metric-grid",
        "data-crop-ai-main-metric",
        "data-crop-ai-main-metric-label",
        "data-crop-ai-main-metric-value",
        "data-crop-ai-main-metric-help",
        "data-crop-ai-main-note",
        "data-crop-ai-main-action-row",
    ):
        assert marker in pattern


def test_ai_strategy_pattern_doc_records_detail_section_classification():
    pattern = _read(PATTERN_DOC)
    for marker in (
        'data-crop-ai-evidence-section="top-models"',
        'data-crop-ai-evidence-section="submodels"',
        'data-crop-ai-evidence-section="model-operations"',
        'data-crop-ai-evidence-section="center-reference"',
        'data-crop-ai-evidence-card="operator-workflow"',
        'data-crop-ai-evidence-card="quality-disorder"',
        'data-crop-ai-evidence-card="prediction-validation"',
        'data-crop-ai-evidence-card="training-dataset-export"',
        "data-center-crop-policy-card",
    ):
        assert marker in pattern


def test_ai_strategy_pattern_doc_records_forbidden_markers_and_current_panel_matches():
    pattern = _read(PATTERN_DOC)
    panel = _read(PANEL)
    forbidden = (
        "data-crop-ai-decision-flow",
        "data-crop-ai-decision-flow-steps",
        "data-crop-ai-flow-step",
        "data-crop-ai-list-header",
        "data-crop-ai-evidence-list",
        "data-crop-subtab-record-list",
        "data-center-crop-policy-execute",
        "centerCropPolicyAllowExecution",
    )
    for marker in forbidden:
        assert marker in pattern
    for removed_marker in (
        "data-crop-ai-decision-flow",
        "data-crop-ai-decision-flow-steps",
        "data-crop-ai-flow-step",
    ):
        assert removed_marker not in panel
