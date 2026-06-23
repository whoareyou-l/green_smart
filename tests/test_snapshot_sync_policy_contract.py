from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INIT = ROOT / "custom_components" / "green_smart" / "__init__.py"
CENTRAL_VIEWS = ROOT / "custom_components" / "green_smart" / "central_views.py"
ZONE_VIEWS = ROOT / "custom_components" / "green_smart" / "zone_control_views.py"
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
DESIGN = ROOT / "docs" / "plans" / "2026-06-23-crop-safety-interlock-real-use-design.md"
BACKEND_DOC = ROOT / "docs" / "design" / "current-backend-api-db-ha-contract.md"


def _source(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_edge_realtime_and_center_snapshot_sync_policy_contract():
    init_source = _source(INIT)
    central_source = _source(CENTRAL_VIEWS)
    zone_source = _source(ZONE_VIEWS)

    assert "SAFETY_GUARD_WATCHDOG_INTERVAL_SECONDS = 60" in zone_source
    for marker in (
        "EDGE_REALTIME_EVALUATION_INTERVAL_SECONDS = 60",
        "CENTER_CROP_INTERLOCK_SNAPSHOT_SYNC_INTERVAL_SECONDS = 300",
        "_setup_center_crop_interlock_snapshot_sync_scheduler",
        "_teardown_center_crop_interlock_snapshot_sync_scheduler",
        "_run_center_crop_interlock_snapshot_sync_tick",
        "unsub_center_crop_interlock_snapshot_sync",
        "timedelta(seconds=CENTER_CROP_INTERLOCK_SNAPSHOT_SYNC_INTERVAL_SECONDS)",
        "await _setup_center_crop_interlock_snapshot_sync_scheduler(hass)",
        "_teardown_center_crop_interlock_snapshot_sync_scheduler(hass)",
    ):
        assert marker in init_source

    for marker in (
        "async def sync_crop_interlock_snapshot_for_season",
        "trigger: str = \"scheduled_5m\"",
        "_growth_report_response",
        "sync_crop_interlock_snapshot",
        "edgeRealtimeIntervalSeconds",
        "centerSnapshotSyncIntervalSeconds",
        "last_center_crop_interlock_snapshot_sync",
    ):
        assert marker in central_source or marker in init_source


def test_panel_event_based_snapshot_sync_contract():
    source = _source(PANEL)
    for marker in (
        "_syncCenterCropInterlockSnapshot",
        'green_smart/central/crop/interlock-snapshot/sync',
        "\"growth_report_refresh\"",
        "\"approval_saved\"",
        "\"manual_panel\"",
        "data-center-crop-interlock-snapshot-sync",
        "센터 snapshot 동기화",
    ):
        assert marker in source


def test_snapshot_sync_policy_docs_contract():
    combined = _source(DESIGN) + "\n" + _source(BACKEND_DOC)
    for marker in (
        "Edge 실시간 판단/감시 기준: 1분",
        "Center snapshot/analytics sync 기준: 5분",
        "이벤트 발생 시 즉시 sync",
        "CENTER_CROP_INTERLOCK_SNAPSHOT_SYNC_INTERVAL_SECONDS = 300",
        "EDGE_REALTIME_EVALUATION_INTERVAL_SECONDS = 60",
        "Center는 push 수신",
        "Edge가 주기/이벤트 기반 전송",
    ):
        assert marker in combined
