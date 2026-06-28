from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
API_CLIENT = ROOT / "custom_components" / "green_smart" / "panel" / "core" / "api-client.js"
ADMIN_PAGE = ROOT / "custom_components" / "green_smart" / "panel" / "domains" / "admin" / "admin-page.js"
SCAFFOLD = ROOT / "docs" / "rebuild" / "vs-n001-rbac-admin-ownership-scaffold.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_api_client_exposes_admin_assign_role_adapter():
    source = _read(API_CLIENT)
    assert "assignRole:" in source
    assert 'request("POST", `green_smart/auth/roles/${haUserId}`' in source
    assert "green_smart/auth/me" in source


def test_admin_role_save_uses_backend_api_before_localstorage_fallback():
    source = _read(PANEL)
    assert "async _saveAdminRoleMapping(root)" in source
    assert "this._api.admin.assignRole" in source
    assert "Promise.all" in source
    assert "assignmentDecision" in source
    assert "role_mapping_saved_via_api" in source
    assert "role_mapping_saved_fallback_localstorage" in source
    assert "data-admin-role-api-status" in source

    api_idx = source.index("this._api.admin.assignRole")
    fallback_idx = source.index("role_mapping_saved_fallback_localstorage")
    assert api_idx < fallback_idx


def test_admin_role_ui_marks_backend_enforcement_and_owner_limited_staff_management():
    source = _read(ADMIN_PAGE)
    for marker in (
        'data-admin-role-api-status',
        'data-required-permission="manage_farm_staff_roles"',
        'data-admin-role-backend-enforced',
        'backend permission enforcement',
        'farm_owner는 farm_staff 역할만 배정/해제',
    ):
        assert marker in source


def test_admin_role_binding_awaits_async_save_handler():
    source = _read(PANEL)
    assert 'addEventListener("click", async () => this._saveAdminRoleMapping(page))' in source


def test_vs_n001_scaffold_records_ui_adapter_contract():
    doc = _read(SCAFFOLD)
    for marker in (
        "VS-N001-C Admin/System role assignment UI adapter",
        "assignRole",
        "data-admin-role-api-status",
        "role_mapping_saved_via_api",
        "role_mapping_saved_fallback_localstorage",
        "localStorage-only role mapping is compatibility fallback",
    ):
        assert marker in doc
