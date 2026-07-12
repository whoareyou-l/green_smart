from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-018-main-dashboard-product-ui-cleanup.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render_default_home() -> str:
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; this._listeners = {{}}; }}
        querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{
        contextSource: 'r7-018-product-home-smoke',
        zones: [
          {{ zoneId: 'zone-1', zoneName: '1구역', currentCrop: {{ cropName: '토마토', cropType: 'tomato' }}, dataAvailability: {{ freshness: 'fresh' }} }},
          {{ zoneId: 'zone-2', zoneName: '2구역', currentCrop: {{ cropName: '상추', cropType: 'lettuce' }}, dataAvailability: {{ freshness: 'delay' }} }},
        ]
      }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
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


def test_r7_018_version_surfaces_are_1_12_50():
    assert '"version": "1.15.50"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.50"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.50"' in _read(REBUILD_PANEL)
    assert "v1.15.50" in _read(DOC)


def test_r7_018_doc_records_product_ui_rule_and_boundaries():
    text = _read(DOC)
    for phrase in (
        "# R7-018 Main Dashboard Product UI Cleanup",
        "Rendered UI must show current operating status, crop, zone, metrics, warnings, freshness, and next checks.",
        "The rendered main dashboard must not show developer/roadmap/process terms",
        "No API route change in R7-018",
        "No DB migration in R7-018",
        "No HA service call in R7-018",
        "No MQTT/device command in R7-018",
        "No save/apply/execute controls in R7-018",
        "No physical device hookup in R7-018",
    ):
        assert phrase in text


def test_r7_018_default_home_has_product_markers_and_operator_sections():
    html = _render_default_home()
    for marker in (
        'data-r7-main-product-dashboard="true"',
        "data-r7-main-product-hero",
        "data-r7-main-zone-focus",
        "data-r7-main-priority-checks",
        "data-r7-main-kpi-grid",
        "data-r7-main-zone-status-grid",
        "data-r7-main-alerts",
        "data-r7-main-trends",
        'data-r7-active-domain="operations-home"',
        'data-r7-operations-dashboard-rewrite="true"',
    ):
        assert marker in html
    for label in (
        "오늘의 작물 운영",
        "현재 선택 구역",
        "우선 확인",
        "핵심 지표",
        "구역별 상태",
        "경보",
        "추세",
        "작물 상태",
        "생육 목표",
        "환경·관수·장치 영향",
        "추천·확인",
        "1구역 · 토마토",
        "2구역 · 상추",
    ):
        assert label in html


def test_r7_018_default_home_hides_development_roadmap_terms_from_rendered_ui():
    visible = _visible_text(_render_default_home())
    forbidden_visible_terms = (
        "R7-",
        "RS-",
        "shared domain visual frame",
        "read-only",
        "boundary",
        "compatibility evidence",
        "projection",
        "scaffold",
        "adapter",
        "later only",
        "manual-first",
        "Crop-centered OS",
        "Developer",
        "No API",
        "No DB",
    )
    for term in forbidden_visible_terms:
        assert term not in visible


def test_r7_018_default_home_does_not_add_runtime_authority():
    text = _read(REBUILD_PANEL)
    for forbidden in (
        "data-r7-main-execute",
        "data-r7-main-save",
        "data-r7-main-apply",
        "callService(",
        ".callService",
        "hass.services",
        "mqttEnabled\": true",
        "deviceCommandEnabled\": true",
        "executionDecisionEnabled\": true",
        "approvalOverrideEnabled\": true",
    ):
        assert forbidden not in text
