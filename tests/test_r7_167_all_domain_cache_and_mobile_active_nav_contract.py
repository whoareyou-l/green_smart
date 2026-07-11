from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"


def source() -> str:
    return PANEL.read_text()


def test_v1_15_33_all_domains_use_prewarmed_shell_cache_not_innerhtml_append():
    text = source()
    assert 'const REBUILD_VERSION = "1.15.36"' in text
    assert '_getOrCreateR7CachedDomainShell(domainKey)' in text
    assert '_attachR7CachedDomainShell(workspace, domainKey)' in text
    assert 'data-r7-all-domain-shell-cache-prewarm", "done"' in text
    assert 'R7_DETAIL_SUBPAGES.map((item) => item.key).filter((key) => this._getOrCreateR7CachedDomainShell(key))' in text
    block = text[text.index('  _patchR7MobileActiveDomainPage()'):text.index('  setR7DomainSubtab', text.index('  _patchR7MobileActiveDomainPage()'))]
    assert 'this._attachR7CachedDomainShell(workspace, this._activeR7Domain)' in block
    assert 'domain-shell-cache-show-hide' in block
    assert 'workspace.replaceChildren?.(document.createRange().createContextualFragment(this.renderR7ActiveDomainPage()))' in block
    assert 'workspace.innerHTML = this.renderR7ActiveDomainPage();' in block  # fallback only
    assert 'data-r7-mobile-domain-render-mode", "workspace-innerhtml-only"' not in block


def test_v1_15_33_domain_shell_cache_replaces_workspace_single_shell():
    text = source()
    start = text.index('  _attachR7CachedDomainShell(workspace, domainKey)')
    block = text[start:text.index('  _getOrCreateR7CachedSettingsDomainShell()', start)]
    assert 'workspace.replaceChildren?.(shell);' in block
    assert 'replace-children-single-domain-shell' in block
    assert 'persistent-dom-show-hide' in block
    assert 'hit-prewarmed' in block
    assert '_scheduleR7MobileFullSubtabHydration(domain, activeTab);' in block


def test_v1_15_33_mobile_top_domain_active_visual_sync_updates_attrs_and_inline_styles():
    text = source()
    start = text.index('  _syncR7MobileDomainActiveVisualState(activeDomain = this._activeR7Domain)')
    block = text[start:text.index('  _scheduleR7MobileActiveDomainButtonScroll()', start)]
    assert '[data-r7-mobile-domain-button="true"]' in block
    assert 'button.setAttribute("data-r7-sidebar-active", selected ? "true" : "false")' in block
    assert 'button.setAttribute("aria-selected", selected ? "true" : "false")' in block
    assert 'button.style.borderBottomColor = selected ? R7_GREEN_ACCENT : "transparent";' in block
    assert 'button.style.background = selected ? R7_GREEN_ACTIVE_BG : "transparent";' in block
    assert 'button.style.color = selected ? R7_GREEN_ACCENT : R7_GREEN_TEXT;' in block
    assert 'data-r7-mobile-domain-active-visual-sync' in block
    render_block = text[text.index('  render() {'):]
    assert 'this._syncR7MobileDomainActiveVisualState(this._activeR7Domain);' in render_block


def test_v1_15_33_mobile_active_tab_scroll_aligns_active_to_right_edge():
    text = source()
    start = text.index('  _scheduleR7MobileActiveDomainButtonScroll()')
    block = text[start:text.index('  _scheduleR7MobileActiveSubtabScroll()', start)]
    assert 'data-r7-mobile-domain-tablist="true"' in block
    assert 'data-r7-mobile-domain-button="true"][data-r7-sidebar-active="true"]' in block
    assert 'const targetLeft = Math.max(0, active.offsetLeft + active.offsetWidth - row.clientWidth);' in block
    assert 'row.scrollLeft = targetLeft;' in block
    assert 'behavior: "auto"' in block
    assert 'data-r7-mobile-active-domain-scroll-left' in block
