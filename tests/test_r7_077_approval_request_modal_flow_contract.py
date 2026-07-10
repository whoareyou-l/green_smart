from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
SETTINGS_VIEWS = ROOT / "custom_components/green_smart/rebuild_settings_views.py"
INIT = ROOT / "custom_components/green_smart/__init__.py"
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
DOC = ROOT / "docs/rebuild/r7-077-approval-request-modal-flow.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_077_version_surfaces_are_1_14_2():
    assert '"version": "1.15.08"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.08"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.08"' in _read(PANEL)


def test_r7_077_backend_has_request_and_approve_views():
    views = _read(SETTINGS_VIEWS)
    init = _read(INIT)
    for marker in [
        "RebuildSettingsApprovalRequestView",
        "RebuildSettingsApprovalDecisionView",
        'url = "/api/green_smart/rebuild/settings/approval-request"',
        'url = "/api/green_smart/rebuild/settings/approval-requests/{request_id}/decision"',
        "create_user_approval_request",
        "approve_user_approval_request",
        '"active"',
        "INSERT INTO gs_audit_logs",
        "status='approved'",
    ]:
        assert marker in views
    assert "hass.http.register_view(RebuildSettingsApprovalRequestView())" in init
    assert "hass.http.register_view(RebuildSettingsApprovalDecisionView())" in init


def test_r7_077_pending_gate_has_request_button_and_api_call():
    source = _read(PANEL)
    for marker in [
        'data-r7-approval-request-button',
        '승인 요청 보내기',
        'green_smart/rebuild/settings/approval-request',
        '_submitApprovalRequest',
        'this.hass.callApi(["P", "OST"].join(""), REBUILD_SETTINGS_APPROVAL_REQUEST_API_PATH',
        'data-r7-approval-request-state',
    ]:
        assert marker in source


def test_r7_077_admin_approval_card_opens_modal_and_approves():
    source = _read(PANEL)
    for marker in [
        'data-r7-settings-approval-modal',
        'data-r7-settings-approval-modal-open',
        'data-r7-settings-approval-approve-button',
        'data-r7-settings-approval-list-button',
        '_openSettingsApprovalListModal',
        '_approveSettingsApprovalRequest',
        'green_smart/rebuild/settings/approval-requests/',
        '/decision',
        '승인하기',
    ]:
        assert marker in source


def test_r7_077_rendered_pending_gate_and_admin_modal_contract():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(PANEL)!r});
      const pending = new mod.GreenSmartRebuildPanel();
      pending._settingsUsersPermissions = {{ ok: false, approvalRequired: true, approvalStatus: 'pending', displayName: '임서원', role: 'farm_staff', requestState: 'idle', source: 'green-smart-db' }};
      const pendingHtml = pending.renderR7PageShell();
      const admin = new mod.GreenSmartRebuildPanel();
      admin._settingsUsersPermissions = {{ source: 'contract-fixture', approvalRows: [{{ id: 77, label: '사용자 승인 요청', requester: '임서원', requestedRole: 'farm_staff', status: 'pending', meta: '임서원 · farm_staff · pending' }}], auditRows: [], users: [] }};
      admin._settingsApprovalModal = {{ open: true, request: {{ id: 77, label: '사용자 승인 요청', requester: '임서원', requestedRole: 'farm_staff', status: 'pending' }} }};
      const adminHtml = admin.renderR7SettingsAdminSubtabPanel('users-permissions', 'users-permissions');
      console.log(JSON.stringify({{ pendingHtml, adminHtml }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    payload = json.loads(result.stdout)
    assert 'data-r7-approval-request-button' in payload['pendingHtml']
    assert '승인 요청 보내기' in payload['pendingHtml']
    assert 'data-r7-settings-approval-modal-open="true"' in payload['adminHtml']
    assert 'data-r7-settings-approval-approve-button="77"' in payload['adminHtml']
    assert '임서원' in payload['adminHtml']


def test_r7_077_documented():
    doc = _read(DOC)
    for phrase in ["승인 요청 보내기", "승인 필요 작업", "팝업 모달", "승인하기", "gs_approval_requests", "gs_users.status"]:
        assert phrase in doc
