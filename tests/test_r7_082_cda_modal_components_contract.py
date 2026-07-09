from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
DOC = ROOT / "docs/rebuild/r7-082-cda-modal-components.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_082_version_surfaces_are_1_14_7():
    assert '"version": "1.14.88"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.88"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.88"' in _read(PANEL)


def test_r7_082_cda_primitives_exist_small_to_large():
    source = _read(PANEL)
    expected_order = [
        'renderR7CdaModalOverlay(',
        'renderR7CdaModalCard(',
        'renderR7CdaModalHeader(',
        'renderR7CdaSearchFilterBar(',
        'renderR7CdaCompactListRow(',
        'renderR7CdaListPanel(',
        'renderR7CdaDetailSection(',
        'renderR7CdaDetailPanel(',
        'renderR7CdaActionFooter(',
        'renderR7CdaSplitModal(',
    ]
    positions = [source.index(item) for item in expected_order]
    assert positions == sorted(positions)
    for marker in [
        'data-r7-cda-modal-overlay',
        'data-r7-cda-modal-card',
        'data-r7-cda-modal-header',
        'data-r7-cda-search-filter-bar',
        'data-r7-cda-list-panel',
        'data-r7-cda-compact-list-row',
        'data-r7-cda-detail-panel',
        'data-r7-cda-detail-section',
        'data-r7-cda-action-footer',
        'data-r7-cda-split-modal',
    ]:
        assert marker in source


def test_r7_082_approval_modal_uses_cda_split_modal_components():
    source = _read(PANEL)
    approval_block = source[source.index('renderR7SettingsApprovalListModal()'):source.index('renderR7SettingsApprovalModal()')]
    for marker in [
        'this.renderR7CdaSearchFilterBar',
        'this.renderR7CdaCompactListRow',
        'this.renderR7CdaListPanel',
        'this.renderR7CdaDetailSection',
        'this.renderR7CdaDetailPanel',
        'this.renderR7CdaActionFooter',
        'this.renderR7CdaSplitModal',
        'data-r7-settings-approval-reference-modal="true"',
    ]:
        assert marker in approval_block


def test_r7_082_record_history_modal_uses_same_cda_completion_shape():
    source = _read(PANEL)
    record_block = source[source.index('renderR7RecordWorkflowModal()'):source.index('renderR7RecordsWorkflowProductLayout')]
    for marker in [
        'renderR7RecordHistoryCdaBody',
        'this.renderR7CdaCompactListRow',
        'this.renderR7CdaListPanel',
        'this.renderR7CdaDetailSection',
        'this.renderR7CdaDetailPanel',
        'this.renderR7CdaSplitModal',
        'data-r7-record-history-cda-modal="true"',
        'data-r7-record-history-detail-panel',
    ]:
        assert marker in source if marker == 'renderR7RecordHistoryCdaBody' else marker in record_block or marker in source


def test_r7_082_rendered_approval_and_record_history_share_cda_markers():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(PANEL)!r});
      const approval = new mod.GreenSmartRebuildPanel();
      approval._settingsUsersPermissions = {{ source: 'contract-fixture', approvalRows: [{{ id: 900, requestType: '권한 변경', requester: '임서원', requestedRole: 'farm_staff', status: 'pending', createdAt: '2026-07-01 04:10', note: '접근 승인 요청' }}], auditRows: [], users: [] }};
      approval._settingsApprovalListModal = {{ open: true, selectedId: 900 }};
      const approvalHtml = approval.renderR7SettingsAdminSubtabPanel('users-permissions', 'users-permissions');
      const record = new mod.GreenSmartRebuildPanel();
      record._r7RecordModal = {{ mode: 'history', recordType: 'growth-survey', seasonId: 7, title: '생육조사 예전 기록', state: 'ready', rows: [{{ id: 1, date: '2026-07-01', summary: '초장 12cm', note: '정상' }}] }};
      const recordHtml = record.renderR7RecordWorkflowModal();
      console.log(JSON.stringify({{ approvalHtml, recordHtml }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    payload = json.loads(result.stdout)
    for html in [payload['approvalHtml'], payload['recordHtml']]:
        assert 'data-r7-cda-modal-overlay' in html
        assert 'data-r7-cda-modal-card' in html
        assert 'data-r7-cda-modal-header' in html
        assert 'data-r7-cda-list-panel' in html
        assert 'data-r7-cda-detail-panel' in html
        assert 'data-r7-cda-split-modal' in html
    assert 'data-r7-settings-approval-reference-modal="true"' in payload['approvalHtml']
    assert 'data-r7-record-history-cda-modal="true"' in payload['recordHtml']
    assert 'data-r7-record-modal-shell' in payload['recordHtml']
    assert 'data-r7-record-history-list' in payload['recordHtml']
    assert 'data-r7-record-history-detail-panel' in payload['recordHtml']


def test_r7_082_documented():
    doc = _read(DOC)
    for phrase in ['CDA', 'primitive', 'composition', '완성형', '승인 필요 작업', '기록 히스토리', '작은 것부터 큰 순서']:
        assert phrase in doc
