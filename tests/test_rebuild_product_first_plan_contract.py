from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT / "docs" / "plans" / "2026-06-28-green-smart-product-first-rebuild-plan.md"
MASTER = ROOT / "docs" / "PROJECT_MASTER_PLAN.md"
MASTER_README = ROOT / "docs" / "master" / "README.md"
MASTER_LOGIC = ROOT / "docs" / "master" / "05-ml-interlock-failsafe-spec.md"
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
    assert "v1.14.36" in plan
    assert "VS-004 신규 기능 구현" in plan
    assert "중단" in plan


def test_rebuild_direction_uses_previous_work_as_reference_not_continuation():
    plan = _read(PLAN)
    master = _read(MASTER)

    for marker in (
        "기존 RB 산출물은 reference/evidence로만 사용",
        "기존 구조를 계속 쪼개는 방식으로 다음 RB를 진행하지 않는다",
        "새 master docs → 새 target architecture → 새 vertical slice scaffold",
        "from-scratch rebuild 기준선",
        "기존 코드 수정은 hotfix와 호환 adapter로만 제한",
    ):
        assert marker in plan

    assert "기존 RB 산출물은 reference/evidence로만 사용" in master
    assert "다음 RB 계속 진행 금지" in master


def test_rebuild_plan_has_five_master_document_deliverables():
    plan = _read(PLAN)
    readme = _read(MASTER_README)
    logic = _read(MASTER_LOGIC)

    for marker in (
        "CBA 화면 기획서 (UI/UX 설계도)",
        "통신 명세서 (인터페이스 규칙서)",
        "DB 구상도 (데이터 저장소 스키마)",
        "통합 시나리오 흐름도 (워크플로우 순서도)",
        "로직 알고리즘 및 예외처리 명세서",
        "공통 부품 → 복합 모듈 → 전체 페이지",
        "REST API 주소와 MQTT topic",
        "사용자/RBAC, 구역/장비, 작기, 센서 데이터/로그",
        "센서 수집 → 백엔드 적재 → AI/VPD 판단 → MQTT/HA 제어 → 하드웨어 구동 → UI 반영",
        "VPD/PID/제어 알고리즘, 인터넷 단절, 센서 고장, 천창 safe position, 로컬 모드, Fail-Safe",
    ):
        assert marker in plan

    assert "로직 알고리즘 및 예외처리 명세서" in readme
    assert "시스템의 두뇌와 생존 장치" in logic
    assert "인터넷 단절" in logic
    assert "천창 30%" in logic
    assert "로컬 모드" in logic


def test_rebuild_plan_preserves_prod_and_uses_gate_for_stack_rebuild():
    plan = _read(PLAN)

    for marker in (
        "Prod 안정성 우선",
        "현재 `v1.14.36` 운영 반영 상태는 유지",
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
