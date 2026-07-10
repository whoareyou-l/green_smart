from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
PLAN = ROOT / "docs/plans/2026-07-10-mobile-logout-responsive-polish-plan.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_136_version_surfaces_are_1_15_01():
    assert '"version": "1.15.11"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.11"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.11"' in _read(REBUILD_PANEL)
    assert "v1.15.11" in _read(PLAN)


def test_r7_136_source_uses_ha_logout_event_and_mobile_text_responsive_markers():
    source = _read(REBUILD_PANEL)
    for marker in (
        'new CustomEvent("hass-logout"',
        'data-r7-sidebar-logout-event="hass-logout"',
        'data-r7-sidebar-logout-fallback-href="/"',
        'data-r7-mobile-account-presentation="text-name-role"',
        'data-r7-mobile-account-text="true"',
        'data-r7-mobile-user-name',
        'data-r7-mobile-user-role',
        '<button type="button" data-r7-mobile-logout-button="true"',
        'data-r7-mobile-domain-tab-ui="subtab-top-navbar"',
        'data-r7-mobile-domain-tablist="true"',
        'data-r7-mobile-domain-ui="subtab-like"',
        'data-r7-mobile-responsive-overflow-fix="true"',
        'data-r7-sidebar-protruding-toggle-tab="true"',
        'data-r7-sidebar-protruding-button="toggle"',
        'data-r7-sidebar-protruding-button="logout"',
        '[data-r7-cdb-layout-row="summary"]',
        '[data-r7-zone-selector] { display:flex !important;',
        '[data-r7-zone-card] { flex:0 0 min(220px,82vw) !important;',
        '[data-r7-domain-subtab] { flex:0 0 auto !important;',
    ):
        assert marker in source
    for forbidden in (
        'data-r7-sidebar-logout-fallback-href="/auth/authorize"',
        'panel._r7LogoutHref() !== \'/auth/authorize\'',
        '<a href="${this._r7LogoutHref()}" data-r7-mobile-logout-button="true"',
        'data-r7-mobile-domain-tab-ui="icon-tile"',
    ):
        assert forbidden not in source


def test_r7_136_render_logout_dispatches_ha_event_and_mobile_does_not_render_link_logout():
    script = """
      let classSet = new Set();
      let assignedUrl = '';
      let logoutEvents = 0;
      const makeStorage = (entries) => {
        const data = new Map(entries);
        return { _data:data, get length(){ return data.size; }, key(i){ return [...data.keys()][i]; }, removeItem(k){ data.delete(k); } };
      };
      globalThis.localStorage = makeStorage([['hassTokens','x'], ['refresh_token','x'], ['keep','safe']]);
      globalThis.sessionStorage = makeStorage([['access_token','x']]);
      globalThis.location = { assign(url){ assignedUrl = url; } };
      globalThis.CustomEvent = class { constructor(type, options){ this.type=type; this.options=options; } };
      globalThis.MutationObserver = class { constructor(fn){ this.fn = fn; } observe(){} };
      globalThis.document = {
        body: { classList: { add(c){ classSet.add(c); }, remove(c){ classSet.delete(c); }, contains(c){ return classSet.has(c); }, toggle(c, enabled){ if (enabled) classSet.add(c); else classSet.delete(c); } } },
        getElementById(){ return null; },
        createElement(){ return { id: '', textContent: '', setAttribute(){}, appendChild(){} }; },
        head: { appendChild(){} },
        querySelectorAll(){ return []; }
      };
      globalThis.HTMLElement = class {
        constructor(){ this.innerHTML=''; this.style={ setProperty(k,v){ this[k]=v; } }; this._attrs={}; }
        setAttribute(k,v){ this._attrs[k]=String(v); }
        getAttribute(k){ return this._attrs[k]; }
        querySelectorAll(){ return []; }
        querySelector(){ return null; }
        addEventListener(){}
        dispatchEvent(event){ if (event.type === 'hass-logout') logoutEvents += 1; return true; }
      };
      globalThis.customElements = { _items:new Map(), get(n){return this._items.get(n)}, define(n,c){this._items.set(n,c)} };
      const mod = await import(__REBUILD__);
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = { user: { name:'서원 임', is_admin:true, green_smart_role:'admin' }, callApi: async () => ({ actorRole:'admin', zones: [] }) };
      panel._homeContext = { actorRole:'admin', zones: [] };
      panel.render();
      const html = panel.innerHTML;
      const required = [
        'data-r7-mobile-account-presentation="text-name-role"',
        'data-r7-mobile-account-text="true"',
        'data-r7-mobile-user-name',
        'data-r7-mobile-user-role',
        '<button type="button" data-r7-mobile-logout-button="true"',
        'data-r7-mobile-domain-tab-ui="subtab-top-navbar"',
        'data-r7-mobile-domain-tablist="true"',
        'data-r7-mobile-responsive-overflow-fix="true"',
        'data-r7-sidebar-protruding-button="logout"',
        '[data-r7-zone-selector] { display:flex !important;',
        '[data-r7-cdb-layout-row="summary"]',
      ];
      const missing = required.filter((needle) => !html.includes(needle));
      const forbidden = ['href="/auth/authorize"', 'data-r7-sidebar-logout-fallback-href="/auth/authorize"', '<a href="/" data-r7-mobile-logout-button="true"'].filter((needle) => html.includes(needle));
      if (missing.length || forbidden.length) { console.error(JSON.stringify({missing, forbidden})); process.exit(1); }
      panel._performR7HaLogout();
      if (logoutEvents !== 1) { console.error(JSON.stringify({logoutEvents})); process.exit(2); }
      if (assignedUrl !== '') { console.error(JSON.stringify({assignedUrl})); process.exit(3); }
      if (localStorage._data.has('hassTokens') || localStorage._data.has('refresh_token') || sessionStorage._data.has('access_token')) { console.error('auth leftovers'); process.exit(4); }
      if (!localStorage._data.has('keep')) { console.error('unrelated key removed'); process.exit(5); }
      console.log(JSON.stringify({ok:true}));
    """.replace("__REBUILD__", repr(str(REBUILD_PANEL)))
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_136_logout_fallback_uses_root_not_invalid_authorize_when_event_unavailable():
    script = """
      let assignedUrl = '';
      globalThis.localStorage = { get length(){ return 0; }, key(){ return null; }, removeItem(){} };
      globalThis.sessionStorage = { get length(){ return 0; }, key(){ return null; }, removeItem(){} };
      globalThis.location = { assign(url){ assignedUrl = url; } };
      globalThis.document = { body: { classList: { add(){}, remove(){}, toggle(){} } } };
      globalThis.HTMLElement = class { constructor(){this.innerHTML='';this.style={};this._attrs={};} setAttribute(k,v){this._attrs[k]=v} getAttribute(k){return this._attrs[k]} querySelectorAll(){return[]} querySelector(){return null} addEventListener(){} dispatchEvent(){ return false; } };
      globalThis.customElements = { _items:new Map(), get(n){return this._items.get(n)}, define(n,c){this._items.set(n,c)} };
      const mod = await import(__REBUILD__);
      const panel = new mod.GreenSmartRebuildPanel();
      if (panel._r7LogoutHref() !== '/') { console.error('bad fallback'); process.exit(1); }
      panel._performR7HaLogout();
      if (assignedUrl !== '/') { console.error(JSON.stringify({assignedUrl})); process.exit(2); }
      console.log(JSON.stringify({ok:true}));
    """.replace("__REBUILD__", repr(str(REBUILD_PANEL)))
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
