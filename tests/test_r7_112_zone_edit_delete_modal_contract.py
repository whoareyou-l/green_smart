from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
VIEWS = ROOT / "custom_components/green_smart/rebuild_settings_write_views.py"
INIT = ROOT / "custom_components/green_smart/__init__.py"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_112_version_surfaces_are_1_14_43():
    assert '"version": "1.15.56"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.56"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.56"' in _read(REBUILD_PANEL)


def test_r7_112_zone_backend_has_patch_delete_item_route_with_route_kwargs_and_hard_delete():
    views = _read(VIEWS)
    init = _read(INIT)
    for marker in [
        "update_settings_zone",
        "delete_settings_zone",
        "class RebuildSettingsZoneItemView",
        'url = "/api/green_smart/rebuild/settings/zones/{zone_id}"',
        "async def patch(self, request: web.Request, zone_id=None)",
        "async def delete(self, request: web.Request, zone_id=None)",
        'zone_id = int(zone_id or request.match_info["zone_id"])',
        "DELETE FROM green_smart_settings_zones",
    ]:
        assert marker in views
    assert "SET status = 'deleted'" not in views
    assert "RebuildSettingsZoneItemView" in init
    assert "hass.http.register_view(RebuildSettingsZoneItemView())" in init


def test_r7_112_zone_list_detail_footer_has_edit_delete_before_close():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML=''; this.dataset={{}}; this.style={{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(n){{ return this._items.get(n); }}, define(n,c){{ this._items.set(n,c); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel._settingsShortcutCdaModal = {{ open: true, kind: 'zone-list', selectedZoneId: 31 }};
      panel._settingsGreenhouseZoneData = {{ source: 'test', greenhouses: [{{ id: 1, name: '대표 온실' }}], zones: [{{ id: 31, zoneName: '1-2구역', greenhouseId: 1, greenhouseName: '대표 온실', purpose: '재배 구역', area: '120', bedCount: 6, status: '정상', note: '딸기' }}], deviceSensorMappings: [] }};
      console.log(panel.renderR7SettingsShortcutReviewLikeModal());
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    html = result.stdout
    assert 'data-r7-settings-zone-edit-button="31"' in html
    assert 'data-r7-settings-zone-delete-button="31"' in html
    footer = html[html.index('data-r7-cda-entity-detail-footer="zone-list"'):]
    assert footer.index('data-r7-settings-zone-edit-button="31"') < footer.index('data-r7-settings-zone-delete-button="31"') < footer.index('data-r7-settings-shortcut-cda-split-close')


def test_r7_112_zone_edit_opens_prefilled_zone_modal_and_submit_patches_selected_row():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML=''; this.dataset={{}}; this.style={{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(n){{ return this._items.get(n); }}, define(n,c){{ this._items.set(n,c); }} }};
      globalThis.FormData = class {{ constructor(){{}} entries(){{ return [['greenhouseId','1'], ['name','1-2구역 수정'], ['purpose','재배 구역'], ['area','140'], ['bedCount','7'], ['status','정상'], ['note','수정 메모']]; }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      const calls = [];
      panel.hass = {{ callApi: async (method, path, payload) => {{ calls.push({{ method, path, payload }}); return {{ ok: true, settingsSnapshot: {{ greenhouses: [{{ id: 1, name: '대표 온실' }}], zones: [{{ id: 31, zoneName: '1-2구역 수정' }}], deviceSensorMappings: [] }} }}; }} }};
      panel.render = () => {{}};
      panel._loadSettingsGreenhouseZoneData = async () => {{}};
      panel._settingsShortcutCdaModal = {{ open: true, kind: 'zone-list', selectedZoneId: 31 }};
      panel._settingsGreenhouseZoneData = {{ source: 'test', greenhouses: [{{ id: 1, name: '대표 온실' }}], zones: [{{ id: 31, zoneName: '1-2구역', name: '1-2구역', greenhouseId: 1, greenhouseName: '대표 온실', purpose: '재배 구역', area: '120', bedCount: 6, status: '정상', note: '딸기' }}], deviceSensorMappings: [] }};
      await panel._editSettingsZone(31);
      const html = panel.renderR7SettingsZoneCreateModal();
      await panel._submitSettingsZoneCreateForm({{}});
      console.log(JSON.stringify({{ modal: panel._settingsZoneCreateModal, cda: panel._settingsShortcutCdaModal, html, calls }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    data = json.loads(result.stdout)
    assert data["cda"]["open"] is False
    assert data["modal"]["mode"] == "edit"
    assert '구역 수정' in data["html"]
    assert 'value="1-2구역"' in data["html"]
    assert 'value="120"' in data["html"]
    assert 'value="6"' in data["html"]
    assert '>구역 수정<' in data["html"]
    assert data["calls"][0]["method"] == "PATCH"
    assert data["calls"][0]["path"] == "green_smart/rebuild/settings/zones/31"
    assert data["calls"][0]["payload"]["name"] == "1-2구역 수정"
