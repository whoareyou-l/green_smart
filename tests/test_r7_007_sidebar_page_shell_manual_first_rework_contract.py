from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-007-sidebar-page-shell-manual-first-rework.md"
SPEC = ROOT / "docs/rebuild/r7-006-manual-first-target-domain-spec.md"
PLAN = ROOT / "docs/rebuild/r7-005-legacy-audit-domain-research-manual-first-plan.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_007_version_surfaces_are_1_12_39():
    assert '"version": "1.12.56"' in _read(MANIFEST)
    assert 'const VERSION = "1.12.56"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.12.56"' in _read(REBUILD_PANEL)
    for path in (DOC, SPEC, PLAN):
        assert "R7-007" in _read(path) or path == SPEC


def test_r7_007_doc_declares_manual_first_shell_scope_and_boundaries():
    text = _read(DOC)
    required = [
        "# R7-007 Sidebar/Page Shell Manual-first Rework",
        "Status: R7-007 complete",
        "운영 홈 / 작물 운영 / 환경 제어 / 관수·양액 / 장치 제어 / 추천·자동화 / 안전·이력 / 설정·관리",
        "Green Smart = 수동 운영 가능한 환경제어 OS",
        "AI = 보조/추천/최적화 레이어",
        "No API route change in R7-007",
        "No DB migration in R7-007",
        "No HA service call in R7-007",
        "No MQTT/device command in R7-007",
        "No execution authority in R7-007",
        "No approval/override release in R7-007",
    ]
    for phrase in required:
        assert phrase in text


def test_r7_007_panel_renders_target_manual_first_sidebar_groups():
    text = _read(REBUILD_PANEL)
    expected = [
        'data-r7-sidebar-group="operations-home"',
        'data-r7-sidebar-group="crop-operations"',
        'data-r7-sidebar-group="environment-control"',
        'data-r7-sidebar-group="irrigation-fertigation"',
        'data-r7-sidebar-group="device-control"',
        'data-r7-sidebar-group="recommendation-automation"',
        'data-r7-sidebar-group="safety-history"',
        'data-r7-sidebar-group="settings-admin"',
    ]
    for marker in expected:
        assert marker in text
    active_section = text[text.index("const R7_SIDEBAR_GROUPS"):text.index("const R7_DETAIL_SUBPAGES")]
    key_order = [
        'key: "operations-home"',
        'key: "crop-operations"',
        'key: "environment-control"',
        'key: "irrigation-fertigation"',
        'key: "device-control"',
        'key: "recommendation-automation"',
        'key: "safety-history"',
        'key: "settings-admin"',
    ]
    positions = [active_section.index(marker) for marker in key_order]
    assert positions == sorted(positions)
    labels = ["운영 홈", "작물 운영", "환경 제어", "관수·양액", "장치 제어", "추천·자동화", "안전·이력", "설정·관리"]
    label_positions = [active_section.index(label) for label in labels]
    assert label_positions == sorted(label_positions)
    assert 'data-r7-manual-first-sidebar="true"' in text


def test_r7_007_old_sidebar_groups_are_deprecated_not_active_registry():
    text = _read(REBUILD_PANEL)
    active_section = text[text.index("const R7_SIDEBAR_GROUPS"):text.index("const R7_DETAIL_SUBPAGES")]
    for old in ('key: "crop-centered"', 'key: "field-status"', 'key: "recommendation-review"'):
        assert old not in active_section
    assert "R7_DEPRECATED_SIDEBAR_GROUPS" in text
    assert 'data-r7-deprecated-sidebar-groups' in text
    assert "작물 중심 운영" in text
    assert "현장 상태" in text
    assert "추천·실행 검토" in text


def test_r7_007_detail_placeholders_render_eight_manual_first_domains_with_layer_grammar():
    text = _read(REBUILD_PANEL)
    for marker in (
        'data-r7-detail-subpage="operations-home"',
        'data-r7-detail-subpage="crop-operations"',
        'data-r7-detail-subpage="environment-control"',
        'data-r7-detail-subpage="irrigation-fertigation"',
        'data-r7-detail-subpage="device-control"',
        'data-r7-detail-subpage="recommendation-automation"',
        'data-r7-detail-subpage="safety-history"',
        'data-r7-detail-subpage="settings-admin"',
        'data-r7-domain-page-router="true"',
        'data-r7-domain-page-shell',
        'data-r7-manual-base-settings',
        'data-r7-rule-schedule-automation',
        'data-r7-ai-assist-layer',
        'data-r7-safety-finalization',
    ):
        assert marker in text
    assert "Manual/Base Settings → Rule/Schedule Automation → AI Assist / Optimization → Safety/Interlock/Fail Safe Finalization" in text


def test_r7_007_visible_copy_is_manual_first_and_ai_assist_not_execution_first():
    text = _read(REBUILD_PANEL)
    required = [
        "작물·구역·경보 중심 운영 화면",
        "오늘 상태를 확인하고 필요한 구역으로 이동합니다",
        "오늘의 작물 운영",
        "현재 선택 구역",
        "우선 확인",
        "4. 추천·확인",
    ]
    for phrase in required:
        assert phrase in text


def test_r7_007_does_not_add_execution_or_physical_device_authority():
    text = _read(REBUILD_PANEL)
    forbidden = (
        "data-r7-sidebar-execute",
        "data-r7-subpage-execute",
        "data-r7-subpage-save",
        "data-r7-subpage-delete",
        "data-r7-subpage-approve-override",
        "callService(",
        ".callService",
        "hass.services",
        "mqttEnabled\": true",
        "deviceCommandEnabled\": true",
        "executionDecisionEnabled\": true",
        "approvalOverrideEnabled\": true",
    )
    for marker in forbidden:
        assert marker not in text


def test_r7_007_node_smoke_renders_new_sidebar_and_domain_placeholders():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ contextSource: 'manual-first-readonly-adapter', zones: [] }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      const html = panel.innerHTML;
      const required = [
        'data-r7-manual-first-sidebar="true"',
        'data-r7-sidebar-group="environment-control"',
        'data-r7-sidebar-group="irrigation-fertigation"',
        'data-r7-sidebar-group="device-control"',
        'data-r7-sidebar-group="recommendation-automation"',
        'data-r7-sidebar-group="safety-history"',
        'data-r7-domain-page-router="true"',
        'data-r7-active-domain="operations-home"',
        'data-r7-domain-page="operations-home"',
        '오늘 상태를 확인하고 필요한 구역으로 이동합니다',
        '추천·확인'
      ];
      for (const item of required) {{
        if (!html.includes(item)) {{ console.error(item); process.exit(1); }}
      }}
      panel.setR7ActiveDomain('environment-control');
      const envHtml = panel.innerHTML;
      for (const item of ['data-r7-active-domain="environment-control"', 'data-r7-manual-base-settings', 'data-r7-ai-assist-layer', 'data-r7-environment-zone-visual="true"', 'data-r7-environment-detail-absorbed="true"']) {{
        if (!envHtml.includes(item)) {{ console.error(item); process.exit(1); }}
      }}
      if (envHtml.includes('data-r7-sidebar-execute')) process.exit(2);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
