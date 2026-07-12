from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
PLAN = ROOT / "docs/plans/2026-07-10-mobile-subtab-freeze-fast-panels-plan.md"


def source() -> str:
    return PANEL.read_text()


def test_v1_15_09_mobile_fast_panel_mode_is_lazy_not_eager():
    text = source()
    assert 'const REBUILD_VERSION = "1.15.49"' in text
    assert 'this._r7MobileFastPanelMode = false;' in text
    assert 'data-r7-mobile-fast-panel-mode", "active-panel-only"' in text
    assert 'renderR7PanelsForDomain(domainKey, tabs, activeTab, renderer, fullRenderer) {' in text
    assert 'if (!this._r7MobileFastPanelMode) return fullRenderer();' in text
    assert 'const panelsFull = tabs.map' not in text
    assert 'const panelsFull = () => tabs.map' in text
    assert 'data-r7-mobile-active-panel-only="true"' in text
    assert 'data-r7-mobile-deferred-subtab-panel="${key}"' in text


def test_v1_15_09_subtab_click_does_not_bubble_and_scrolls_active_tab():
    text = source()
    assert '_scheduleR7MobileActiveSubtabScroll()' in text
    assert 'data-r7-mobile-subtab-route", "no-bubble-active-panel-only"' in text
    assert 'event.stopPropagation();' in text
    assert '{ passive: false }' in text
    assert 'data-r7-domain-subtabs-for="${domainKey}"' in text
    assert '[data-r7-domain-subtab-active="true"]' in text
    assert 'active.offsetLeft + active.offsetWidth - row.clientWidth' in text
    assert 'this._scheduleR7MobileActiveSubtabScroll();' in text


def test_v1_15_09_plan_documents_subtab_freeze_root_cause():
    plan = PLAN.read_text()
    for marker in [
        '모바일 하위탭/도메인 전환 freeze 제거 계획',
        '하위탭 클릭은 여전히 모든 패널을 동기 렌더',
        '모바일 액션 전용 fast panel mode',
        'active subtab panel만 렌더',
        '설명 페이지 전환도 mobile fast mode',
    ]:
        assert marker in plan
