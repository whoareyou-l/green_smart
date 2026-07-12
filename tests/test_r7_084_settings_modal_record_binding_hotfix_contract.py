from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
DOC = ROOT / "docs/rebuild/r7-084-settings-modal-record-binding-hotfix.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_084_version_surfaces_are_1_14_9():
    assert '"version": "1.15.48"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.48"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.48"' in _read(PANEL)


def test_r7_084_settings_audit_button_skips_record_workflow_binding():
    source = _read(PANEL)
    assert 'data-r7-settings-audit-log-button' in source
    assert 'data-r7-settings-modal-skip-record-binding="true"' in source
    assert 'r7SettingsModalSkipRecordBinding' in source
    assert 'r7SettingsApprovalSkipRecordBinding' in source


def test_r7_084_rendered_audit_click_does_not_open_record_loading_modal():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel._settingsUsersPermissions = {{ source: 'fixture', users: [], approvalRows: [], auditRows: [{{ id: 1, label: '권한 승인', actor: 'admin', action: 'approve', summary: 'farm_staff 승인', meta: '2026-07-01 05:10', createdAt: '2026-07-01 05:10', tone: 'green' }}] }};
      panel._settingsAuditLogModal = {{ open: true, selectedId: 1 }};
      panel._r7RecordModal = null;
      const html = panel.renderR7SettingsAdminSubtabPanel('users-permissions', 'users-permissions');
      console.log(JSON.stringify({{ html, recordModal: panel._r7RecordModal }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    payload = json.loads(result.stdout)
    html = payload['html']
    assert 'data-r7-settings-audit-log-modal-open="true"' in html
    assert 'data-r7-settings-audit-log-cda-modal="true"' in html
    assert 'data-r7-record-modal-loading' not in html
    assert '히스토리를 불러오는 중입니다.' not in html
    assert payload['recordModal'] is None


def test_r7_084_documented():
    doc = _read(DOC)
    for phrase in ['record workflow binding', '전체 감사 로그 보기', 'data-r7-settings-modal-skip-record-binding', '이중 모달', '히스토리를 불러오는 중입니다']:
        assert phrase in doc
