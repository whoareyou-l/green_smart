from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEPLOY = ROOT.parent / "green_smart-deploy"
CENTRAL_MAIN = DEPLOY / "central" / "api" / "app" / "main.py"
CENTRAL_MIGRATION = DEPLOY / "central" / "api" / "app" / "migrations" / "004_crop_policy_bundles.sql"
DB = ROOT / "custom_components" / "green_smart" / "db.py"
CENTRAL_API = ROOT / "custom_components" / "green_smart" / "central_api.py"
CENTRAL_VIEWS = ROOT / "custom_components" / "green_smart" / "central_views.py"
INIT = ROOT / "custom_components" / "green_smart" / "__init__.py"
DOC = ROOT / "docs" / "design" / "current-backend-api-db-ha-contract.md"


def _source(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_center_crop_policy_bundle_migration_contract():
    assert CENTRAL_MIGRATION.exists()
    sql = _source(CENTRAL_MIGRATION)
    for marker in (
        "CREATE TABLE IF NOT EXISTS crop_policy_bundles",
        "policy_version text NOT NULL",
        "crop_model_variables jsonb NOT NULL DEFAULT '{}'::jsonb",
        "crop_interlock_variables jsonb NOT NULL DEFAULT '{}'::jsonb",
        "recommendation_hints jsonb NOT NULL DEFAULT '{}'::jsonb",
        "apply_mode text NOT NULL DEFAULT 'recommend_only'",
        "valid_until timestamptz NOT NULL",
        "stale_after_seconds integer NOT NULL DEFAULT 600",
        "fallback_after_seconds integer NOT NULL DEFAULT 1800",
        "idx_crop_policy_bundles_latest",
        "UNIQUE (installation_id, farm_id, season_id, zone_id, policy_version)",
    ):
        assert marker in sql
    assert "pid" not in sql.lower()
    assert "vent" not in sql.lower()
    assert "irrigation" not in sql.lower()


def test_center_crop_policy_bundle_api_contract():
    source = _source(CENTRAL_MAIN)
    for marker in (
        "class CropPolicyBundleRecalculateRequest(BaseModel)",
        "class CropPolicyBundleResponse(BaseModel)",
        '@app.post("/analytics/crop/policy/recalculate")',
        '@app.get("/edge/policies/crop/latest")',
        "crop_policy_bundles",
        "crop_model_variables",
        "crop_interlock_variables",
        "recommendation_hints",
        "apply_mode",
        "recommend_only",
        "stale_after_seconds",
        "fallback_after_seconds",
        "crop_policy.recalculated",
        "Center calculates crop policy candidates; Edge validates/caches/applies",
    ):
        assert marker in source
    assert "pidHints" not in source
    assert "ventilation" not in source
    assert "irrigation" not in source


def test_edge_crop_policy_cache_schema_and_client_contract():
    db = _source(DB)
    api = _source(CENTRAL_API)
    views = _source(CENTRAL_VIEWS)
    for marker in (
        "CREATE TABLE IF NOT EXISTS edge_crop_policy_cache",
        "policy_version VARCHAR(128) NOT NULL",
        "policy_json JSON NOT NULL",
        "status VARCHAR(32) NOT NULL DEFAULT 'fresh'",
        "received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
        "validated_at TIMESTAMP NULL",
        "valid_until TIMESTAMP NULL",
        "stale_after_seconds INT NOT NULL DEFAULT 600",
        "fallback_after_seconds INT NOT NULL DEFAULT 1800",
        "last_error TEXT NULL",
        "idx_edge_crop_policy_cache_lookup",
    ):
        assert marker in db
    for marker in (
        "CROP_POLICY_RECALCULATE_PATH",
        "CROP_POLICY_LATEST_PATH",
        "async def recalculate_crop_policy_bundle",
        "async def get_latest_crop_policy_bundle",
        "async def pull_and_cache_crop_policy_bundle",
        "_validate_crop_policy_bundle",
        "fresh",
        "stale_usable",
        "stale_restricted",
        "fallback_safe",
        "rejected",
    ):
        assert marker in api or marker in views
    assert "pidHints" not in api + views
    assert "ventilation" not in api + views
    assert "irrigation" not in api + views


def test_crop_policy_pull_scheduler_and_docs_contract():
    init_source = _source(INIT)
    doc = _source(DOC)
    for marker in (
        "CENTER_CROP_POLICY_PULL_INTERVAL_SECONDS = 300",
        "_setup_center_crop_policy_pull_scheduler",
        "_teardown_center_crop_policy_pull_scheduler",
        "_run_center_crop_policy_pull_tick",
        "unsub_center_crop_policy_pull",
        "timedelta(seconds=CENTER_CROP_POLICY_PULL_INTERVAL_SECONDS)",
    ):
        assert marker in init_source
    for marker in (
        "Crop policy bundle",
        "Center calculates crop policy candidates; Edge validates/caches/applies",
        "crop_model_variables",
        "crop_interlock_variables",
        "recommendation_hints",
        "apply_mode = recommend_only",
        "fresh → stale_usable → stale_restricted → fallback_safe",
        "현재 범위는 Crop이며 환경/관수/장치 PID 적용은 제외",
    ):
        assert marker in doc
