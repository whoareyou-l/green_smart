from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT / "docs" / "rebuild" / "db-schema-rationalization-plan.md"
PRODUCT_PLAN = ROOT / "docs" / "plans" / "2026-06-28-green-smart-product-first-rebuild-plan.md"
MASTER = ROOT / "docs" / "PROJECT_MASTER_PLAN.md"
MASTER_DB = ROOT / "docs" / "master" / "03-database-schema.md"
MANIFEST = ROOT / "custom_components" / "green_smart" / "manifest.json"
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
DB = ROOT / "custom_components" / "green_smart" / "db.py"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r4_version_surfaces_are_v1114():
    assert '"version": "1.11.9"' in _read(MANIFEST)
    assert 'const VERSION = "1.11.9"' in _read(PANEL)
    assert "v1.11.9" in _read(PLAN)
    assert "v1.11.9" in _read(PRODUCT_PLAN)
    assert "v1.11.9" in _read(MASTER)
    assert "v1.11.9" in _read(MASTER_DB)


def test_r4_physical_schema_still_uses_current_names_and_no_crop_cycles_table():
    db = _read(DB)
    plan = _read(PLAN)
    assert "CREATE TABLE IF NOT EXISTS crop_seasons" in db
    assert "crop_season_id INT NOT NULL" in db
    assert "season_id INT NOT NULL" in db
    assert "CREATE TABLE IF NOT EXISTS crop_cycles" not in db
    assert "RENAME TABLE crop_seasons" not in db
    assert "RENAME COLUMN crop_season_id" not in db
    assert "DROP TABLE crop_seasons" not in db
    for marker in (
        "`crop_seasons` table rename | 금지",
        "`crop_season_id` column rename | 금지",
        "`season_id` record column rename | 금지",
        "prod DB 접속/변경 | 금지",
    ):
        assert marker in plan


def test_r4_canonical_vocabulary_and_alias_mapping_are_documented():
    plan = _read(PLAN)
    for marker in (
        "`crop_cycle`",
        "`crop_season`",
        "`crop_cycle_id`",
        "`crop_season_id`, `season_id`",
        "`farm_id`",
        "`greenhouse_id`",
        "crop_cycle_id alias of crop_season_id",
        "farm_id + crop_cycle_id + zone_id + domain",
        "farm_id + crop_season_id + zone_id + domain",
    ):
        assert marker in plan


def test_r4_api_compatibility_and_alias_conflict_policy_are_documented():
    plan = _read(PLAN)
    for marker in (
        "/api/green_smart/crop/seasons",
        "/api/green_smart/crop/seasons/{season_id}/growth",
        "/api/green_smart/zones/control-settings?crop_season_id=...",
        "기존 request는 `crop_season_id`를 계속 받는다",
        "신규 service/repository DTO는 `crop_cycle_id`를 표준 필드로 사용해도 된다",
        "adapter layer는 `crop_cycle_id`와 `crop_season_id`를 normalize할 수 있다",
        "400 alias_conflict",
        "response는 migration 전까지 기존 field를 유지",
        "path segment `{season_id}`는 실제 route compatibility 때문에 유지한다",
        "normalize_crop_cycle_id",
    ):
        assert marker in plan


def test_r4_migration_gate_blocks_physical_rename_until_explicit_approval():
    plan = _read(PLAN)
    for marker in (
        "No physical rename from crop_seasons/crop_season_id/season_id to crop_cycles/crop_cycle_id before explicit migration approval.",
        "prod DB backup/restore rehearsal 완료",
        "migration SQL + rollback SQL 작성",
        "dev stack에서 migration rehearsal 완료",
        "virtual HA/device smoke 완료",
        "사용자 명시 승인",
        "M0 | alias DTO/service normalization only",
        "M5 | old column/table deprecation",
    ):
        assert marker in plan


def test_r4_master_db_doc_contains_implementation_compatibility_note():
    master_db = _read(MASTER_DB)
    product_plan = _read(PRODUCT_PLAN)
    master = _read(MASTER)
    for marker in (
        "R4 implementation compatibility",
        "현재 물리 DB는 `crop_seasons`, `crop_season_id`, crop record의 `season_id`를 유지한다",
        "`crop_cycle`/`crop_cycle_id`는 제품/API canonical alias",
        "명시 승인 전까지 실제 rename/migration은 금지",
        "docs/rebuild/db-schema-rationalization-plan.md",
    ):
        assert marker in master_db
    assert "상세 산출물은 `docs/rebuild/db-schema-rationalization-plan.md`" in product_plan
    assert "docs/rebuild/db-schema-rationalization-plan.md" in master


def test_r4_abort_rules_protect_routes_responses_and_prod_db():
    plan = _read(PLAN)
    for marker in (
        "`CREATE TABLE crop_cycles`가 필요해지는 경우",
        "`ALTER TABLE ... RENAME`이 필요해지는 경우",
        "prod DB 접속/수정이 필요한 경우",
        "response에서 기존 `crop_season_id`/`season_id` field 제거가 필요한 경우",
        "route path의 `{season_id}`를 `{crop_cycle_id}`로 바꾸려는 경우",
        "migration/backfill/dual-write가 필요한 경우",
    ):
        assert marker in plan
