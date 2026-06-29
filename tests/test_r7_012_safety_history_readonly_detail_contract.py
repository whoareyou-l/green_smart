from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-012-safety-history-readonly-detail.md"
SPEC = ROOT / "docs/rebuild/r7-006-manual-first-target-domain-spec.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_012_version_surfaces_are_1_12_44():
    assert '"version": "1.12.72"' in _read(MANIFEST)
    assert 'const VERSION = "1.12.72"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.12.72"' in _read(REBUILD_PANEL)
    assert "v1.12.72" in _read(DOC)


def test_r7_012_doc_records_safety_history_grammar_and_boundaries():
    text = _read(DOC)
    required = [
        "# R7-012 Safety/History Read-only Detail",
        "Status: R7-012 complete",
        "Safety status",
        "Interlock status",
        "Fail Safe status",
        "block/allow reasons",
        "manual/rule/AI history",
        "audit evidence",
        "authoritative allow/block history, read-only",
        "No API route change in R7-012",
        "No DB migration in R7-012",
        "No HA service call in R7-012",
        "No MQTT/device command in R7-012",
        "No alarm ack/clear in R7-012",
        "No approval/override release in R7-012",
        "No execution history mutation in R7-012",
        "Safety/history is not a normal setpoint owner",
    ]
    for phrase in required:
        assert phrase in text


def test_r7_012_panel_contains_safety_history_visual_absorbed_markers_and_layers():
    text = _read(REBUILD_PANEL)
    required = [
        "renderR7SafetyHistoryZoneVisual",
        'data-r7-safety-zone-visual="true"',
        'data-r7-safety-detail-absorbed="true"',
        "data-r7-safety-status-card",
        "data-r7-safety-reason-card",
        "data-r7-safety-event-card",
        "data-r7-safety-operation-card",
        "data-r7-safety-audit-card",
        "authoritative allow/block history",
        "read-only",
    ]
    for marker in required:
        assert marker in text


def test_r7_012_safety_history_status_and_reason_items_are_named():
    text = _read(REBUILD_PANEL)
    for marker in (
        'data-r7-safety-history-status-item="Safety 상태"',
        'data-r7-safety-history-status-item="Interlock 상태"',
        'data-r7-safety-history-status-item="Fail Safe 상태"',
        'data-r7-safety-history-status-item="알람"',
        'data-r7-safety-history-reason="차단 이유"',
        'data-r7-safety-history-reason="허용 이유"',
        'data-r7-safety-history-reason="센서 stale 이력"',
        'data-r7-safety-history-reason="오류/Traceback/통신 장애"',
    ):
        assert marker in text


def test_r7_012_safety_history_timeline_and_audit_items_are_named():
    text = _read(REBUILD_PANEL)
    for marker in (
        "수동 조작 이력",
        "기본 자동제어 이력",
        "AI 추천 이력",
        "AI 적용/미적용 이력",
        "장치 명령 후보 이력",
        "실제 실행 이력, later only",
        "알람 ack/clear, 승인/override, 실행 이력 수정 제외",
        "실제 실행 이력은 later only evidence입니다",
    ):
        assert marker in text


def test_r7_012_safety_history_detail_is_only_attached_to_safety_history_domain():
    text = _read(REBUILD_PANEL)
    assert 'subpage.key === "safety-history" ? this.renderR7SafetyHistoryZoneVisual() : ""' in text
    assert 'subpage.key === "recommendation-automation" ? this.renderR7RecommendationZoneVisual() : ""' in text
    assert 'subpage.key === "device-control" ? this.renderR7DeviceZoneVisual() : ""' in text


def test_r7_012_does_not_add_ack_clear_override_or_execution_authority():
    text = _read(REBUILD_PANEL)
    forbidden = (
        "data-r7-safety-history-ack",
        "data-r7-safety-history-clear",
        "data-r7-safety-history-override",
        "data-r7-safety-history-approve",
        "data-r7-safety-history-execute",
        "data-r7-safety-history-mutate",
        "callService(",
        ".callService",
        "hass.services",
        "mqttEnabled\": true",
        "deviceCommandEnabled\": true",
        "executionDecisionEnabled\": true",
    )
    for marker in forbidden:
        assert marker not in text


def test_r7_012_node_smoke_renders_safety_history_visual_absorbed_detail_items():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ contextSource: 'r7-012-readonly-smoke', zones: [] }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      panel.setR7ActiveDomain('safety-history');
      const html = panel.innerHTML;
      const required = [
        'data-r7-detail-subpage="safety-history"',
        'data-r7-safety-zone-visual="true"',
        'data-r7-safety-detail-absorbed="true"',
        'data-r7-safety-status-card',
        'data-r7-safety-reason-card',
        'data-r7-safety-operation-card',
        'data-r7-safety-audit-card',
        '안전·이력은 일반 setpoint owner가 아닙니다',
        'authoritative allow/block history'
      ];
      for (const item of required) {{
        if (!html.includes(item)) {{ console.error(item); process.exit(1); }}
      }}
      if (html.includes('data-r7-safety-history-detail')) process.exit(3);
      if (html.includes('data-r7-safety-history-override')) process.exit(2);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_012_spec_still_defines_safety_history_domain_source_boundary():
    text = _read(SPEC)
    for phrase in (
        "## 5.7 안전·이력",
        "Safety 상태",
        "Interlock 상태",
        "Fail Safe 상태",
        "차단 이유",
        "수동 조작 이력",
        "AI 추천 이력",
        "실제 실행 이력, later only",
        "안전·이력은 일반 setpoint owner가 아니다",
        "모든 도메인의 최종 allow/block evidence를 모아야 한다",
    ):
        assert phrase in text
