from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-069-settings-users-permissions-matrix-approval.md"


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


def test_r7_069_version_surfaces_are_1_13_4():
    assert '"version": "1.13.6"' in _read(MANIFEST)
    assert 'const VERSION = "1.13.6"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.13.6"' in _read(REBUILD_PANEL)


def test_r7_069_permission_matrix_has_detailed_steps_and_edit_buttons():
    html = _render_users_permissions()
    assert 'data-r7-settings-permission-matrix-detailed="true"' in html
    for bucket in ['조회', '기록', '전략', '실행', '안전', '고급설정']:
        assert f'data-r7-settings-permission-step-row="{bucket}"' in html
    for step in ['기본 조회', '상세 조회', '기록 작성', '기록 수정', '전략 검토', '전략 승인', '실행 요청', '실행 허락', '안전 확인', '인터록 해제 검토', '구역/작기 설정', '권한 설정']:
        assert step in html
    assert html.count('data-r7-settings-permission-edit=') >= 6
    assert '수정' in html


def test_r7_069_typography_alignment_markers_exist():
    html = _render_users_permissions()
    assert 'data-r7-settings-users-typography="aligned-compact"' in html
    assert 'data-r7-settings-users-grid-align="centered"' in html
    assert 'font-size:12px' in html
    assert 'line-height:1.35' in html
    assert 'text-align:center' in html
    assert 'align-items:center' in html


def test_r7_069_user_flow_is_approval_request_not_invitation():
    html = _render_users_permissions()
    required = [
        '사용자 승인 요청',
        '승인 요청 허락',
        '요청자',
        '요청 역할',
        '요청 상태',
        '대기',
        '허락',
        '반려',
        'data-r7-settings-user-approval-request-row=',
        'data-r7-settings-users-action="approve-request"',
        'data-r7-settings-users-action="reject-request"',
    ]
    for item in required:
        assert item in html
    forbidden = ['사용자 초대', '초대 대기', 'data-r7-settings-users-action="invite"']
    for item in forbidden:
        assert item not in html


def test_r7_069_documented():
    doc = _read(DOC)
    for phrase in ['권한 버킷 매트릭스 상세화', '수정 버튼', '글자 수평 정렬', '사용자 승인 요청', '초대 방식 제외']:
        assert phrase in doc
