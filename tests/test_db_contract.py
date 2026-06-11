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
