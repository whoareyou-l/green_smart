from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
API_CLIENT = ROOT / "custom_components" / "green_smart" / "panel" / "core" / "api-client.js"
ADMIN_PAGE = ROOT / "custom_components" / "green_smart" / "panel" / "domains" / "admin" / "admin-page.js"
SCAFFOLD = ROOT / "docs" / "rebuild" / "vs-n001-rbac-admin-ownership-scaffold.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _save_method_source() -> str:
    source = _read(PANEL)
    return source.split("  async _saveAdminRoleMapping(root) {", 1)[1].split("  _saveAdminSystemConfig(root) {", 1)[0]


def test_vs_n001d_save_handler_has_backend_success_and_fallback_status_paths():
    method = _save_method_source()
    assert "data-admin-role-api-status" in method
    assert "Backend API로" in method
    assert "Backend 저장 실패" in method
    assert "localStorage 호환 fallback" in method
    assert "role_mapping_saved_via_api" in method
    assert "role_mapping_saved_fallback_localstorage" in method


def test_vs_n001d_save_handler_preserves_assignment_decisions_from_api_results():
    method = _save_method_source()
    assert "assignmentResults" in method
    assert "assignmentResults[idx]?.assignmentDecision" in method
    assert "assignmentDecision" in method
    assert "Promise.all" in method
    assert "this._api.admin.assignRole(row.id, { role: row.role })" in method


def test_vs_n001d_ui_exposes_denied_assignment_guidance_and_backend_first_marker():
    admin = _read(ADMIN_PAGE)
    for marker in (
        "data-admin-role-api-status",
        "data-admin-role-backend-enforced",
        "backend permission enforcement",
        "farm_owner는 farm_staff 역할만 배정/해제",
        "localStorage는 호환 fallback",
        "권한 거부 시 backend reasonCode를 확인",
    ):
        assert marker in admin


def test_vs_n001d_api_client_normalizes_role_assignment_error_path():
    client = _read(API_CLIENT)
    assert "assignRole:" in client
    assert "normalizeApiError" in client
    assert "normalized.status" in client
    assert "green_smart/auth/roles/${haUserId}" in client


def test_vs_n001d_docs_record_behavior_smoke_scope():
    doc = _read(SCAFFOLD)
    for marker in (
        "VS-N001-D role assignment behavior smoke",
        "source-level behavior smoke",
        "Backend API success status",
        "Backend API failure fallback status",
        "assignmentDecision preservation",
        "No Prod sync in this smoke step",
    ):
        assert marker in doc
