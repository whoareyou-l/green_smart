from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DB = ROOT / "custom_components/green_smart/db.py"
VIEWS = ROOT / "custom_components/green_smart/rebuild_settings_write_views.py"
DOC = ROOT / "docs/rebuild/r7-098-settings-greenhouse-zone-real-db-api.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_098_version_surfaces_are_1_14_23():
    assert '"version": "1.15.55"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.55"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.55"' in _read(REBUILD_PANEL)


def test_r7_098_db_schema_has_real_settings_tables_not_ack_only_shell():
    db = _read(DB)
    for table in [
        "green_smart_settings_greenhouses",
        "green_smart_settings_zones",
        "green_smart_settings_device_sensor_mappings",
    ]:
        assert f"CREATE TABLE IF NOT EXISTS {table}" in db
    assert "UNIQUE KEY uniq_settings_greenhouse" in db
    assert "UNIQUE KEY uniq_settings_zone" in db
    assert "UNIQUE KEY uniq_settings_device_sensor_mapping" in db


def test_r7_098_backend_views_have_get_post_and_persist_to_db():
    views = _read(VIEWS)
    for name in [
        "create_settings_greenhouse",
        "list_settings_greenhouses",
        "create_settings_zone",
        "list_settings_zones",
        "create_settings_device_sensor_mapping",
        "list_settings_device_sensor_mappings",
        "settings_snapshot_response",
    ]:
        assert name in views
    assert 'async def get(self, request: web.Request) -> web.Response' in views
    assert 'async def post(self, request: web.Request) -> web.Response' in views
    assert '"saved": True' in views
    assert '"approvalRequired": False' in views
    assert '"settingsSnapshot"' in views
    assert 'approval-gated-settings-shell' not in views
    assert '"saved": False' not in views


def test_r7_098_frontend_reload_settings_snapshot_after_each_save_and_lists_use_api_data():
    source = _read(REBUILD_PANEL)
    assert "REBUILD_SETTINGS_SNAPSHOT_API_PATH" in source
    assert "async _loadSettingsGreenhouseZoneData" in source
    assert "this._settingsGreenhouseZoneData" in source
    for submit in [
        "_submitSettingsGreenhouseCreateForm",
        "_submitSettingsZoneCreateForm",
        "_submitSettingsDeviceSensorMappingForm",
    ]:
        start = source.index(f"async {submit}")
        end = source.index("\n  }", start)
        body = source[start:end]
        assert "await this._loadSettingsGreenhouseZoneData" in body
    assert "const settingsData = this.r7SettingsGreenhouseZoneData()" in source
    assert "settingsData.greenhouses" in source
    assert "settingsData.zones" in source
    assert "settingsData.deviceSensorMappings" in source


def test_r7_098_frontend_submit_behavior_calls_post_then_get_snapshot():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML=''; this.dataset={{}}; this.style={{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(n){{ return this._items.get(n); }}, define(n,c){{ this._items.set(n,c); }} }};
      globalThis.FormData = class {{ constructor(){{}} entries(){{ return [['name','실제 온실'], ['location','화성']]; }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      const calls = [];
      panel.hass = {{ callApi: async (method, path, payload) => {{ calls.push({{ method, path, payload }}); return {{ ok: true, greenhouses: [{{ id: 1, name: '실제 온실' }}], zones: [], deviceSensorMappings: [] }}; }} }};
      panel.render = () => {{}};
      await panel._submitSettingsGreenhouseCreateForm({{}});
      console.log(JSON.stringify({{ calls, data: panel._settingsGreenhouseZoneData }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    data = json.loads(result.stdout)
    assert data["calls"][0]["method"] == "POST"
    assert data["calls"][0]["path"] == "green_smart/rebuild/settings/greenhouses"
    assert data["calls"][1]["method"] == "GET"
    assert data["calls"][1]["path"] == "green_smart/rebuild/settings/snapshot"
    assert data["data"]["greenhouses"][0]["name"] == "실제 온실"


def test_r7_098_documented():
    doc = _read(DOC)
    for phrase in ["실제 DB", "GET/POST", "settingsSnapshot", "green_smart_settings_greenhouses", "장치 연결 작성"]:
        assert phrase in doc
