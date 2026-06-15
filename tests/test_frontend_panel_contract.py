from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FRONTEND_PANEL = ROOT / "custom_components" / "green_smart" / "frontend_panel.py"


def _source() -> str:
    return FRONTEND_PANEL.read_text(encoding="utf-8")


def test_panel_manifest_version_read_runs_in_executor_not_event_loop():
    source = _source()
    setup_section = source.split("async def async_setup_panel", 1)[1].split("async def _register_static_path", 1)[0]

    assert "async_add_executor_job(_get_panel_js_url)" in setup_section
    assert "panel_js_url = _get_panel_js_url()" not in setup_section
    assert "read_text" in source  # sync file read is allowed only inside executor target
