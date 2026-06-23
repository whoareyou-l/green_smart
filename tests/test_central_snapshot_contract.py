from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEPLOY = ROOT.parent / "green_smart-deploy"
CENTRAL_MAIN = DEPLOY / "central" / "api" / "app" / "main.py"
CENTRAL_MIGRATION = DEPLOY / "central" / "api" / "app" / "migrations" / "002_crop_interlock_snapshots.sql"
CENTRAL_API = ROOT / "custom_components" / "green_smart" / "central_api.py"
CENTRAL_VIEWS = ROOT / "custom_components" / "green_smart" / "central_views.py"
INIT = ROOT / "custom_components" / "green_smart" / "__init__.py"
DESIGN = ROOT / "docs" / "plans" / "2026-06-23-crop-safety-interlock-real-use-design.md"


def _source(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_center_crop_interlock_snapshot_migration_contract():
    assert CENTRAL_MIGRATION.exists()
    sql = _source(CENTRAL_MIGRATION)
    for marker in (
        "CREATE TABLE IF NOT EXISTS crop_interlock_snapshots",
        "tenant_id uuid NOT NULL REFERENCES tenants(id)",
        "site_id uuid NOT NULL REFERENCES sites(id)",
        "installation_id uuid NOT NULL REFERENCES installations(id)",
        "farm_id bigint NOT NULL",
        "season_id bigint NOT NULL",
        "zone_id bigint",
        "stage_diagnosis jsonb NOT NULL DEFAULT '{}'::jsonb",
        "crop_interlock jsonb NOT NULL DEFAULT '{}'::jsonb",
        "approval_audit jsonb NOT NULL DEFAULT '[]'::jsonb",
        "edge_versions jsonb NOT NULL DEFAULT '{}'::jsonb",
        "snapshot_hash text NOT NULL",
        "UNIQUE (installation_id, farm_id, season_id, snapshot_hash)",
        "idx_crop_interlock_snapshots_lookup",
    ):
        assert marker in sql


def test_center_crop_interlock_snapshot_api_contract():
    source = _source(CENTRAL_MAIN)
    for marker in (
        "class CropInterlockSnapshotRequest(BaseModel)",
        "class CropInterlockSnapshotResponse(BaseModel)",
        '@app.post("/edge/snapshots/crop-interlock")',
        '@app.get("/edge/snapshots/crop-interlock/latest")',
        "authorize_access_token",
        "crop_interlock_snapshots",
        "stage_diagnosis",
        "crop_interlock",
        "approval_audit",
        "snapshot_hash",
        "crop_interlock_snapshot.received",
        "not real-time safety decision",
    ):
        assert marker in source


def test_edge_crop_interlock_snapshot_sync_contract():
    central_api = _source(CENTRAL_API)
    central_views = _source(CENTRAL_VIEWS)
    init_source = _source(INIT)
    design = _source(DESIGN)

    for marker in (
        "CROP_INTERLOCK_SNAPSHOT_PATH",
        "async def sync_crop_interlock_snapshot",
        '"/edge/snapshots/crop-interlock"',
        '"stageDiagnosis"',
        '"cropInterlock"',
        '"approvalAudit"',
    ):
        assert marker in central_api

    for marker in (
        "class CentralCropInterlockSnapshotSyncView",
        'url = "/api/green_smart/central/crop/interlock-snapshot/sync"',
        "sync_crop_interlock_snapshot",
        "_growth_report_response",
        "ensure_access_token",
    ):
        assert marker in central_views

    assert "CentralCropInterlockSnapshotSyncView" in init_source
    assert "hass.http.register_view(CentralCropInterlockSnapshotSyncView())" in init_source
    assert "POST /edge/snapshots/crop-interlock" in design
    assert "센터 API는 snapshot 수집/분석 주체이며 실시간 safety/interlock 최종 판단자가 아니다" in design
