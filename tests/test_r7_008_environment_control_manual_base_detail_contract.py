from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-008-environment-control-manual-base-detail.md"
SPEC = ROOT / "docs/rebuild/r7-006-manual-first-target-domain-spec.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_008_version_surfaces_are_1_12_40():
    assert '"version": "1.14.88"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.88"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.88"' in _read(REBUILD_PANEL)
    assert "v1.14.88" in _read(DOC)


def test_r7_008_doc_records_environment_formula_and_boundaries():
    text = _read(DOC)
    required = [
        "# R7-008 Environment Control Manual/Base Read-only Detail",
        "Status: R7-008 complete",
        "manualEnvironmentSettings",
        "ruleScheduleEnvironmentAutomation",
        "aiEnvironmentCorrection if enabled and healthy",
        "calculatedEnvironmentTargets",
        "environmentSafetyLimits / deviceInterlock clamp",
        "finalEnvironmentTargets",
        "No API route change in R7-008",
        "No DB migration in R7-008",
        "No HA service call in R7-008",
        "No MQTT/device command in R7-008",
        "No environment setting save in R7-008",
        "No AI direct control authority in R7-008",
    ]
    for phrase in required:
        assert phrase in text


def test_r7_008_panel_contains_environment_detail_markers_and_layers():
    text = _read(REBUILD_PANEL)
    required = [
        "renderR7EnvironmentControlDetail",
        "data-r7-environment-control-detail",
        'data-r7-environment-readonly-boundary="true"',
        "data-r7-environment-control-formula",
        "manualEnvironmentSettings + ruleScheduleEnvironmentAutomation + aiEnvironmentCorrection",
        "calculatedEnvironmentTargets",
        "environmentSafetyLimits/deviceInterlock",
        "finalEnvironmentTargets",
        "data-r7-environment-manual-settings",
        "data-r7-environment-rule-schedule",
        "data-r7-environment-ai-assist",
        'data-r7-environment-ai-authority="assist-only"',
        "data-r7-environment-safety-final",
        "data-r7-environment-fallback",
        'data-r7-environment-ai-fallback-to-manual="true"',
    ]
    for marker in required:
        assert marker in text


def test_r7_008_environment_detail_names_manual_environment_setpoints():
    text = _read(REBUILD_PANEL)
    for marker in (
        'data-r7-environment-manual-setting="주간 온도"',
        'data-r7-environment-manual-setting="야간 온도"',
        'data-r7-environment-manual-setting="습도"',
        'data-r7-environment-manual-setting="VPD"',
        'data-r7-environment-manual-setting="CO₂"',
        'data-r7-environment-manual-setting="광/DLI"',
        "24~27℃",
        "17~19℃",
        "65~75%",
        "0.8~1.2 kPa",
        "600~900 ppm",
    ):
        assert marker in text


def test_r7_008_environment_detail_names_rule_ai_safety_and_fallback_items():
    text = _read(REBUILD_PANEL)
    for marker in (
        'data-r7-environment-rule="주야간 전환"',
        'data-r7-environment-rule="환기 단계"',
        'data-r7-environment-rule="난방 최소온도"',
        'data-r7-environment-rule="CO₂ 시간대"',
        'data-r7-environment-ai-item="aiEnvironmentCorrection"',
        'data-r7-environment-ai-item="수동 기준 대비 차이"',
        'data-r7-environment-ai-item="fallback"',
        'data-r7-environment-safety-item="environmentSafetyLimits"',
        'data-r7-environment-safety-item="deviceInterlock"',
        'data-r7-environment-safety-item="finalEnvironmentTargets"',
        "disabled/unhealthy/timeout/stale",
        "Safety/Interlock/Fail Safe를 우회할 수 없습니다",
    ):
        assert marker in text


def test_r7_008_environment_detail_is_absorbed_into_environment_visual_domain():
    text = _read(REBUILD_PANEL)
    assert 'subpage.key === "environment-control" ? this.renderR7EnvironmentZoneVisual() : ""' in text
    assert 'subpage.key === "settings-admin" ? this.renderR7SettingsAdminZoneVisual() : ""' in text
    assert 'data-r7-environment-detail-absorbed="true"' in text


def test_r7_008_does_not_add_execution_or_write_authority():
    text = _read(REBUILD_PANEL)
    forbidden = (
        "data-r7-environment-save",
        "data-r7-environment-apply",
        "data-r7-environment-execute",
        "data-r7-environment-device-command",
        "data-r7-environment-ha-service-call",
        "callService(",
        ".callService",
        "hass.services",
        "mqttEnabled\": true",
        "deviceCommandEnabled\": true",
        "executionDecisionEnabled\": true",
    )
    for marker in forbidden:
        assert marker not in text


def test_r7_008_node_smoke_renders_environment_visual_absorbed_detail_items():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ contextSource: 'r7-008-absorbed-visual-smoke', zones: [] }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      panel.setR7ActiveDomain('environment-control');
      const html = panel.innerHTML;
      const required = [
        'data-r7-detail-subpage="environment-control"',
        'data-r7-environment-zone-visual="true"',
        'data-r7-environment-detail-absorbed="true"',
        'data-r7-environment-setting-card',
        'data-r7-environment-rule-card',
        'data-r7-environment-assist-card',
        'data-r7-environment-safety-card',
        '주간 온도', '야간 온도', '습도', 'VPD', 'CO₂', '광/DLI',
        '주야간 전환', '환기 단계', '난방 최소온도', 'CO₂ 시간대',
        'aiEnvironmentCorrection', '수동 기준 대비 차이', 'fallback',
        '환경 한계', '장치 인터록', '최종 환경 후보'
      ];
      for (const item of required) {{
        if (!html.includes(item)) {{ console.error(item); process.exit(1); }}
      }}
      if (html.includes('data-r7-environment-control-detail')) process.exit(3);
      if (html.includes('data-r7-environment-execute')) process.exit(2);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_008_spec_still_defines_environment_domain_source_formula():
    text = _read(SPEC)
    for phrase in (
        "## 5.3 환경 제어",
        "manualEnvironmentSettings",
        "ruleScheduleEnvironmentAutomation",
        "aiEnvironmentCorrection",
        "environmentSafetyLimits / deviceInterlock clamp",
        "= finalEnvironmentTargets",
    ):
        assert phrase in text
