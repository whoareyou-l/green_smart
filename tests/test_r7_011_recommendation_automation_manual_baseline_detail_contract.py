from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-011-recommendation-automation-manual-baseline-detail.md"
SPEC = ROOT / "docs/rebuild/r7-006-manual-first-target-domain-spec.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_011_version_surfaces_are_1_12_43():
    assert '"version": "1.12.59"' in _read(MANIFEST)
    assert 'const VERSION = "1.12.59"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.12.59"' in _read(REBUILD_PANEL)
    assert "v1.12.59" in _read(DOC)


def test_r7_011_doc_records_recommendation_grammar_and_boundaries():
    text = _read(DOC)
    required = [
        "# R7-011 Recommendation/Automation Manual-baseline Read-only Detail",
        "Status: R7-011 complete",
        "Manual baseline",
        "Rule/schedule candidate",
        "AI recommendation/correction",
        "Safety-final candidate",
        "Fallback value when AI is off",
        "No API route change in R7-011",
        "No DB migration in R7-011",
        "No HA service call in R7-011",
        "No MQTT/device command in R7-011",
        "No recommendation apply/execute in R7-011",
        "No operator approval release in R7-011",
        "No automatic work order in R7-011",
        "No final command authority in R7-011",
        "No AI direct execution authority in R7-011",
    ]
    for phrase in required:
        assert phrase in text


def test_r7_011_panel_contains_recommendation_detail_markers_and_layers():
    text = _read(REBUILD_PANEL)
    required = [
        "renderR7RecommendationAutomationDetail",
        "data-r7-recommendation-automation-detail",
        'data-r7-recommendation-readonly-boundary="true"',
        "data-r7-recommendation-comparison-grammar",
        "Manual baseline → Rule/schedule candidate → AI recommendation/correction → Safety-final candidate → Fallback value when AI is off",
        "data-r7-recommendation-manual-baseline",
        "data-r7-recommendation-rule-candidate",
        "data-r7-recommendation-ai-assist",
        'data-r7-recommendation-ai-authority="assist-only"',
        "data-r7-recommendation-safety-final",
        "data-r7-recommendation-fallback",
        'data-r7-recommendation-final-command-authority="none"',
    ]
    for marker in required:
        assert marker in text


def test_r7_011_recommendation_detail_names_manual_baseline_items():
    text = _read(REBUILD_PANEL)
    for marker in (
        'data-r7-recommendation-manual-item="환경 수동 기준"',
        'data-r7-recommendation-manual-item="관수·양액 수동 기준"',
        'data-r7-recommendation-manual-item="장치 모드 기준"',
        'data-r7-recommendation-manual-item="AI off fallback value"',
        "환경 수동 기준",
        "관수·양액 수동 기준",
        "장치 모드 기준",
        "AI off fallback value",
    ):
        assert marker in text


def test_r7_011_recommendation_detail_names_rule_ai_safety_and_fallback_items():
    text = _read(REBUILD_PANEL)
    for marker in (
        'data-r7-recommendation-rule="rule/schedule candidate"',
        'data-r7-recommendation-rule="automation eligibility"',
        'data-r7-recommendation-rule="difference from manual baseline"',
        'data-r7-recommendation-ai-item="AI recommendation/correction"',
        'data-r7-recommendation-ai-item="explanation"',
        'data-r7-recommendation-ai-item="fallback"',
        'data-r7-recommendation-safety-item="Safety-final candidate"',
        'data-r7-recommendation-safety-item="not final command"',
        'data-r7-recommendation-safety-item="no final command authority"',
        "추천·자동화는 실행 버튼 중심 화면이 아닙니다",
        "Safety-final candidate는 최종 명령이 아니며 final command authority를 갖지 않습니다",
    ):
        assert marker in text


def test_r7_011_recommendation_detail_is_absorbed_into_visual_domain():
    text = _read(REBUILD_PANEL)
    assert 'subpage.key === "recommendation-automation" ? this.renderR7RecommendationZoneVisual() : ""' in text
    assert 'subpage.key === "device-control" ? this.renderR7DeviceZoneVisual() : ""' in text
    assert 'subpage.key === "irrigation-fertigation" ? this.renderR7IrrigationZoneVisual() : ""' in text
    assert 'data-r7-recommendation-detail-absorbed="true"' in text


def test_r7_011_does_not_add_recommendation_execution_or_approval_authority():
    text = _read(REBUILD_PANEL)
    forbidden = (
        "data-r7-recommendation-save",
        "data-r7-recommendation-apply",
        "data-r7-recommendation-execute",
        "data-r7-recommendation-approve",
        "data-r7-recommendation-work-order",
        "data-r7-recommendation-ha-service-call",
        "callService(",
        ".callService",
        "hass.services",
        "mqttEnabled\": true",
        "deviceCommandEnabled\": true",
        "executionDecisionEnabled\": true",
    )
    for marker in forbidden:
        assert marker not in text


def test_r7_011_node_smoke_renders_recommendation_visual_absorbed_detail_items():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ contextSource: 'r7-011-absorbed-visual-smoke', zones: [] }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      panel.setR7ActiveDomain('recommendation-automation');
      const html = panel.innerHTML;
      const required = [
        'data-r7-detail-subpage="recommendation-automation"',
        'data-r7-recommendation-zone-visual="true"',
        'data-r7-recommendation-detail-absorbed="true"',
        'data-r7-recommendation-setting-card',
        'data-r7-recommendation-rule-card',
        'data-r7-recommendation-assist-card',
        'data-r7-recommendation-safety-card',
        '환경 수동 기준', '관수·양액 수동 기준', '장치 모드 기준', 'AI off fallback value',
        'rule/schedule candidate', 'automation eligibility', 'difference from manual baseline',
        'AI recommendation/correction', 'explanation', 'fallback',
        'Safety-final candidate', 'not final command', 'no final command authority'
      ];
      for (const item of required) {{
        if (!html.includes(item)) {{ console.error(item); process.exit(1); }}
      }}
      if (html.includes('data-r7-recommendation-automation-detail')) process.exit(3);
      if (html.includes('data-r7-recommendation-execute')) process.exit(2);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_011_spec_still_defines_recommendation_domain_source_grammar():
    text = _read(SPEC)
    for phrase in (
        "## 5.6 추천·자동화",
        "Manual baseline",
        "Rule/schedule candidate",
        "AI recommendation/correction",
        "Safety-final candidate",
        "Fallback value when AI is off",
        "추천·자동화는 실행 버튼 중심 화면이 아니다",
        "추천·자동화는 final command authority를 갖지 않는다",
    ):
        assert phrase in text
