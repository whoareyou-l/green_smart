from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MASTER_DIR = ROOT / "docs" / "master"
GAP = ROOT / "docs" / "rebuild" / "master-docs-gap-inventory.md"
README = MASTER_DIR / "README.md"
EXEC_PLAN = ROOT / "docs" / "plans" / "2026-06-28-from-scratch-rebuild-execution-plan.md"
TARGET_ARCH = ROOT / "docs" / "rebuild" / "target-architecture.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_from_scratch_execution_plan_exists_and_sets_question_gate():
    plan = _read(EXEC_PLAN)
    assert "Green Smart From-Scratch Rebuild Execution Plan" in plan
    assert "기존 RB 계속 진행 금지" in plan
    assert "질문 기준" in plan
    assert "한 질문만" in plan
    assert "Stage 1 — Master Docs Gap Inventory" in plan
    assert "Stage 3 — First Vertical Rebuild Slice Selection" in plan


def test_master_docs_gap_inventory_exists_and_covers_all_five_docs():
    gap = _read(GAP)
    for marker in (
        "Master Docs Gap Inventory",
        "from-scratch rebuild 기준",
        "01-cba-ui-ux-spec.md",
        "02-interface-spec.md",
        "03-database-schema.md",
        "04-workflow-diagrams.md",
        "05-ml-interlock-failsafe-spec.md",
        "기존 RB 산출물은 reference/evidence",
        "active VS-003 진행 중 표현은 historical/reference로 격하",
        "질문 gate",
        "첫 vertical rebuild slice 선택은 사용자 질문 필요",
    ):
        assert marker in gap


def test_master_readme_points_to_from_scratch_rebuild_not_active_vs003():
    readme = _read(README)
    assert "from-scratch rebuild 기준선" in readme
    assert "docs/rebuild/target-architecture.md" in readme
    assert "docs/rebuild/master-docs-gap-inventory.md" in readme
    assert "현재 진행 수직 슬라이드 — VS-003" not in readme
    assert "Historical reference — VS-003" in readme
    assert "첫 vertical rebuild slice는 Stage 3에서 사용자 질문 후 선택" in readme


def test_target_architecture_and_gap_inventory_are_linked():
    target = _read(TARGET_ARCH)
    gap = _read(GAP)
    assert "docs/master 5대 문서 현행화" in target
    assert "Master Docs Gap Inventory" in gap
    assert "target architecture" in gap
    assert "새 master docs → 새 target architecture → 새 vertical slice scaffold" in gap
