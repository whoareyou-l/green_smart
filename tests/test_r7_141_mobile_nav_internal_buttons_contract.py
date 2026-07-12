from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"


def source() -> str:
    return PANEL.read_text()


def test_v1_15_07_mobile_hides_pc_external_protruding_controls():
    text = source()
    assert 'const REBUILD_VERSION = "1.15.42"' in text
    assert '[data-r7-sidebar-external-controls-shell="true"], [data-r7-sidebar-external-controls-shell="true"] * { display:none !important; pointer-events:none !important; visibility:hidden !important; }' in text
    assert 'data-r7-sidebar-external-controls-shell="true"' in text


def test_v1_15_07_mobile_domain_buttons_are_internal_and_settings_has_hash_fallback():
    text = source()
    assert 'data-r7-mobile-route-mode="internal-button-no-hash"' in text
    assert '<button type="button" data-r7-mobile-domain-button="true"' in text
    assert '<a href="#settings-admin" role="button" data-r7-mobile-settings-button="true"' in text
    assert 'data-r7-mobile-route-mode="dedicated-internal-anchor-hash-cache"' in text
    assert '<a href="#${group.target}" data-r7-mobile-domain-button="true"' not in text


def test_v1_15_07_mobile_navigation_uses_internal_router_without_hash_scroll():
    text = source()
    assert '_activateR7DomainFromNavigation(domainKey)' in text
    assert 'this.setAttribute?.("data-r7-mobile-domain-transition", "instant-internal-button")' in text
    assert 'event.stopPropagation();' in text
    assert 'const target = link.dataset.r7SidebarTarget;' in text
    assert 'if (target === "settings-admin") this._openR7SettingsDomainFromMobile();' in text
    assert 'else this._activateR7DomainFromNavigation(target);' in text
    assert 'addEventListener("click", (event) => {' in text
