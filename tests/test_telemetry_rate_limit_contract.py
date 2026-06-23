from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEPLOY = ROOT.parent / "green_smart-deploy"
CENTRAL_MAIN = DEPLOY / "central" / "api" / "app" / "main.py"
CENTRAL_MIGRATION = DEPLOY / "central" / "api" / "app" / "migrations" / "003_environment_telemetry_rate_limits.sql"
CENTRAL_API = ROOT / "custom_components" / "green_smart" / "central_api.py"
CENTRAL_VIEWS = ROOT / "custom_components" / "green_smart" / "central_views.py"
INIT = ROOT / "custom_components" / "green_smart" / "__init__.py"
DOC = ROOT / "docs" / "design" / "current-backend-api-db-ha-contract.md"


def _source(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_center_environment_telemetry_migration_contract():
    assert CENTRAL_MIGRATION.exists()
    sql = _source(CENTRAL_MIGRATION)
    for marker in (
        "CREATE TABLE IF NOT EXISTS environment_telemetry_snapshots",
        "recorded_at timestamptz NOT NULL",
        "metrics jsonb NOT NULL DEFAULT '{}'::jsonb",
        "deltas jsonb NOT NULL DEFAULT '{}'::jsonb",
        "rate_limit_flags jsonb NOT NULL DEFAULT '[]'::jsonb",
        "CREATE TABLE IF NOT EXISTS rate_limit_events",
        "metric text NOT NULL",
        "window_seconds integer NOT NULL DEFAULT 60",
        "severity text NOT NULL DEFAULT 'warning'",
        "idx_environment_telemetry_lookup",
        "idx_rate_limit_events_lookup",
    ):
        assert marker in sql


def test_center_environment_telemetry_api_contract():
    source = _source(CENTRAL_MAIN)
    for marker in (
        "class EnvironmentTelemetrySnapshotRequest(BaseModel)",
        "class EnvironmentTelemetrySnapshotResponse(BaseModel)",
        "class EnvironmentTelemetrySummaryResponse(BaseModel)",
        '@app.post("/edge/telemetry/environment")',
        '@app.get("/analytics/environment/telemetry/summary")',
        "environment_telemetry_snapshots",
        "rate_limit_events",
        "environment_telemetry.received",
        "analytics/reporting only; edge remains real-time authority",
        "window_seconds",
        "rate_limit_flags",
    ):
        assert marker in source


def test_edge_environment_telemetry_sync_scheduler_contract():
    init_source = _source(INIT)
    central_api = _source(CENTRAL_API)
    central_views = _source(CENTRAL_VIEWS)
    for marker in (
        "EDGE_ENVIRONMENT_TELEMETRY_SYNC_INTERVAL_SECONDS = 60",
        "_setup_edge_environment_telemetry_sync_scheduler",
        "_teardown_edge_environment_telemetry_sync_scheduler",
        "_run_edge_environment_telemetry_sync_tick",
        "unsub_edge_environment_telemetry_sync",
        "timedelta(seconds=EDGE_ENVIRONMENT_TELEMETRY_SYNC_INTERVAL_SECONDS)",
        "await _setup_edge_environment_telemetry_sync_scheduler(hass)",
        "_teardown_edge_environment_telemetry_sync_scheduler(hass)",
    ):
        assert marker in init_source
    for marker in (
        "ENVIRONMENT_TELEMETRY_PATH",
        "async def sync_environment_telemetry",
        "async def sync_environment_telemetry_snapshot",
        "temperatureDelta1m",
        "humidityDelta1m",
        "rateLimitFlags",
        "trigger: str = \"scheduled_1m\"",
        "sensor_readings",
    ):
        assert marker in central_api or marker in central_views


def test_telemetry_policy_docs_contract():
    source = _source(DOC)
    for marker in (
        "Edge environment telemetry sync 기준: 1분",
        "POST /edge/telemetry/environment",
        "GET /analytics/environment/telemetry/summary",
        "environment_telemetry_snapshots",
        "rate_limit_events",
        "temperatureDelta1m",
        "humidityDelta1m",
        "1분 변화율",
        "Center model 입력용; Edge remains real-time authority",
    ):
        assert marker in source
