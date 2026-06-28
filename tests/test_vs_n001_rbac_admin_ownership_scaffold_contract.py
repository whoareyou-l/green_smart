from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCAFFOLD = ROOT / "docs" / "rebuild" / "vs-n001-rbac-admin-ownership-scaffold.md"
TARGET = ROOT / "docs" / "rebuild" / "target-architecture.md"
PLAN = ROOT / "docs" / "plans" / "2026-06-28-vs-n001-rbac-admin-ownership-scaffold-plan.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_vs_n001_plan_exists_and_keeps_scope_documentation_first():
    plan = _read(PLAN)
    for marker in (
        "VS-N001 RBAC/Admin Ownership Scaffold Implementation Plan",
        "No DB migration",
        "No existing RBAC runtime rewrite in this planning slice",
        "backend permission enforcement before UI-only hiding",
        "Ask the user only if role semantics or backend permission ownership conflicts",
    ):
        assert marker in plan


def test_vs_n001_scaffold_doc_exists_with_role_and_permission_matrix():
    doc = _read(SCAFFOLD)
    for marker in (
        "VS-N001 RBAC/Admin Ownership Scaffold",
        "Role ownership matrix",
        "`admin`",
        "`farm_owner`",
        "`farm_staff`",
        "Permission bucket matrix",
        "조회 / 기록 / 전략 / 실행 / 안전 / 고급설정",
        "visible_enabled",
        "visible_disabled",
        "summary_only",
        "hidden",
    ):
        assert marker in doc


def test_vs_n001_scaffold_requires_backend_enforcement_and_admin_ownership():
    doc = _read(SCAFFOLD)
    for marker in (
        "backend permission enforcement before UI-only hiding",
        "write/execute/save/delete/ack/clear/apply",
        "Admin/System ownership matrix",
        "HA user ID remains the identity source",
        "No DB migration",
        "No prod stack change",
        "No physical MQTT/device hookup",
    ):
        assert marker in doc


def test_vs_n001_question_gates_are_explicit():
    doc = _read(SCAFFOLD)
    for marker in (
        "Question gate",
        "farm_owner can manage farm_staff role assignment",
        "role mapping stays HA-user-ID based",
        "farm_staff write/execute permission expansion",
        "DB physical RBAC tables should be migrated",
        "Confirmed decision: farm_owner can manage farm_staff role assignment for operational convenience",
        "limited to assigning/revoking `farm_staff` role",
        "must not grant farm_owner access to admin-only system config",
    ):
        assert marker in doc


def test_target_architecture_links_to_vs_n001():
    target = _read(TARGET)
    assert "VS-N001 RBAC/Admin ownership scaffold" in target
    assert "docs/rebuild/vs-n001-rbac-admin-ownership-scaffold.md" in target
