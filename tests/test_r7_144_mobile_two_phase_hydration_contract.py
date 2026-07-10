from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
PLAN = ROOT / "docs/plans/2026-07-10-mobile-two-phase-panel-hydration-plan.md"


def source() -> str:
    return PANEL.read_text()


def test_v1_15_10_mobile_click_uses_two_phase_panel_hydration():
    text = source()
    assert 'const REBUILD_VERSION = "1.15.11"' in text
    assert '_requestR7MobilePanelHydration(domainKey, tabKey)' in text
    assert 'data-r7-mobile-panel-hydration", "pending"' in text
    assert 'requestAnimationFrame' in text and 'setTimeout(hydrate, 120)' in text
    assert 'setTimeout(hydrate, 650)' in text
    assert 'data-r7-mobile-panel-hydration", "hydrated"' in text
    assert 'this._requestR7MobilePanelHydration(nextDomain, activeTab);' in text
    assert 'this._requestR7MobilePanelHydration(domain, tabKey);' in text


def test_v1_15_10_mobile_pending_panel_renders_placeholder_not_heavy_body():
    text = source()
    assert 'renderR7MobilePanelHydrationPlaceholder(domainKey, activeKey)' in text
    assert 'data-r7-mobile-panel-placeholder="true"' in text
    assert 'data-r7-mobile-panel-hydration="pending"' in text
    assert '화면을 전환하는 중입니다' in text
    assert 'const hydrationPending = this._r7MobilePanelHydration?.pending' in text
    assert 'hydrationPending ? this.renderR7MobilePanelHydrationPlaceholder(domainKey, activeKey)' in text
    assert 'data-r7-mobile-panel-hydration-state="${hydrationPending ? "pending" : "hydrated"}"' in text


def test_v1_15_10_plan_documents_two_phase_hydration():
    plan = PLAN.read_text()
    for marker in [
        '모바일 2단계 패널 hydrate 계획',
        'DOM 삽입/레이아웃 비용',
        'lightweight placeholder',
        'requestAnimationFrame',
        '두 번째 render',
    ]:
        assert marker in plan
