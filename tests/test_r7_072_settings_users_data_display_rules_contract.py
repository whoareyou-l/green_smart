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
      const html = panel.renderR7SettingsAdminSubtabPanel('users-permissions', 'users-permissions');
      console.log(JSON.stringify({{ html }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)["html"]


def test_r7_072_version_surfaces_are_1_13_7():
    assert '"version": "1.13.7"' in _read(MANIFEST)
    assert 'const VERSION = "1.13.7"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.13.7"' in _read(REBUILD_PANEL)


def test_r7_072_approval_card_has_no_inline_allow_reject_buttons():
    html = _render_users_permissions()
    assert 'data-r7-common-card-shell="settings-approval-needed"' in html
    approval_card = html.split('data-r7-common-card-shell="settings-approval-needed"', 1)[1].split('data-r7-common-card-shell="settings-audit-log"', 1)[0]
    assert 'data-r7-settings-users-action="approve-request"' not in approval_card
    assert 'data-r7-settings-users-action="reject-request"' not in approval_card
    assert '>허락<' not in approval_card
    assert '>반려<' not in approval_card
    assert 'data-r7-settings-users-action="approval-all"' in approval_card


def test_r7_072_approval_primary_and_note_are_data_summary_not_static_description():
    html = _render_users_permissions()
    assert 'data-r7-settings-approval-primary-summary' in html
    assert '사용자 승인 요청 · 자동제어 활성화 · 안전 리밋 변경' not in html
    assert '요청자 / 요청 역할 / 요청 상태 / 승인 요청 허락' not in html
    assert any(text in html for text in ['기록 없음', '최근 5일 전', '승인 대기'])
    # 데이터가 있을 때는 추가 요청 안내성 부연 설명을 표시하지 않는다.
    assert 'data-r7-settings-approval-empty-help' not in html
    assert '승인 요청 데이터가 없으면 요청자와 요청 역할을 추가하세요.' not in html


def test_r7_072_common_component_data_limit_renders_latest_two_audit_rows():
    html = _render_users_permissions()
    assert 'data-r7-common-data-limit="2"' in html
    rows = re.findall(r'data-r7-settings-audit-row="([^"]+)"', html)
    assert len(rows) == 2
    assert rows == ['admin', 'owner01']
    assert 'staff01' not in rows
    assert '2026-06-30 09:12' in html
    assert '2026-06-30 08:45' in html
    assert '2026-06-30 08:10' not in html


def test_r7_072_table_like_common_user_list_limits_to_latest_five():
    html = _render_users_permissions()
    assert 'data-r7-common-table-limit="5"' in html
    rows = re.findall(r'data-r7-settings-user-row="([^"]+)"', html)
    assert len(rows) == 5
    assert rows == ['admin', 'owner01', 'staff01', 'staff02', 'viewer01']
    assert 'retired01' not in rows
