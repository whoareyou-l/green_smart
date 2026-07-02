from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INVENTORY = ROOT / "docs" / "rebuild" / "current-state-inventory.md"
RISK = ROOT / "docs" / "rebuild" / "rebuild-risk-register.md"
PLAN = ROOT / "docs" / "plans" / "2026-06-28-green-smart-product-first-rebuild-plan.md"
MANIFEST = ROOT / "custom_components" / "green_smart" / "manifest.json"
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
CROP_VIEWS = ROOT / "custom_components" / "green_smart" / "crop_views.py"
ZONE_VIEWS = ROOT / "custom_components" / "green_smart" / "zone_control_views.py"
DB = ROOT / "custom_components" / "green_smart" / "db.py"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r0_release_version_is_v1110_everywhere():
    assert '"version": "1.14.17"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.17"' in _read(PANEL)
    assert "v1.14.17" in _read(INVENTORY)
    assert "v1.14.17" in _read(RISK)
    assert "v1.14.17" in _read(PLAN)


def test_r0_inventory_freezes_current_monolith_hotspots_and_counts():
    inventory = _read(INVENTORY)
    assert len(_read(PANEL).splitlines()) >= 9000
    assert len(_read(CROP_VIEWS).splitlines()) >= 4000
    assert len(_read(ZONE_VIEWS).splitlines()) >= 2000
    assert "10,007" in inventory
    assert "4,946" in inventory
    assert "2,737" in inventory
    assert "99" in inventory
    assert "89" in inventory
    assert "40" in inventory


def test_r0_inventory_defines_preserved_contracts_and_rebuild_targets():
    inventory = _read(INVENTORY)
    for marker in (
        "Home Assistant custom integration/HACS 구조 유지",
        "`green-smart-panel` custom element 유지",
        "기존 `/api/green_smart/*` route path 유지",
        "`crop_seasons` 물리 테이블은 당장 유지",
        "SafetyGuard/Interlock/Operator confirmation 없이 AI output을 실행하지 않음",
        "실제 장비/MQTT 직접 연결은 virtual rehearsal 전까지 금지",
        "Panel monolith",
        "API monolith",
        "Zone control 혼재",
        "문서 기준",
    ):
        assert marker in inventory


def test_r0_risk_register_blocks_unsafe_changes_before_rebuild_execution():
    risk = _read(RISK)
    for marker in (
        "R0 prod 변경 | 금지",
        "R0 DB migration | 금지",
        "R0 신규 기능 | 금지",
        "prod cutover | R6 이후 별도 승인 필요",
        "RISK-001",
        "RISK-003",
        "RISK-005",
        "RISK-012",
        "실제 DB migration이 필요한 경우",
        "prod container stop/recreate/cutover가 필요한 경우",
    ):
        assert marker in risk


def test_r0_db_inventory_mentions_core_four_pillars():
    inventory = _read(INVENTORY)
    db = _read(DB)
    for table in (
        "zones",
        "crop_seasons",
        "growth_surveys",
        "sensor_readings",
        "zone_control_logs",
        "green_smart_admin_role_mappings",
    ):
        assert f"CREATE TABLE IF NOT EXISTS {table}" in db
        assert table in inventory


def test_r0_next_steps_are_r1_to_r6_not_vs004():
    inventory = _read(INVENTORY)
    risk = _read(RISK)
    plan = _read(PLAN)
    assert "VS-004" in plan and "보류" in plan
    assert "R1 IA/RBAC 현행화" in risk
    assert "R6 운영/배포 스택 리빌드 준비" in risk
    assert "R0 완료 기준" in inventory
