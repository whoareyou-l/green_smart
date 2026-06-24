from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
MANIFEST = ROOT / "custom_components" / "green_smart" / "manifest.json"
CENTRAL = ROOT / "custom_components" / "green_smart" / "central_views.py"
UI_DOC = ROOT / "docs" / "design" / "current-ui-design-and-navigation.md"
MASTER = ROOT / "docs" / "PROJECT_MASTER_PLAN.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _home_section(panel: str) -> str:
    return panel.split("  _renderHomeActionSummaryCard(kpi = {})", 1)[1].split("  _renderHomeStatusPopup", 1)[0]


def test_v1983_home_today_tasks_are_derived_from_real_crop_and_safety_state():
    panel = _read(PANEL)
    home = _home_section(panel)

    for marker in (
        "_homeTodayTaskItems()",
        "_homeRequiredActionItems()",
        "_homeSafetyActiveEventCount()",
        "data-home-today-task-list",
        "data-home-required-action-list",
        "data-home-task-source=\"growth\"",
        "data-home-task-source=\"pest\"",
        "data-home-task-source=\"control\"",
        "data-home-action-source=\"safety\"",
        "data-home-action-source=\"pest\"",
        "data-home-action-source=\"control\"",
    ):
        assert marker in panel

    assert "작물 상태 확인 · 관수 상태 확인 · 장치 이상 여부 확인" not in home
    assert "알림 확인, 조치 완료 기록, 권한 내 장치 정지를 여기서 시작합니다." not in home
    assert "this._growthData" in panel
    assert "this._pestData" in panel
    assert "this._controlData" in panel
    assert "this._zoneSafetyGuardEventCache" in panel


def test_v1983_home_real_state_keeps_no_execution_boundary_and_version_docs():
    panel = _read(PANEL)
    manifest = _read(MANIFEST)
    central = _read(CENTRAL)
    ui_doc = _read(UI_DOC)
    master = _read(MASTER)

    assert '"version": "1.9.83"' in manifest
    assert 'const VERSION = "1.9.83"' in panel
    assert "v1.9.83" in panel[:200]
    assert 'EDGE_VERSION = "1.9.83"' in central
    assert "Home real-state tasks v1.9.83" in ui_doc
    assert "Home real-state tasks v1.9.83" in master

    for forbidden in (
        "data-home-execute-device",
        "homeAllowDeviceExecution",
        "data-home-auto-apply-control",
        "homeAutoSchedulePesticideApplication",
    ):
        assert forbidden not in panel
