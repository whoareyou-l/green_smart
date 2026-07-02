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
    assert '"version": "1.14.19"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.19"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.19"' in _read(PANEL)


def test_r7_083_audit_all_has_dedicated_cda_modal_route():
    source = _read(PANEL)
    for marker in [
        '_settingsAuditLogModal',
        '_openSettingsAuditLogModal',
        '_closeSettingsAuditLogModal',
        '_selectSettingsAuditLogRow',
        'renderR7SettingsAuditLogModal()',
        'data-r7-settings-audit-log-button',
        'data-r7-settings-audit-log-close-button',
        'data-r7-settings-audit-log-list-item-button',
        'data-r7-settings-audit-log-cda-modal="true"',
        'data-r7-settings-audit-log-modal-open',
    ]:
        assert marker in source


def test_r7_083_audit_all_button_no_longer_uses_only_generic_action():
    source = _read(PANEL)
    assert 'data-r7-settings-users-action="audit-all" data-r7-settings-audit-log-button' in source
    bind_block = source[source.index('_bindSettingsApprovalActions()'):source.index('_bindR7DomainNavigation()')]
    assert '[data-r7-settings-audit-log-button]' in bind_block
    assert '[data-r7-settings-audit-log-close-button]' in bind_block
    assert '[data-r7-settings-audit-log-list-item-button]' in bind_block


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
        users: [],
        auditRows: [
          {{ id: 1, label: '권한 승인', actor: 'admin', action: 'approve', summary: 'farm_staff 승인', meta: '2026-07-01 05:10', createdAt: '2026-07-01 05:10', tone: 'green' }},
          {{ id: 2, label: '역할 변경', actor: 'owner01', action: 'role-change', summary: '조회 권한 변경', meta: '2026-07-01 05:20', createdAt: '2026-07-01 05:20', tone: 'amber' }}
        ]
      }};
      panel._settingsAuditLogModal = {{ open: true, selectedId: 2 }};
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
        '권한 승인',
        '역할 변경',
    ]:
        assert marker in html
    assert '히스토리를 불러오는 중입니다.' not in html
    assert 'data-r7-record-modal-loading' not in html


def test_r7_083_documented():
    doc = _read(DOC)
    for phrase in ['전체 감사 로그 보기', 'CDA', '감사 로그', '누락 경로', '기록 히스토리 팝업 모달의 완성형']:
        assert phrase in doc
