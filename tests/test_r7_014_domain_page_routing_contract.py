from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-014-domain-page-routing.md"

ACTIVE_DOMAINS = (
    "operations-home",
    "crop-operations",
    "environment-control",
    "irrigation-fertigation",
    "device-control",
    "recommendation-automation",
    "safety-history",
    "settings-admin",
)


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_014_version_surfaces_are_1_12_46():
    assert '"version": "1.15.35"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.35"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.35"' in _read(REBUILD_PANEL)
    assert "v1.15.35" in _read(DOC)


def test_r7_014_doc_declares_domain_page_routing_scope_and_boundaries():
    text = _read(DOC)
    for phrase in (
        "# R7-014 Domain Page Routing",
        "Status: R7-014 complete",
        "Only one active domain page is visible at a time",
        "Default active domain: operations-home",
        "Sidebar click changes active domain without page reload",
        "Mobile nav click changes active domain without page reload",
        "The operator no longer sees all domain details stacked under 운영 홈",
        "No API route change in R7-014",
        "No DB migration in R7-014",
        "No HA service call in R7-014",
        "No MQTT/device command in R7-014",
        "No execution/apply/save controls in R7-014",
        "No approval/override release in R7-014",
    ):
        assert phrase in text


def test_r7_014_panel_has_domain_page_router_state_and_markers():
    text = _read(REBUILD_PANEL)
    for marker in (
        "_activeR7Domain",
        "setR7ActiveDomain",
        "_bindR7DomainNavigation",
        "renderR7ActiveDomainPage",
        'data-r7-domain-page-router="true"',
        'data-r7-active-domain="${this._activeR7Domain}"',
        "data-r7-domain-page-shell",
        "data-r7-domain-page-active=\"true\"",
        "data-r7-domain-page-hidden=\"true\"",
        "data-r7-sidebar-active",
        "aria-current=\"page\"",
    ):
        assert marker in text


def test_r7_014_panel_defines_all_active_domain_pages():
    text = _read(REBUILD_PANEL)
    for domain in ACTIVE_DOMAINS:
        assert f'data-r7-domain-page="{domain}"' in text
        assert f'data-r7-sidebar-target="{domain}"' in text


def test_r7_014_operations_home_is_dashboard_page_not_all_detail_dump():
    text = _read(REBUILD_PANEL)
    assert 'this._activeR7Domain = "operations-home"' in text
    assert "renderOperatingHome()" in text
    assert "renderR7ActiveDomainPage()" in text
    assert "renderR7SubpagePlaceholders()" not in text
    assert "${this.renderR7SubpagePlaceholders()}" not in text
    assert "${this.renderOperatingHome()}" not in text


def test_r7_014_active_domain_page_routes_existing_domain_details():
    text = _read(REBUILD_PANEL)
    for phrase in (
        'case "operations-home":',
        'this.renderR7DomainPageShell(subpage, this.renderOperatingHome())',
        'case "environment-control":',
        'this.renderR7DomainPageShell(subpage, this.renderR7DetailSubpage(subpage))',
        'case "irrigation-fertigation":',
        'case "device-control":',
        'case "recommendation-automation":',
        'case "safety-history":',
        'case "settings-admin":',
    ):
        assert phrase in text


def test_r7_014_click_smoke_changes_sidebar_domain_without_reload():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; this._listeners = {{}}; }}
        querySelectorAll(selector){{ return Array.from(this._nodes || []).filter((node) => node.matches?.(selector)); }}
        querySelector(selector){{ return this.querySelectorAll(selector)[0] || null; }}
        addEventListener(type, fn){{ this._listeners[type] = fn; }}
        dispatchEvent(event){{ this._listeners[event.type]?.(event); }}
      }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ contextSource: 'r7-014-readonly-smoke', zones: [] }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      if (!panel.innerHTML.includes('data-r7-active-domain="operations-home"')) process.exit(1);
      panel.setR7ActiveDomain('device-control');
      if (panel._activeR7Domain !== 'device-control') process.exit(2);
      if (!panel.innerHTML.includes('data-r7-active-domain="device-control"')) process.exit(3);
      if (!panel.innerHTML.includes('data-r7-domain-page="device-control"')) process.exit(4);
      if (!panel.innerHTML.includes('data-r7-device-zone-visual="true"')) process.exit(5);
      if (!panel.innerHTML.includes('data-r7-device-detail-absorbed="true"')) process.exit(8);
      if (panel.innerHTML.includes('data-r7-domain-page="environment-control" data-r7-domain-page-active="true"')) process.exit(6);
      panel.setR7ActiveDomain('unknown-domain');
      if (panel._activeR7Domain !== 'operations-home') process.exit(7);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_014_no_new_execution_or_mutation_authority():
    text = _read(REBUILD_PANEL)
    for marker in (
        "data-r7-domain-page-save",
        "data-r7-domain-page-apply",
        "data-r7-domain-page-execute",
        "data-r7-domain-page-approve",
        "callService(",
        ".callService",
        "hass.services",
        "mqttEnabled\": true",
        "deviceCommandEnabled\": true",
        "executionDecisionEnabled\": true",
        "approvalOverrideEnabled\": true",
    ):
        assert marker not in text
