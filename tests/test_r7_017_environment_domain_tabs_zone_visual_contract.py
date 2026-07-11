from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-017-environment-domain-tabs-zone-visual.md"
CORRECTED_PLAN = ROOT / "docs/rebuild/r7-017-024-domain-tabs-zone-qa-plan.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_017_version_surfaces_are_1_12_49():
    assert '"version": "1.15.19"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.19"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.19"' in _read(REBUILD_PANEL)
    assert "v1.15.19" in _read(DOC)


def test_r7_017_doc_defines_shared_domain_visual_frame_and_runtime_boundaries():
    text = _read(DOC)
    for phrase in (
        "# R7-017 Environment Domain Tabs + Zone Visual Rewrite",
        "Status: R7-017 complete",
        "shared domain visual frame",
        "Domain visual frame",
        "domain hero",
        "zone context bar",
        "domain sub-tabs",
        "active tab visual panel",
        "No API route change in R7-017",
        "No DB migration in R7-017",
        "No HA service call in R7-017",
        "No MQTT/device command in R7-017",
        "No save/apply/execute controls in R7-017",
        "No physical device hookup in R7-017",
    ):
        assert phrase in text


def test_r7_017_panel_declares_shared_visual_helpers_and_markers():
    text = _read(REBUILD_PANEL)
    for marker in (
        "renderR7DomainVisualFrame",
        "renderR7DomainZoneContextBar",
        "renderR7DomainSubtabs",
        "renderR7EnvironmentZoneVisual",
        "renderR7EnvironmentSubtabPanel",
        "data-r7-domain-visual-frame",
        'data-r7-domain-visual-frame-version="1"',
        "data-r7-domain-visual-hero",
        'data-r7-domain-frame-order="title-unified-card"',
        'data-r7-domain-content-card="tabs-zone-content"',
        'data-r7-domain-top-env-metrics="removed"',
        "data-r7-domain-subtabs",
        "data-r7-domain-subtab",
        'data-r7-domain-subtab-active="true"',
        "data-r7-domain-subtab-panel",
        "data-r7-zone-context-bar",
        "data-r7-zone-selector",
        "data-r7-zone-card",
        "data-r7-active-zone",
    ):
        assert marker in text


def test_r7_017_environment_page_renders_zone_scoped_subtab_visual_frame():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; this._listeners = {{}}; }}
        querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{
        contextSource: 'r7-017-env-zone-smoke',
        zones: [
          {{ zoneId: 'zone-1', zoneName: '1구역', currentCrop: {{ cropName: '토마토', cropType: 'tomato' }}, dataAvailability: {{ freshness: 'fresh' }} }},
          {{ zoneId: 'zone-2', zoneName: '2구역', currentCrop: {{ cropName: '상추', cropType: 'lettuce' }}, dataAvailability: {{ freshness: 'delay' }} }},
        ]
      }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      panel.setR7ActiveDomain('environment-control');
      const html = panel.innerHTML;
      const required = [
        'data-r7-active-domain="environment-control"',
        'data-r7-domain-page="environment-control"',
        'data-r7-environment-zone-visual="true"',
        'data-r7-domain-visual-frame',
        'data-r7-domain-visual-frame-version="1"',
        'data-r7-domain-visual-hero',
        'data-r7-domain-frame-order="title-unified-card"',
        'data-r7-domain-content-card="tabs-zone-content"',
        'data-r7-domain-top-env-metrics="removed"',
        'data-r7-zone-context-bar',
        'data-r7-zone-selector',
        'data-r7-zone-card',
        'data-r7-active-zone',
        'data-r7-domain-subtabs',
        'data-r7-domain-subtab',
        'data-r7-domain-subtab-active="true"',
        'data-r7-domain-subtab-panel',
        'data-r7-environment-subtab="status-summary"',
        'data-r7-environment-subtab="base-settings"',
        'data-r7-environment-subtab="rule-schedule"',
        'data-r7-environment-subtab="interlock-block"',
        'data-r7-environment-subtab="assist-fallback"',
        'data-r7-environment-subtab="trend-evidence"',
        'data-r7-environment-zone-status-grid',
        'data-r7-environment-zone-base-settings',
        'data-r7-environment-zone-interlock-stack',
        'data-r7-environment-zone-trend-evidence',
        '환경 제어', '구역별 환경 상태', '현재 선택 구역', '1구역 · 토마토', '2구역 · 상추',
        '상태 요약', '설정값', '일정·규칙', '인터록·차단', '추천·보조', '추세·근거',
        '온도', '습도', 'VPD', 'CO₂', '광/DLI', '환기 단계', '장치 인터록', '센서 freshness'
      ];
      for (const item of required) {{
        if (!html.includes(item)) {{ console.error(item); process.exit(1); }}
      }}
      const frameIndex = html.indexOf('data-r7-domain-visual-frame');
      if (frameIndex < 0) process.exit(2);
      if (html.includes('data-r7-environment-control-detail')) process.exit(6);
      if (html.includes('data-r7-environment-execute')) process.exit(3);
      if (html.includes('data-r7-environment-save')) process.exit(4);
      if (html.includes('data-r7-environment-apply')) process.exit(5);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_017_environment_visual_rewrite_keeps_domain_ui_consistency_contract():
    text = _read(DOC) + "\n" + _read(CORRECTED_PLAN) + "\n" + _read(REBUILD_PANEL)
    for phrase in (
        "shared domain visual frame",
        "R7-018~R7-023 must reuse",
        "data-r7-domain-visual-frame",
        "data-r7-domain-subtabs",
        "data-r7-zone-context-bar",
    ):
        assert phrase in text


def test_r7_017_environment_visual_does_not_add_runtime_authority():
    text = _read(REBUILD_PANEL)
    for forbidden in (
        "data-r7-environment-execute",
        "data-r7-environment-save",
        "data-r7-environment-apply",
        "callService(",
        ".callService",
        "hass.services",
        "mqttEnabled\": true",
        "deviceCommandEnabled\": true",
        "executionDecisionEnabled\": true",
        "approvalOverrideEnabled\": true",
    ):
        assert forbidden not in text
