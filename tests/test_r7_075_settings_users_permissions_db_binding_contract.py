from pathlib import Path
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "custom_components/green_smart/db.py"
INIT = ROOT / "custom_components/green_smart/__init__.py"
VIEWS = ROOT / "custom_components/green_smart/rebuild_settings_views.py"
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
DOC = ROOT / "docs/rebuild/r7-075-settings-users-permissions-db-binding.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_075_version_surfaces_are_1_14_0():
    assert '"version": "1.14.48"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.48"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.48"' in _read(PANEL)


def test_r7_075_db_schema_creates_settings_users_permissions_tables():
    source = _read(DB)
    for table in ["gs_users", "gs_approval_requests", "gs_audit_logs"]:
        assert f"CREATE TABLE IF NOT EXISTS {table}" in source
    assert "uq_gs_users_ha_user" in source
    assert "idx_gs_approval_requests_status" in source
    assert "idx_gs_audit_logs_created" in source


def test_r7_075_api_view_registered_and_uses_db_response():
    init = _read(INIT)
    views = _read(VIEWS)
    assert "RebuildSettingsUsersPermissionsView" in init
    assert "hass.http.register_view(RebuildSettingsUsersPermissionsView())" in init
    assert 'url = "/api/green_smart/rebuild/settings/users-permissions"' in views
    assert "settings_users_permissions_response" in views
    assert "fetchall(" in views
    assert "execute(" in views
    assert "gs_users" in views and "gs_approval_requests" in views and "gs_audit_logs" in views


def test_r7_075_api_response_shape_function_from_rows():
    namespace = {}
    exec(compile(_read(VIEWS), str(VIEWS), "exec"), namespace)
    fn = namespace["settings_users_permissions_response_from_rows"]
    payload = fn(
        users=[{"ha_user_id": "ha-1", "display_name": "서원", "role": "admin", "status": "active", "last_seen_at": "2026-07-01T10:00:00", "permission_summary": "전체 설정"}],
        approvals=[{"request_type": "사용자 승인 요청", "requester": "staff02", "requested_role": "farm_staff", "status": "pending", "icon": "mdi:account-clock-outline", "tone": "amber"}],
        audits=[{"actor": "admin", "summary": "역할 허락", "created_at": "2026-07-01T09:00:00"}],
        source="db-test",
    )
    assert payload["source"] == "db-test"
    assert payload["users"][0]["kind"] == "서원"
    assert payload["users"][0]["at"] == "admin"
    assert payload["approvalRows"][0]["label"] == "사용자 승인 요청"
    assert payload["auditRows"][0]["label"] == "admin"


def test_r7_075_frontend_fetches_settings_users_permissions_api_and_removes_inline_dummy_arrays():
    source = _read(PANEL)
    assert 'const REBUILD_SETTINGS_USERS_PERMISSIONS_API_PATH = "green_smart/rebuild/settings/users-permissions";' in source
    assert "_loadSettingsUsersPermissions" in source
    assert 'this.hass.callApi("GET", REBUILD_SETTINGS_USERS_PERMISSIONS_API_PATH)' in source
    assert "settingsUsersPermissions" in source
    users_block = source.split('tabKey === "users-permissions"', 1)[1].split(': tabKey === "safety-approval-policy"', 1)[0]
    assert 'const approvalRows = [["사용자 승인 요청"' not in users_block
    assert 'const auditRows = [["admin"' not in users_block
    assert 'rows: [["admin","admin"' not in users_block
    assert "this.r7SettingsUsersPermissionsData()" in users_block
    assert "data-r7-settings-users-data-source" in users_block


def test_r7_075_documented():
    doc = _read(DOC)
    for phrase in ["gs_users", "gs_approval_requests", "gs_audit_logs", "더미 데이터 금지", "users-permissions API"]:
        assert phrase in doc
