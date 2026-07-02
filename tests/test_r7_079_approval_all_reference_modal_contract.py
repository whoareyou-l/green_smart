from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
DOC = ROOT / "docs/rebuild/r7-079-approval-all-reference-modal.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_079_version_surfaces_are_1_14_4():
    assert '"version": "1.14.22"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.22"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.22"' in _read(PANEL)


def test_r7_079_reference_modal_structure_markers_exist():
    source = _read(PANEL)
    for marker in [
        'data-r7-settings-approval-reference-modal="true"',
        'data-r7-settings-approval-search-input',
        'data-r7-settings-approval-filter="all"',
        'data-r7-settings-approval-filter="safety"',
        'data-r7-settings-approval-filter="automation"',
        'data-r7-settings-approval-filter="device-mapping"',
        'data-r7-settings-approval-filter="permission"',
        'data-r7-settings-approval-filter="urgent"',
        'data-r7-settings-approval-pending-list',
        'data-r7-settings-approval-review-pane',
        'data-r7-settings-approval-section="request-info"',
        'data-r7-settings-approval-section="change-detail"',
        'data-r7-settings-approval-section="risk-analysis"',
        'data-r7-settings-approval-section="check-tags"',
        'data-r7-settings-approval-decision-memo',
        'data-r7-settings-approval-reject-button',
        'data-r7-settings-approval-hold-button',
        'data-r7-settings-approval-apply-button',
        '_selectSettingsApprovalListRequest',
    ]:
        assert marker in source


def test_r7_079_rendered_reference_modal_matches_requested_layout():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel._settingsUsersPermissions = {{ source: 'contract-fixture', approvalRows: [
        {{ id: 77, label: '안전 확인', requestType: '안전 확인', requester: 'farm_owner', requestedRole: 'farm_staff', status: 'pending', meta: '강풍 폐쇄 기준 10→12m/s', createdAt: '2026-07-01 09:20', note: '강풍 폐쇄 기준 10→12m/s' }},
        {{ id: 78, label: '자동제어', requester: 'admin', requestedRole: 'farm_owner', status: 'pending', meta: '관수 자동 실행 활성화', createdAt: '2026-07-01 08:55' }}
      ], auditRows: [], users: [] }};
      panel._settingsApprovalListModal = {{ open: true, selectedId: 77 }};
      panel._settingsApprovalModal = {{ open: false, request: null }};
      const html = panel.renderR7SettingsAdminSubtabPanel('users-permissions', 'users-permissions');
      console.log(JSON.stringify({{ html }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    html = json.loads(result.stdout)["html"]
    for text in ["승인 필요 작업", "승인 대기 목록", "선택 작업 검토", "요청 정보", "변경 내용", "영향 분석", "검증 체크", "승인/반려 메모", "상세 로그 보기", "반려", "보류", "승인 적용"]:
        assert text in html
    assert 'data-r7-settings-approval-reference-modal="true"' in html
    assert 'data-r7-settings-approval-list-modal-open="true"' in html
    assert 'data-r7-settings-approval-list-row-selected="true"' in html
    assert 'data-r7-settings-approval-apply-button="77"' in html
    assert 'data-r7-settings-approval-approve-button="77"' in html
    assert '기록 히스토리' not in html


def test_r7_079_documented():
    doc = _read(DOC)
    for phrase in ["좌측 승인 대기 목록", "우측 선택 작업 검토", "요청 정보", "변경 내용", "영향 분석", "검증 체크", "승인 적용"]:
        assert phrase in doc
