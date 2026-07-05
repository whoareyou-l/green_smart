from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
DOC = ROOT / "docs/rebuild/r7-081-approval-list-compact-rows.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_081_version_surfaces_are_1_14_6():
    assert '"version": "1.14.80"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.80"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.80"' in _read(PANEL)


def test_r7_081_left_approval_list_body_prevents_single_row_stretch():
    source = _read(PANEL)
    for marker in [
        'data-r7-settings-approval-list-body',
        'align-content:start',
        'grid-auto-rows:max-content',
        'data-r7-settings-approval-list-row-compact="true"',
        'min-height:42px',
        'max-height:54px',
    ]:
        assert marker in source
    assert 'grid-template-rows:auto auto minmax(0,1fr) auto' in source


def test_r7_081_rendered_single_approval_remains_compact_list_row():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel._settingsUsersPermissions = {{ source: 'contract-fixture', approvalRows: [{{ id: 801, requestType: '권한 변경', requester: '임서원', requestedRole: 'farm_staff', status: 'pending', createdAt: '2026-07-01 04:10', note: 'pending user requested Green Smart access' }}], auditRows: [], users: [] }};
      panel._settingsApprovalListModal = {{ open: true, selectedId: 801 }};
      const html = panel.renderR7SettingsAdminSubtabPanel('users-permissions', 'users-permissions');
      console.log(JSON.stringify({{ html }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    html = json.loads(result.stdout)["html"]
    assert 'data-r7-settings-approval-list-body' in html
    assert 'align-content:start' in html
    assert 'grid-auto-rows:max-content' in html
    assert 'data-r7-settings-approval-list-row-compact="true"' in html
    assert 'min-height:42px' in html
    assert 'max-height:54px' in html
    assert '총 1건' in html


def test_r7_081_documented():
    doc = _read(DOC)
    for phrase in ["1건이어도", "리스트 row", "align-content:start", "grid-auto-rows:max-content", "stretch 방지"]:
        assert phrase in doc
