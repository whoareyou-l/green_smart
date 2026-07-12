from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
PLAN = ROOT / "docs/plans/2026-07-10-mobile-dom-patch-navigation-plan.md"


def source() -> str:
    return PANEL.read_text()


def test_v1_15_13_mobile_subtab_uses_panel_outerhtml_patch_before_full_render():
    text = source()
    assert 'const REBUILD_VERSION = "1.15.42"' in text
    assert '_patchR7MobileSubtabPanel(domain, tabKey)' in text
    assert 'data-r7-mobile-dom-patch-subtab", "true"' in text
    assert 'data-r7-mobile-subtab-render-mode", "light-first-paint-then-full-hydrate"' in text
    assert 'panelSection.innerHTML = this._renderR7MobileLightSubtabPanel(domain, tabKey);' in text
    assert 'if (mobileFast && this._patchR7MobileSubtabPanel(domain, tabKey)) return true;' in text


def test_v1_15_33_mobile_domain_uses_domain_shell_cache_before_fragment_fallback():
    text = source()
    assert '_patchR7MobileActiveDomainPage()' in text
    assert 'const workspace = this.querySelector?.("[data-r7-page-workspace]");' in text
    assert 'this._attachR7CachedDomainShell(workspace, this._activeR7Domain)' in text
    assert 'data-r7-mobile-domain-render-mode", "domain-shell-cache-show-hide"' in text
    assert 'workspace.replaceChildren?.(document.createRange().createContextualFragment(this.renderR7ActiveDomainPage()))' in text
    assert 'data-r7-mobile-domain-render-mode", "workspace-replace-fragment-fallback"' in text
    assert 'data-r7-mobile-dom-patch-domain", "true"' in text
    assert 'if (this._patchR7MobileActiveDomainPage()) return;' in text


def test_v1_15_13_partial_patch_rebinds_with_duplicate_listener_guards():
    text = source()
    assert '_bindR7PatchedInteractiveActions()' in text
    assert 'data-r7-subtab-bound' in text
    assert 'data-r7-domain-navigation-bound' in text
    assert 'if (button.getAttribute("data-r7-subtab-bound") === "true") return;' in text
    assert 'if (link.getAttribute("data-r7-domain-navigation-bound") === "true") return;' in text


def test_v1_15_13_plan_documents_dom_patch_navigation():
    plan = PLAN.read_text()
    for marker in ['모바일 DOM patch navigation 계획', 'this.render()`를 호출하지 않는다', 'outerHTML', 'workspace-innerhtml-only']:
        assert marker in plan
