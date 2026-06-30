from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-016-operations-home-visual-dashboard.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_016_version_surfaces_are_1_12_48():
    assert '"version": "1.13.1"' in _read(MANIFEST)
    assert 'const VERSION = "1.13.1"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.13.1"' in _read(REBUILD_PANEL)
    assert "v1.13.1" in _read(DOC)


def test_r7_016_doc_declares_dashboard_rewrite_scope_and_boundaries():
    text = _read(DOC)
    for phrase in (
        "# R7-016 Operations Home Visual Dashboard Rewrite",
        "Status: R7-016 complete",
        "Command Center Hero",
        "Today Priority Panel",
        "KPI Rail",
        "Domain Board",
        "Alert Stack",
        "Trend Board",
        "Secondary CBA Stage Flow",
        "No API route change in R7-016",
        "No DB migration in R7-016",
        "No HA service call in R7-016",
        "No MQTT/device command in R7-016",
        "No save/apply/execute controls in R7-016",
        "No approval/override release in R7-016",
    ):
        assert phrase in text


def test_r7_016_panel_declares_operations_dashboard_rewrite_helpers_and_markers():
    text = _read(REBUILD_PANEL)
    for marker in (
        "renderR7OperationsDashboardRewrite",
        "renderR7CommandCenterHero",
        "renderR7TodayPriorityPanel",
        "renderR7KpiRail",
        "renderR7DomainBoard",
        "renderR7AlertStack",
        "renderR7TrendBoard",
        'data-r7-operations-dashboard-rewrite="true"',
        "data-r7-command-center-hero",
        "data-r7-today-priority-panel",
        "data-r7-kpi-rail",
        "data-r7-kpi-rail-item",
        "data-r7-domain-board",
        "data-r7-domain-board-card",
        "data-r7-alert-stack",
        "data-r7-trend-board",
        "data-r7-secondary-stage-flow",
    ):
        assert marker in text


def test_r7_016_operations_home_renders_new_dashboard_before_secondary_stage_flow():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; this._listeners = {{}}; }}
        querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ contextSource: 'r7-016-visual-smoke', zones: [] }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      const html = panel.innerHTML;
      const required = [
        'data-r7-operations-dashboard-rewrite="true"',
        'data-r7-active-domain="operations-home"',
        'data-r7-command-center-hero',
        'data-r7-today-priority-panel',
        'data-r7-kpi-rail',
        'data-r7-kpi-rail-item',
        'data-r7-domain-board',
        'data-r7-domain-board-card',
        'data-r7-alert-stack',
        'data-r7-trend-board',
        'data-r7-secondary-stage-flow',
        'data-r7-visual-system="true"',
        'data-r7-status-badge',
        'data-r7-metric-card',
        'data-r7-alert-banner',
        'data-r7-mini-trend-chart',
        '오늘의 작물 운영', '우선 확인', '핵심 지표', '구역별 상태', '경보', '추세', '작물 운영 흐름',
        '전체 상태', '작물 상태', '환경 편차', '관수 상태', '장치 응답', '안전 판단', '현재 선택 구역'
      ];
      for (const item of required) {{
        if (!html.includes(item)) {{ console.error(item); process.exit(1); }}
      }}
      const commandIndex = html.indexOf('data-r7-command-center-hero');
      const secondaryIndex = html.indexOf('data-r7-secondary-stage-flow');
      if (commandIndex < 0 || secondaryIndex < 0 || commandIndex > secondaryIndex) process.exit(2);
      if (html.includes('data-r7-operations-execute')) process.exit(3);
      if (html.includes('data-r7-operations-save')) process.exit(4);
      if (html.includes('data-r7-operations-apply')) process.exit(5);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_016_dashboard_preserves_domain_routing_to_non_home_pages():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; this._listeners = {{}}; }}
        querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ contextSource: 'r7-016-routing-smoke', zones: [] }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      panel.setR7ActiveDomain('device-control');
      const html = panel.innerHTML;
      if (!html.includes('data-r7-active-domain="device-control"')) process.exit(1);
      if (!html.includes('data-r7-domain-page="device-control"')) process.exit(2);
      if (!html.includes('data-r7-device-zone-visual="true"')) process.exit(3);
      if (!html.includes('data-r7-device-detail-absorbed="true"')) process.exit(5);
      if (html.includes('data-r7-operations-dashboard-rewrite="true"')) process.exit(4);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_016_dashboard_does_not_add_runtime_authority():
    text = _read(REBUILD_PANEL)
    for forbidden in (
        "data-r7-operations-execute",
        "data-r7-operations-save",
        "data-r7-operations-apply",
        "data-r7-operations-approve",
        "callService(",
        ".callService",
        "hass.services",
        "mqttEnabled\": true",
        "deviceCommandEnabled\": true",
        "executionDecisionEnabled\": true",
        "approvalOverrideEnabled\": true",
    ):
        assert forbidden not in text
