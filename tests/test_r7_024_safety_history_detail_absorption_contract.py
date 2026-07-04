from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-024-safety-history-detail-absorption.md"
PLAN = ROOT / "docs/rebuild/r7-017-024-domain-tabs-zone-qa-plan.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_024_version_surfaces_are_1_12_58():
    assert '"version": "1.14.67"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.67"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.67"' in _read(REBUILD_PANEL)
    assert "v1.14.67" in _read(DOC)


def test_r7_024_doc_records_safety_history_inventory_and_boundaries():
    text = _read(DOC)
    for phrase in (
        "# R7-024 Safety/History Detail Absorption",
        "안전 제어 도메인을 zone-scoped visual 하위탭으로 전환",
        "renderR7SafetyHistoryDetail()",
        "Safety / Interlock / Fail Safe / alarm status",
        "block/allow reasons, stale/errors",
        "manual/rule/AI/device/execution history",
        "authoritative allow/block history, read-only",
        "No alarm ack/clear",
        "No approval/override release",
        "No execution history mutation",
        "No SafetyGuard/Interlock runtime behavior change",
        "No physical device hookup",
    ):
        assert phrase in text
    plan = _read(PLAN)
    assert "R7-024 | 안전 제어" in plan


def _render_safety_page() -> str:
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; this._listeners = {{}}; }}
        querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ contextSource: 'r7-024-safety-visual-smoke', zones: [
        {{ zoneId: 'zone-2', zoneName: '2구역', currentCrop: {{ cropLabelKo: '상추', cropType: 'lettuce' }}, dataAvailability: {{ state: 'delay', source: 'safety_adapter' }} }},
        {{ zoneId: 'zone-1', zoneName: '1구역', currentCrop: {{ cropLabelKo: '토마토', cropType: 'tomato' }}, dataAvailability: {{ state: 'fresh', source: 'safety_adapter' }} }}
      ] }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      panel.setR7ActiveDomain('safety-history');
      console.log(panel.innerHTML);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
    return result.stdout


def test_r7_024_safety_visual_tabs_absorb_old_detail_content():
    html = _render_safety_page()
    assert 'data-r7-safety-history-detail' not in html
    for marker in (
        'data-r7-domain-page="safety-history"',
        'data-r7-safety-zone-visual="true"',
        'data-r7-safety-detail-absorbed="true"',
        'data-r7-domain-subtabs data-r7-domain-subtabs-for="safety-history"',
        'data-r7-safety-subtab="status-summary"',
        'data-r7-safety-subtab="block-allow"',
        'data-r7-safety-subtab="event-history"',
        'data-r7-safety-subtab="operation-history"',
        'data-r7-safety-subtab="audit-evidence"',
        'data-r7-safety-subtab="trend-evidence"',
        'data-r7-zone-context-default="zone-1"',
        'data-r7-zone-sync-button',
        'data-r7-safety-status-card',
        'data-r7-safety-reason-card',
        'data-r7-safety-event-card',
        'data-r7-safety-operation-card',
        'data-r7-safety-audit-card',
        'data-r7-safety-trend-evidence',
    ):
        assert marker in html
    for phrase in (
        "안전 제어",
        "구역 기준 안전 제어",
        "1구역 · 토마토",
        "Safety 상태",
        "Interlock 상태",
        "Fail Safe 상태",
        "차단 이유",
        "허용 이유",
        "센서 stale 이력",
        "오류/Traceback/통신 장애",
        "수동 조작 이력",
        "기본 자동제어 이력",
        "AI 추천 이력",
        "AI 적용/미적용 이력",
        "장치 명령 후보 이력",
        "실제 실행 이력, later only",
        "authoritative allow/block history",
        "read-only",
    ):
        assert phrase in html


def test_r7_024_safety_subtabs_switch_visible_panel_on_click():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; this._listeners = {{}}; }}
        querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ contextSource: 'r7-024-safety-subtab-click-smoke', zones: [] }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      panel.setR7ActiveDomain('safety-history');
      const clicked = panel.setR7DomainSubtab('safety-history', 'operation-history');
      const html = panel.innerHTML;
      if (clicked !== true) process.exit(1);
      if (!html.includes('data-r7-safety-subtab="operation-history" role="tab" aria-selected="true"')) process.exit(2);
      if (!html.includes('data-r7-domain-subtab-panel-key="operation-history" data-r7-safety-subtab="operation-history" data-r7-safety-detail-absorbed="true" data-r7-safety-operation-history-grid style="display:grid')) process.exit(3);
      if (!html.includes('수동 조작 이력') || !html.includes('AI 추천 이력') || !html.includes('실제 실행 이력, later only')) process.exit(4);
      if (html.includes('data-r7-safety-history-detail')) process.exit(5);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_024_does_not_add_ack_clear_override_or_execution_authority():
    text = _read(REBUILD_PANEL)
    forbidden = (
        "data-r7-safety-history-ack",
        "data-r7-safety-history-clear",
        "data-r7-safety-history-override",
        "data-r7-safety-history-approve",
        "data-r7-safety-history-execute",
        "data-r7-safety-history-mutate",
        "data-r7-safety-save",
        "data-r7-safety-apply",
        "data-r7-safety-execute",
        "callService(",
        ".callService",
        "mqttEnabled\": true",
        "deviceCommandEnabled\": true",
        "executionDecisionEnabled\": true",
    )
    for marker in forbidden:
        assert marker not in text
