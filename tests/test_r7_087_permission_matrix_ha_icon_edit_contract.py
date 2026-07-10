from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-087-permission-matrix-ha-icon-edit.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render_permission_matrix(selected_role="admin"):
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel._settingsUsersPermissions = {{ source: 'contract-fixture', approvalRows: [], auditRows: [], users: [] }};
      panel._settingsPermissionMatrixModal = {{ open: true, selectedRole: {selected_role!r} }};
      const html = panel.renderR7SettingsAdminSubtabPanel('users-permissions', 'users-permissions');
      console.log(JSON.stringify({{ html }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)["html"]


def test_r7_087_version_surfaces_are_1_14_12():
    assert '"version": "1.15.07"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.07"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.07"' in _read(REBUILD_PANEL)


def test_r7_087_permission_matrix_status_uses_ha_icons_not_emoji():
    html = _render_permission_matrix("admin") + _render_permission_matrix("farm_owner") + _render_permission_matrix("farm_staff")
    for emoji in ["✅", "🛡️", "👁️", "🕘", "🔒"]:
        assert emoji not in html
    for icon in [
        'icon="mdi:check-circle-outline"',
        'icon="mdi:shield-check-outline"',
        'icon="mdi:eye-outline"',
        'icon="mdi:clock-outline"',
        'icon="mdi:lock-outline"',
    ]:
        assert icon in html
    assert html.count('data-r7-settings-permission-state-icon=') >= 18
    assert 'data-r7-settings-permission-state="allowed"' in html
    assert 'data-r7-settings-permission-state="review"' in html
    assert 'data-r7-settings-permission-state="readonly"' in html
    assert 'data-r7-settings-permission-state="request"' in html
    assert 'data-r7-settings-permission-state="none"' in html


def test_r7_087_role_permission_row_selects_role_and_opens_detail_panel():
    source = _read(REBUILD_PANEL)
    assert '_selectSettingsPermissionMatrixRole' in source
    assert 'data-r7-settings-role-permission-list-item-button' in source
    assert 'data-r7-settings-role-permission-detail-panel' in source
    assert 'data-r7-settings-role-permission-section="bucket-permissions"' in source

    html = _render_permission_matrix("farm_staff")
    assert 'data-r7-settings-role-permission-row-selected="true"' in html
    assert 'data-r7-settings-role-permission-row="farm_staff"' in html
    assert 'farm_staff · 농장 작업자 · 기록 작성 · 조회 중심' in html
    assert 'data-r7-settings-role-permission-state="farm_staff"' in html
    assert '실행 요청 / 실행 허락' in html
    assert 'data-r7-settings-role-permission-delete-button="farm_staff"' in html
    assert 'data-r7-settings-role-permission-edit-button="farm_staff"' in html
    assert 'data-r7-settings-role-permission-add-button="farm_staff"' not in html
    assert 'data-r7-settings-permission-change-request-button="farm_staff"' not in html


def test_r7_087_documented():
    doc = _read(DOC)
    for phrase in ['ha-icon', '수정 버튼', '선택 버킷', 'data-r7-settings-permission-state-icon', 'data-r7-settings-permission-edit-panel']:
        assert phrase in doc
