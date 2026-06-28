from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
BASELINE = ROOT / "docs/rebuild/r5-foundation-completion-baseline.md"
PRODUCT_PLAN = ROOT / "docs/plans/2026-06-28-green-smart-product-first-rebuild-plan.md"
EXEC_PLAN = ROOT / "docs/plans/2026-06-28-from-scratch-rebuild-execution-plan.md"
TARGET_ARCH = ROOT / "docs/rebuild/target-architecture.md"
MASTER_README = ROOT / "docs/master/README.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r5_foundation_completion_version_surfaces_are_1_12_30():
    assert '"version": "1.12.40"' in _read(MANIFEST)
    assert 'const VERSION = "1.12.40"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.12.40"' in _read(REBUILD_PANEL)
    for path in (BASELINE, PRODUCT_PLAN, EXEC_PLAN, TARGET_ARCH, MASTER_README):
        assert "v1.12.40" in _read(path)


def test_r5_foundation_baseline_document_closes_vs_n001_to_vs_n004():
    text = _read(BASELINE)
    for marker in (
        "# R5 Foundation Completion Baseline",
        "Status: R5 foundation complete",
        "VS-N001 RBAC/Admin ownership scaffold",
        "VS-N002 Crop cycle recording scaffold",
        "VS-N003 Real-time monitoring read-only scaffold",
        "VS-N004 Interlock/Safety core scaffold",
        "RBAC/Admin ownership scaffold → Crop cycle recording scaffold → Real-time monitoring read-only slice → Interlock/Safety core scaffold",
        "R5 foundation complete before runtime adapters",
        "R5 foundation complete before panel read-only cards",
        "R5 foundation complete before SafetyGuard/Interlock adapters",
    ):
        assert marker in text


def test_r5_foundation_baseline_preserves_no_authority_boundaries():
    text = _read(BASELINE)
    for marker in (
        "No DB migration in R5 foundation closure",
        "No write/mutation in R5 foundation closure",
        "No runtime adapter in R5 foundation closure",
        "No panel read-only card in R5 foundation closure",
        "No SafetyGuard runtime behavior change in R5 foundation closure",
        "No Interlock runtime behavior change in R5 foundation closure",
        "No execution decision change in R5 foundation closure",
        "No approval/override release in R5 foundation closure",
        "No MQTT/device command in R5 foundation closure",
        "question gates must use clarify tool",
    ):
        assert marker in text


def test_r5_foundation_next_phase_gate_is_documented_without_auto_advancing():
    text = _read(BASELINE)
    for marker in (
        "Next phase requires a fresh clarify question",
        "Runtime read-only adapter slice",
        "Panel read-only display slice",
        "SafetyGuard/Interlock read-only adapter slice",
        "Crop-centered product UI continuation slice",
        "Do not auto-advance from R5 foundation closure into runtime/UI/adapter work",
    ):
        assert marker in text


def test_source_docs_link_r5_foundation_completion_baseline():
    for path in (PRODUCT_PLAN, EXEC_PLAN, TARGET_ARCH, MASTER_README):
        text = _read(path)
        assert "R5 Foundation Completion Baseline" in text
        assert "docs/rebuild/r5-foundation-completion-baseline.md" in text
        assert "R5 foundation complete before runtime adapters" in text
        assert "question gates must use clarify tool" in text
