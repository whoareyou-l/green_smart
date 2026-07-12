from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"


def source() -> str:
    return PANEL.read_text()


def test_v1_15_12_mobile_click_uses_immediate_panel_render_instead_of_placeholder():
    text = source()
    assert 'const REBUILD_VERSION = "1.15.42"' in text
    assert '_requestR7MobilePanelHydration(domainKey, tabKey)' in text
    assert 'data-r7-mobile-panel-hydration", "not-used-immediate"' in text
    assert 'data-r7-mobile-immediate-panel-render' in text
    assert 'data-r7-mobile-panel-hydration-state="not-used-immediate"' in text


def test_v1_15_12_mobile_placeholder_body_removed_so_user_sees_real_panel():
    text = source()
    assert 'renderR7MobilePanelHydrationPlaceholder(domainKey, activeKey)' not in text
    assert 'data-r7-mobile-panel-placeholder="true"' not in text
    assert '화면을 전환하는 중입니다' not in text
    assert 'const activePanel = activeKey ? renderer(activeKey) : "";' in text
