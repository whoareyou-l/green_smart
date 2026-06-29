from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LEGACY_DOC = ROOT / "docs" / "rebuild" / "legacy-reference-inventory.md"
REBUILD_PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "rebuild" / "green-smart-rebuild-panel.js"
LEGACY_PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_legacy_inventory_declares_reference_only_not_direction():
    doc = _read(LEGACY_DOC)
    for marker in (
        "LEGACY REFERENCE ONLY",
        "reference material only",
        "not be treated as",
        "the target architecture",
        "the next implementation direction",
        "v1.11.17 is not a from-scratch rebuild result",
        "Previously, Green Smart worked like this",
    ):
        assert marker in doc


def test_legacy_inventory_records_old_panel_as_legacy_evidence():
    doc = _read(LEGACY_DOC)
    assert "green-smart-panel.js" in doc
    assert "line count at v1.11.17: 9561" in doc
    assert "./domains/crop/crop-readonly.js" in doc
    assert "./domains/admin/admin-page.js" in doc


def test_from_scratch_rebuild_panel_exists_as_new_main_surface():
    source = _read(REBUILD_PANEL)
    for marker in (
        "green-smart-rebuild-panel",
        "data-rebuild-root",
        "data-rebuild-empty-shell",
        "작물 상태를 먼저 확인합니다",
        "오늘의 작물 운영을 먼저 확인합니다",
        "구역별 세부 정보는 각 단계 안에서",
    ):
        assert marker in source


def test_from_scratch_transition_rules_stay_in_docs_not_rendered_panel():
    source = _read(REBUILD_PANEL)
    doc = _read(LEGACY_DOC)
    for marker in (
        "Legacy UI/features are reference only.",
        "Start from blank page/scaffold.",
        "No legacy panel module imports.",
        "No production cutover without explicit approval.",
    ):
        assert marker not in source
        assert marker in doc


def test_from_scratch_rebuild_panel_does_not_import_legacy_modules():
    source = _read(REBUILD_PANEL)
    forbidden = (
        "./domains/crop/",
        "./domains/admin/admin-page.js",
        "renderAdminSystemPage",
        "./domains/crop/crop-readonly.js",
        "./domains/crop/crop-write-modal.js",
        "green-smart-panel.js",
        "_saveAdminRoleMapping",
    )
    for marker in forbidden:
        assert marker not in source


def test_legacy_panel_still_exists_but_is_not_the_rebuild_start_surface():
    legacy = _read(LEGACY_PANEL)
    rebuild = _read(REBUILD_PANEL)
    assert "Green Smart — Modern SaaS greenhouse dashboard" in legacy
    assert "green-smart-rebuild-panel" in rebuild
    # RS-003~RS-027 and R7-001~R7-020 add real CBA interactions, API loading, crop_cycle cards, assignment read models, read-only projections,
    # virtual runner contract/result adapters, the R7 manual-first sidebar shell, domain placeholders, settings/admin realignment, environment/irrigation/device details,
    # recommendation/automation detail, safety/history detail, domain-page routing, common visual UI, operations dashboard rewrite, shared domain visual frames,
    # and detail-card absorption for environment + irrigation while keeping the rebuild surface far below the legacy panel scale.
    assert len(rebuild.splitlines()) < 1700
