from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REBUILD_PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "rebuild" / "green-smart-rebuild-panel.js"
LEGACY_DOC = ROOT / "docs" / "rebuild" / "legacy-reference-inventory.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_rs001_rebuild_panel_declares_crop_centered_shell_sections():
    source = _read(REBUILD_PANEL)
    for marker in (
        "REBUILD_PAGES",
        'key: "crop-status"',
        'key: "growth-goal"',
        'key: "influence-map"',
        'key: "recommend-act"',
        "data-rebuild-shell-nav",
        "data-rebuild-shell-main",
    ):
        assert marker in source


def test_rs001_rebuild_shell_avoids_legacy_domain_primary_nav():
    source = _read(REBUILD_PANEL)
    nav_section = source.split("const REBUILD_PAGES", 1)[1].split("]);", 1)[0]
    for marker in (
        'key: "home"',
        'key: "crop"',
        'key: "environment"',
        'key: "irrigation"',
        'key: "device"',
        'key: "admin"',
        "작물 업무 흐름",
        "환경 제어 화면",
        "관수 화면",
        "장치 운영 화면",
        "사용자/권한/시스템",
    ):
        assert marker not in nav_section


def test_rs001_rebuild_panel_exports_pages_for_future_new_modules():
    source = _read(REBUILD_PANEL)
    assert "REBUILD_PAGES" in source
    assert "REBUILD_ZONE_CONTEXTS" in source
    assert "REBUILD_STAGE_DETAILS" in source
    assert "export { GreenSmartRebuildPanel, REBUILD_ELEMENT_NAME, REBUILD_PAGES, REBUILD_VERSION, REBUILD_ZONE_CONTEXTS" in source
    assert "Object.freeze" in source


def test_rs001_legacy_doc_points_to_blank_shell_as_new_start_surface():
    doc = _read(LEGACY_DOC)
    for marker in (
        "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js",
        "blank scaffold",
        "must intentionally avoid importing legacy crop/environment/admin page modules",
    ):
        assert marker in doc
