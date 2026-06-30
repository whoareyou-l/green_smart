from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IA = ROOT / "docs" / "design" / "ui-information-architecture-and-rbac.md"
UI_DOC = ROOT / "docs" / "design" / "current-ui-design-and-navigation.md"
BACKEND_DOC = ROOT / "docs" / "design" / "current-backend-api-db-ha-contract.md"
MANIFEST = ROOT / "custom_components" / "green_smart" / "manifest.json"
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
RBAC = ROOT / "custom_components" / "green_smart" / "rbac.py"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r1_version_surfaces_are_v1111():
    assert '"version": "1.12.98"' in _read(MANIFEST)
    assert 'const VERSION = "1.12.98"' in _read(PANEL)
    assert "v1.12.98" in _read(IA)
    assert "v1.12.98" in _read(UI_DOC)
    assert "v1.12.98" in _read(BACKEND_DOC)


def test_r1_ia_defines_six_ui_buckets_and_four_display_states():
    text = _read(IA)
    for marker in (
        "조회 / 기록 / 전략 / 실행 / 안전 / 고급설정",
        "`조회`",
        "`기록`",
        "`전략`",
        "`실행`",
        "`안전`",
        "`고급설정`",
        "`visible_enabled`",
        "`visible_disabled`",
        "`summary_only`",
        "`hidden`",
    ):
        assert marker in text


def test_r1_ia_defines_roles_and_page_matrix():
    text = _read(IA)
    for marker in (
        "`admin`",
        "`farm_owner`",
        "`farm_staff`",
        "Home — 오늘 농장을 운영하는 화면",
        "Crop — 작물/기록 화면",
        "Environment — 환경 제어",
        "Irrigation — 관수 제어",
        "Device — 장치제어",
        "Admin/System — 고급설정 화면",
        "system_settings",
    ):
        assert marker in text


def test_r1_technical_fields_move_to_admin_system():
    text = _read(IA)
    ui_doc = _read(UI_DOC)
    for marker in (
        "`entity_id`",
        "PID/제어 계수",
        "raw JSON",
        "API key/token/activation code",
        "DB/API 상세 오류",
        "MQTT topic",
        "Admin/System",
        "농장주/직원 기본 화면이 아니라 Admin/System",
    ):
        assert marker in text or marker in ui_doc


def test_r1_backend_permission_enforcement_is_documented_and_code_has_auth_baseline():
    text = _read(BACKEND_DOC)
    rbac = _read(RBAC)
    panel = _read(PANEL)
    for marker in (
        "frontend의 `visible_enabled`, `visible_disabled`, `summary_only`, `hidden` 상태는 UX 표현일 뿐",
        "crop create/update/delete",
        "strategy setting save",
        "final target execution",
        "safety event ack/clear",
        "entity mapping",
        "user/role/system config",
        "HA user → Green Smart role → permission",
    ):
        assert marker in text
    assert "/api/green_smart/auth/me" in rbac
    assert "GREEN_SMART_ROLE_PERMISSIONS" in panel
    assert "green_smart/auth/me" in panel


def test_r1_non_technical_wording_dictionary_exists():
    text = _read(IA)
    for marker in (
        "공기 건조도(VPD)",
        "배지 수분율",
        "야간 수분 빠짐",
        "실행할 최종 목표",
        "안전 차단 조건",
        "안전 위치 전환",
        "장치 연결 안 됨",
        "오래된 센서값",
    ):
        assert marker in text
