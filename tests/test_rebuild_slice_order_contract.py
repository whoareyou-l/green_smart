from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "docs" / "rebuild" / "target-architecture.md"
EXEC_PLAN = ROOT / "docs" / "plans" / "2026-06-28-from-scratch-rebuild-execution-plan.md"
GAP = ROOT / "docs" / "rebuild" / "master-docs-gap-inventory.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_user_confirmed_first_rebuild_slice_order():
    target = _read(TARGET)
    plan = _read(EXEC_PLAN)
    gap = _read(GAP)

    for doc in (target, plan, gap):
        assert "Confirmed decision: first rebuild slice order" in doc
        assert "1. RBAC/Admin ownership scaffold" in doc
        assert "2. Crop cycle recording scaffold" in doc
        assert "3. Real-time monitoring read-only slice" in doc
        assert "4. Interlock/Safety core scaffold" in doc


def test_rbac_first_reason_is_documented():
    target = _read(TARGET)
    for marker in (
        "RBAC first because permission ownership must exist before records, monitoring scope, and interlock approval",
        "farm_staff",
        "farm_owner",
        "admin",
        "backend permission enforcement before UI-only hiding",
    ):
        assert marker in target


def test_first_slice_is_rbac_not_old_rb007():
    plan = _read(EXEC_PLAN)
    assert "First selected slice: VS-N001 RBAC/Admin ownership scaffold" in plan
    assert "RB-007" not in plan.split("First selected slice: VS-N001 RBAC/Admin ownership scaffold", 1)[1]
