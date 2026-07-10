from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
WRITE_VIEWS = ROOT / "custom_components/green_smart/rebuild_settings_write_views.py"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render_with_system(system: dict) -> str:
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
      panel._settingsGreenhouseZoneData = {{ source: 'contract', greenhouses: [], zones: [], deviceSensorMappings: [], devices: [], deviceGroups: [], systemIntegration: {json.dumps(system, ensure_ascii=False)} }};
      console.log(JSON.stringify({{ html: panel.renderR7SettingsAdminZoneVisual() }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)["html"]


def test_r7_127_system_cards_use_live_snapshot_values_not_hardcoded_copy():
    html = _render_with_system({
        "haVersion": "HA-LIVE-2026.7.1",
        "hacsVersion": "HACS-LIVE-3.0.0",
        "gsVersion": "GS-LIVE-1.15.08",
        "dbUse": "MariaDB",
        "dbVersion": "MariaDB-LIVE-11.9",
        "dbStatus": "정상",
        "dbErrorCount": 0,
        "centerConnectionStatus": "설정됨",
        "centerApiStatus": "오류 2건",
        "centerApiErrorCount": 2,
        "edgeApiStatus": "정상",
        "edgeApiErrorCount": 0,
        "gsUpdateStatus": "업데이트 가능",
        "hacsUpdateStatus": "최신",
        "haDbUpdateStatus": "Update Agent 도입 후",
    })
    for expected in (
        "HA-LIVE-2026.7.1",
        "HACS-LIVE-3.0.0",
        "GS-LIVE-1.15.08",
        "DB 종류",
        "MariaDB-LIVE-11.9",
        "업데이트 가능",
        "Center",
        "오류 2건",
        "Edge",
        "정상",
        "시스템 기준",
        "3개",
        "3건",
        "1건",
        "4건",
    ):
        assert expected in html
    system_html = html[html.index('data-r7-settings-system-integration'):]
    for stale in ("DB 사용", "로그 조회 · watchdog 재검사", "힌트 확인 후 재검사", "HA/HACS/GS 실제 버전", "MariaDB watchdog", "Center/Edge watchdog"):
        assert stale not in system_html
    for stale in ('>작업</span>', '>수정</span>'):
        assert stale not in system_html


def test_r7_127_zero_errors_show_normal_and_positive_errors_show_count_per_domain():
    html = _render_with_system({"dbErrorCount": 0, "centerApiErrorCount": 1, "edgeApiErrorCount": 3, "dbUse": "MariaDB"})
    assert "DB" in html and "정상" in html
    assert "Center" in html and "오류 1건" in html
    assert "Edge" in html and "오류 3건" in html


def test_r7_127_watchdog_manifest_versions_use_executor_not_event_loop_read_text():
    source = _read(WRITE_VIEWS)
    for marker in (
        "async def _manifest_version_async",
        "async_add_executor_job",
        "async def _hacs_version_status",
        "async def _gs_version_status",
        '"hacsVersion": await _hacs_version_status(hass)',
        '"gsVersion": await _gs_version_status(hass)',
    ):
        assert marker in source
    watchdog_start = source.index("async def system_integration_watchdog_response")
    watchdog_block = source[watchdog_start: source.index("def _update_entity_dto", watchdog_start)]
    assert '"hacsVersion": _hacs_version_status(hass)' not in watchdog_block
    assert '"gsVersion": _gs_version_status(hass)' not in watchdog_block
