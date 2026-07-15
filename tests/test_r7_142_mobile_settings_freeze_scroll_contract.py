from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
PLAN = ROOT / "docs/plans/2026-07-10-mobile-settings-freeze-domain-scroll-plan.md"


def source() -> str:
    return PANEL.read_text()


def test_v1_15_08_mobile_settings_uses_dedicated_internal_action():
    text = source()
    assert 'const REBUILD_VERSION = "1.15.60"' in text
    assert 'data-r7-mobile-settings-action="open-settings-domain"' in text
    assert 'data-r7-mobile-route-mode="dedicated-internal-anchor-hash-cache"' in text
    assert '<a href="#settings-admin" role="button" data-r7-mobile-settings-button="true"' in text
    assert '_openR7SettingsDomainFromMobile()' in text
    assert '_handleR7SettingsHashRoute(source = "hashchange")' in text
    assert 'return this._openR7SettingsDomainFromCache(`hash-${source}`);' in text
    assert 'this._activeR7Domain = "settings-admin"' in text


def test_v1_15_08_mobile_settings_fast_landing_defers_heavy_settings_panels():
    text = source()
    assert 'this._r7MobileSettingsFastLanding = true;' in text
    assert 'data-r7-mobile-settings-fast-landing="true"' in text
    assert 'data-r7-mobile-settings-heavy-panels-deferred="true"' in text
    assert '즉시 표시' in text
    assert 'if (domain === "settings-admin") this._r7MobileSettingsFastLanding = false;' in text
    assert ': this.renderR7PanelsForDomain("settings-admin", tabs, activeTab, (key) => this.renderR7SettingsAdminSubtabPanel(key, activeTab), panelsFull);' in text


def test_v1_15_08_mobile_active_domain_button_aligns_to_right_edge():
    text = source()
    assert 'data-r7-mobile-active-domain-scroll-align="right-edge"' in text
    assert '_scheduleR7MobileActiveDomainButtonScroll()' in text
    assert '[data-r7-mobile-domain-button="true"][data-r7-sidebar-active="true"]' in text
    assert 'const targetLeft = Math.max(0, active.offsetLeft + active.offsetWidth - row.clientWidth);' in text
    assert 'row.scrollLeft = targetLeft;' in text
    assert 'row.scrollTo?.({ left: targetLeft, behavior: "auto" });' in text
    assert 'data-r7-mobile-active-domain-scroll-left' in text
    assert 'this._scheduleR7MobileActiveDomainButtonScroll();' in text


def test_v1_15_08_plan_documents_root_cause_and_fix():
    plan = PLAN.read_text()
    for marker in [
        '모바일 설정 버튼 freeze',
        'inactive 패널까지 즉시 렌더',
        '모바일 설정 버튼을 전용 action으로 분리',
        'active 도메인 버튼 우측 정렬',
    ]:
        assert marker in plan
