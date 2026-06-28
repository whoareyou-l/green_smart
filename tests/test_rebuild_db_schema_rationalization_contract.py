from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT / "docs" / "rebuild" / "db-schema-rationalization-plan.md"
PRODUCT_PLAN = ROOT / "docs" / "plans" / "2026-06-28-green-smart-product-first-rebuild-plan.md"
MASTER = ROOT / "docs" / "PROJECT_MASTER_PLAN.md"
MASTER_DB = ROOT / "docs" / "master" / "03-database-schema.md"
MANIFEST = ROOT / "custom_components" / "green_smart" / "manifest.json"
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
DB = ROOT / "custom_components" / "green_smart" / "db.py"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_rs008_version_surfaces_are_v1127():
    assert '"version": "1.12.17"' in _read(MANIFEST)
    assert 'const VERSION = "1.12.17"' in _read(PANEL)
    assert "v1.12.17" in _read(PLAN)
    assert "v1.12.17" in _read(PRODUCT_PLAN)
    assert "v1.12.17" in _read(MASTER)
    assert "v1.12.17" in _read(MASTER_DB)


def test_rs008_target_schema_uses_rbac_first_gs_prefix_and_crop_cycle_direction():
    master_db = _read(MASTER_DB)
    plan = _read(PLAN)
    for marker in (
        "RBAC-first target schema",
        "legacy physical schema is adapter-only",
        "canonical target tables use `gs_` prefix",
        "crop_cycle is product/API canonical",
        "crop_seasons is legacy adapter terminology only",
        "CREATE TABLE gs_users",
        "CREATE TABLE gs_roles",
        "CREATE TABLE gs_permissions",
        "CREATE TABLE gs_crop_cycles",
        "CREATE TABLE gs_zone_crop_cycle_assignments",
    ):
        assert marker in master_db or marker in plan


def test_rs008_physical_db_is_not_migrated_in_this_slice():
    db = _read(DB)
    plan = _read(PLAN)
    # Existing runtime schema remains untouched until explicit migration approval.
    assert "CREATE TABLE IF NOT EXISTS crop_seasons" in db
    assert "CREATE TABLE IF NOT EXISTS gs_crop_cycles" not in db
    assert "RENAME TABLE" not in db
    assert "ALTER TABLE crop_seasons RENAME" not in db
    for marker in (
        "No physical migration in RS-008",
        "migration requires explicit user approval",
        "Prod DB migration | 금지",
        "Physical table rename | 금지",
        "Column rename/backfill | 금지",
    ):
        assert marker in plan


def test_rs008_target_schema_separates_recommendation_approval_execution_safety():
    master_db = _read(MASTER_DB)
    for marker in (
        "CREATE TABLE gs_strategy_runs",
        "CREATE TABLE gs_recommendations",
        "CREATE TABLE gs_approval_requests",
        "CREATE TABLE gs_execution_commands",
        "CREATE TABLE gs_execution_results",
        "CREATE TABLE gs_safety_rules",
        "CREATE TABLE gs_interlock_rules",
        "CREATE TABLE gs_failsafe_events",
        "recommendation.approve",
        "execution.dry_run",
        "execution.command",
        "safety.event.ack",
        "safety.event.clear",
    ):
        assert marker in master_db


def test_rs008_product_plan_and_master_link_db_rationalization_docs():
    product_plan = _read(PRODUCT_PLAN)
    master = _read(MASTER)
    for marker in (
        "docs/rebuild/db-schema-rationalization-plan.md",
        "docs/master/03-database-schema.md",
    ):
        assert marker in product_plan
        assert marker in master
