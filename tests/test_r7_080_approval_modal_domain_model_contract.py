from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
SETTINGS_VIEWS = ROOT / "custom_components/green_smart/rebuild_settings_views.py"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
DOC = ROOT / "docs/rebuild/r7-080-approval-modal-domain-model.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_080_version_surfaces_are_1_14_5():
    assert '"version": "1.15.03"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.03"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.03"' in _read(PANEL)


def test_r7_080_backend_exposes_approval_detail_fields_not_only_label_meta():
    source = _read(SETTINGS_VIEWS)
    for marker in [
        'note',
        'createdAt',
        'approvalStage',
        'riskLevel',
        'target',
        'beforeValue',
        'afterValue',
        'scope',
        'validationChecks',
    ]:
        assert marker in source
    assert 'SELECT id, request_type, requester, requested_role, status, icon, tone, note, created_by, created_at' in source


def test_r7_080_frontend_has_explicit_domain_model_helpers_and_no_image_sample_fallbacks():
    source = _read(PANEL)
    for marker in [
        '_normalizeR7ApprovalRequest',
        '_r7ApprovalStageForStatus',
        '_r7ApprovalRiskModel',
        '_r7ApprovalImpactBadges',
        '_r7ApprovalValidationChecks',
        'data-r7-settings-approval-stage',
        'data-r7-settings-approval-risk-level',
        'data-r7-settings-approval-change-row',
        'data-r7-settings-approval-validation-check',
        'data-r7-settings-approval-decision-enabled',
    ]:
        assert marker in source
    for forbidden in [
        '"1구역 · 토마토"',
        '"2026-07-01 09:20"',
        '"10 m/s"',
        '"12 m/s"',
        '"강풍 폐쇄 기준 10→12m/s"',
    ]:
        assert forbidden not in source


def test_r7_080_rendered_modal_uses_row_values_and_missing_state_labels():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel._settingsUsersPermissions = {{ source: 'contract-fixture', approvalRows: [
        {{ id: 501, requestType: '권한 변경', requester: '임서원', requestedRole: 'farm_staff', status: 'pending', createdAt: '2026-07-01 12:34', note: '작업자 앱 접근 승인 요청', target: '사용자 계정 · 임서원', beforeValue: 'status=pending', afterValue: 'status=active', scope: 'RBAC 사용자 승인', riskLevel: '중간' }},
        {{ id: 502, requestType: '장치 매핑', requester: 'admin', status: 'requested', createdAt: '2026-07-01 13:00', target: '2구역 환기창', beforeValue: 'entity 미지정', afterValue: 'cover.zone2_window' }}
      ], auditRows: [], users: [] }};
      panel._settingsApprovalListModal = {{ open: true, selectedId: 501 }};
      const html = panel.renderR7SettingsAdminSubtabPanel('users-permissions', 'users-permissions');
      console.log(JSON.stringify({{ html }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    html = json.loads(result.stdout)["html"]
    for expected in ['임서원', '2026-07-01 12:34', '사용자 계정 · 임서원', 'status=pending', 'status=active', 'RBAC 사용자 승인', '작업자 앱 접근 승인 요청']:
        assert expected in html
    assert 'data-r7-settings-approval-stage="review-pending"' in html
    assert 'data-r7-settings-approval-risk-level="중간"' in html
    assert 'data-r7-settings-approval-decision-enabled="true"' in html
    assert '데이터 없음' in html or '미확인' in html
    for forbidden_text in ['강풍 폐쇄 기준 10→12m/s', '1구역 · 토마토']:
        assert forbidden_text not in html


def test_r7_080_documented_domain_model():
    doc = _read(DOC)
    for phrase in ['requestedAt', 'approvalType', 'riskLevel', 'stageLabel', 'beforeValue', 'afterValue', 'validationChecks', 'decisionEnabled']:
        assert phrase in doc
