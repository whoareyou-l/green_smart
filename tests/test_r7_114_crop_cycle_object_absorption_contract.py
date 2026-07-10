from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _node_render(script_body: str) -> str:
    script = f"""
      const classSet = new Set();
      globalThis.location = {{ pathname: '/green_smart', search: '', hash: '#crop-operations' }};
      globalThis.innerWidth = 1280;
      globalThis.document = {{ body: {{ classList: {{ add(c){{ classSet.add(c); }}, remove(c){{ classSet.delete(c); }}, contains(c){{ return classSet.has(c); }} }} }}, getElementById(){{ return null; }}, createElement(){{ return {{ id: '', textContent: '', setAttribute(){{}}, appendChild(){{}} }}; }}, head: {{ appendChild(){{}} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = '';this.dataset = {{}};this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ user: {{ name: 'admin', is_admin: true }}, callApi: async () => ({{}}) }};
      panel._homeContext = {{
        actorRole: 'admin',
        zones: [{{ id: 'zone-1', name: '1구역', currentCrop: {{ crop_cycle_id: 4, crop_type: 'lettuce', crop_label_ko: '상추', growth_stage: '활착기', variety: '청치마', plant_date: '2026-06-01' }}, currentCropAssignment: {{ assignmentState: 'assigned', sourceRowId: 'crop_seasons:4', dataAvailability: {{ state: 'fresh', source: 'currentCropAssignment' }} }}, dataAvailability: {{ state: 'fresh' }} }}]
      }};
      {script_body}
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)["html"]


def _render_crop_cycle() -> str:
    return _node_render("""
      const zone = panel._homeContext.zones[0];
      console.log(JSON.stringify({ html: panel.renderR7CropSubtabPanel('crop-cycle', zone, 'crop-cycle') }));
    """)


def _render_settings() -> str:
    return _node_render("""
      panel._activeR7Domain = 'settings-admin';
      panel._activeR7DomainSubtabs = { ...panel._activeR7DomainSubtabs, 'settings-admin': 'greenhouse-zones' };
      console.log(JSON.stringify({ html: panel.renderR7SettingsAdminZoneVisual() }));
    """)


def test_r7_114_version_surfaces_are_1_14_45():
    assert '"version": "1.15.14"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.14"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.14"' in _read(REBUILD_PANEL)


def test_r7_114_crop_cycle_subtab_absorbs_crop_object_rule_card():
    html = _render_crop_cycle()
    for needle in (
        'data-r7-crop-cycle-object-rule-card',
        'data-r7-crop-object-rule="four-per-cycle"',
        '작기마다 4개의 작물 객체',
        '작기 번호-객체 번호',
        '4-1', '4-2', '4-3', '4-4',
        '생육조사/추세/이상치 비교 기준',
    ):
        assert needle in html
    assert 'data-r7-settings-crop-cycle-objects' not in html


def test_r7_114_settings_domain_no_longer_exposes_crop_cycle_objects_subtab():
    html = _render_settings()
    assert '작기·작물 객체' not in html
    assert 'data-r7-settings-admin-subtab="crop-cycle-objects"' not in html
    assert 'data-r7-settings-crop-cycle-objects' not in html
    assert 'data-r7-settings-object-rule="four-per-cycle"' not in html
    for remaining in ('온실·구역', '장치 연결 작성', '사용자·권한', '시스템·연동'):
        assert remaining in html
    for removed in ('안전·승인 정책', '진단·감사'):
        assert removed not in html
