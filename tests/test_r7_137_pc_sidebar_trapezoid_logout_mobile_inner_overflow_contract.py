from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_137_version_surfaces_are_1_15_06():
    assert '"version": "1.15.36"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.36"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.36"' in _read(REBUILD_PANEL)


def test_r7_137_source_has_fixed_overlay_pc_trapezoids_mobile_right_user_and_inner_overflow_fix():
    source = _read(REBUILD_PANEL)
    for marker in (
        'data-r7-sidebar-toggle-position="logo-right-outside"',
        'data-r7-sidebar-toggle-shape="trapezoid-wide-left"',
        'data-r7-sidebar-control-position="fixed-outside-overlay"',
        '_syncR7SidebarExternalControlPosition',
        '_scheduleR7SidebarExternalControlPositionSync',
        '_ensureR7SidebarExternalControlObservers',
        'new ResizeObserver(() => this._scheduleR7SidebarExternalControlPositionSync())',
        'new MutationObserver(() => this._scheduleR7SidebarExternalControlPositionSync())',
        'addEventListener?.("resize", this._r7SidebarExternalControlResizeHandler',
        'attributeFilter: ["class", "style", "open", "expanded"]',
        '--r7-sidebar-external-left',
        '--r7-sidebar-external-toggle-top',
        '--r7-sidebar-external-logout-top',
        'position:fixed;left:var(--r7-sidebar-external-left',
        'width:18px;height:34px',
        'width="13" height="13"',
        'font-size:12px',
        'data-r7-mobile-nested-content-overflow-fix="true"',
        '[data-r7-domain-content-card="tabs-zone-content"] :where(article,section,div)',
        'overflow-y:auto;overflow-x:hidden',
        'clip-path:polygon(0 0,100% 18%,100% 82%,0 100%)',
        'toggleGlyph = collapsed ? "›" : "‹"',
        'data-r7-sidebar-logout-shape="trapezoid-wide-left"',
        'data-r7-sidebar-protruding-button="logout"',
        'data-r7-sidebar-user-layout="pc-previous-avatar-left"',
        'grid-template-columns:36px minmax(0,1fr)',
        'data-r7-mobile-user-text-align="right-near-logout"',
        'text-align:right;justify-items:end',
        'logout: "mdi:logout"',
        'exit: "mdi:logout"',
        'data-r7-sidebar-line-icon="logout"',
        'this._r7SidebarLineIcon("logout")',
        '[data-r7-cdb-common-card], [data-r7-cdb-card-type]',
        '[data-r7-cdb-common-card] * { max-width:100% !important;',
        '[data-r7-cdb-common-card] [style*="grid-template-columns:repeat"]',
    ):
        assert marker in source
    for forbidden in (
        'data-r7-sidebar-user-text-align="right-near-logout"',
        'data-r7-sidebar-line-icon="exit"',
        'grid-template-columns:minmax(0,1fr) 36px',
        'this._r7SidebarLineIcon("exit")',
        'position:absolute;right:-34px',
        'width:36px;height:42px',
        'font-size:19px',
        'width="19" height="19"',
        'overflow-y:auto;overflow-x:visible',
        'grid-template-columns:minmax(0,1fr) 42px;gap:6px;align-items:center;justify-content:center;position:relative;',
    ):
        assert forbidden not in source


def test_r7_137_render_pc_expanded_and_compact_use_fixed_overlay_not_sidebar_overflow():
    script = """
      let classSet = new Set();
      globalThis.MutationObserver = class { constructor(fn){ this.fn = fn; } observe(){} };
      globalThis.document = {
        body: { classList: { add(c){ classSet.add(c); }, remove(c){ classSet.delete(c); }, contains(c){ return classSet.has(c); }, toggle(c, enabled){ if (enabled) classSet.add(c); else classSet.delete(c); } } },
        getElementById(){ return null; },
        createElement(){ return { id: '', textContent: '', setAttribute(){}, appendChild(){} }; },
        head: { appendChild(){} },
        querySelectorAll(){ return []; }
      };
      globalThis.HTMLElement = class { constructor(){ this.innerHTML=''; this.style={ setProperty(k,v){ this[k]=v; } }; this._attrs={}; } setAttribute(k,v){ this._attrs[k]=String(v); } getAttribute(k){ return this._attrs[k]; } querySelectorAll(){ return []; } querySelector(){ return null; } addEventListener(){} };
      globalThis.customElements = { _items:new Map(), get(n){return this._items.get(n)}, define(n,c){this._items.set(n,c)} };
      const mod = await import(__REBUILD__);
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = { user: { name:'admin', is_admin:true, green_smart_role:'operator' }, callApi: async () => ({ actorRole:'operator', zones: [] }) };
      panel._homeContext = { actorRole:'operator', zones: [] };
      for (const collapsed of [false, true]) {
        panel._r7SidebarCollapsed = collapsed;
        panel.render();
        const html = panel.innerHTML;
        const required = [
          'data-r7-sidebar-toggle-position="logo-right-outside"',
          'data-r7-sidebar-toggle-shape="trapezoid-wide-left"',
          'data-r7-sidebar-control-position="fixed-outside-overlay"',
          'data-r7-sidebar-protruding-button="toggle"',
          'data-r7-sidebar-logout-shape="trapezoid-wide-left"',
          'data-r7-sidebar-protruding-button="logout"',
          'data-r7-sidebar-button-placement="outside-right"',
          'position:fixed;left:var(--r7-sidebar-external-left',
          'width:18px;height:34px',
          'width="13" height="13"',
          'font-size:12px',
          'data-r7-mobile-nested-content-overflow-fix="true"',
          'overflow-y:auto;overflow-x:hidden',
          'clip-path:polygon(0 0,100% 18%,100% 82%,0 100%)',
          'data-r7-sidebar-line-icon="logout"',
          'data-r7-mobile-user-text-align="right-near-logout"',
          'data-r7-sidebar-ha-icon="logout"',
          'data-r7-mobile-responsive-overflow-fix="true"',
          '[data-r7-cdb-common-card] * { max-width:100% !important;',
        ];
        const expandedRequired = collapsed ? [] : ['data-r7-sidebar-user-layout="pc-previous-avatar-left"'];
        const missing = [...required, ...expandedRequired].filter((needle) => !html.includes(needle));
        const forbidden = ['data-r7-sidebar-user-text-align="right-near-logout"', 'position:absolute;right:-34px'].filter((needle) => html.includes(needle));
        if (missing.length || forbidden.length) { console.error(JSON.stringify({collapsed, missing, forbidden})); process.exit(1); }
        if (collapsed && !html.includes('>›</button>')) { console.error('collapsed must show detail glyph'); process.exit(2); }
        if (!collapsed && !html.includes('>‹</button>')) { console.error('expanded must show collapse glyph'); process.exit(3); }
      }
      console.log(JSON.stringify({ok:true}));
    """.replace("__REBUILD__", repr(str(REBUILD_PANEL)))
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
