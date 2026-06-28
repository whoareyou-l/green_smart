from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "docs" / "rebuild" / "target-architecture.md"
GAP = ROOT / "docs" / "rebuild" / "master-docs-gap-inventory.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_target_architecture_has_implementation_grade_sections():
    doc = _read(TARGET)
    for marker in (
        "Target module tree",
        "Domain ownership matrix",
        "Route compatibility adapter policy",
        "DB physical/logical naming policy",
        "Safety and execution boundary",
        "Question gate",
        "First vertical rebuild slice selection gate",
    ):
        assert marker in doc


def test_target_architecture_defines_domain_layer_ownership():
    doc = _read(TARGET)
    for marker in (
        "Home",
        "Crop",
        "Environment",
        "Irrigation",
        "Device",
        "Safety",
        "Admin/System",
        "UI owner",
        "Frontend service owner",
        "Backend owner",
        "DB owner",
        "Safety owner",
    ):
        assert marker in doc


def test_target_architecture_blocks_unsafe_shortcuts():
    doc = _read(TARGET)
    for marker in (
        "RB-007 이후를 기존 계획대로 계속 진행하지 않는다",
        "physical table rename 금지",
        "route path breaking change 금지",
        "실제 장비/MQTT 물리 연결 금지",
        "prod stack cutover 금지",
        "AI output 직접 실행 권한 금지",
    ):
        assert marker in doc


def test_target_architecture_links_back_to_gap_inventory_and_master_docs():
    doc = _read(TARGET)
    gap = _read(GAP)
    assert "Master Docs Gap Inventory" in gap
    for marker in (
        "01-cba-ui-ux-spec.md",
        "02-interface-spec.md",
        "03-database-schema.md",
        "04-workflow-diagrams.md",
        "05-ml-interlock-failsafe-spec.md",
    ):
        assert marker in doc
