from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
PLAN = ROOT / "docs/plans/2026-07-10-mobile-immediate-panel-render-plan.md"


def source() -> str:
    return PANEL.read_text()


def test_v1_15_12_mobile_fast_mode_renders_active_panel_immediately():
    text = source()
    assert 'const REBUILD_VERSION = "1.15.58"' in text
    assert 'data-r7-mobile-immediate-panel-render", "true"' in text
    assert 'data-r7-mobile-panel-hydration", "not-used-immediate"' in text
    assert 'const activePanel = activeKey ? renderer(activeKey) : "";' in text
    assert 'data-r7-mobile-panel-hydration-state="not-used-immediate"' in text
    assert 'data-r7-mobile-deferred-subtab-panel="${key}"' in text


def test_v1_15_12_mobile_waiting_placeholder_removed_from_served_source():
    text = source()
    assert '화면을 전환하는 중입니다' not in text
    assert '선택한 탭을 먼저 표시하고 내용을 이어서 불러옵니다' not in text
    assert 'data-r7-mobile-panel-placeholder="true"' not in text
    assert 'setTimeout(hydrate' not in text
    assert 'timer-watchdog' not in text


def test_v1_15_12_plan_documents_immediate_user_preferred_behavior():
    plan = PLAN.read_text()
    for marker in ['모바일 즉시 패널 렌더 계획', '바로바로 실제 화면', 'placeholder를 렌더하지 않는다', '화면을 전환하는 중입니다']:
        assert marker in plan
