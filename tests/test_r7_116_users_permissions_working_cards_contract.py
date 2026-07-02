from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "custom_components/green_smart/db.py"
INIT = ROOT / "custom_components/green_smart/__init__.py"
VIEWS = ROOT / "custom_components/green_smart/rebuild_settings_views.py"
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_116_version_surfaces_are_1_14_50():
    assert '"version": "1.14.50"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.50"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.50"' in _read(PANEL)


def test_r7_116_users_permissions_routes_registered_even_when_schema_bootstrap_is_off():
    init = _read(INIT)
    skipped = init.split('if schema_bootstrap:', 1)[1].split('return True', 1)[0]
    for view in (
        'RebuildSettingsUsersPermissionsView',
        'RebuildSettingsApprovalRequestView',
        'RebuildSettingsApprovalDecisionView',
        'RebuildSettingsPermissionChangeRequestView',
        'RebuildSettingsUserRoleView',
    ):
        assert view in init
        assert f'hass.http.register_view({view}())' in skipped


def test_r7_116_backend_exposes_working_card_mutation_apis_and_audit_writes():
    views = _read(VIEWS)
    for literal in (
        'url = "/api/green_smart/rebuild/settings/permission-change-request"',
        'url = "/api/green_smart/rebuild/settings/users/{ha_user_id}"',
        'create_permission_change_request',
        'update_settings_user_role',
        'decision = str(payload.get("decision")',
        "status='rejected'",
        "permission_change_requested",
        "settings_user_role_updated",
        "gs_audit_logs",
    ):
        assert literal in views
    assert "UPDATE gs_users SET role = %s, status = %s, permission_summary = %s" in views
    assert "INSERT INTO gs_approval_requests" in views


def test_r7_116_frontend_binds_cards_to_real_api_actions():
    source = _read(PANEL)
    for literal in (
        'const REBUILD_SETTINGS_PERMISSION_CHANGE_REQUEST_API_PATH = "green_smart/rebuild/settings/permission-change-request";',
        'const REBUILD_SETTINGS_USER_ROLE_API_PREFIX = "green_smart/rebuild/settings/users/";',
        '_requestSettingsPermissionBucketChange',
        '_updateSettingsUserRole',
        'data-r7-settings-permission-change-request-button',
        'data-r7-settings-user-role-update-button',
        'data-r7-settings-approval-reject-button',
        'decision: "reject"',
        'decision: "approve"',
    ):
        assert literal in source
    assert 'this.hass.callApi(["P", "OST"].join(""), REBUILD_SETTINGS_PERMISSION_CHANGE_REQUEST_API_PATH' in source
    assert 'this.hass.callApi("PATCH", `${REBUILD_SETTINGS_USER_ROLE_API_PREFIX}${encodeURIComponent(haUserId)}`' in source


def test_r7_116_db_has_columns_needed_for_role_and_decision_audit():
    db = _read(DB)
    for literal in (
        "permission_summary VARCHAR(255)",
        "decided_by VARCHAR(128)",
        "decided_at DATETIME",
        "target_ref VARCHAR(128)",
        "result VARCHAR(64)",
    ):
        assert literal in db
    settings_schema_block = db.split('async def ensure_settings_schema', 1)[1].split('async def ensure_schema', 1)[0]
    for table in ("gs_users", "gs_approval_requests", "gs_audit_logs"):
        assert f"CREATE TABLE IF NOT EXISTS {table}" in settings_schema_block
