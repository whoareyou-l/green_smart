from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
DOC = ROOT / "docs/rebuild/r7-083-settings-audit-cda-modal.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_083_version_surfaces_are_1_14_8():
    assert '"version": "1.15.56"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.56"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.56"' in _read(PANEL)


def test_r7_083_audit_all_has_dedicated_cda_modal_route():
    source = _read(PANEL)
    for marker in [
        '_settingsAuditLogModal',
        '_openSettingsAuditLogModal',
        '_closeSettingsAuditLogModal',
        '_selectSettingsAuditLogRow',
        '_updateSettingsAuditLogRow',
        'renderR7SettingsAuditLogModal()',
        'data-r7-settings-audit-log-button',
        'data-r7-settings-audit-log-close-button',
        'data-r7-settings-audit-log-list-item-button',
        'data-r7-settings-audit-log-reject-button',
        'data-r7-settings-audit-log-edit-button',
        'data-r7-settings-audit-log-cda-modal="true"',
        'data-r7-settings-audit-log-modal-open',
    ]:
        assert marker in source
    assert 'REBUILD_SETTINGS_AUDIT_LOG_API_PREFIX = "green_smart/rebuild/settings/audit-logs/"' in source


def test_r7_083_audit_all_button_no_longer_uses_only_generic_action():
    source = _read(PANEL)
    assert 'data-r7-settings-users-action="audit-all" data-r7-settings-audit-log-button' in source
    bind_block = source[source.index('_bindSettingsApprovalActions()'):source.index('_bindR7DomainNavigation()')]
    assert '[data-r7-settings-audit-log-button]' in bind_block
    assert '[data-r7-settings-audit-log-close-button]' in bind_block
    assert '[data-r7-settings-audit-log-list-item-button]' in bind_block
    assert '[data-r7-settings-audit-log-reject-button]' in bind_block
    assert '[data-r7-settings-audit-log-edit-button]' in bind_block


def test_r7_083_settings_audit_log_modal_uses_cda_completion_shape():
    source = _read(PANEL)
    block = source[source.index('renderR7SettingsAuditLogModal()'):source.index('renderR7SettingsApprovalListModal()')]
    for marker in [
        'this.renderR7CdaSearchFilterBar',
        'this.renderR7CdaCompactListRow',
        'this.renderR7CdaListPanel',
        'this.renderR7CdaDetailSection',
        'this.renderR7CdaDetailPanel',
        'this.renderR7CdaActionFooter',
        'this.renderR7CdaSplitModal',
        'data-r7-settings-audit-log-cda-modal="true"',
        'data-r7-settings-audit-log-detail-panel',
    ]:
        assert marker in block


def test_r7_083_rendered_audit_all_modal_uses_cda_not_legacy_history_card():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel._settingsUsersPermissions = {{
        source: 'contract-fixture',
        approvalRows: [],
        auditRows: [],
        users: [
          {{ id: 1, haUserId: 'admin-ha-id', displayName: 'admin', role: 'admin', status: 'active', permissionSummary: '전체 설정', lastSeenAt: '2026-07-03 08:12', createdAt: '2026-07-03 06:15', updatedAt: '2026-07-03 08:12' }},
          {{ id: 3, haUserId: 'user-ha-id', displayName: '임서원', role: 'farm_staff', status: 'active', permissionSummary: '기록 · 모니터링', lastSeenAt: '2026-07-03 06:15', createdAt: '2026-07-03 06:15', updatedAt: '2026-07-03 06:17' }}
        ]
      }};
      panel._settingsAuditLogModal = {{ open: true, selectedId: 'user-ha-id' }};
      const html = panel.renderR7SettingsAdminSubtabPanel('users-permissions', 'users-permissions');
      console.log(JSON.stringify({{ html }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    html = json.loads(result.stdout)['html']
    for marker in [
        'data-r7-settings-audit-log-cda-modal="true"',
        'data-r7-settings-audit-log-modal-open="true"',
        'data-r7-cda-modal-overlay',
        'data-r7-cda-modal-card',
        'data-r7-cda-modal-header',
        'data-r7-cda-list-panel',
        'data-r7-cda-detail-panel',
        'data-r7-cda-split-modal',
        'data-r7-settings-audit-log-detail-panel',
        'data-r7-settings-audit-log-export',
        'data-r7-settings-audit-log-reject-button="user-ha-id"',
        'data-r7-settings-audit-log-edit-button="user-ha-id"',
        '유저 목록',
        '선택한 유저 상세',
        '번호',
        '사용자 이름',
        '역할',
        '상태',
        '수정일',
        'HA 사용자 ID',
        '권한 요약',
        '최근 접속',
        '생성일',
        '유저 DB',
        '임서원',
        'farm_staff',
        '거부',
        '수정',
    ]:
        assert marker in html
    detail_start = html.index('data-r7-settings-audit-log-detail-panel')
    detail_end = html.index('<footer', detail_start) if '<footer' in html[detail_start:] else len(html)
    detail = html[detail_start:detail_end]
    assert 'data-r7-settings-audit-log-close-button style' not in detail
    assert '히스토리를 불러오는 중입니다.' not in html
    assert 'data-r7-record-modal-loading' not in html
def test_r7_083_audit_edit_uses_growth_common_modal_prefilled_with_db_columns():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel._settingsUsersPermissions = {{
        source: 'contract-fixture', approvalRows: [], auditRows: [],
        users: [{{ id: 7, haUserId: 'ha-user-7', displayName: '임서원', role: 'farm_staff', status: 'active', permissionSummary: '기록 · 모니터링', lastSeenAt: '2026-07-03 06:17', createdAt: '2026-07-03 06:15', updatedAt: '2026-07-03 06:17' }}]
      }};
      panel._settingsAuditLogEditModal = {{ open: true, selectedId: 'ha-user-7', state: 'idle' }};
      const html = panel.renderR7SettingsAuditLogEditModal();
      console.log(JSON.stringify({{ html }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    html = json.loads(result.stdout)['html']
    for marker in [
        'data-r7-record-common-modal-shell',
        'data-r7-settings-audit-log-edit-modal="true"',
        'data-r7-settings-audit-log-edit-form',
        'name="haUserId" value="ha-user-7"',
        'name="displayName" value="임서원"',
        'data-r7-settings-user-role-select',
        '<select name="role"',
        '<option value="farm_staff" selected>농장 작업자</option>',
        '<option value="admin"',
        '<option value="farm_owner"',
        'data-r7-settings-user-status-select',
        '<select name="status"',
        '<option value="active" selected>활성</option>',
        '<option value="pending"',
        '<option value="rejected"',
        'name="permissionSummary"',
        '사용자 이름',
        '역할',
        '상태',
        '권한 요약',
        '기록 · 모니터링',
        '유저 수정',
        'gs_users DB 항목',
    ]:
        assert marker in html


def test_r7_083_documented():
    doc = _read(DOC)
    for phrase in ['전체 감사 로그 보기', 'CDA', '감사 로그', '누락 경로', '기록 히스토리 팝업 모달의 완성형']:
        assert phrase in doc
