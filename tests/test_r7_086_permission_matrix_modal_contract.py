from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-086-permission-matrix-modal.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render_users_permissions(open_modal=False):
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel._settingsUsersPermissions = {{ source: 'contract-fixture', approvalRows: [], auditRows: [], users: [] }};
      panel._settingsPermissionMatrixModal = {{ open: {str(open_modal).lower()} }};
      const html = panel.renderR7SettingsAdminSubtabPanel('users-permissions', 'users-permissions');
      console.log(JSON.stringify({{ html }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)["html"]


def test_r7_086_version_surfaces_are_1_14_11():
    assert '"version": "1.14.75"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.75"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.75"' in _read(REBUILD_PANEL)


def test_r7_086_permission_matrix_button_opens_dedicated_cda_modal_not_hidden_shell():
    source = _read(REBUILD_PANEL)
    assert 'data-r7-settings-permission-matrix-button' in source
    assert '_openSettingsPermissionMatrixModal' in source
    assert '_closeSettingsPermissionMatrixModal' in source
    assert 'renderR7SettingsPermissionMatrixModal' in source
    assert 'data-r7-settings-users-action="open-permission-matrix-modal"' not in source
    assert 'data-r7-settings-users-action="close-permission-matrix-modal"' not in source

    closed_html = _render_users_permissions(open_modal=False)
    assert 'data-r7-settings-permission-matrix-button' in closed_html
    assert 'data-r7-settings-permission-matrix-cda-modal="true"' in closed_html
    assert 'data-r7-settings-permission-matrix-modal-open="false"' in closed_html
    assert 'data-r7-settings-permission-matrix-table-modal="true"' not in closed_html

    open_html = _render_users_permissions(open_modal=True)
    assert 'data-r7-settings-permission-matrix-cda-modal="true"' in open_html
    assert 'data-r7-settings-permission-matrix-modal-open="true"' in open_html
    assert 'data-r7-settings-role-permission-modal="true"' in open_html
    assert '전체 역활별 권한 보기' in open_html
    assert 'data-r7-settings-role-permission-list-panel' in open_html
    assert 'data-r7-settings-role-permission-detail-panel' in open_html
    assert 'data-r7-settings-permission-matrix-table-modal="true"' not in open_html
    for role in ['admin', 'farm_owner', 'farm_staff']:
        assert f'data-r7-settings-role-permission-row="{role}"' in open_html
        assert f'data-r7-settings-permission-role="{role}"' in open_html
    for bucket in ['조회', '기록', '전략', '실행', '안전', '고급설정']:
        assert f'data-r7-settings-permission-step-row="{bucket}"' in open_html
    assert 'data-r7-settings-permission-matrix-close-button' in open_html


def test_r7_086_documented():
    doc = _read(DOC)
    for phrase in ['권한 매트릭스 보기', '팝업 모달', 'CDA', 'data-r7-settings-permission-matrix-button', 'data-r7-settings-permission-matrix-table-modal']:
        assert phrase in doc
