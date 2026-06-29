from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VIEWS = ROOT / "custom_components" / "green_smart" / "zone_control_views.py"
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
MANIFEST = ROOT / "custom_components" / "green_smart" / "manifest.json"
README = ROOT / "docs" / "master" / "README.md"
WORKFLOW = ROOT / "docs" / "master" / "04-workflow-diagrams.md"
INTERFACE = ROOT / "docs" / "master" / "02-interface-spec.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_vs002_version_surfaces_are_current():
    panel = _read(PANEL)
    manifest = _read(MANIFEST)
    readme = _read(README)
    workflow = _read(WORKFLOW)

    assert '"version": "1.12.78"' in manifest
    assert 'const VERSION = "1.12.78"' in panel
    assert "v1.12.78" in panel[:200]
    assert "기준 버전: `v1.12.78`" in readme
    assert "기준 버전: `v1.12.78`" in workflow


def test_vs002_backend_has_roof_window_dry_run_contract_markers():
    views = _read(VIEWS)

    for marker in (
        "_vs002_roof_window_dry_run_target",
        "roof_window_open_pct",
        "command_id",
        "tolerance_pct",
        "timeout_ms",
        "actualServiceCallSuppressed",
        "vs002_roof_window_dry_run",
        "cover.set_cover_position",
        "position",
        "stateVerification",
        "dry_run",
    ):
        assert marker in views


def test_vs002_panel_has_roof_window_dry_run_operator_card():
    panel = _read(PANEL)

    for marker in (
        "data-vs002-roof-window-dry-run-card",
        "data-vs002-roof-window-position",
        "data-vs002-roof-window-dry-run",
        "data-vs002-roof-window-result",
        "천창 개폐 Dry Run",
        "roof_window_open_pct",
        "actualServiceCallSuppressed",
        "green_smart/zones/execute-final-targets",
    ):
        assert marker in panel


def test_vs002_docs_define_endpoint_and_workflow_contract():
    interface = _read(INTERFACE)
    workflow = _read(WORKFLOW)

    for marker in (
        "VS-002 천창 개폐 Dry Run 제어",
        "roof_window_open_pct",
        "dry_run",
        "actualServiceCallSuppressed",
        "command_id",
        "tolerance_pct",
        "timeout_ms",
        "POST | `/api/green_smart/zones/execute-final-targets`",
    ):
        assert marker in interface + "\n" + workflow
