from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"


def source() -> str:
    return PANEL.read_text()


def test_v1_15_11_mobile_hydration_has_direct_timer_and_watchdog_fallback():
    text = source()
    assert 'const REBUILD_VERSION = "1.15.11"' in text
    assert 'data-r7-mobile-panel-hydration-fallback", "timer-watchdog"' in text
    assert 'this._r7MobilePanelHydrationTimer = setTimeout(hydrate, 120);' in text
    assert 'this._r7MobilePanelHydrationWatchdog = setTimeout(hydrate, 650);' in text
    assert 'globalThis.requestAnimationFrame?.(scheduleTimer)' in text
    assert 'catch (_error) { scheduleTimer(); }' in text


def test_v1_15_11_pending_placeholder_cannot_become_permanent_on_future_render():
    text = source()
    assert 'requestedAt: Date.now()' in text
    assert 'Date.now() - Number(this._r7MobilePanelHydration.requestedAt || 0) > 900' in text
    assert 'this._r7MobilePanelHydration = null;' in text
    assert 'data-r7-mobile-panel-hydration-state="${hydrationPending ? "pending" : "hydrated"}"' in text
