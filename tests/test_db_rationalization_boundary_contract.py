from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/design/current-db-rationalization.md"
PLAN = ROOT / "docs/plans/2026-07-02-db-rationalization-legacy-retirement-plan.md"
MANIFEST_DOC = ROOT / "docs/design/db-legacy-usage-manifest.md"
CUSTOM_COMPONENT = ROOT / "custom_components/green_smart"

HA_RECORDER_TABLES = {
    "event_data",
    "event_types",
    "events",
    "migration_changes",
    "recorder_runs",
    "schema_changes",
    "state_attributes",
    "states",
    "states_meta",
    "statistics",
    "statistics_meta",
    "statistics_runs",
    "statistics_short_term",
}

LEGACY_TABLES = {
    "zones",
    "crop_seasons",
    "growth_surveys",
    "pest_surveys",
    "control_records",
    "control_pesticides",
    "devices",
    "device_alarms",
    "device_control_logs",
    "device_failsafe_rules",
    "device_groups",
    "device_group_items",
    "device_interlocks",
    "device_status",
    "ventilation_device_settings",
    "screen_device_settings",
    "irrigation_settings",
    "sensor_readings",
    "irrigation_drain_feedback",
    "ai_irrigation_outputs",
    "final_irrigation_targets",
    "irrigation_control_logs",
    "audit_logs",
}

CURRENT_TABLES = {
    "green_smart_settings_greenhouses",
    "green_smart_settings_zones",
    "green_smart_settings_device_sensor_mappings",
    "gs_users",
    "gs_approval_requests",
    "gs_audit_logs",
    "green_smart_admin_role_mappings",
    "green_smart_admin_system_config",
    "green_smart_admin_diagnostics",
    "green_smart_admin_backups",
    "zone_control_settings",
    "zone_interlock_settings",
    "zone_control_modes",
    "zone_final_control_targets",
    "zone_control_logs",
    "zone_control_copy_jobs",
    "zone_device_entity_mappings",
    "ai_zone_control_outputs",
    "crop_interlock_approvals",
    "crop_stage_calibrations",
    "crop_model_feature_snapshots",
    "crop_model_training_snapshots",
    "edge_crop_policy_cache",
}

ALLOWED_BOOTSTRAP_FILES = {
    "db.py",
}


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _production_py_files() -> list[Path]:
    return sorted(p for p in CUSTOM_COMPONENT.rglob("*.py") if "__pycache__" not in p.parts)


def test_db_rationalization_version_surfaces_are_1_14_32():
    assert '"version": "1.14.41"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.41"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.41"' in _read(REBUILD_PANEL)


def test_db_rationalization_docs_classify_all_current_tables_and_protect_ha_recorder():
    doc = _read(DOC)
    plan = _read(PLAN)
    manifest = _read(MANIFEST_DOC)
    for phrase in [
        "HA 기본 테이블",
        "Green Smart 레거시/호환 테이블",
        "Green Smart 현재/신규 테이블",
        "운영 DB 구조 변경 없음",
        "레거시 사용 금지 경계",
        "archive/drop은 명시 승인 후",
    ]:
        assert phrase in doc
    for table in sorted(HA_RECORDER_TABLES | LEGACY_TABLES | CURRENT_TABLES):
        assert f"`{table}`" in doc or f"| {table} |" in doc
    assert "Total tables: `59`" in doc
    assert "HA recorder tables are protected" in manifest
    assert "DB-00" in plan and "DB-01" in plan


def test_no_destructive_sql_against_ha_or_legacy_tables_without_approval_marker():
    forbidden = re.compile(r"\b(DROP\s+TABLE|RENAME\s+TABLE|TRUNCATE\s+TABLE)\b", re.I)
    offenders = []
    for path in _production_py_files():
        text = _read(path)
        for match in forbidden.finditer(text):
            offenders.append(f"{path.relative_to(CUSTOM_COMPONENT)}:{match.group(1)}")
    assert offenders == []


def _contains_legacy_sql_table_reference(text: str, table: str) -> bool:
    """Return true for SQL table tokens, not incidental words/import paths."""
    table_pattern = re.escape(table)
    sql_table_reference = re.compile(
        rf"\b(FROM|JOIN|UPDATE|INTO|DELETE\s+FROM)\s+`?{table_pattern}`?\b",
        re.I,
    )
    return bool(sql_table_reference.search(text))


def test_legacy_table_direct_usage_is_quarantined_in_manifest_not_untracked():
    manifest = _read(MANIFEST_DOC)
    offenders = []
    for path in _production_py_files():
        relative = str(path.relative_to(CUSTOM_COMPONENT))
        text = _read(path)
        for table in sorted(LEGACY_TABLES):
            if _contains_legacy_sql_table_reference(text, table):
                if relative in ALLOWED_BOOTSTRAP_FILES:
                    continue
                marker = f"`{relative}` -> `{table}`"
                if marker not in manifest:
                    offenders.append(marker)
    assert offenders == []


def test_current_product_tables_are_the_only_non_legacy_canonical_targets_in_doc():
    doc = _read(DOC)
    for table in sorted(CURRENT_TABLES):
        assert f"`{table}`" in doc
    for legacy in ["zones", "crop_seasons", "growth_surveys", "pest_surveys", "control_records", "control_pesticides"]:
        assert f"`{legacy}` → 이관 대상" in doc
