from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT / "docs" / "rebuild" / "backend-api-decomposition-plan.md"
PRODUCT_PLAN = ROOT / "docs" / "plans" / "2026-06-28-green-smart-product-first-rebuild-plan.md"
MASTER = ROOT / "docs" / "PROJECT_MASTER_PLAN.md"
MANIFEST = ROOT / "custom_components" / "green_smart" / "manifest.json"
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
CROP_VIEWS = ROOT / "custom_components" / "green_smart" / "crop_views.py"
ZONE_VIEWS = ROOT / "custom_components" / "green_smart" / "zone_control_views.py"
INIT = ROOT / "custom_components" / "green_smart" / "__init__.py"
DB = ROOT / "custom_components" / "green_smart" / "db.py"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r3_version_surfaces_are_v1113():
    assert '"version": "1.12.50"' in _read(MANIFEST)
    assert 'const VERSION = "1.12.50"' in _read(PANEL)
    assert "v1.12.50" in _read(PLAN)
    assert "v1.12.50" in _read(PRODUCT_PLAN)
    assert "v1.12.50" in _read(MASTER)


def test_r3_current_backend_hotspots_are_documented_from_real_files():
    plan = _read(PLAN)
    assert len(_read(CROP_VIEWS).splitlines()) >= 4900
    assert len(_read(ZONE_VIEWS).splitlines()) >= 2700
    assert "`custom_components/green_smart/crop_views.py` | 4,946 | 24" in plan
    assert "`custom_components/green_smart/zone_control_views.py` | 2,737 | 36" in plan
    assert "`custom_components/green_smart/__init__.py` | 463" in plan
    assert "route/view class" in plan


def test_r3_target_backend_structure_is_documented_before_code_split():
    plan = _read(PLAN)
    for marker in (
        "api_views/crop.py",
        "api_views/environment.py",
        "api_views/irrigation.py",
        "api_views/device.py",
        "api_views/safety.py",
        "api_views/admin.py",
        "services/crop_service.py",
        "services/strategy_service.py",
        "services/safety_service.py",
        "services/rbac_service.py",
        "repositories/crop_repo.py",
        "repositories/zone_control_repo.py",
        "repositories/device_repo.py",
        "repositories/safety_repo.py",
        "schedulers/safety_guard_scheduler.py",
    ):
        assert marker in plan


def test_r3_route_compatibility_contract_preserves_existing_paths():
    plan = _read(PLAN)
    crop = _read(CROP_VIEWS)
    zone = _read(ZONE_VIEWS)
    for route in (
        "/api/green_smart/crop/seasons",
        "/api/green_smart/crop/seasons/{season_id}/growth",
        "/api/green_smart/crop/seasons/{season_id}/growth-report",
        "/api/green_smart/crop/seasons/{season_id}/stage-diagnosis",
        "/api/green_smart/zones/control-settings",
        "/api/green_smart/zones/final-targets",
        "/api/green_smart/zones/execute-final-targets",
        "/api/green_smart/zones/safety-guard-watchdog",
        "/api/green_smart/zones/device-entity-mappings",
        "/api/green_smart/environment/strategy-preview",
        "/api/green_smart/irrigation/strategy-preview",
    ):
        assert route in plan
        assert route in crop or route in zone
    for marker in (
        "/api/green_smart/*` path는 변경하지 않는다",
        "/api/v1/sensors/current` compatibility route를 유지한다",
        "response JSON shape는 임의 변경하지 않는다",
        "기존 HTTP method semantics를 유지한다",
    ):
        assert marker in plan


def test_r3_layer_responsibility_and_adapter_first_pattern_are_documented():
    plan = _read(PLAN)
    for marker in (
        "`api_views/*`",
        "`services/*`",
        "`repositories/*`",
        "`schedulers/*`",
        "SQL 문자열 직접 보유 금지",
        "raw SQL 직접 작성 금지",
        "DB query/fetch/insert/update/delete",
        "Step A — No-op wrapper 추가",
        "Step B — View에서 service 호출로 교체",
        "Step C — DB query를 repository로 이동",
        "Step D — Old helper compatibility 유지",
    ):
        assert marker in plan


def test_r3_first_backend_extraction_is_crop_read_only_not_execution():
    plan = _read(PLAN)
    product_plan = _read(PRODUCT_PLAN)
    master = _read(MASTER)
    assert "첫 backend extraction은 실행/장비/인터록이 아니라 **read-only crop service/repo boundary**" in plan
    assert "RB-006A Crop read-only service/repo boundary" in plan
    assert "`GET /api/green_smart/crop/seasons`" in plan
    assert "zones/execute-final-targets` | 보류" in plan
    assert "device-entity-mappings` | 보류" in plan
    assert "상세 산출물은 `docs/rebuild/backend-api-decomposition-plan.md`" in product_plan
    assert "docs/rebuild/backend-api-decomposition-plan.md" in master


def test_r3_contract_preserves_no_backend_split_or_migration_beyond_rb006a():
    plan = _read(PLAN)
    db = _read(DB)
    init = _read(INIT)
    assert (ROOT / "custom_components" / "green_smart" / "services/crop_service.py").exists()
    assert (ROOT / "custom_components" / "green_smart" / "repositories/crop_repo.py").exists()
    for rel in (
        "api_views/crop.py",
        "schedulers/safety_guard_scheduler.py",
    ):
        assert not (ROOT / "custom_components" / "green_smart" / rel).exists()
    assert "CREATE TABLE IF NOT EXISTS crop_seasons" in db
    assert "ensure_schema" in init
    for marker in (
        "R3는 backend 구현 분해 단계가 아니다",
        "HTTP route path 변경 | 금지",
        "DB migration | 금지",
        "scheduler 실행 방식 변경 | 금지",
        "prod stack 변경 | 금지",
        "신규 기능 구현 | 금지",
        "Crop read-only service/repo boundary baseline",
    ):
        assert marker in plan


def test_r3_rbac_and_scheduler_strategy_are_documented():
    plan = _read(PLAN)
    for marker in (
        "Frontend hidden/disabled는 보안 경계가 아니다",
        "모든 write/execute/delete/save/apply/ack/clear route는 service layer에서 permission을 검증한다",
        "actor`, `role`, `permissions` DTO",
        "RB-006A read-only crop route는 `view_crop_records` 기준",
        "scheduler tick의 DB lookup을 repository로 이동",
        "`__init__.py`는 `_setup_*_scheduler` import/register shell만 보유",
        "hass.data[DOMAIN]` 기존 key를 유지",
    ):
        assert marker in plan
