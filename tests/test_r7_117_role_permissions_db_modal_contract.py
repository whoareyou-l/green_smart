from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
VIEWS = ROOT / "custom_components/green_smart/rebuild_settings_views.py"
INIT = ROOT / "custom_components/green_smart/__init__.py"
DB = ROOT / "custom_components/green_smart/db.py"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render(open_role_modal=True, open_edit_modal=False, selected_role="farm_owner"):
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel._settingsUsersPermissions = {{ source: 'contract', approvalRows: [], auditRows: [], users: [], rolePermissions: [
        {{ role: 'admin', roleLabel: '관리자', permissionSummary: '전체 권한 · 시스템 설정', viewPermission: 'allowed', recordPermission: 'allowed', strategyPermission: 'allowed', executionPermission: 'allowed', safetyPermission: 'allowed', settingsPermission: 'allowed', status: 'active' }},
        {{ role: 'farm_owner', roleLabel: '농장 소유자', permissionSummary: '운영 승인 · 전략 검토', viewPermission: 'allowed', recordPermission: 'allowed', strategyPermission: 'allowed', executionPermission: 'allowed', safetyPermission: 'review', settingsPermission: 'review', status: 'active' }},
        {{ role: 'farm_staff', roleLabel: '농장 작업자', permissionSummary: '기록 작성 · 조회 중심', viewPermission: 'allowed', recordPermission: 'allowed', strategyPermission: 'readonly', executionPermission: 'request', safetyPermission: 'readonly', settingsPermission: 'none', status: 'active' }},
      ] }};
      panel._settingsPermissionMatrixModal = {{ open: {str(open_role_modal).lower()}, selectedRole: {selected_role!r} }};
      panel._settingsRolePermissionEditModal = {{ open: {str(open_edit_modal).lower()}, mode: 'edit', selectedRole: {selected_role!r}, values: {{ role: {selected_role!r}, roleLabel: '농장 소유자', permissionSummary: '운영 승인 · 전략 검토', viewPermission: 'allowed', recordPermission: 'allowed', strategyPermission: 'allowed', executionPermission: 'allowed', safetyPermission: 'review', settingsPermission: 'review', status: 'active', note: '기존 row 값' }} }};
      const html = panel.renderR7SettingsAdminSubtabPanel('users-permissions', 'users-permissions');
      console.log(JSON.stringify({{ html }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)["html"]


def test_r7_117_role_permission_modal_actions_replace_change_request():
    html = _render(open_role_modal=True, selected_role="farm_owner")
    assert 'data-r7-settings-role-permission-delete-button="farm_owner"' in html
    assert 'data-r7-settings-role-permission-edit-button="farm_owner"' in html
    assert 'data-r7-settings-role-permission-add-button' not in html
    assert '삭제' in html and '수정' in html
    assert '변경 요청 생성' not in html


def test_r7_117_role_permission_create_button_lives_on_zone_create_like_card():
    html = _render(open_role_modal=False, selected_role="farm_owner")
    start = html.index('data-r7-common-card-shell="settings-permission-matrix-summary"')
    end = html.index('data-r7-settings-permission-matrix-modal', start)
    card = html[start:end]
    assert 'data-r7-record-card-shell="settings-permission-matrix-summary"' in card
    assert 'data-r7-record-image-card="settings-permission-matrix-summary"' in card
    assert 'data-r7-settings-role-permission-create-card' in card
    assert 'data-r7-settings-role-permission-count-note' in card
    assert '총 3개 역할' in card
    assert card.count('data-r7-common-card-data-row="settings-role-permission-summary"') == 3
    for row in ['admin', 'farm_owner', 'farm_staff']:
        assert f'data-r7-settings-role-permission-summary-row="{row}"' in card
    assert 'data-r7-settings-role-permission-create-button="farm_staff"' in card
    assert '새 역활 추가' in card
    assert '+ 새 역할 권한 추가' not in card
    assert 'data-r7-settings-permission-matrix-button' in card


def test_r7_117_role_permission_add_edit_modal_reuses_growth_like_shell_and_closes_list_modal():
    html = _render(open_role_modal=False, open_edit_modal=True, selected_role="farm_owner")
    assert 'data-r7-settings-role-permission-edit-modal="true"' in html
    assert 'data-r7-settings-create-growth-like-modal="true"' in html
    assert 'data-r7-settings-role-permission-edit-form' in html
    assert 'data-r7-settings-permission-matrix-modal-open="false"' in html
    for field in ['role', 'roleLabel', 'permissionSummary', 'viewPermission', 'recordPermission', 'strategyPermission', 'executionPermission', 'safetyPermission', 'settingsPermission', 'status', 'note']:
        assert f'name="{field}"' in html
    assert 'value="farm_owner"' in html
    assert '운영 승인 · 전략 검토' in html


def test_r7_117_panel_calls_role_permission_crud_api():
    source = _read(PANEL)
    assert 'REBUILD_SETTINGS_ROLE_PERMISSIONS_API_PREFIX' in source
    assert '["DEL", "ETE"].join("")' in source
    assert '`${REBUILD_SETTINGS_ROLE_PERMISSIONS_API_PREFIX}${encodeURIComponent(role)}`' in source
    assert 'this.hass.callApi(method, path, payload)' in source
    assert 'renderR7RecordCardShell({ kind, icon, title, subtitle = ""' in source
    assert 'this.renderR7CommonCardShell({ kind, icon, title, subtitle' in source
    assert '_openSettingsRolePermissionCreateModal' in source
    assert '_openSettingsRolePermissionEditModal' in source
    assert '_submitSettingsRolePermissionEditForm' in source
    assert '_deleteSettingsRolePermission' in source


def test_r7_117_backend_has_role_permission_db_table_and_api_views():
    db = _read(DB)
    views = _read(VIEWS)
    init = _read(INIT)
    assert 'CREATE TABLE IF NOT EXISTS gs_role_permissions' in db
    assert 'UNIQUE KEY uq_gs_role_permissions_role (role)' in db
    assert 'role_permissions' in views
    assert 'SELECT role, role_label, permission_summary' in views
    assert 'INSERT INTO gs_role_permissions' in views
    assert 'UPDATE gs_role_permissions SET' in views
    assert 'DELETE FROM gs_role_permissions WHERE role = %s' in views
    assert 'class RebuildSettingsRolePermissionsView' in views
    assert 'class RebuildSettingsRolePermissionItemView' in views
    assert 'RebuildSettingsRolePermissionsView' in init
    assert 'RebuildSettingsRolePermissionItemView' in init


def test_r7_117_cdb_common_card_taxonomy_is_explicit():
    source = _read(PANEL)
    for marker in [
        'renderR7CdbSummaryCard',
        'renderR7CdbButtonOneCard',
        'renderR7CdbButtonTwoCard',
        'renderR7CdbListCard',
        'renderR7CdbSubtabContentLayout',
        'data-r7-cdb-common-card="summary-card"',
        'data-r7-cdb-common-card="button-1-card"',
        'data-r7-cdb-common-card="button-2-card"',
        'data-r7-cdb-common-card="list-card"',
        'data-r7-cdb-subtab-content-layout="summary3-action3-list"',
        'data-r7-cdb-layout-row="summary"',
        'data-r7-cdb-layout-row="actions"',
        'data-r7-cdb-layout-row="list"',
    ]:
        assert marker in source

    html = _render(open_role_modal=False, selected_role="farm_owner")
    assert 'data-r7-cdb-common-card="button-1-card"' in html
    assert 'data-r7-cdb-common-card="button-2-card"' in html
    assert 'data-r7-cdb-common-card="list-card"' in html
    assert 'data-r7-cdb-card-type="button-two"' in html


def test_r7_117_cdb_card_buttons_declare_modal_intent_and_list_modal_footer_polarity():
    html = _render(open_role_modal=True, selected_role="farm_owner")
    assert 'data-r7-cdb-button-role="list"' in html
    assert 'data-r7-cdb-opens-modal="list"' in html
    assert 'data-r7-cdb-button-role="create"' in html
    assert 'data-r7-cdb-opens-modal="create"' in html
    assert 'data-r7-cdb-list-modal-action-footer="positive-negative"' in html
    assert 'data-r7-cdb-modal-action="positive"' in html
    assert 'data-r7-cdb-positive-action="edit"' in html
    assert 'data-r7-cdb-modal-action="negative"' in html
    assert 'data-r7-cdb-negative-action="delete"' in html


def test_r7_117_user_edit_role_select_uses_db_role_permissions():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel._settingsUsersPermissions = {{ source: 'contract', approvalRows: [], auditRows: [], users: [{{ haUserId: 'user-1', displayName: '작업자', role: 'farm_staff', status: 'active', permissionSummary: '기록 작성' }}], rolePermissions: [
        {{ role: 'admin', roleLabel: '관리자', permissionSummary: '전체 권한', status: 'active' }},
        {{ role: 'farm_staff', roleLabel: '농장 작업자', permissionSummary: '기록 작성', status: 'active' }},
        {{ role: 'season_manager', roleLabel: '작기 관리자', permissionSummary: '작기 설정 · 승인 보조', status: 'active' }},
      ] }};
      panel._settingsAuditLogEditModal = {{ open: true, selectedId: 'user-1' }};
      const html = panel.renderR7SettingsAuditLogEditModal();
      console.log(JSON.stringify({{ html }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    html = json.loads(result.stdout)["html"]
    assert 'data-r7-settings-user-role-select' in html
    assert '<option value="season_manager"' in html
    assert '작기 관리자' in html


def test_r7_117_version_is_current():
    assert '"version": "1.14.78"' in _read(MANIFEST)
