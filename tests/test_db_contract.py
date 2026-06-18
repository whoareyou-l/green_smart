import ast
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "custom_components" / "green_smart" / "db.py"


def _module() -> ast.Module:
    return ast.parse(DB.read_text(encoding="utf-8"), filename=str(DB))


def test_db_cfg_reads_only_expected_environment_variables_with_safe_defaults():
    source = DB.read_text(encoding="utf-8")

    assert 'os.environ.get("DB_HOST", "127.0.0.1")' in source
    assert 'os.environ.get("DB_PORT", "3306")' in source
    assert 'os.environ.get("DB_USER", "gs_user")' in source
    assert 'os.environ.get("DB_PASSWORD", "")' in source
    assert 'os.environ.get("DB_NAME", "green_smart")' in source


def test_db_pool_uses_utf8mb4_autocommit_and_bounded_pool_size():
    source = DB.read_text(encoding="utf-8")

    assert 'charset="utf8mb4"' in source
    assert "autocommit=True" in source
    assert "minsize=2" in source
    assert "maxsize=10" in source


def test_db_query_helpers_convert_isoformat_values_and_return_single_row_or_none():
    source = DB.read_text(encoding="utf-8")

    assert "v.isoformat() if hasattr(v, \"isoformat\") else v" in source
    assert "return rows[0] if rows else None" in source


def test_db_close_pool_resets_singleton_after_wait_closed():
    module = _module()
    close_pool = next(node for node in module.body if isinstance(node, ast.AsyncFunctionDef) and node.name == "close_pool")
    source = ast.unparse(close_pool)

    assert "_pool.close()" in source
    assert "await _pool.wait_closed()" in source
    assert "_pool = None" in source


def test_db_bootstrap_creates_crop_management_tables_and_default_zone():
    source = DB.read_text(encoding="utf-8")

    assert "async def ensure_schema" in source
    for table in (
        "zones",
        "crop_seasons",
        "growth_surveys",
        "pest_surveys",
        "control_records",
        "control_pesticides",
    ):
        assert f"CREATE TABLE IF NOT EXISTS {table}" in source
    assert "INSERT IGNORE INTO zones" in source


def test_integration_setup_runs_db_schema_bootstrap_before_crop_views():
    init_source = (ROOT / "custom_components" / "green_smart" / "__init__.py").read_text(encoding="utf-8")

    assert "from .db import ensure_schema" in init_source
    assert "await ensure_schema(hass)" in init_source
    assert init_source.index("await ensure_schema(hass)") < init_source.index("hass.http.register_view(CropSeasonsView())")


def test_control_record_save_requires_active_season_before_posting():
    panel = (ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js").read_text(encoding="utf-8")
    save_section = panel.split('inner.querySelector("#c-save")?.addEventListener("click"', 1)[1].split("const controlBody", 1)[0]

    assert "!this._activeSeasonId" in save_section
    assert "작기를 먼저 등록" in save_section
    assert "green_smart/crop/seasons/${this._activeSeasonId}/control" in panel


def test_crop_season_post_ensures_zone_and_get_keeps_zone_id_name():
    source = (ROOT / "custom_components" / "green_smart" / "crop_views.py").read_text(encoding="utf-8")

    assert "async def _ensure_zone" in source
    assert "INSERT IGNORE INTO zones" in source
    assert "await _ensure_zone(hass, zone_id_int)" in source
    assert "LEFT JOIN zones" in source
    assert "s.zone_id AS zoneId" in source
    assert "COALESCE(z.name, CONCAT(s.zone_id, '구역')) AS zoneName" in source
