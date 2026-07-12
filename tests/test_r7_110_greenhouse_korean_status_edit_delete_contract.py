from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DB = ROOT / "custom_components/green_smart/db.py"
VIEWS = ROOT / "custom_components/green_smart/rebuild_settings_write_views.py"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_110_version_surfaces_are_1_14_41():
    assert '"version": "1.15.41"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.41"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.41"' in _read(REBUILD_PANEL)


def test_r7_110_greenhouse_db_stores_korean_status_labels_not_english_codes():
    db = _read(DB)
    views = _read(VIEWS)
    assert "operating_status VARCHAR(32) NOT NULL DEFAULT '운영중'" in db
    assert "status VARCHAR(32) NOT NULL DEFAULT '정상'" in db
    assert "CASE operating_status WHEN 'active' THEN '운영중'" in db
    assert "CASE status WHEN 'active' THEN '정상'" in db
    greenhouse_create = views[views.index("async def create_settings_greenhouse"):views.index("async def update_settings_greenhouse")]
    greenhouse_update = views[views.index("async def update_settings_greenhouse"):views.index("async def delete_settings_greenhouse")]
    assert "_greenhouse_operating_status_label(payload" in greenhouse_create
    assert "_greenhouse_status_label(payload" in greenhouse_create
    assert "_greenhouse_operating_status_label(payload" in greenhouse_update
    assert "_greenhouse_status_label(payload" in greenhouse_update
    assert "status = 'active'" not in greenhouse_create + greenhouse_update
    assert "default=\"active\"" not in greenhouse_create + greenhouse_update


def test_r7_110_greenhouse_delete_is_hard_delete_not_soft_status_update():
    views = _read(VIEWS)
    delete_body = views[views.index("async def delete_settings_greenhouse"):views.index("async def list_settings_zones")]
    assert "DELETE FROM green_smart_settings_greenhouses" in delete_body
    assert "SET status = 'deleted'" not in delete_body
    assert "SET status = '삭제됨'" not in delete_body


def test_r7_110_edit_button_opens_prefilled_greenhouse_edit_modal_then_patch_on_submit():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML=''; this.dataset={{}}; this.style={{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(n){{ return this._items.get(n); }}, define(n,c){{ this._items.set(n,c); }} }};
      globalThis.FormData = class {{ constructor(){{}} entries(){{ return [['name','대표 온실 수정'], ['location','김제'], ['operatingStatus','점검중'], ['installType','NUC edge'], ['timezone','Asia/Seoul'], ['note','수정 사유']]; }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      const calls = [];
      panel.hass = {{ callApi: async (method, path, payload) => {{ calls.push({{ method, path, payload }}); return {{ ok: true, settingsSnapshot: {{ greenhouses: [{{ id: 1, name: '대표 온실 수정' }}], zones: [], deviceSensorMappings: [] }} }}; }} }};
      panel.render = () => {{}};
      panel._settingsShortcutCdaModal = {{ open: true, kind: 'greenhouse-info', selectedGreenhouseId: 1 }};
      panel._settingsGreenhouseZoneData = {{ source: 'test', greenhouses: [{{ id: 1, name: '대표 온실', location: '전북 김제', operatingStatus: '운영중', installType: 'NUC edge', timezone: 'Asia/Seoul', status: '정상', creationReason: '초기 생성' }}], zones: [], deviceSensorMappings: [] }};
      await panel._editSettingsGreenhouse(1);
      const html = panel.renderR7SettingsGreenhouseCreateModal();
      await panel._submitSettingsGreenhouseCreateForm({{}});
      console.log(JSON.stringify({{ modal: panel._settingsGreenhouseCreateModal, cda: panel._settingsShortcutCdaModal, html, calls }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    data = json.loads(result.stdout)
    assert data["cda"]["open"] is False
    assert data["modal"]["mode"] == "edit"
    assert '온실 수정' in data["html"]
    assert 'value="대표 온실"' in data["html"]
    assert 'value="전북 김제"' in data["html"]
    assert 'value="운영중" selected' in data["html"]
    assert '>온실 수정<' in data["html"]
    assert data["calls"][0]["method"] == "PATCH"
    assert data["calls"][0]["path"] == "green_smart/rebuild/settings/greenhouses/1"
    assert data["calls"][0]["payload"]["operatingStatus"] == "점검중"
