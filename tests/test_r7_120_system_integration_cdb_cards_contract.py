from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-120-system-integration-cdb-cards.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render_system_integration() -> str:
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
      panel._activeR7DomainSubtabs = {{ ...panel._activeR7DomainSubtabs, 'settings-admin': 'system-integration' }};
      panel._homeContext = {{ actorRole: 'admin', greenhouseName: '대표 온실', zones: [{{ id: 'zone-a', zoneName: 'A구역' }}] }};
      console.log(JSON.stringify({{ html: panel.renderR7SettingsAdminZoneVisual() }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)["html"]


def test_r7_120_version_surfaces_are_1_14_80():
    assert '"version": "1.15.10"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.10"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.10"' in _read(REBUILD_PANEL)


def test_r7_120_system_integration_uses_cdb_layout_and_cards():
    html = _render_system_integration()
    assert 'data-r7-settings-system-integration' in html
    assert 'data-r7-cdb-subtab-content-layout="summary3-action3-list"' in html
    assert 'data-r7-cdb-layout-row="summary"' in html
    assert 'data-r7-cdb-layout-row="actions"' in html
    assert 'data-r7-cdb-layout-row="list"' in html
    assert html.count('data-r7-cdb-card-type="summary"') >= 3
    assert html.count('data-r7-cdb-card-type="button-one"') >= 2
    assert html.count('data-r7-cdb-card-type="button-two"') >= 1
    assert html.count('data-r7-cdb-card-type="list"') >= 1
    for card in ('ha-connection', 'db-connection', 'api-status'):
        marker_at = html.index(f'data-r7-settings-system-summary-card="{card}"')
        start = html.rindex('<article', 0, marker_at)
        end = html.index('</article>', marker_at)
        snippet = html[start:end]
        assert 'data-r7-cdb-card-type="summary"' in snippet
        assert 'data-r7-cdb-common-card="summary-card"' in snippet
    for card in ('system-update-deferred', 'system-db-api-errors'):
        marker_at = html.index(f'data-r7-settings-system-action-card="{card}"')
        start = html.rindex('<article', 0, marker_at)
        end = html.index('</article>', marker_at)
        snippet = html[start:end]
        assert 'data-r7-cdb-card-type="button-one"' in snippet
        assert 'data-r7-cdb-button-role="list"' in snippet
    marker_at = html.index('data-r7-settings-system-action-card="system-center-connection"')
    start = html.rindex('<article', 0, marker_at)
    end = html.index('</article>', marker_at)
    snippet = html[start:end]
    assert 'data-r7-cdb-card-type="button-two"' in snippet
    assert 'data-r7-common-card-subtitle' in snippet
    assert 'data-r7-cdb-button-two-subtitle="present"' in snippet


def test_r7_120_system_integration_visible_content_and_secret_boundary():
    html = _render_system_integration()
    for text in (
        'Home Assistant 연동', 'DB 연결', 'API 상태',
        'HA 버전', 'HACS 버전', 'GS 버전',
        'DB 종류', 'DB 버전', 'DB 상태',
        'Center 연결 상태', 'Center API 상태', 'Edge API 상태',
        '업데이트', 'DB/API 오류', 'Center 연결',
        '업데이트 목록', '오류 작업 보기', '허용 토큰 연결', 'Center 목록',
        '연동 목록', '[REDACTED]',
    ):
        assert text in html
    for old_label in ('>패널<', '>API<', '>Entity<', '>운영 DB<', '>Recorder<', '>Boundary<', '>전체 DB 상태<', '>HA DB 상태<', '>GS DB 상태<', '>DB 사용<', '>Secret<', '>HA 리소스<', '>DB 경계<', '>Secret redaction<'):
        assert old_label not in html
    assert 'Secret values render as [REDACTED] only' in html
    assert 'data-r7-settings-system-integration-card="ha"' not in html
    assert 'data-r7-settings-system-integration-card="db"' not in html
    assert 'data-r7-settings-system-integration-card="api"' not in html
    assert 'data-r7-settings-system-integration-card="secret"' not in html


def test_r7_120_documented():
    doc = _read(DOC)
    for phrase in ('시스템·연동', 'summary row: 3 summary cards', 'action row: 2 one-button cards + 1 two-button card', 'list row: 1 list card', 'Secret values render as [REDACTED] only'):
        assert phrase in doc
