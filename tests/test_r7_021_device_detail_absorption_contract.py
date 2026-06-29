from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-021-device-detail-absorption.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render_device_page() -> str:
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; this._listeners = {{}}; }}
        querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{
        contextSource: 'r7-021-device-detail-absorption-smoke',
        zones: [
          {{ zoneId: 'zone-2', zoneName: '2구역', currentCrop: {{ cropLabelKo: '상추', cropType: 'lettuce' }}, dataAvailability: {{ freshness: 'delay' }} }},
          {{ zoneId: 'zone-1', zoneName: '1구역', currentCrop: {{ cropLabelKo: '토마토', cropType: 'tomato' }}, dataAvailability: {{ freshness: 'fresh' }} }},
        ]
      }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      panel.setR7ActiveDomain('device-control');
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


def test_r7_021_version_surfaces_are_1_12_55():
    assert '"version": "1.12.69"' in _read(MANIFEST)
    assert 'const VERSION = "1.12.69"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.12.69"' in _read(REBUILD_PANEL)
    assert "v1.12.69" in _read(DOC)


def test_r7_021_doc_records_device_detail_inventory_and_mapping():
    doc = _read(DOC)
    for phrase in (
        "# R7-021 Device Control Detail Absorption",
        "Old detail card = source design inventory",
        "New visual tabs = final product UI",
        "manual, auto, locked, maintenance",
        "HA entity mapping",
        "MQTT topic mapping later only",
        "operatorRequestedAction",
        "automationCandidate",
        "optional aiStrategyHint",
        "Permission / Safety / Interlock / Fail Safe",
        "The old detail card must not be rendered",
        "No API route change in R7-021",
        "No DB migration in R7-021",
        "No HA service call in R7-021",
        "No MQTT/device command in R7-021",
        "No physical device hookup in R7-021",
    ):
        assert phrase in doc


def test_r7_021_device_page_removes_old_detail_card_render():
    html = _render_device_page()
    assert 'data-r7-device-control-detail' not in html
    visible = _visible_text(html)
    for phrase in (
        "R7-010 read-only device control detail",
        "Manual/Base Settings",
        "Rule/Schedule Automation",
        "AI Assist / Optimization",
        "Permission / Safety / Interlock / Fail Safe Finalization",
        "장치 실행/fallback 원칙",
    ):
        assert phrase not in visible
    assert 'data-r7-device-zone-visual="true"' in html
    assert 'data-r7-domain-visual-frame' in html


def test_r7_021_device_visual_tabs_absorb_detail_content():
    html = _render_device_page()
    for marker in (
        'data-r7-device-subtab="status-summary"',
        'data-r7-device-subtab="base-settings"',
        'data-r7-device-subtab="rule-schedule"',
        'data-r7-device-subtab="interlock-block"',
        'data-r7-device-subtab="assist-fallback"',
        'data-r7-device-subtab="trend-evidence"',
        'data-r7-device-setting-card',
        'data-r7-device-rule-card',
        'data-r7-device-assist-card',
        'data-r7-device-safety-card',
        'data-r7-device-detail-absorbed="true"',
        'data-r7-zone-context-default="zone-1"',
        'data-r7-zone-sync-button',
    ):
        assert marker in html
    for label in (
        "수동 모드",
        "자동 모드",
        "잠금 모드",
        "점검 모드",
        "HA entity mapping",
        "MQTT topic mapping later only",
        "operatorRequestedAction",
        "automationCandidate",
        "mode gate",
        "mapping health",
        "optional aiStrategyHint",
        "hint only",
        "fallback",
        "permission check",
        "Safety check",
        "Interlock check",
        "Fail Safe check",
        "HA/MQTT status",
        "Physical MQTT/device hookup remains blocked",
        "1구역 · 토마토",
        "2구역 · 상추",
    ):
        assert label in html


def test_r7_021_device_subtabs_switch_visible_panel_on_click():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; this._listeners = {{}}; }}
        querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ contextSource: 'r7-021-subtab-click-smoke', zones: [] }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      panel.setR7ActiveDomain('device-control');
      const clicked = panel.setR7DomainSubtab('device-control', 'interlock-block');
      const html = panel.innerHTML;
      if (clicked !== true) process.exit(1);
      if (!html.includes('data-r7-device-subtab="interlock-block" role="tab" aria-selected="true"')) process.exit(2);
      if (!html.includes('data-r7-domain-subtab-panel-key="interlock-block" data-r7-device-subtab="interlock-block" data-r7-device-detail-absorbed="true" data-r7-device-zone-interlock-stack style="display:grid')) process.exit(3);
      if (!html.includes('permission check') || !html.includes('Fail Safe check')) process.exit(4);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_021_device_absorption_does_not_add_runtime_authority():
    text = _read(REBUILD_PANEL)
    for forbidden in (
        "data-r7-device-execute",
        "data-r7-device-save",
        "data-r7-device-apply",
        "data-r7-device-command-button",
        "data-r7-device-ha-service-call",
        "data-r7-device-mqtt-command",
        "callService(",
        ".callService",
        "hass.services",
        "mqttEnabled\": true",
        "deviceCommandEnabled\": true",
        "executionDecisionEnabled\": true",
        "approvalOverrideEnabled\": true",
    ):
        assert forbidden not in text
