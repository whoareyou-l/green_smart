from pathlib import Path
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-105-zone-create-greenhouse-fk-auto-name.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render_zone_create_modal() -> str:
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML=''; this.dataset={{}}; this.style={{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(n){{ return this._items.get(n); }}, define(n,c){{ this._items.set(n,c); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel._homeContext = {{ greenhouseName: '대표 온실' }};
      panel._settingsZoneCreateModal = {{ open: true, state: 'idle' }};
      panel._settingsGreenhouseZoneData = {{
        source: 'test',
        greenhouses: [
          {{ id: 1, name: '대표온실', location: '화성' }},
          {{ id: 2, name: '시험온실', location: '평택' }}
        ],
        zones: [
          {{ id: 'z1', greenhouseId: 1, zoneName: '1-1구역', name: '1-1구역' }},
          {{ id: 'z2', greenhouseId: 1, zoneName: '1-2구역', name: '1-2구역' }},
          {{ id: 'z3', greenhouseId: 2, zoneName: '2-1구역', name: '2-1구역' }}
        ],
        deviceSensorMappings: []
      }};
      console.log(JSON.stringify({{ html: panel.renderR7SettingsZoneCreateModal() }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)["html"]


def _section(html: str, key: str) -> str:
    match = re.search(rf'data-r7-settings-create-section="{key}".*?</fieldset>', html, re.S)
    assert match, key
    return match.group(0)


def test_r7_105_version_surfaces_are_1_14_30():
    assert '"version": "1.15.08"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.08"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.08"' in _read(REBUILD_PANEL)


def test_r7_105_zone_create_header_has_product_ready_copy_not_internal_settings_trace():
    html = _render_zone_create_modal()
    assert '구역 생성' in html
    assert '온실별 재배·운영 공간을 등록하고 저장 전 기준을 확인합니다' in html
    assert '작기 settings - 기록' not in html
    assert '구역 구성값을 입력하고 저장 전 검증을 확인합니다' not in html


def test_r7_105_basic_info_starts_with_greenhouse_fk_select_then_auto_zone_name_then_purpose_select():
    html = _render_zone_create_modal()
    basic = _section(html, 'basic-info')
    expected = [
        ('온실명', 'greenhouseId'),
        ('구역명', 'name'),
        ('구역 용도', 'purpose'),
    ]
    for label, name in expected:
        assert f'<span>{label}</span>' in basic
        assert f'name="{name}"' in basic
    positions = [basic.index(f'name="{name}"') for _, name in expected]
    assert positions == sorted(positions)
    greenhouse_select = re.search(r'<select name="greenhouseId".*?</select>', basic, re.S).group(0)
    assert 'value="1"' in greenhouse_select and '대표온실' in greenhouse_select
    assert 'value="2"' in greenhouse_select and '시험온실' in greenhouse_select
    assert 'data-r7-settings-zone-greenhouse-fk-select' in greenhouse_select
    assert '<input name="name" value="1-3구역"' in basic
    assert 'data-r7-settings-zone-auto-name' in basic
    assert 'readonly' in re.search(r'<input name="name".*?>', basic, re.S).group(0)


def test_r7_105_zone_auto_name_uses_greenhouse_display_order_not_db_id():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML=''; this.dataset={{}}; this.style={{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(n){{ return this._items.get(n); }}, define(n,c){{ this._items.set(n,c); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      const greenhouse = {{ id: 4, name: '대표 온실', displayNumber: 1 }};
      const zones = [{{ id: 1, greenhouseId: 4, name: '4-1구역', zoneName: '4-1구역' }}];
      console.log(JSON.stringify({{ first: panel._r7SettingsNextZoneName(greenhouse, []), next: panel._r7SettingsNextZoneName(greenhouse, zones) }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    data = json.loads(result.stdout)
    assert data["first"] == "1-1구역"
    assert data["next"] == "1-2구역"
    assert data["first"] != "4-1구역"


def test_r7_105_zone_purpose_dropdown_stores_korean_operator_labels_not_english_codes():
    html = _render_zone_create_modal()
    basic = _section(html, 'basic-info')
    purpose_select = re.search(r'<select name="purpose".*?</select>', basic, re.S).group(0)
    for label in [
        '재배 구역',
        '육묘 구역',
        '사무 구역',
        '실험 구역',
        '자재 보관 구역',
        '격리·검역 구역',
    ]:
        assert re.search(rf'value="{label}"[^>]*>{label}', purpose_select)
    for stale_code in ['cultivation', 'nursery', 'office', 'experiment', 'storage', 'quarantine']:
        assert f'value="{stale_code}"' not in purpose_select
    assert 'value="재배"' not in purpose_select
    assert 'name="purpose"' in purpose_select


def test_r7_105_zone_composition_uses_numeric_inputs_with_m2_and_count_units():
    html = _render_zone_create_modal()
    composition = _section(html, 'zone-composition')
    area = re.search(r'<input name="area".*?>', composition, re.S).group(0)
    bed = re.search(r'<input name="bedCount".*?>', composition, re.S).group(0)
    assert 'type="number"' in area
    assert 'min="0"' in area
    assert 'step="0.1"' in area
    assert 'data-r7-settings-zone-area-unit="m2"' in composition
    assert 'm²' in composition
    assert 'type="number"' in bed
    assert 'min="0"' in bed
    assert 'step="1"' in bed
    assert 'data-r7-settings-zone-bed-unit="count"' in composition
    assert '개' in composition
    assert '120㎡' not in composition


def test_r7_105_memo_keeps_creation_reason_and_documented():
    html = _render_zone_create_modal()
    memo = _section(html, 'memo')
    assert '<span>생성 사유</span><textarea name="note"' in memo
    doc = _read(DOC)
    for phrase in ['온실 테이블 외래키', '다음 구역 번호', '1-3구역', '면적 숫자 입력', '배드 수 숫자 입력', '제품 출시용 문구']:
        assert phrase in doc
