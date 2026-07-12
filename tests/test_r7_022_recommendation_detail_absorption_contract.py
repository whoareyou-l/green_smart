from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-022-recommendation-detail-absorption.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render_recommendation_page() -> str:
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; this._listeners = {{}}; }}
        querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{
        contextSource: 'r7-022-recommendation-detail-absorption-smoke',
        zones: [
          {{ zoneId: 'zone-2', zoneName: '2구역', currentCrop: {{ cropLabelKo: '상추', cropType: 'lettuce' }}, dataAvailability: {{ freshness: 'delay' }} }},
          {{ zoneId: 'zone-1', zoneName: '1구역', currentCrop: {{ cropLabelKo: '토마토', cropType: 'tomato' }}, dataAvailability: {{ freshness: 'fresh' }} }},
        ]
      }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      panel.setR7ActiveDomain('recommendation-automation');
      process.stdout.write(panel.innerHTML);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
    return result.stdout


def _visible_text(html: str) -> str:
    html = re.sub(r"<template[\s\S]*?</template>", " ", html)
    html = re.sub(r"<script[\s\S]*?</script>", " ", html)
    html = re.sub(r"<style[\s\S]*?</style>", " ", html)
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html))


def test_r7_022_version_surfaces_are_1_12_56():
    assert '"version": "1.15.50"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.50"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.50"' in _read(REBUILD_PANEL)
    assert "v1.15.50" in _read(DOC)


def test_r7_022_doc_records_recommendation_detail_inventory_and_mapping():
    doc = _read(DOC)
    for phrase in (
        "# R7-022 Recommendation/Automation Detail Absorption",
        "Old detail card = source design inventory",
        "New visual tabs = final product UI",
        "환경 수동 기준",
        "관수 제어 수동 기준",
        "장치 모드 기준",
        "AI off fallback value",
        "rule/schedule candidate",
        "automation eligibility",
        "AI recommendation/correction",
        "Safety-final candidate",
        "The old detail card must not be rendered",
        "No API route change in R7-022",
        "No DB migration in R7-022",
        "No HA service call in R7-022",
        "No MQTT/device command in R7-022",
        "No physical device hookup in R7-022",
    ):
        assert phrase in doc


def test_r7_022_recommendation_page_removes_old_detail_card_render():
    html = _render_recommendation_page()
    assert 'data-r7-recommendation-automation-detail' not in html
    visible = _visible_text(html)
    for phrase in (
        "R7-011 read-only recommendation/automation detail",
        "AI recommendation / correction / explanation",
        "AI off / fallback 원칙",
    ):
        assert phrase not in visible
    # Generic domain metadata can still mention baseline/candidate concepts; the old rendered detail card itself must be gone.
    assert 'data-r7-recommendation-automation-detail' not in html
    assert 'data-r7-recommendation-zone-visual="true"' in html
    assert 'data-r7-domain-visual-frame' in html


def test_r7_022_recommendation_visual_tabs_absorb_detail_content():
    html = _render_recommendation_page()
    for marker in (
        'data-r7-recommendation-subtab="status-summary"',
        'data-r7-recommendation-subtab="base-settings"',
        'data-r7-recommendation-subtab="rule-schedule"',
        'data-r7-recommendation-subtab="interlock-block"',
        'data-r7-recommendation-subtab="assist-fallback"',
        'data-r7-recommendation-subtab="trend-evidence"',
        'data-r7-recommendation-setting-card',
        'data-r7-recommendation-rule-card',
        'data-r7-recommendation-assist-card',
        'data-r7-recommendation-safety-card',
        'data-r7-recommendation-detail-absorbed="true"',
        'data-r7-zone-context-default="zone-1"',
        'data-r7-zone-sync-button',
    ):
        assert marker in html
    for label in (
        "환경 수동 기준",
        "관수 제어 수동 기준",
        "장치 모드 기준",
        "AI off fallback value",
        "rule/schedule candidate",
        "automation eligibility",
        "difference from manual baseline",
        "AI recommendation/correction",
        "explanation",
        "fallback",
        "Safety-final candidate",
        "not final command",
        "no final command authority",
        "final command authority none",
        "1구역 · 토마토",
        "2구역 · 상추",
    ):
        assert label in html


def test_r7_022_recommendation_subtabs_switch_visible_panel_on_click():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; this._listeners = {{}}; }}
        querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ contextSource: 'r7-022-subtab-click-smoke', zones: [] }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      panel.setR7ActiveDomain('recommendation-automation');
      const clicked = panel.setR7DomainSubtab('recommendation-automation', 'assist-fallback');
      const html = panel.innerHTML;
      if (clicked !== true) process.exit(1);
      if (!html.includes('data-r7-recommendation-subtab="assist-fallback" role="tab" aria-selected="true"')) process.exit(2);
      if (!html.includes('data-r7-domain-subtab-panel-key="assist-fallback" data-r7-recommendation-subtab="assist-fallback" data-r7-recommendation-detail-absorbed="true" data-r7-recommendation-assist-fallback-grid style="display:grid')) process.exit(3);
      if (!html.includes('AI recommendation/correction') || !html.includes('fallback')) process.exit(4);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_022_recommendation_absorption_does_not_add_runtime_authority():
    text = _read(REBUILD_PANEL)
    for forbidden in (
        "data-r7-recommendation-execute",
        "data-r7-recommendation-save",
        "data-r7-recommendation-apply",
        "data-r7-recommendation-approve",
        "data-r7-recommendation-work-order",
        "data-r7-recommendation-ha-service-call",
        "callService(",
        ".callService",
        "hass.services",
        "mqttEnabled\": true",
        "deviceCommandEnabled\": true",
        "executionDecisionEnabled\": true",
        "approvalOverrideEnabled\": true",
    ):
        assert forbidden not in text
