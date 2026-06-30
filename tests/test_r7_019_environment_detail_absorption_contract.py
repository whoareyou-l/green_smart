from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-019-environment-detail-absorption.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render_environment_page() -> str:
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; this._listeners = {{}}; }}
        querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{
        contextSource: 'r7-019-environment-detail-absorption-smoke',
        zones: [
          {{ zoneId: 'zone-1', zoneName: '1구역', currentCrop: {{ cropName: '토마토', cropType: 'tomato' }}, dataAvailability: {{ freshness: 'fresh' }} }},
          {{ zoneId: 'zone-2', zoneName: '2구역', currentCrop: {{ cropName: '상추', cropType: 'lettuce' }}, dataAvailability: {{ freshness: 'delay' }} }},
        ]
      }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      panel.setR7ActiveDomain('environment-control');
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


def test_r7_019_version_surfaces_are_1_12_51():
    assert '"version": "1.12.89"' in _read(MANIFEST)
    assert 'const VERSION = "1.12.89"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.12.89"' in _read(REBUILD_PANEL)
    assert "v1.12.89" in _read(DOC)


def test_r7_019_doc_records_detail_inventory_and_mapping():
    doc = _read(DOC)
    for phrase in (
        "# R7-019 Environment Detail Absorption",
        "Old detail card = source design inventory",
        "New visual tabs = final product UI",
        "Manual/Base Settings",
        "Rule/Schedule Automation",
        "AI Assist / Optimization",
        "Safety / Interlock / Fail Safe",
        "The old detail card must not be rendered",
        "No API route change in R7-019",
        "No DB migration in R7-019",
        "No HA service call in R7-019",
        "No MQTT/device command in R7-019",
        "No physical device hookup in R7-019",
    ):
        assert phrase in doc


def test_r7_019_environment_page_removes_old_detail_card_render():
    html = _render_environment_page()
    assert 'data-r7-environment-control-detail' not in html
    visible = _visible_text(html)
    forbidden_visible = (
        "R7-008 read-only environment control detail",
        "Manual/Base Settings",
        "Rule/Schedule Automation",
        "AI Assist / Optimization",
        "Safety / Interlock / Fail Safe Finalization",
        "AI 장애/fallback 원칙",
    )
    for phrase in forbidden_visible:
        assert phrase not in visible
    assert 'data-r7-environment-zone-visual="true"' in html
    assert 'data-r7-domain-visual-frame' in html


def test_r7_019_environment_visual_tabs_absorb_detail_content():
    html = _render_environment_page()
    for marker in (
        'data-r7-environment-subtab="status-summary"',
        'data-r7-environment-subtab="base-settings"',
        'data-r7-environment-subtab="rule-schedule"',
        'data-r7-environment-subtab="interlock-block"',
        'data-r7-environment-subtab="assist-fallback"',
        'data-r7-environment-subtab="trend-evidence"',
        'data-r7-environment-setting-card',
        'data-r7-environment-rule-card',
        'data-r7-environment-assist-card',
        'data-r7-environment-safety-card',
        'data-r7-environment-detail-absorbed="true"',
    ):
        assert marker in html
    for label in (
        "주간 온도",
        "야간 온도",
        "습도",
        "VPD",
        "CO₂",
        "광/DLI",
        "주야간 전환",
        "환기 단계",
        "난방 최소온도",
        "CO₂ 시간대",
        "aiEnvironmentCorrection",
        "수동 기준 대비 차이",
        "fallback",
        "환경 한계",
        "장치 인터록",
        "최종 환경 후보",
        "1구역 · 토마토",
        "2구역 · 상추",
    ):
        assert label in html


def test_r7_019_environment_subtabs_switch_visible_panel_on_click():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; this._listeners = {{}}; }}
        querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ contextSource: 'r7-019-subtab-click-smoke', zones: [] }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      panel.setR7ActiveDomain('environment-control');
      const before = panel.innerHTML;
      if (!before.includes('data-r7-environment-subtab="status-summary" role="tab" aria-selected="true"')) process.exit(1);
      const clicked = panel.setR7DomainSubtab('environment-control', 'rule-schedule');
      const after = panel.innerHTML;
      if (clicked !== true) process.exit(2);
      if (!after.includes('data-r7-environment-subtab="rule-schedule" role="tab" aria-selected="true"')) process.exit(3);
      if (!after.includes('data-r7-domain-subtab-panel-key="rule-schedule" data-r7-environment-subtab="rule-schedule" data-r7-environment-detail-absorbed="true" data-r7-environment-rule-schedule-grid style="display:grid')) process.exit(4);
      if (!after.includes('data-r7-domain-subtab-panel-key="status-summary" data-r7-environment-subtab="status-summary" data-r7-environment-detail-absorbed="true" data-r7-environment-zone-status-grid style="display:none')) process.exit(5);
      if (!after.includes('환기 단계') || !after.includes('CO₂ 시간대')) process.exit(6);
      process.stdout.write('subtab-switch-ok');
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_019_environment_zone_context_defaults_to_zone_1_sorted_with_sync_button():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; this._listeners = {{}}; }}
        querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{
        contextSource: 'r7-019-zone-sort-sync-smoke',
        zones: [
          {{ zoneId: 'zone-10', zoneName: '10구역', currentCrop: {{ cropName: '파프리카', cropType: 'paprika' }}, dataAvailability: {{ freshness: 'fresh' }} }},
          {{ zoneId: 'zone-2', zoneName: '2구역', currentCrop: {{ cropName: '상추', cropType: 'lettuce' }}, dataAvailability: {{ freshness: 'delay' }} }},
          {{ zoneId: 'zone-1', zoneName: '1구역', currentCrop: {{ cropName: '토마토', cropType: 'tomato' }}, dataAvailability: {{ freshness: 'fresh' }} }},
        ]
      }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      panel.setR7ActiveDomain('environment-control');
      const html = panel.innerHTML;
      if (!html.includes('data-r7-active-zone="zone-1"')) process.exit(1);
      if (!html.includes('data-r7-zone-sync-button')) process.exit(2);
      if (!html.includes('동기화')) process.exit(3);
      const idx1 = html.indexOf('data-r7-zone-card-id="zone-1"');
      const idx2 = html.indexOf('data-r7-zone-card-id="zone-2"');
      const idx10 = html.indexOf('data-r7-zone-card-id="zone-10"');
      if (!(idx1 >= 0 && idx2 > idx1 && idx10 > idx2)) process.exit(4);
      if (!html.includes('data-r7-zone-context-default="zone-1"')) process.exit(5);
      if (html.includes('data-r7-zone-execute') || html.includes('data-r7-zone-apply') || html.includes('data-r7-zone-save')) process.exit(6);
      process.stdout.write('zone-context-default-sort-sync-ok');
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_019_environment_absorption_does_not_add_runtime_authority():
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
