from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
CENTRAL = ROOT / "custom_components/green_smart/central_views.py"
UI_DOC = ROOT / "docs/design/current-ui-design-and-navigation.md"
PLAN = ROOT / "docs/plans/2026-06-24-crop-settings-ui-slice-plan.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_v1977_cross_subpage_consistency_markers_exist():
    panel = _read(PANEL)
    docs = _read(UI_DOC)
    plan = _read(PLAN)

    for marker in (
        "data-crop-consistency-shell",
        "data-crop-consistency-mobile-safe",
        "data-crop-consistency-action-row",
        "data-crop-consistency-card-radius",
        "data-crop-consistency-final-pass",
        "모바일 360px 기준",
        "모바일 360px 기준",
    ):
        assert marker in panel
        assert marker in docs
        assert marker in plan


def test_v1977_all_crop_subpages_have_summary_and_action_hierarchy():
    panel = _read(PANEL)

    required_subpage_markers = (
        "data-crop-basic-summary-card",
        "data-crop-growth-workflow-card",
        "data-crop-ai-primary-summary",
        "data-crop-pest-summary-card",
        "data-crop-control-safety-summary",
        "data-crop-ai-next-action",
        "data-crop-pest-next-action",
        "data-crop-control-next-check",
        "data-crop-basic-record-actions",
        "data-crop-growth-record-actions",
        "data-crop-pest-delete-action",
        "data-crop-control-delete-action",
    )
    for marker in required_subpage_markers:
        assert marker in panel

    assert panel.count("data-crop-consistency-action-row") >= 5
    assert panel.count("data-crop-consistency-mobile-safe") >= 5


def test_v1977_no_hidden_duplicate_or_scope_breaking_markers():
    panel = _read(PANEL)
    docs = _read(UI_DOC)
    plan = _read(PLAN)

    forbidden = (
        "data-crop-ai-execute-device",
        "data-crop-ai-train-production-model",
        "data-crop-pest-control-form",
        "data-crop-pest-apply-treatment",
        "data-crop-control-execute-spray",
        "data-crop-control-auto-apply",
        "centerPolicyAllowExecution",
        "cropAiAllowExecution",
        "pestAllowPesticideExecution",
        "controlAllowPesticideExecution",
        "autoSchedulePesticideApplication",
    )
    for marker in forbidden:
        assert marker not in panel
        assert marker in docs
        assert marker in plan

    assert "data-crop-hidden-duplicate-card" not in panel
    assert "raw lettuce" not in panel.lower()


def test_v1977_cross_subpage_version_markers():
    manifest = _read(MANIFEST)
    panel = _read(PANEL)
    central = _read(CENTRAL)
    docs = _read(UI_DOC)
    plan = _read(PLAN)

    assert '"version": "1.12.66"' in manifest
    assert 'const VERSION = "1.12.66"' in panel
    assert 'v1.12.66' in panel[:200]
    assert 'EDGE_VERSION = "1.9.96"' in central
    assert '기준 버전: `v1.12.66`' in docs
    assert 'UI Slice 6 | v1.9.77 | Cross-subpage consistency pass' in plan
    assert 'Crop Settings subpage consistency final state' in docs
