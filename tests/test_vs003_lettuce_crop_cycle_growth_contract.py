from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "custom_components" / "green_smart" / "db.py"
VIEWS = ROOT / "custom_components" / "green_smart" / "crop_views.py"
INIT = ROOT / "custom_components" / "green_smart" / "__init__.py"
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
MANIFEST = ROOT / "custom_components" / "green_smart" / "manifest.json"
README = ROOT / "docs" / "master" / "README.md"
INTERFACE = ROOT / "docs" / "master" / "02-interface-spec.md"
DBDOC = ROOT / "docs" / "master" / "03-database-schema.md"
WORKFLOW = ROOT / "docs" / "master" / "04-workflow-diagrams.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_vs003_version_surfaces_are_current():
    panel = _read(PANEL)
    manifest = _read(MANIFEST)
    docs = _read(README) + _read(INTERFACE) + _read(DBDOC) + _read(WORKFLOW)

    assert '"version": "1.14.50"' in manifest
    assert 'const VERSION = "1.14.50"' in panel
    assert "v1.14.50" in panel[:200]
    assert "기준 버전: `v1.14.50`" in docs


def test_vs003_backend_persists_lettuce_crop_cycle_and_growth_metrics_contract():
    db = _read(DB)
    views = _read(VIEWS)
    init = _read(INIT)

    for marker in (
        "CREATE TABLE IF NOT EXISTS crop_seasons",
        "CREATE TABLE IF NOT EXISTS growth_surveys",
        "crop_type VARCHAR(50) NOT NULL DEFAULT 'other'",
        "metrics_json TEXT NULL",
        "idx_growth_surveys_season",
    ):
        assert marker in db

    for marker in (
        "CropSeasonsView",
        "CropGrowthListView",
        'url  = "/api/green_smart/crop/seasons"',
        'url  = "/api/green_smart/crop/seasons/{season_id}/growth"',
        "_vs003_lettuce_crop_cycle_payload",
        "_vs003_lettuce_growth_metrics_payload",
        "crop_cycle_id",
        "growth_survey_id",
        "lettuce",
        "L-Index",
        "leafLength",
        "leafWidth",
        "freshWeight",
        "metrics_json",
    ):
        assert marker in views

    assert "CropSeasonsView" in init
    assert "CropGrowthListView" in init


def test_vs003_panel_has_lettuce_crop_cycle_and_growth_operator_markers():
    panel = _read(PANEL)

    for marker in (
        "data-vs003-lettuce-crop-cycle-card",
        "data-vs003-lettuce-crop-cycle-submit",
        "data-vs003-lettuce-growth-survey-card",
        "data-vs003-lettuce-growth-submit",
        "data-vs003-lettuce-l-index-fields",
        "VS-003 상추 작기 등록",
        "VS-003 상추 생육조사 입력",
        "leafLength",
        "leafWidth",
        "freshWeight",
        "L-Index",
        "metrics_json",
        "green_smart/crop/seasons",
        "green_smart/crop/seasons/${this._activeSeasonId}/growth",
    ):
        assert marker in panel


def test_vs003_docs_define_vertical_slice_contract():
    docs = _read(README) + "\n" + _read(INTERFACE) + "\n" + _read(DBDOC) + "\n" + _read(WORKFLOW)

    for marker in (
        "VS-003 상추 작기 등록 및 생육조사 입력",
        "crop_cycle",
        "crop_seasons",
        "growth_surveys",
        "metrics_json",
        "lettuce",
        "L-Index",
        "leafLength",
        "leafWidth",
        "freshWeight",
        "farm_staff",
        "POST | `/api/green_smart/crop/seasons`",
        "GET/POST | `/api/green_smart/crop/seasons/{crop_cycle_id}/growth`",
    ):
        assert marker in docs
