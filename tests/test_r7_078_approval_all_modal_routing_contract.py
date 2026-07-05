from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
DOC = ROOT / "docs/rebuild/r7-078-approval-all-modal-routing-hotfix.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_078_version_surfaces_are_1_14_3():
    assert '"version": "1.14.80"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.80"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.80"' in _read(PANEL)


def test_r7_078_approval_all_uses_dedicated_list_modal_not_record_history_or_row_button():
    source = _read(PANEL)
    assert 'data-r7-settings-users-action="approval-all" data-r7-settings-approval-list-button' in source
    assert 'data-r7-settings-approval-row-button="\' + (approvalRows[0]?.id || \'\') + \'"' not in source
    assert '_openSettingsApprovalListModal' in source
    assert '_closeSettingsApprovalListModal' in source
    assert 'data-r7-settings-approval-list-modal' in source
    assert 'data-r7-settings-approval-list-close-button' in source
    assert 'data-r7-settings-approval-list-item-button' in source


def test_r7_078_record_workflow_binding_skips_settings_approval_buttons():
    source = _read(PANEL)
    assert 'if (button.dataset.r7SettingsApprovalSkipRecordBinding === "true") return;' in source
    assert 'data-r7-settings-approval-skip-record-binding="true"' in source


def test_r7_078_rendered_approval_all_opens_list_modal_and_not_individual_modal():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel._settingsUsersPermissions = {{ source: 'contract-fixture', approvalRows: [{{ id: 77, label: '사용자 승인 요청', requester: '임서원', requestedRole: 'farm_staff', status: 'pending', meta: '임서원 · farm_staff · pending' }}], auditRows: [], users: [] }};
      panel._settingsApprovalListModal = {{ open: true }};
      panel._settingsApprovalModal = {{ open: false, request: null }};
      const html = panel.renderR7SettingsAdminSubtabPanel('users-permissions', 'users-permissions');
      console.log(JSON.stringify({{ html }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    html = json.loads(result.stdout)["html"]
    assert 'data-r7-settings-approval-list-modal-open="true"' in html
    assert 'data-r7-settings-approval-modal-open="false"' in html
    assert 'data-r7-settings-approval-list-item-button="77"' in html
    assert '기록 히스토리' not in html


def test_r7_078_documented():
    doc = _read(DOC)
    for phrase in ["모든 승인 요청 확인", "전용 목록 모달", "기록 히스토리", "바인딩 충돌", "개별 승인 모달"]:
        assert phrase in doc
