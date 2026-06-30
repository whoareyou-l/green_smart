from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-010-device-control-manual-base-detail.md"
SPEC = ROOT / "docs/rebuild/r7-006-manual-first-target-domain-spec.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_010_version_surfaces_are_1_12_42():
    assert '"version": "1.13.8"' in _read(MANIFEST)
    assert 'const VERSION = "1.13.8"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.13.8"' in _read(REBUILD_PANEL)
    assert "v1.13.8" in _read(DOC)


def test_r7_010_doc_records_device_formula_and_boundaries():
    text = _read(DOC)
    required = [
        "# R7-010 Device Control Manual/Base Read-only Detail",
        "Status: R7-010 complete",
        "deviceMode: manual / auto / locked / maintenance",
        "operatorRequestedAction or automationCandidate",
        "optional aiStrategyHint",
        "permission check",
        "Safety check",
        "Interlock check",
        "Fail Safe check",
        "allowed command or blocked reason",
        "No API route change in R7-010",
        "No DB migration in R7-010",
        "No HA service call in R7-010",
        "No MQTT/device command in R7-010",
        "No device mode save in R7-010",
        "No manual device operation in R7-010",
        "No automatic device execution in R7-010",
        "No AI direct device command authority in R7-010",
    ]
    for phrase in required:
        assert phrase in text


def test_r7_010_panel_contains_device_detail_markers_and_layers():
    text = _read(REBUILD_PANEL)
    required = [
        "renderR7DeviceControlDetail",
        "data-r7-device-control-detail",
        'data-r7-device-readonly-boundary="true"',
        "data-r7-device-control-formula",
        "deviceMode: manual / auto / locked / maintenance + operatorRequestedAction or automationCandidate + optional aiStrategyHint",
        "permission check",
        "Safety check",
        "Interlock check",
        "Fail Safe check",
        "allowed command or blocked reason",
        "data-r7-device-manual-settings",
        "data-r7-device-rule-schedule",
        "data-r7-device-ai-assist",
        'data-r7-device-ai-authority="hint-only"',
        "data-r7-device-safety-final",
        "data-r7-device-fallback",
        'data-r7-device-physical-hookup-blocked="true"',
    ]
    for marker in required:
        assert marker in text


def test_r7_010_device_detail_names_manual_modes_and_mapping_evidence():
    text = _read(REBUILD_PANEL)
    for marker in (
        'data-r7-device-manual-setting="manual"',
        'data-r7-device-manual-setting="auto"',
        'data-r7-device-manual-setting="locked"',
        'data-r7-device-manual-setting="maintenance"',
        'data-r7-device-manual-setting="HA entity mapping"',
        'data-r7-device-manual-setting="MQTT topic mapping later only"',
        "수동 모드",
        "자동 모드",
        "잠금 모드",
        "점검 모드",
        "HA entity mapping",
        "MQTT topic mapping later only",
    ):
        assert marker in text


def test_r7_010_device_detail_names_rule_ai_safety_and_fallback_items():
    text = _read(REBUILD_PANEL)
    for marker in (
        'data-r7-device-rule="operatorRequestedAction"',
        'data-r7-device-rule="automationCandidate"',
        'data-r7-device-rule="mode gate"',
        'data-r7-device-rule="mapping health"',
        'data-r7-device-ai-item="optional aiStrategyHint"',
        'data-r7-device-ai-item="hint only"',
        'data-r7-device-ai-item="fallback"',
        'data-r7-device-safety-item="permission check"',
        'data-r7-device-safety-item="Safety check"',
        'data-r7-device-safety-item="Interlock check"',
        'data-r7-device-safety-item="Fail Safe check"',
        'data-r7-device-safety-item="HA/MQTT status"',
        "AI는 optional aiStrategyHint만 제공하며 장치 명령을 직접 내리지 않습니다",
        "Physical MQTT/device hookup remains blocked until virtual scenario verification passes",
    ):
        assert marker in text


def test_r7_010_device_detail_is_absorbed_into_visual_domain():
    text = _read(REBUILD_PANEL)
    assert 'subpage.key === "device-control" ? this.renderR7DeviceZoneVisual() : ""' in text
    assert 'subpage.key === "irrigation-fertigation" ? this.renderR7IrrigationZoneVisual() : ""' in text
    assert 'subpage.key === "environment-control" ? this.renderR7EnvironmentZoneVisual() : ""' in text
    assert 'data-r7-device-detail-absorbed="true"' in text


def test_r7_010_does_not_add_device_execution_or_write_authority():
    text = _read(REBUILD_PANEL)
    forbidden = (
        "data-r7-device-save",
        "data-r7-device-apply",
        "data-r7-device-execute",
        "data-r7-device-command-button",
        "data-r7-device-ha-service-call",
        "data-r7-device-mqtt-command",
        "callService(",
        ".callService",
        "hass.services",
        "mqttEnabled\": true",
        "deviceCommandEnabled\": true",
        "executionDecisionEnabled\": true",
    )
    for marker in forbidden:
        assert marker not in text


def test_r7_010_node_smoke_renders_device_visual_absorbed_detail_items():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ contextSource: 'r7-010-absorbed-visual-smoke', zones: [] }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      panel.setR7ActiveDomain('device-control');
      const html = panel.innerHTML;
      const required = [
        'data-r7-detail-subpage="device-control"',
        'data-r7-device-zone-visual="true"',
        'data-r7-device-detail-absorbed="true"',
        'data-r7-device-setting-card',
        'data-r7-device-rule-card',
        'data-r7-device-assist-card',
        'data-r7-device-safety-card',
        '수동 모드', '자동 모드', '잠금 모드', '점검 모드',
        'HA entity mapping', 'MQTT topic mapping later only',
        'operatorRequestedAction', 'automationCandidate', 'mode gate', 'mapping health',
        'optional aiStrategyHint', 'hint only', 'fallback',
        'permission check', 'Safety check', 'Interlock check', 'Fail Safe check', 'HA/MQTT status'
      ];
      for (const item of required) {{
        if (!html.includes(item)) {{ console.error(item); process.exit(1); }}
      }}
      if (html.includes('data-r7-device-control-detail')) process.exit(3);
      if (html.includes('data-r7-device-execute')) process.exit(2);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_010_spec_still_defines_device_domain_source_formula():
    text = _read(SPEC)
    for phrase in (
        "## 5.5 장치 제어",
        "deviceMode: manual / auto / locked / maintenance",
        "operatorRequestedAction or automationCandidate",
        "optional aiStrategyHint",
        "permission check",
        "Safety check",
        "Interlock check",
        "Fail Safe check",
        "= allowed command or blocked reason",
    ):
        assert phrase in text
