from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-042-crop-operations-third-party-informed-detail.md"

REQUIRED_SOURCES = [
    "Priva",
    "Connext",
    "Hoogendoorn",
    "IIVO",
    "Argus LIVE",
    "LetsGrow",
    "30MHz",
    "Source.ag",
]

REQUIRED_MARKERS = [
    'data-r7-crop-third-party-informed="true"',
    "data-r7-crop-operator-question",
    "data-r7-crop-attention-queue",
    "data-r7-crop-influence-strip",
    "data-r7-crop-registration-lane",
    "data-r7-crop-target-gap",
    "data-r7-crop-work-queue",
    "data-r7-crop-model-review-lane",
    "data-r7-crop-season-review",
    'data-r7-crop-vendor-pattern="crop-goal-to-influence-to-action"',
]

FORBIDDEN_MARKERS = [
    "data-r7-crop-direct-execute",
    "data-r7-crop-ha-service-call",
    "data-r7-crop-mqtt-command",
    "data-r7-crop-auto-apply",
    "data-r7-crop-device-command",
]


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_042_version_surfaces_are_1_12_77():
    assert '"version": "1.12.81"' in _read(MANIFEST)
    assert 'const VERSION = "1.12.81"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.12.81"' in _read(REBUILD_PANEL)
    assert "v1.12.81" in _read(DOC)


def test_r7_042_research_doc_cites_third_party_patterns_and_boundaries():
    text = _read(DOC)
    for source in REQUIRED_SOURCES:
        assert source in text
    for phrase in [
        "crop goal / current crop context",
        "climate / irrigation / root-zone / equipment influence",
        "crop registration and observations",
        "prediction / strategy / expert or AI assist",
        "crop-goal-to-influence-to-action",
        "R7-042 is UI/detail/read-only only",
    ]:
        assert phrase in text
    for marker in REQUIRED_MARKERS + FORBIDDEN_MARKERS:
        assert marker in text


def test_r7_042_source_contains_crop_operations_detail_markers_without_execution_authority():
    text = _read(REBUILD_PANEL)
    for marker in REQUIRED_MARKERS:
        assert marker in text
    for forbidden in FORBIDDEN_MARKERS:
        assert forbidden not in text
    for operator_text in [
        "현재 구역 작물이 정상인가",
        "목표 대비 차이",
        "오늘 확인할 작업",
        "모델 검토",
        "시즌 리뷰",
        "환경·관수·장치 영향",
    ]:
        assert operator_text in text


def test_r7_042_render_smoke_crop_operations_all_subtabs_are_detailed_and_readonly():
    script = f"""
      const classSet = new Set();
      globalThis.location = {{ pathname: '/green_smart', search: '', hash: '' }};
      globalThis.document = {{
        body: {{ classList: {{ add(c){{ classSet.add(c); }}, remove(c){{ classSet.delete(c); }}, contains(c){{ return classSet.has(c); }} }} }},
        getElementById(){{ return null; }},
        createElement(){{ return {{ id: '', textContent: '', setAttribute(){{}}, appendChild(){{}} }}; }},
        head: {{ appendChild(){{}} }}
      }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; this._listeners = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      const zone = {{ id: 'zone-1', name: '1구역', crop: '상추', state: '활착기', currentCrop: {{ crop_cycle_id: 'cycle-1', crop_label_ko: '상추', crop_type: 'lettuce', growth_stage: '활착기', variety: '청치마', plant_date: '2026-06-01' }}, currentCropAssignment: {{ assignmentState: 'assigned', sourceRowId: 'crop_seasons:1', dataAvailability: {{ state: 'fresh', source: 'currentCropAssignment' }} }}, growthTargetProjection: {{ targetStageLabel: '엽수 확대', targetFocus: '초기 활착 안정' }}, dataAvailability: {{ state: 'fresh', source: 'qa' }} }};
      panel.hass = {{ user: {{ name: '서원 임', is_admin: true, green_smart_role: 'operator' }}, callApi: async () => ({{ actorRole: 'operator', zones: [zone] }}) }};
      panel._homeContext = {{ actorRole: 'operator', zones: [zone] }};
      const tabs = ['status-summary','crop-cycle','growth-target','records-workflow','model-assist','trend-evidence'];
      const results = [];
      for (const tab of tabs) {{
        panel.setR7DomainSubtab('crop-operations', tab);
        panel._activeR7Domain = 'crop-operations';
        panel.render();
        const html = panel.innerHTML;
        const panelStart = html.indexOf(`data-r7-domain-subtab-panel-key="${{tab}}"`);
        const sectionOpen = panelStart >= 0 ? html.lastIndexOf('<section', panelStart) : -1;
        const sectionClose = sectionOpen >= 0 ? html.indexOf('</section>', sectionOpen) : -1;
        const section = sectionOpen >= 0 && sectionClose >= 0 ? html.slice(sectionOpen, sectionClose + 10) : '';
        const missing = [];
        for (const marker of {json.dumps(REQUIRED_MARKERS)}) {{
          if (!html.includes(marker)) missing.push(marker);
        }}
        if (!section.includes('data-r7-crop-operator-question')) missing.push('operator-question-in-section');
        if (!section.includes('data-r7-crop-third-party-informed="true"')) missing.push('third-party-informed-section');
        if (!section.includes('read-only') && !section.includes('읽기 전용')) missing.push('readonly-wording');
        for (const forbidden of {json.dumps(FORBIDDEN_MARKERS)}) {{
          if (html.includes(forbidden)) missing.push(`forbidden:${{forbidden}}`);
        }}
        results.push({{ tab, missing }});
      }}
      const failed = results.filter((r) => r.missing.length);
      if (failed.length) {{ console.error(JSON.stringify(failed)); process.exit(1); }}
      console.log(JSON.stringify(results));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
