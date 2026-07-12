from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-015-common-visual-ui-system.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_015_version_surfaces_are_1_12_47():
    assert '"version": "1.15.46"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.46"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.46"' in _read(REBUILD_PANEL)
    assert "v1.15.46" in _read(DOC)


def test_r7_015_doc_declares_visual_system_scope_and_boundaries():
    text = _read(DOC)
    for phrase in (
        "# R7-015 Common Visual UI System",
        "Status: R7-015 complete",
        "StatusBadge: 정상 / 주의 / 경고 / 차단 / 데이터 부족",
        "SeverityCard: green / yellow / orange / red / gray emphasis",
        "FreshnessPill: 최신 / 지연 / stale / 오류",
        "MetricCard: 현재값 / 목표값 / 편차 / 상태",
        "DomainHealthStrip: 도메인별 health row",
        "AlertBanner: 차단 / 인터록 / Fail Safe / 센서 오류",
        "MiniTrendChart placeholder",
        "control-room dashboard",
        "No API route change in R7-015",
        "No DB migration in R7-015",
        "No HA service call in R7-015",
        "No MQTT/device command in R7-015",
        "No save/apply/execute controls in R7-015",
        "No approval/override release in R7-015",
    ):
        assert phrase in text


def test_r7_015_panel_declares_visual_component_methods_and_markers():
    text = _read(REBUILD_PANEL)
    for marker in (
        "renderR7StatusBadge",
        "renderR7SeverityCard",
        "renderR7FreshnessPill",
        "renderR7MetricCard",
        "renderR7DomainHealthStrip",
        "renderR7AlertBanner",
        "renderR7MiniTrendChart",
        'data-r7-visual-system="true"',
        "data-r7-status-badge",
        "data-r7-severity-card",
        "data-r7-freshness-pill",
        "data-r7-metric-card",
        "data-r7-domain-health-strip",
        "data-r7-domain-health-item",
        "data-r7-alert-banner",
        "data-r7-mini-trend-chart",
    ):
        assert marker in text


def test_r7_015_panel_defines_all_status_and_severity_tokens():
    text = _read(REBUILD_PANEL)
    for token in (
        'data-r7-status="normal"',
        'data-r7-status="attention"',
        'data-r7-status="warning"',
        'data-r7-status="blocked"',
        'data-r7-status="unknown"',
        'data-r7-severity="green"',
        'data-r7-severity="yellow"',
        'data-r7-severity="orange"',
        'data-r7-severity="red"',
        'data-r7-severity="gray"',
    ):
        assert token in text


def test_r7_015_operations_home_visual_dashboard_contains_required_korean_labels():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; this._listeners = {{}}; }}
        querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ contextSource: 'r7-015-visual-smoke', zones: [] }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      const html = panel.innerHTML;
      const required = [
        'data-r7-visual-system="true"',
        'data-r7-active-domain="operations-home"',
        'data-r7-dashboard-visual-hero',
        'data-r7-status-badge',
        'data-r7-metric-card',
        'data-r7-domain-health-strip',
        'data-r7-alert-banner',
        'data-r7-mini-trend-chart',
        '정상', '주의', '경고', '차단', '데이터 부족',
        '최신', '지연', '오류',
        '현재값', '목표값', '편차', '상태',
        'Fail Safe', '센서 오류'
      ];
      for (const item of required) {{
        if (!html.includes(item)) {{ console.error(item); process.exit(1); }}
      }}
      if (html.includes('data-r7-visual-execute')) process.exit(2);
      if (html.includes('data-r7-visual-save')) process.exit(3);
      if (html.includes('data-r7-visual-apply')) process.exit(4);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_015_domain_routing_still_changes_active_page_after_visual_system():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; this._listeners = {{}}; }}
        querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ contextSource: 'r7-015-routing-smoke', zones: [] }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      panel.setR7ActiveDomain('environment-control');
      const html = panel.innerHTML;
      if (!html.includes('data-r7-active-domain="environment-control"')) process.exit(1);
      if (!html.includes('data-r7-domain-page="environment-control"')) process.exit(2);
      if (!html.includes('data-r7-environment-zone-visual="true"')) process.exit(3);
      if (!html.includes('data-r7-environment-detail-absorbed="true"')) process.exit(5);
      if (html.includes('data-r7-domain-page="device-control" data-r7-domain-page-active="true"')) process.exit(4);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_015_visual_system_does_not_add_runtime_authority():
    text = _read(REBUILD_PANEL)
    for forbidden in (
        "data-r7-visual-execute",
        "data-r7-visual-save",
        "data-r7-visual-apply",
        "data-r7-visual-approve",
        "callService(",
        ".callService",
        "hass.services",
        "mqttEnabled\": true",
        "deviceCommandEnabled\": true",
        "executionDecisionEnabled\": true",
        "approvalOverrideEnabled\": true",
    ):
        assert forbidden not in text
