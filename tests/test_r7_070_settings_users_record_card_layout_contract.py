from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-070-settings-users-record-card-layout.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render_users_permissions():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ user: {{ name: 'admin', is_admin: true }}, callApi: async () => ({{}}) }};
      panel._settingsUsersPermissions = {{
        source: 'contract-fixture',
        approvalRows: [
          {{ label: '사용자 승인 요청', meta: 'staff02 · farm_staff · 대기', icon: 'mdi:account-clock-outline', tone: 'amber' }},
          {{ label: '자동제어 활성화', meta: 'owner01 허락 필요', icon: 'mdi:robot-outline', tone: 'amber' }},
          {{ label: '안전 리밋 변경', meta: 'farm_owner 허락 필요', icon: 'mdi:shield-alert-outline', tone: 'amber' }},
        ],
        auditRows: [
          {{ label: 'admin', summary: '역할 허락: staff01 → farm_staff', meta: '2026-06-30 09:12', icon: 'mdi:account-check-outline', tone: 'green' }},
          {{ label: 'owner01', summary: '안전 정책 허락', meta: '2026-06-30 08:45', icon: 'mdi:account-check-outline', tone: 'green' }},
        ],
        users: [
          {{ kind: 'admin', at: 'admin', memo: '활성 · 방금 전', state: '전체 설정', icon: 'mdi:shield-account-outline', tone: 'green' }},
          {{ kind: 'owner01', at: 'farm_owner', memo: '활성 · 오늘 09:20', state: '승인 · 전략', icon: 'mdi:account-tie-outline', tone: 'green' }},
          {{ kind: 'staff01', at: 'farm_staff', memo: '승인 대기 · -', state: '기록 · 모니터링', icon: 'mdi:account-outline', tone: 'amber' }},
          {{ kind: 'staff02', at: 'farm_staff', memo: '대기 · 오늘 08:40', state: '승인 요청', icon: 'mdi:account-clock-outline', tone: 'amber' }},
          {{ kind: 'viewer01', at: 'viewer', memo: '최근 5일 전', state: '조회 전용', icon: 'mdi:account-eye-outline', tone: 'blue' }},
        ],
      }};
      const html = panel.renderR7SettingsAdminSubtabPanel('users-permissions', 'users-permissions');
      console.log(JSON.stringify({{ html }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)["html"]


def test_r7_070_version_surfaces_are_1_13_5():
    assert '"version": "1.14.3"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.3"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.3"' in _read(REBUILD_PANEL)


def test_r7_070_users_permissions_uses_record_workflow_card_grammar_and_order():
    html = _render_users_permissions()
    assert 'data-r7-settings-users-record-card-layout="true"' in html
    assert 'data-r7-settings-users-layout-order="approval-audit-matrix-user-list"' in html
    for section in ['approval-needed', 'audit-log', 'permission-matrix-summary', 'user-list-wide']:
        assert f'data-r7-record-section="settings-{section}"' in html
    approval_idx = html.index('data-r7-record-section="settings-approval-needed"')
    audit_idx = html.index('data-r7-record-section="settings-audit-log"')
    matrix_idx = html.index('data-r7-record-section="settings-permission-matrix-summary"')
    users_idx = html.index('data-r7-record-section="settings-user-list-wide"')
    assert approval_idx < audit_idx < matrix_idx < users_idx
    assert 'grid-column:1/-1' in html


def test_r7_070_user_list_is_full_width_and_has_no_buttons():
    html = _render_users_permissions()
    user_list = html.split('data-r7-record-section="settings-user-list-wide"', 1)[1]
    assert '사용자 목록' in user_list
    assert 'admin' in user_list and 'owner01' in user_list and 'staff01' in user_list
    forbidden = ['사용자 초대', '역할 변경', 'data-r7-settings-users-action="invite"', 'data-r7-settings-users-action="role-change"']
    for item in forbidden:
        assert item not in user_list


def test_r7_070_permission_matrix_table_moves_to_hidden_modal():
    html = _render_users_permissions()
    summary = html.split('data-r7-settings-permission-matrix-modal', 1)[0]
    assert '권한 매트릭스 보기' in summary
    assert 'data-r7-settings-users-action="open-permission-matrix-modal"' in summary
    assert 'data-r7-settings-permission-matrix-table' not in summary
    modal = html.split('data-r7-settings-permission-matrix-modal', 1)[1]
    assert 'style="display:none' in modal
    assert 'data-r7-settings-permission-matrix-table' in modal
    for step in ['기본 조회 / 상세 조회', '기록 작성 / 기록 수정', '실행 요청 / 실행 허락', '구역/작기 설정 / 권한 설정']:
        assert step in modal


def test_r7_070_documented():
    doc = _read(DOC)
    for phrase in ['기록·작업 공동 컴포넌트', '승인 필요 작업, 감사 로그, 권한 버킷 매트릭스', '사용자 목록 full-width', '사용자 목록 버튼 제거', '권한 매트릭스 표는 모달']:
        assert phrase in doc
