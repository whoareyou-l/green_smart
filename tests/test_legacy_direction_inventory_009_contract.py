from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INVENTORY = ROOT / "docs" / "rebuild" / "legacy-direction-inventory.md"
MASTER = ROOT / "docs" / "PROJECT_MASTER_PLAN.md"
MASTER_DB = ROOT / "docs" / "master" / "03-database-schema.md"
PRODUCT_PLAN = ROOT / "docs" / "plans" / "2026-06-28-green-smart-product-first-rebuild-plan.md"
MANIFEST = ROOT / "custom_components" / "green_smart" / "manifest.json"
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "rebuild" / "green-smart-rebuild-panel.js"

HISTORICAL_DOCS = [
    ROOT / "docs" / "design" / "data-model.md",
    ROOT / "docs" / "design" / "api-spec.md",
    ROOT / "docs" / "design" / "zone-scoped-control-settings.md",
    ROOT / "docs" / "design" / "zone-control-roadmap-and-data-model.md",
]


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_rs009_version_surfaces_are_v1128():
    assert '"version": "1.15.13"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.13"' in _read(PANEL)
    assert 'REBUILD_VERSION = "1.15.13"' in _read(REBUILD_PANEL)
    for path in (INVENTORY, MASTER, MASTER_DB, PRODUCT_PLAN):
        assert "v1.15.13" in _read(path)


def test_legacy_direction_inventory_exists_and_declares_boundaries():
    doc = _read(INVENTORY)
    required = (
        "# RS-009 Legacy Direction Inventory",
        "Status: active boundary contract",
        "legacy physical schema is adapter-only",
        "historical reference, not product direction",
        "current source of truth",
        "docs/master/03-database-schema.md",
        "docs/master/01-cba-ui-ux-spec.md",
        "docs/master/02-interface-spec.md",
        "Green Smart Legacy panel",
        "rebuild panel only for new product slices",
    )
    for marker in required:
        assert marker in doc


def test_inventory_classifies_p0_p1_p2_legacy_areas():
    doc = _read(INVENTORY)
    for marker in (
        "P0 — Historical design data/API docs",
        "P0 — Backend route/API naming compatibility",
        "P1 — Legacy frontend panel state/API calls",
        "P1 — RBAC permission naming compatibility",
        "P2 — Old phase/MVP/legacy transition language",
        "docs/design/data-model.md",
        "docs/design/api-spec.md",
        "docs/design/zone-scoped-control-settings.md",
        "docs/design/zone-control-roadmap-and-data-model.md",
        "custom_components/green_smart/repositories/crop_repo.py",
        "custom_components/green_smart/crop_views.py",
        "custom_components/green_smart/zone_control_views.py",
        "custom_components/green_smart/panel/green-smart-panel.js",
    ):
        assert marker in doc


def test_historical_design_docs_have_status_marker_and_source_of_truth():
    for path in HISTORICAL_DOCS:
        doc = _read(path)
        header = "\n".join(doc.splitlines()[:25])
        assert "Status: historical/adapter reference" in header
        assert "Do not use as product direction" in header
        assert "Current source of truth:" in header
        assert "docs/master/03-database-schema.md" in header or "docs/master/02-interface-spec.md" in header


def test_master_plan_links_legacy_inventory():
    master = _read(MASTER)
    product_plan = _read(PRODUCT_PLAN)
    for doc in (master, product_plan):
        assert "docs/rebuild/legacy-direction-inventory.md" in doc
        assert "legacy direction inventory" in doc


def test_inventory_forbids_frontend_legacy_direction_copy_but_allows_adapter_inventory():
    doc = _read(INVENTORY)
    rebuild = _read(REBUILD_PANEL)
    forbidden_frontend = (
        "레거시를 참고하되",
        "기존 UI/기능은 참고 자료입니다",
        "Legacy UI/features are reference only.",
        "Start from blank page/scaffold.",
    )
    for marker in forbidden_frontend:
        assert marker not in rebuild
    for marker in (
        "adapter-only code may contain legacy names",
        "legacy names must not leak into new product API/docs/frontend direction",
        "No production migration in RS-009",
    ):
        assert marker in doc
