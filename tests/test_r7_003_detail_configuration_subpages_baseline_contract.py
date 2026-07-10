from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-003-detail-configuration-subpages-baseline.md"
R7_002_DOC = ROOT / "docs/rebuild/r7-002-sidebar-navigation-page-shell.md"
R7_000_DOC = ROOT / "docs/rebuild/r7-000-main-dashboard-sidebar-detail-ia-blueprint.md"
CURRENT_UI = ROOT / "docs/design/current-ui-design-and-navigation.md"
PRODUCT_PLAN = ROOT / "docs/plans/2026-06-28-green-smart-product-first-rebuild-plan.md"
TARGET_ARCH = ROOT / "docs/rebuild/target-architecture.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_003_version_surfaces_are_1_12_37():
    assert '"version": "1.15.12"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.12"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.12"' in _read(REBUILD_PANEL)
    for path in (DOC, R7_002_DOC, R7_000_DOC, CURRENT_UI, PRODUCT_PLAN, TARGET_ARCH):
        assert "v1.15.12" in _read(path)


def test_r7_003_doc_declares_selected_scope_and_boundaries():
    text = _read(DOC)
    for marker in (
        "# R7-003 Detail/Configuration Subpages Baseline",
        "Status: R7-003 complete",
        "selected scope: all five sidebar groups receive read-only detail/config placeholder baselines",
        "운영 홈",
        "작물 중심 운영",
        "현장 상태",
        "추천·실행 검토",
        "설정",
        "No API route change in R7-003",
        "No DB migration in R7-003",
        "No execution authority in R7-003",
        "No approval/override release in R7-003",
        "No SafetyGuard/Interlock runtime behavior change in R7-003",
        "No MQTT/device command in R7-003",
    ):
        assert marker in text


def test_r7_003_panel_declares_detail_subpage_registry_for_all_sidebar_groups():
    text = _read(REBUILD_PANEL)
    for marker in (
        "R7-003 Detail/configuration subpages baseline",
        "R7_DETAIL_SUBPAGES",
        "renderR7DetailSubpage",
        "renderR7ActiveDomainPage",
        "data-r7-domain-page-router=\"true\"",
        "data-r7-detail-subpage=\"operations-home\"",
        "data-r7-detail-subpage=\"crop-centered\"",
        "data-r7-detail-subpage=\"field-status\"",
        "data-r7-detail-subpage=\"recommendation-review\"",
        "data-r7-detail-subpage=\"settings-admin\"",
        "data-r7-subpage-readonly-boundary=\"true\"",
        "data-r7-subpage-config-placeholder",
        "data-r7-domain-visual-frame",
        "data-r7-domain-subtabs",
    ):
        assert marker in text


def test_r7_003_subpage_grammar_is_operator_summary_first_and_group_ordered():
    text = _read(REBUILD_PANEL)
    expected_order = [
        "data-r7-detail-subpage=\"operations-home\"",
        "data-r7-detail-subpage=\"crop-centered\"",
        "data-r7-detail-subpage=\"field-status\"",
        "data-r7-detail-subpage=\"recommendation-review\"",
        "data-r7-detail-subpage=\"settings-admin\"",
    ]
    positions = [text.index(marker) for marker in expected_order]
    assert positions == sorted(positions)
    assert "operator summary → source freshness → zone-scoped evidence → safety/interlock boundary → optional technical details" not in text
    assert "manual-first read-only domain" not in text
    assert "data-r7-subpage-evidence-summary" not in text
    assert "data-r7-subpage-source-freshness" not in text
    assert "data-r7-subpage-zone-scope" not in text
    assert "data-r7-subpage-safety-boundary" not in text


def test_r7_003_placeholder_baseline_keeps_dashboard_and_sidebar_without_legacy_zone_drift():
    text = _read(REBUILD_PANEL)
    assert "data-r7-sidebar-primary-groups" in text
    assert "data-r7-page-workspace" in text
    assert "data-r7-main-dashboard" in text
    assert "data-r7-stage-grid" in text
    assert "this.renderOperatingHome()" in text
    assert "구역별 작물 운영" not in text
    assert "data-crop-os-zone-contexts" not in text


def test_r7_003_readonly_placeholders_do_not_add_execution_or_routes():
    text = _read(REBUILD_PANEL)
    forbidden = (
        "data-r7-subpage-execute",
        "data-r7-subpage-save",
        "data-r7-subpage-delete",
        "data-r7-subpage-approve-override",
        "callService(",
        ".callService",
        "hass.services",
        "POST",
        "PUT",
        "DELETE",
        "mqttEnabled\": true",
        "deviceCommandEnabled\": true",
        "executionDecisionEnabled\": true",
        "approvalOverrideEnabled\": true",
    )
    for marker in forbidden:
        assert marker not in text


def test_r7_003_node_smoke_renders_all_detail_subpage_placeholders():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ contextSource: 'legacy-physical-readonly-adapter', zones: [] }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      const html = panel.innerHTML;
      const required = [
        'data-r7-domain-page-router="true"',
        'data-r7-active-domain="operations-home"',
        'data-r7-domain-page="operations-home"',
        'data-r7-domain-page-active="true"',
        'data-r7-main-dashboard'
      ];
      for (const item of required) {{
        if (!html.includes(item)) {{ console.error(item); process.exit(1); }}
      }}
      panel.setR7ActiveDomain('environment-control');
      const envHtml = panel.innerHTML;
      const envRequired = [
        'data-r7-active-domain="environment-control"',
        'data-r7-domain-page="environment-control"',
        'data-r7-detail-subpage="environment-control"',
        'data-r7-subpage-readonly-boundary="true"',
        'data-r7-subpage-config-placeholder',
        'data-r7-environment-zone-visual="true"',
        'data-r7-environment-detail-absorbed="true"'
      ];
      for (const item of envRequired) {{
        if (!envHtml.includes(item)) {{ console.error(item); process.exit(1); }}
      }}
      if (envHtml.includes('구역별 작물 운영')) process.exit(2);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_003_source_docs_link_detail_subpage_slice():
    for path in (R7_002_DOC, R7_000_DOC, CURRENT_UI, PRODUCT_PLAN, TARGET_ARCH):
        text = _read(path)
        assert "R7-003 Detail/Configuration Subpages Baseline" in text
        assert "docs/rebuild/r7-003-detail-configuration-subpages-baseline.md" in text
        assert "No execution authority in R7-003" in text
