from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT / "docs" / "plans" / "2026-06-28-green-smart-product-first-rebuild-plan.md"
MASTER = ROOT / "docs" / "PROJECT_MASTER_PLAN.md"
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
CROP_VIEWS = ROOT / "custom_components" / "green_smart" / "crop_views.py"
ZONE_VIEWS = ROOT / "custom_components" / "green_smart" / "zone_control_views.py"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_rebuild_plan_exists_and_sets_product_first_order():
    plan = _read(PLAN)
    master = _read(MASTER)

    assert "Green Smart Product-First Rebuild Plan" in plan
    assert "제품 구조 리빌딩 → 운영 스택 리빌딩" in plan
    assert "제품 구조 리빌딩 → 운영 스택 리빌딩" in master
    assert "v1.10.29" in plan
    assert "VS-004 신규 기능 구현" in plan
    assert "중단" in plan


def test_rebuild_plan_preserves_prod_and_uses_gate_for_stack_rebuild():
    plan = _read(PLAN)

    for marker in (
        "Prod 안정성 우선",
        "현재 `v1.10.29` 운영 반영 상태는 유지",
        "prod stack 구조 변경",
        "운영/배포 스택 리빌드 준비",
        "사용자 승인 후 cutover",
        "green_smart-deploy",
    ):
        assert marker in plan


def test_rebuild_plan_defines_domain_boundaries_and_rbac_buckets():
    plan = _read(PLAN)

    for marker in (
        "Crop / Environment / Irrigation / Device / Safety / Admin",
        "조회 / 기록 / 전략 / 실행 / 안전 / 고급설정",
        "admin",
        "farm_owner",
        "farm_staff",
        "Safety → Interlock → Model",
    ):
        assert marker in plan


def test_rebuild_plan_identifies_current_monolith_hotspots():
    plan = _read(PLAN)
    panel = _read(PANEL)
    crop_views = _read(CROP_VIEWS)
    zone_views = _read(ZONE_VIEWS)

    assert len(panel.splitlines()) >= 9000
    assert len(crop_views.splitlines()) >= 4000
    assert len(zone_views.splitlines()) >= 2000
    assert "panel/green-smart-panel.js" in plan
    assert "crop_views.py" in plan
    assert "zone_control_views.py" in plan


def test_rebuild_plan_has_first_executable_r0_inventory_slice():
    plan = _read(PLAN)

    for marker in (
        "Phase R0 — 현재 구조 freeze 및 inventory",
        "docs/rebuild/current-state-inventory.md",
        "docs/rebuild/rebuild-risk-register.md",
        "tests/test_rebuild_baseline_contract.py",
        "v1.10.30",
    ):
        assert marker in plan
