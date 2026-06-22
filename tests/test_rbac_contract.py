from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INIT = ROOT / "custom_components" / "green_smart" / "__init__.py"
RBAC = ROOT / "custom_components" / "green_smart" / "rbac.py"
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
PLAN = ROOT / "docs" / "plans" / "2026-06-22-ui-rbac-reorganization-implementation-plan.md"
UI_DOC = ROOT / "docs" / "design" / "ui-information-architecture-and-rbac.md"


def test_rbac_backend_contract_uses_ha_user_role_mapping_and_auth_me_route():
    assert RBAC.exists()
    source = RBAC.read_text(encoding="utf-8")
    init_source = INIT.read_text(encoding="utf-8")

    for marker in (
        "GREEN_SMART_ROLES",
        '"admin"',
        '"farm_owner"',
        '"farm_staff"',
        "GREEN_SMART_ROLE_PERMISSIONS",
        "GREEN_SMART_HA_USER_ROLE_STORE_KEY",
        "GreenSmartAuthMeView",
        'url = "/api/green_smart/auth/me"',
        "async_get_green_smart_user_role",
        "async_set_green_smart_user_role",
        "permissions_for_role",
        "ha_user_id",
        "roleSource",
    ):
        assert marker in source

    assert "GreenSmartAuthMeView" in init_source
    assert "hass.http.register_view(GreenSmartAuthMeView())" in init_source


def test_panel_rbac_baseline_uses_auth_me_and_declares_permission_helpers():
    source = PANEL.read_text(encoding="utf-8")

    for marker in (
        "GREEN_SMART_ROLES",
        "GREEN_SMART_ROLE_PERMISSIONS",
        'admin: new Set',
        'farm_owner: new Set',
        'farm_staff: new Set',
        "this._authMe",
        "async _fetchAuthMe()",
        'green_smart/auth/me',
        "_currentUserRole()",
        "_permissionsForRole(role)",
        "_hasPermission(permission)",
        "_visibilityForPermission(permission",
        "_renderPermissionHint(reason)",
    ):
        assert marker in source


def test_panel_ui_taxonomy_and_admin_sidebar_contract_markers():
    source = PANEL.read_text(encoding="utf-8")

    for marker in (
        'data-ui-section="view"',
        'data-ui-section="record"',
        'data-ui-section="strategy"',
        'data-ui-section="approval"',
        'data-ui-section="execute"',
        'data-ui-section="safety"',
        'data-ui-section="admin"',
        'data-required-permission=',
        'data-role-visibility=',
        'navBtn("admin", "mdi:shield-account", "Admin/System"',
        'this._hasPermission("system_settings")',
    ):
        assert marker in source


def test_rbac_decision_docs_stay_in_sync_with_phase_u0_u1_baseline():
    plan = PLAN.read_text(encoding="utf-8")
    ui_doc = UI_DOC.read_text(encoding="utf-8")

    for marker in (
        "Phase U0/U1의 모호성은 10% 이하",
        "Home Assistant 사용자와 Green Smart 역할을 매핑",
        "농장주가 허용한 장치별 범위",
        "고급 rule builder",
        "Admin/System은 `admin`에게만 보이는 sidebar 별도 메뉴",
    ):
        assert marker in plan

    for marker in (
        "Home Assistant user ID",
        "Green Smart role(admin/farm_owner/farm_staff)",
        "Admin/System은 `admin` 전용 sidebar 별도 메뉴",
        "농장주가 허용한 장치별 범위",
        "Fail Safe/safe_state 설정",
    ):
        assert marker in ui_doc
