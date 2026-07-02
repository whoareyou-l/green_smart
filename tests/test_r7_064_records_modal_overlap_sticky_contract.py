from pathlib import Path
import subprocess, json

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-064-records-modal-overlap-sticky-hotfix.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render(record_type="growth-survey"):
    script = f"""
      const classSet = new Set();
      globalThis.location = {{ pathname: '/green_smart', search: '', hash: '' }};
      globalThis.innerWidth = 1120;
      globalThis.document = {{ body: {{ classList: {{ add(c){{ classSet.add(c); }}, remove(c){{ classSet.delete(c); }}, contains(c){{ return classSet.has(c); }} }} }}, getElementById(){{ return null; }}, createElement(){{ return {{ id: '', textContent: '', setAttribute(){{}}, appendChild(){{}} }}; }}, head: {{ appendChild(){{}} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = '';this.dataset = {{}};this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ user: {{ name: 'admin', is_admin: true }}, callApi: async () => ({{}}) }};
      panel._homeContext = {{ actorRole: 'operator', zones: [{{ id: 'zone-1', name: '1구역', currentCrop: {{ crop_cycle_id: 7, crop_type: 'lettuce', growth_stage: '활착기' }}, currentCropAssignment: {{ sourceRowId: 'crop_seasons:7' }} }}] }};
      panel._r7RecordModal = {{ mode: 'write', recordType: {record_type!r}, seasonId: '7', title: '생육조사 작성', state: 'ready', rows: [] }};
      console.log(JSON.stringify({{ html: panel.renderR7RecordWorkflowModal() }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)["html"]


def test_r7_064_version_surfaces_are_1_12_99():
    assert '"version": "1.14.47"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.47"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.47"' in _read(REBUILD_PANEL)


def test_r7_064_growth_modal_uses_single_full_width_grid_not_nested_two_column_wrapper():
    html = _render("growth-survey")
    assert 'data-r7-record-form-layout="embedded-reference"' in html
    body_after_style = html.split('</style>', 1)[1]
    assert 'data-r7-record-form-layout="side-reference"' not in body_after_style
    assert 'data-r7-growth-survey-image-modal="true"' in html
    assert 'grid-template-columns:minmax(0,1fr) minmax(300px,340px)' in html
    assert 'data-r7-record-form-main' not in html.split('data-r7-growth-survey-image-modal="true"', 1)[0]


def test_r7_064_validation_panel_is_sticky_below_modal_header_without_overlap():
    html = _render("growth-survey")
    assert 'data-r7-record-modal-sticky-header' in html
    assert 'data-r7-record-pre-save-checklist' in html
    assert 'position:sticky;top:76px' in html
    assert 'z-index:2' in html
    assert html.index('data-r7-record-modal-sticky-header') < html.index('data-r7-record-pre-save-checklist')


def test_r7_064_modal_spacing_and_mobile_rules_are_explicit():
    source = _read(REBUILD_PANEL)
    assert 'box-sizing:border-box' in source
    assert 'max-width:340px' in source
    assert '@media (max-width: 860px)' in source
    assert 'grid-template-columns:1fr !important' in source
    assert 'top:0 !important' in source


def test_r7_064_documented():
    doc = _read(DOC)
    for phrase in ('겹침 원인', '이중 grid wrapper 제거', '헤더 바로 아래', 'sticky', '모바일'):
        assert phrase in doc
