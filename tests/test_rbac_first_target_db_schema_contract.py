from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MASTER_DB = ROOT / "docs" / "master" / "03-database-schema.md"
RATIONALIZATION = ROOT / "docs" / "rebuild" / "db-schema-rationalization-plan.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_master_db_schema_is_rbac_first_target_model_not_legacy_physical_baseline():
    doc = _read(MASTER_DB)
    required = (
        "# 3. DB 구상도 — RBAC-first Target Database Schema",
        "기준 버전: `v1.14.46`",
        "RBAC-first target schema",
        "legacy physical schema is adapter-only",
        "실제 운영 DB migration은 별도 승인 slice 전까지 금지",
        "## 1. Target schema principles",
        "## 2. RBAC and audit core",
        "## 3. Farm, zone, and crop cycle core",
        "## 4. Observation and work records",
        "## 5. Device, entity, and sensor core",
        "## 6. Strategy, recommendation, approval, and execution",
        "## 7. Safety, interlock, failsafe, and events",
        "## 8. Configuration, integration, and external adapters",
        "## 9. Legacy adapter boundary",
    )
    for marker in required:
        assert marker in doc

    early = "\n".join(doc.splitlines()[:80])
    forbidden_early = (
        "현재 물리 DB는 `crop_seasons`",
        "R4 implementation compatibility",
        "crop_seasons row로 호환 유지",
    )
    for marker in forbidden_early:
        assert marker not in early


def test_master_db_schema_defines_new_canonical_tables_and_fields():
    doc = _read(MASTER_DB)
    for table in (
        "gs_users",
        "gs_roles",
        "gs_permissions",
        "gs_user_role_assignments",
        "gs_role_permission_grants",
        "gs_audit_events",
        "gs_farms",
        "gs_zones",
        "gs_crop_cycles",
        "gs_zone_crop_cycle_assignments",
        "gs_growth_observations",
        "gs_pest_scouting_records",
        "gs_treatment_records",
        "gs_devices",
        "gs_device_entity_bindings",
        "gs_sensor_observations",
        "gs_strategy_runs",
        "gs_recommendations",
        "gs_approval_requests",
        "gs_execution_commands",
        "gs_execution_results",
        "gs_safety_rules",
        "gs_interlock_rules",
        "gs_failsafe_events",
        "gs_system_settings",
    ):
        assert f"CREATE TABLE {table}" in doc

    for field in (
        "actor_user_id",
        "required_permission_code",
        "crop_cycle_id",
        "current_crop_cycle_id",
        "zone_id",
        "farm_id",
        "rbac_scope_type",
        "decision_status",
        "safety_decision_json",
        "interlock_result_json",
        "execution_enabled",
        "read_only",
    ):
        assert field in doc


def test_master_db_schema_has_rbac_permission_matrix_and_api_mapping():
    doc = _read(MASTER_DB)
    for marker in (
        "admin",
        "farm_owner",
        "farm_staff",
        "crop_cycle.read",
        "crop_cycle.write",
        "home_context.read",
        "device.mapping.manage",
        "recommendation.approve",
        "execution.dry_run",
        "execution.command",
        "safety.event.ack",
        "safety.event.clear",
        "GET /api/green_smart/rebuild/home/context",
        "home_context.read",
        "readOnly: true",
        "executionEnabled: false",
    ):
        assert marker in doc


def test_rebuild_rationalization_records_rs008_schema_rewrite_and_migration_gate():
    doc = _read(RATIONALIZATION)
    for marker in (
        "RS-008 RBAC-first target schema rewrite",
        "legacy physical schema is adapter-only",
        "canonical target tables use `gs_` prefix",
        "crop_cycle is product/API canonical",
        "crop_seasons is legacy adapter terminology only",
        "No physical migration in RS-008",
        "migration requires explicit user approval",
    ):
        assert marker in doc
