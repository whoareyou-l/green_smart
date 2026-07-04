from pathlib import Path
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"


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
          {{ label: 'staff01', summary: '생육조사 작성', meta: '2026-06-30 08:10', icon: 'mdi:account-check-outline', tone: 'green' }},
        ],
        users: [
          {{ kind: 'admin', at: 'admin', memo: '활성 · 방금 전', state: '전체 설정', icon: 'mdi:shield-account-outline', tone: 'green' }},
          {{ kind: 'owner01', at: 'farm_owner', memo: '활성 · 오늘 09:20', state: '승인 · 전략', icon: 'mdi:account-tie-outline', tone: 'green' }},
          {{ kind: 'staff01', at: 'farm_staff', memo: '승인 대기 · -', state: '기록 · 모니터링', icon: 'mdi:account-outline', tone: 'amber' }},
          {{ kind: 'staff02', at: 'farm_staff', memo: '대기 · 오늘 08:40', state: '승인 요청', icon: 'mdi:account-clock-outline', tone: 'amber' }},
          {{ kind: 'viewer01', at: 'viewer', memo: '최근 5일 전', state: '조회 전용', icon: 'mdi:account-eye-outline', tone: 'blue' }},
          {{ kind: 'retired01', at: 'inactive', memo: '30일 전', state: '비활성', icon: 'mdi:account-off-outline', tone: 'red' }},
        ],
      }};
      const html = panel.renderR7SettingsAdminSubtabPanel('users-permissions', 'users-permissions');
      console.log(JSON.stringify({{ html }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)["html"]


def test_r7_072_version_surfaces_are_1_13_7():
    assert '"version": "1.14.62"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.62"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.62"' in _read(REBUILD_PANEL)


def test_r7_072_approval_card_has_no_inline_allow_reject_buttons():
    html = _render_users_permissions()
    assert 'data-r7-common-card-shell="settings-approval-needed"' in html
    approval_card = html.split('data-r7-common-card-shell="settings-approval-needed"', 1)[1].split('data-r7-common-card-shell="settings-audit-log"', 1)[0]
    assert 'data-r7-settings-users-action="approve-request"' not in approval_card
    assert 'data-r7-settings-users-action="reject-request"' not in approval_card
    assert '>허락<' not in approval_card
    assert '>반려<' not in approval_card
    assert 'data-r7-settings-users-action="approval-all"' in approval_card


def test_r7_072_approval_subtitle_is_count_and_body_has_rows_only():
    html = _render_users_permissions()
    assert 'data-r7-settings-approval-count-note' in html
    assert '로그인 승인 요청 3건' in html
    assert 'data-r7-settings-approval-primary-summary' not in html
    assert '사용자 승인 요청 · 자동제어 활성화 · 안전 리밋 변경' not in html
    assert '요청자 / 요청 역할 / 요청 상태 / 승인 요청 허락' not in html
    assert '기록 없음' not in html
    assert '승인 대기 6건' not in html
    assert 'data-r7-settings-approval-empty-help' not in html
    assert '승인 요청 데이터가 없으면 요청자와 요청 역할을 추가하세요.' not in html


def test_r7_072_user_summary_card_renders_latest_three_user_rows():
    html = _render_users_permissions()
    assert 'data-r7-common-data-limit="3"' in html
    rows = re.findall(r'data-r7-settings-audit-row="([^"]+)"', html)
    assert len(rows) == 3
    assert rows == ['admin', 'owner01', 'staff01']
    assert 'staff02' not in rows
    assert '총 6명' in html
    assert '총 6명의 사용자가 있습니다' not in html
    assert 'data-r7-settings-audit-primary-summary' not in html
    assert '전체 사용자 목록 보기' in html


def test_r7_072_table_like_common_user_list_limits_to_latest_three():
    html = _render_users_permissions()
    assert 'data-r7-common-table-limit="3"' in html
    rows = re.findall(r'data-r7-settings-user-row="([^"]+)"', html)
    assert len(rows) == 3
    assert rows == ['admin', 'owner01', 'staff01']
    assert 'staff02' not in rows
    assert 'retired01' not in rows
