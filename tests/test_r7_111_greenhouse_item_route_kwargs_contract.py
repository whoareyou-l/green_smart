from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
VIEWS = ROOT / "custom_components/green_smart/rebuild_settings_write_views.py"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_111_version_surfaces_are_1_14_42():
    assert '"version": "1.14.57"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.57"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.57"' in _read(REBUILD_PANEL)


def test_r7_111_greenhouse_item_view_accepts_ha_route_kwargs_for_patch_and_delete():
    source = _read(VIEWS)
    assert "async def patch(self, request: web.Request, greenhouse_id=None)" in source
    assert "async def delete(self, request: web.Request, greenhouse_id=None)" in source


def test_r7_111_greenhouse_item_view_uses_route_kwarg_before_match_info_fallback():
    source = _read(VIEWS)
    patch_body = source[source.index("    async def patch"):source.index("    async def delete")]
    delete_body = source[source.index("    async def delete"):source.index("class RebuildSettingsZoneCreateView")]
    assert "greenhouse_id = int(greenhouse_id or request.match_info" in patch_body
    assert "greenhouse_id = int(greenhouse_id or request.match_info" in delete_body
    assert "unexpected keyword argument 'greenhouse_id'" not in source
