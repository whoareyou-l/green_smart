from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-068-settings-users-permissions-image-layout.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render_users_permissions(open_permission_matrix=False):
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
      panel._settingsPermissionMatrixModal = {{ open: {str(open_permission_matrix).lower()} }};
      const html = panel.renderR7SettingsAdminSubtabPanel('users-permissions', 'users-permissions');
      console.log(JSON.stringify({{ html }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)["html"]


def test_r7_068_version_surfaces_are_1_13_3():
    assert '"version": "1.14.33"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.33"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.33"' in _read(REBUILD_PANEL)


def test_r7_068_users_permissions_matches_reference_card_structure_without_policy_memo():
    html = _render_users_permissions()
    required = [
        'data-r7-settings-users-permissions-image-layout="true"',
        'data-r7-settings-users-card="user-list"',
        '사용자 목록',
        'data-r7-settings-users-card="permission-matrix"',
        '권한 버킷 매트릭스',
        'data-r7-settings-users-card="approval-queue"',
        '승인 필요 작업',
        'data-r7-settings-users-card="audit-log"',
        '감사 로그',
        'admin',
        'owner01',
        'staff01',
        'farm_owner',
        'farm_staff',
        '사용자 승인 요청',
        '승인 요청 허락',
        '모든 승인 요청 확인',
        '전체 감사 로그 보기',
    ]
    for item in required:
        assert item in html
    forbidden = ['권한 정책 메모', '정책 상세 보기', '권한 버킷은 UI 표시와 backend enforcement를 분리합니다']
    for item in forbidden:
        assert item not in html


def test_r7_068_permission_matrix_contains_role_columns_and_bucket_rows():
    html = _render_users_permissions(open_permission_matrix=True)
    for role in ['admin', 'farm_owner', 'farm_staff']:
        assert f'data-r7-settings-permission-role="{role}"' in html
    for bucket in ['조회', '기록', '전략', '실행', '안전', '고급설정']:
        assert f'data-r7-settings-permission-bucket="{bucket}"' in html
    for state in ['허용', '읽기 전용', '확인', '없음']:
        assert state in html


def test_r7_068_user_list_approval_audit_rows_are_table_like():
    html = _render_users_permissions()
    assert html.count('data-r7-settings-user-row=') == 5
    assert html.count('data-r7-settings-approval-row=') >= 3
    assert html.count('data-r7-settings-audit-row=') == 2
    assert 'data-r7-common-data-limit="2"' in html
    assert 'data-r7-common-table-limit="5"' in html
    for header in ['사용자', '역할', '상태', '최근 활동', '권한 요약']:
        assert header in html


def test_r7_068_documented():
    doc = _read(DOC)
    for phrase in ['사용자·권한', '사용자 목록', '권한 버킷 매트릭스', '승인 필요 작업', '감사 로그', '권한 정책 메모 제외']:
        assert phrase in doc
