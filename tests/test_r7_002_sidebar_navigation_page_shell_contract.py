from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-002-sidebar-navigation-page-shell.md"
R7_001_DOC = ROOT / "docs/rebuild/r7-001-main-dashboard-redesign.md"
R7_000_DOC = ROOT / "docs/rebuild/r7-000-main-dashboard-sidebar-detail-ia-blueprint.md"
CURRENT_UI = ROOT / "docs/design/current-ui-design-and-navigation.md"
PRODUCT_PLAN = ROOT / "docs/plans/2026-06-28-green-smart-product-first-rebuild-plan.md"
TARGET_ARCH = ROOT / "docs/rebuild/target-architecture.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_002_version_surfaces_are_1_12_36():
    assert '"version": "1.12.52"' in _read(MANIFEST)
    assert 'const VERSION = "1.12.52"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.12.52"' in _read(REBUILD_PANEL)
    for path in (DOC, R7_001_DOC, R7_000_DOC, CURRENT_UI, PRODUCT_PLAN, TARGET_ARCH):
        assert "v1.12.52" in _read(path)


def test_r7_002_doc_declares_shell_scope_and_boundaries():
    text = _read(DOC)
    for marker in (
        "# R7-002 Sidebar Navigation + Page Shell",
        "Status: R7-002 complete",
        "implements the R7 sidebar primary groups and page shell",
        "운영 홈",
        "작물 중심 운영",
        "현장 상태",
        "추천·실행 검토",
        "설정·관리",
        "No API route change in R7-002",
        "No DB migration in R7-002",
        "No execution authority in R7-002",
        "No approval/override release in R7-002",
        "No SafetyGuard/Interlock runtime behavior change in R7-002",
    ):
        assert marker in text


def test_r7_002_panel_has_sidebar_page_shell_markers_and_group_order():
    text = _read(REBUILD_PANEL)
    for marker in (
        "R7-002 Sidebar navigation + page shell",
        "R7_SIDEBAR_GROUPS",
        "data-r7-app-shell",
        "data-r7-sidebar",
        "data-r7-sidebar-primary-groups",
        "data-r7-sidebar-group=\"operations-home\"",
        "data-r7-sidebar-group=\"crop-centered\"",
        "data-r7-sidebar-group=\"field-status\"",
        "data-r7-sidebar-group=\"recommendation-review\"",
        "data-r7-sidebar-group=\"settings-admin\"",
        "data-r7-page-shell",
        "data-r7-page-header",
        "data-r7-page-workspace",
        "data-r7-mobile-nav",
    ):
        assert marker in text
    labels = ["운영 홈", "작물 중심 운영", "현장 상태", "추천·실행 검토", "설정·관리"]
    positions = [text.index(label) for label in labels]
    assert positions == sorted(positions)


def test_r7_002_page_shell_wraps_existing_crop_centered_dashboard_without_standalone_zone_section():
    text = _read(REBUILD_PANEL)
    assert "renderR7Sidebar" in text
    assert "renderR7MobileNav" in text
    assert "renderR7PageShell" in text
    assert "this.renderOperatingHome()" in text
    assert "data-r7-main-dashboard" in text
    assert "data-r7-stage-grid" in text
    assert "data-crop-os-stage-zone-detail" in text
    assert "구역별 작물 운영" not in text
    assert "data-crop-os-zone-contexts" not in text


def test_r7_002_sidebar_preserves_readonly_no_execution_boundary():
    text = _read(REBUILD_PANEL)
    forbidden = (
        "data-r7-sidebar-execute",
        "data-r7-sidebar-approve-override",
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


def test_r7_002_node_smoke_renders_sidebar_shell_and_dashboard_markers():
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
      if (!html.includes('data-r7-app-shell')) process.exit(1);
      if (!html.includes('data-r7-sidebar-primary-groups')) process.exit(2);
      if (!html.includes('운영 홈')) process.exit(3);
      if (!html.includes('작물 중심 운영')) process.exit(4);
      if (!html.includes('data-r7-page-workspace')) process.exit(5);
      if (!html.includes('data-r7-main-dashboard')) process.exit(6);
      if (html.includes('구역별 작물 운영')) process.exit(7);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_002_source_docs_link_sidebar_shell_slice():
    for path in (R7_001_DOC, R7_000_DOC, CURRENT_UI, PRODUCT_PLAN, TARGET_ARCH):
        text = _read(path)
        assert "R7-002 Sidebar Navigation + Page Shell" in text
        assert "docs/rebuild/r7-002-sidebar-navigation-page-shell.md" in text
        assert "No execution authority in R7-002" in text
