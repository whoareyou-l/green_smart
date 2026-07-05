from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-067-settings-visible-tab-cleanup.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render_settings():
    script = f"""
      const classSet = new Set();
      globalThis.location = {{ pathname: '/green_smart', search: '', hash: '#settings-admin' }};
      globalThis.innerWidth = 1280;
      globalThis.document = {{ body: {{ classList: {{ add(c){{ classSet.add(c); }}, remove(c){{ classSet.delete(c); }}, contains(c){{ return classSet.has(c); }} }} }}, getElementById(){{ return null; }}, createElement(){{ return {{ id: '', textContent: '', setAttribute(){{}}, appendChild(){{}} }}; }}, head: {{ appendChild(){{}} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = '';this.dataset = {{}};this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ user: {{ name: 'admin', is_admin: true }}, callApi: async () => ({{}}) }};
      panel._activeR7Domain = 'settings-admin';
      panel._activeR7DomainSubtabs = {{ ...panel._activeR7DomainSubtabs, 'settings-admin': 'greenhouse-zones' }};
      panel._homeContext = {{ actorRole: 'admin', zones: [{{ id: 'zone-1', name: '1구역', currentCrop: {{ crop_cycle_id: 4 }} }}] }};
      console.log(JSON.stringify({{ html: panel.renderR7SettingsAdminZoneVisual() }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)["html"]


def test_r7_067_version_surfaces_are_1_13_2():
    assert '"version": "1.14.81"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.81"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.81"' in _read(REBUILD_PANEL)


def test_r7_067_visible_settings_tabs_are_only_current_six_tabs():
    html = _render_settings()
    visible_nav = html.split('data-r7-domain-subtab-panel', 1)[0]
    expected = ['온실·구역', '장치·센서 매핑', '사용자·권한', '안전·승인 정책', '시스템·연동', '진단·감사']
    for label in expected:
        assert label in visible_nav
    assert '작기·작물 객체' not in visible_nav
    assert visible_nav.count('data-r7-domain-subtab-key=') == 6
    for stale in ['도메인 소유권', '역할·권한', '매핑·장치', '시스템·보안', 'RBAC 정책']:
        assert stale not in visible_nav


def test_r7_067_legacy_settings_markers_remain_hidden_compatibility_only():
    html = _render_settings()
    hidden = html.split('<section style="display:none;">', 1)[1]
    for marker in (
        'data-r7-settings-admin-subtab="domain-ownership"',
        'data-r7-settings-admin-subtab="role-permissions"',
        'data-r7-settings-admin-subtab="mapping-devices"',
        'data-r7-settings-admin-subtab="system-security"',
        'data-r7-settings-admin-subtab="rbac-policy"',
    ):
        assert marker in hidden
    visible_body = html.split('<section style="display:none;">', 1)[0]
    first_panel_and_visible_panels = visible_body.split('data-r7-domain-subtab-panel', 1)[1]
    assert 'data-r7-settings-admin-subtab="domain-ownership"' not in first_panel_and_visible_panels
    assert 'data-r7-settings-admin-subtab="rbac-policy"' not in first_panel_and_visible_panels


def test_r7_067_documented():
    doc = _read(DOC)
    for phrase in ('구버전 탭 버튼 노출 제거', '6개만 표시', 'hidden compatibility marker', '도메인 소유권', 'RBAC 정책'):
        assert phrase in doc
