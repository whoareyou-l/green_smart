from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-020-irrigation-detail-absorption.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render_irrigation_page() -> str:
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; this._listeners = {{}}; }}
        querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{
        contextSource: 'r7-020-irrigation-detail-absorption-smoke',
        zones: [
          {{ zoneId: 'zone-2', zoneName: '2구역', currentCrop: {{ cropName: '상추', cropType: 'lettuce' }}, dataAvailability: {{ freshness: 'delay' }} }},
          {{ zoneId: 'zone-1', zoneName: '1구역', currentCrop: {{ cropName: '토마토', cropType: 'tomato' }}, dataAvailability: {{ freshness: 'fresh' }} }},
        ]
      }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      panel.setR7ActiveDomain('irrigation-fertigation');
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


def test_r7_020_version_surfaces_are_1_12_54():
    assert '"version": "1.14.18"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.18"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.18"' in _read(REBUILD_PANEL)
    assert "v1.14.18" in _read(DOC)


def test_r7_020_doc_records_irrigation_detail_inventory_and_mapping():
    doc = _read(DOC)
    for phrase in (
        "# R7-020 Irrigation/Fertigation Detail Absorption",
        "Old detail card = source design inventory",
        "New visual tabs = final product UI",
        "관수 스케줄",
        "EC 목표",
        "드라이백",
        "Rule/Schedule Automation",
        "AI Assist / Optimization",
        "Safety / Interlock / Fail Safe",
        "The old detail card must not be rendered",
        "No API route change in R7-020",
        "No DB migration in R7-020",
        "No HA service call in R7-020",
        "No MQTT/device command in R7-020",
        "No physical device hookup in R7-020",
    ):
        assert phrase in doc


def test_r7_020_irrigation_page_removes_old_detail_card_render():
    html = _render_irrigation_page()
    assert 'data-r7-irrigation-fertigation-detail' not in html
    visible = _visible_text(html)
    for phrase in (
        "R7-009 read-only irrigation/fertigation detail",
        "Manual/Base Settings",
        "Rule/Schedule Automation",
        "AI Assist / Optimization",
        "Safety / Interlock / Fail Safe Finalization",
        "AI 장애/fallback 원칙",
    ):
        assert phrase not in visible
    assert 'data-r7-irrigation-zone-visual="true"' in html
    assert 'data-r7-domain-visual-frame' in html


def test_r7_020_irrigation_visual_tabs_absorb_detail_content():
    html = _render_irrigation_page()
    for marker in (
        'data-r7-irrigation-subtab="status-summary"',
        'data-r7-irrigation-subtab="base-settings"',
        'data-r7-irrigation-subtab="rule-schedule"',
        'data-r7-irrigation-subtab="interlock-block"',
        'data-r7-irrigation-subtab="assist-fallback"',
        'data-r7-irrigation-subtab="trend-evidence"',
        'data-r7-irrigation-setting-card',
        'data-r7-irrigation-rule-card',
        'data-r7-irrigation-assist-card',
        'data-r7-irrigation-safety-card',
        'data-r7-irrigation-detail-absorbed="true"',
        'data-r7-zone-context-default="zone-1"',
        'data-r7-zone-sync-button',
    ):
        assert marker in html
    for label in (
        "관수 스케줄",
        "일사 누적 관수",
        "EC 목표",
        "pH 목표",
        "급액량",
        "배액률",
        "드라이백",
        "양액 레시피",
        "시간 기반 관수",
        "근권 수분 기준 관수",
        "저수조/배액 재활용 점검",
        "aiIrrigationCorrection",
        "수동 기준 대비 차이",
        "fallback",
        "관수 한계",
        "센서 신선도",
        "최종 관수 후보",
        "1구역 · 토마토",
        "2구역 · 상추",
    ):
        assert label in html


def test_r7_020_irrigation_subtabs_switch_visible_panel_on_click():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; this._listeners = {{}}; }}
        querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ contextSource: 'r7-020-subtab-click-smoke', zones: [] }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      panel.setR7ActiveDomain('irrigation-fertigation');
      const clicked = panel.setR7DomainSubtab('irrigation-fertigation', 'rule-schedule');
      const html = panel.innerHTML;
      if (clicked !== true) process.exit(1);
      if (!html.includes('data-r7-irrigation-subtab="rule-schedule" role="tab" aria-selected="true"')) process.exit(2);
      if (!html.includes('data-r7-domain-subtab-panel-key="rule-schedule" data-r7-irrigation-subtab="rule-schedule" data-r7-irrigation-detail-absorbed="true" data-r7-irrigation-rule-schedule-grid style="display:grid')) process.exit(3);
      if (!html.includes('시간 기반 관수') || !html.includes('근권 수분 기준 관수')) process.exit(4);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_020_irrigation_absorption_does_not_add_runtime_authority():
    text = _read(REBUILD_PANEL)
    for forbidden in (
        "data-r7-irrigation-execute",
        "data-r7-irrigation-save",
        "data-r7-irrigation-apply",
        "data-r7-irrigation-pump-command",
        "data-r7-irrigation-valve-command",
        "callService(",
        ".callService",
        "hass.services",
        "mqttEnabled\": true",
        "deviceCommandEnabled\": true",
        "executionDecisionEnabled\": true",
        "approvalOverrideEnabled\": true",
    ):
        assert forbidden not in text
