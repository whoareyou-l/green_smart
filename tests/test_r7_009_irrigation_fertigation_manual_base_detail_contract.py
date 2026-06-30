from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-009-irrigation-fertigation-manual-base-detail.md"
SPEC = ROOT / "docs/rebuild/r7-006-manual-first-target-domain-spec.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_009_version_surfaces_are_1_12_41():
    assert '"version": "1.14.2"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.2"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.2"' in _read(REBUILD_PANEL)
    assert "v1.14.2" in _read(DOC)


def test_r7_009_doc_records_irrigation_formula_and_boundaries():
    text = _read(DOC)
    required = [
        "# R7-009 Irrigation/Fertigation Manual/Base Read-only Detail",
        "Status: R7-009 complete",
        "baseIrrigationSettings",
        "ruleScheduleIrrigationAutomation",
        "aiIrrigationCorrection if enabled and healthy",
        "calculatedIrrigationTargets",
        "irrigationSafetyLimits clamp",
        "finalIrrigationTargets",
        "No API route change in R7-009",
        "No DB migration in R7-009",
        "No HA service call in R7-009",
        "No MQTT/device command in R7-009",
        "No irrigation/fertigation setting save in R7-009",
        "No pump/valve/fertigation device execution in R7-009",
        "No AI direct irrigation authority in R7-009",
    ]
    for phrase in required:
        assert phrase in text


def test_r7_009_panel_contains_irrigation_detail_markers_and_layers():
    text = _read(REBUILD_PANEL)
    required = [
        "renderR7IrrigationFertigationDetail",
        "data-r7-irrigation-fertigation-detail",
        'data-r7-irrigation-readonly-boundary="true"',
        "data-r7-irrigation-control-formula",
        "baseIrrigationSettings + ruleScheduleIrrigationAutomation + aiIrrigationCorrection",
        "calculatedIrrigationTargets",
        "irrigationSafetyLimits clamp",
        "finalIrrigationTargets",
        "data-r7-irrigation-manual-settings",
        "data-r7-irrigation-rule-schedule",
        "data-r7-irrigation-ai-assist",
        'data-r7-irrigation-ai-authority="assist-only"',
        "data-r7-irrigation-safety-final",
        "data-r7-irrigation-fallback",
        'data-r7-irrigation-ai-fallback-to-manual="true"',
    ]
    for marker in required:
        assert marker in text


def test_r7_009_irrigation_detail_names_manual_irrigation_settings():
    text = _read(REBUILD_PANEL)
    for marker in (
        'data-r7-irrigation-manual-setting="관수 스케줄"',
        'data-r7-irrigation-manual-setting="일사 누적 관수"',
        'data-r7-irrigation-manual-setting="EC 목표"',
        'data-r7-irrigation-manual-setting="pH 목표"',
        'data-r7-irrigation-manual-setting="급액량"',
        'data-r7-irrigation-manual-setting="배액률"',
        'data-r7-irrigation-manual-setting="드라이백"',
        'data-r7-irrigation-manual-setting="양액 레시피"',
        "06:00 / 10:30 / 14:30",
        "100~160 J/cm²",
        "EC 1.8~2.4 dS/m",
        "pH 5.8~6.3",
        "배액률 20~30%",
        "드라이백 8~12%",
    ):
        assert marker in text


def test_r7_009_irrigation_detail_names_rule_ai_safety_and_fallback_items():
    text = _read(REBUILD_PANEL)
    for marker in (
        'data-r7-irrigation-rule="시간 기반 관수"',
        'data-r7-irrigation-rule="일사 누적 관수"',
        'data-r7-irrigation-rule="근권 수분 기준 관수"',
        'data-r7-irrigation-rule="저수조/배액 재활용 점검"',
        'data-r7-irrigation-ai-item="aiIrrigationCorrection"',
        'data-r7-irrigation-ai-item="수동 기준 대비 차이"',
        'data-r7-irrigation-ai-item="fallback"',
        'data-r7-irrigation-safety-item="irrigationSafetyLimits"',
        'data-r7-irrigation-safety-item="sensorFreshness"',
        'data-r7-irrigation-safety-item="finalIrrigationTargets"',
        "disabled/unhealthy/timeout/stale",
        "센서 stale, 배액 오류, 장치 장애, 권한 제한은 AI 관수 보정보다 우선합니다",
    ):
        assert marker in text


def test_r7_009_irrigation_detail_is_absorbed_into_visual_domain():
    text = _read(REBUILD_PANEL)
    assert 'subpage.key === "irrigation-fertigation" ? this.renderR7IrrigationZoneVisual() : ""' in text
    assert 'subpage.key === "environment-control" ? this.renderR7EnvironmentZoneVisual() : ""' in text
    assert 'subpage.key === "settings-admin" ? this.renderR7SettingsAdminZoneVisual() : ""' in text
    assert 'data-r7-irrigation-detail-absorbed="true"' in text


def test_r7_009_does_not_add_irrigation_execution_or_write_authority():
    text = _read(REBUILD_PANEL)
    forbidden = (
        "data-r7-irrigation-save",
        "data-r7-irrigation-apply",
        "data-r7-irrigation-execute",
        "data-r7-irrigation-device-command",
        "data-r7-irrigation-ha-service-call",
        "data-r7-irrigation-pump-command",
        "data-r7-irrigation-valve-command",
        "callService(",
        ".callService",
        "hass.services",
        "mqttEnabled\": true",
        "deviceCommandEnabled\": true",
        "executionDecisionEnabled\": true",
    )
    for marker in forbidden:
        assert marker not in text


def test_r7_009_node_smoke_renders_irrigation_visual_absorbed_detail_items():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ contextSource: 'r7-009-absorbed-visual-smoke', zones: [] }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      panel.setR7ActiveDomain('irrigation-fertigation');
      const html = panel.innerHTML;
      const required = [
        'data-r7-detail-subpage="irrigation-fertigation"',
        'data-r7-irrigation-zone-visual="true"',
        'data-r7-irrigation-detail-absorbed="true"',
        'data-r7-irrigation-setting-card',
        'data-r7-irrigation-rule-card',
        'data-r7-irrigation-assist-card',
        'data-r7-irrigation-safety-card',
        '관수 스케줄', '일사 누적 관수', 'EC 목표', 'pH 목표', '급액량', '배액률', '드라이백', '양액 레시피',
        '시간 기반 관수', '근권 수분 기준 관수', '저수조/배액 재활용 점검',
        'aiIrrigationCorrection', '수동 기준 대비 차이', 'fallback',
        '관수 한계', '센서 신선도', '최종 관수 후보'
      ];
      for (const item of required) {{
        if (!html.includes(item)) {{ console.error(item); process.exit(1); }}
      }}
      if (html.includes('data-r7-irrigation-fertigation-detail')) process.exit(3);
      if (html.includes('data-r7-irrigation-execute')) process.exit(2);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_009_spec_still_defines_irrigation_domain_source_formula():
    text = _read(SPEC)
    for phrase in (
        "## 5.4 관수 제어",
        "baseIrrigationSettings",
        "ruleScheduleIrrigationAutomation",
        "aiIrrigationCorrection",
        "irrigationSafetyLimits clamp",
        "= finalIrrigationTargets",
    ):
        assert phrase in text
