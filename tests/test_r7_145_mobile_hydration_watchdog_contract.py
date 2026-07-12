from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"


def source() -> str:
    return PANEL.read_text()


def test_v1_15_12_mobile_hydration_timers_removed_for_immediate_user_feedback():
    text = source()
    assert 'const REBUILD_VERSION = "1.15.40"' in text
    assert 'data-r7-mobile-immediate-panel-render", "true"' in text
    assert 'data-r7-mobile-panel-hydration", "not-used-immediate"' in text
    assert 'setTimeout(hydrate' not in text
    assert 'timer-watchdog' not in text
    assert 'requestedAt: Date.now()' not in text


def test_v1_15_12_request_hydration_is_safe_noop_for_backward_handlers():
    text = source()
    assert '_requestR7MobilePanelHydration(domainKey, tabKey)' in text
    assert 'this._r7MobilePanelHydration = null;' in text
    assert 'clearTimeout(this._r7MobilePanelHydrationTimer)' in text
    assert 'clearTimeout(this._r7MobilePanelHydrationWatchdog)' in text
    assert 'data-r7-mobile-immediate-panel-render", "true"' in text
