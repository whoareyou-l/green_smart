from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CROP = ROOT / "custom_components" / "green_smart" / "crop_views.py"
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
GROWTH_MODAL = ROOT / "custom_components" / "green_smart" / "panel" / "domains" / "crop" / "crop-growth-modal.js"
MANIFEST = ROOT / "custom_components" / "green_smart" / "manifest.json"
CENTRAL = ROOT / "custom_components" / "green_smart" / "central_views.py"
PLAN = ROOT / "docs" / "plans" / "2026-06-24-crop-model-slice-execution-plan.md"
DESIGN = ROOT / "docs" / "plans" / "2026-06-23-crop-model-design-decisions.md"

TOMATO_KEYS = (
    "fruitSetRate",
    "fruitCrackingCount",
    "blossomEndRotCount",
    "leafCurlScore",
    "vigorScore",
    "spadValue",
)
LETTUCE_KEYS = (
    "tipburnScore",
    "boltingRiskScore",
    "leafColorScore",
    "spadValue",
    "marketableWeight",
    "outerLeafDamageScore",
)


def test_v1960_vertical_slice_is_documented_before_code_contract():
    plan = PLAN.read_text(encoding="utf-8")
    design = DESIGN.read_text(encoding="utf-8")
    for marker in (
        "Slice 2 — v1.9.61 Crop Quality/Disorder Survey Inputs",
        "Vertical-slice scope",
        "metrics_json only",
        "featureSnapshot.growthSurvey.qualityDisorderSummary",
        "trainableBaseline.qualityDisorderSummary",
    ):
        assert marker in plan
    for marker in (
        "Confirmed decision 10 — crop quality/disorder survey metrics",
        "Tomato quality/disorder metrics stored in `metrics_json only`",
        "Lettuce quality/disorder metrics stored in `metrics_json only`",
        "qualityDisorderSummary",
    ):
        assert marker in design


def test_v1960_backend_quality_disorder_metrics_contract():
    crop = CROP.read_text(encoding="utf-8")
    for marker in (
        'CROP_QUALITY_DISORDER_METRICS_VERSION = "crop_quality_disorder_metrics_v1"',
        "CROP_QUALITY_DISORDER_METRIC_KEYS",
        "_crop_quality_disorder_metrics_from_growth(",
        "qualityDisorderSummary",
        "riskFlags",
        "missingMetrics",
        "tomato_blossom_end_rot_observed",
        "tomato_fruit_cracking_observed",
        "lettuce_tipburn_risk_observed",
        "lettuce_bolting_risk_observed",
    ):
        assert marker in crop
    for key in TOMATO_KEYS + LETTUCE_KEYS:
        assert key in crop


def test_v1960_quality_disorder_metrics_do_not_overload_legacy_columns_contract():
    crop = CROP.read_text(encoding="utf-8")
    legacy_fn_start = crop.index("def _growth_legacy_payload_from_metrics")
    legacy_fn_end = crop.index("def _crop_quality_disorder_metrics_from_growth")
    legacy_fn = crop[legacy_fn_start:legacy_fn_end]
    for key in TOMATO_KEYS + LETTUCE_KEYS:
        assert key not in legacy_fn
    assert "metrics_json" in crop
    assert "_normalize_growth_metrics" in crop


def test_v1960_feature_snapshot_exposes_quality_disorder_contract():
    crop = CROP.read_text(encoding="utf-8")
    for marker in (
        '"qualityDisorderSummary": qualityDisorderSummary',
        '"growthSurvey": {',
        '"source": "growth_surveys.metrics_json"',
        'featureSnapshot.update({',
        'trainableBaseline["qualityDisorderSummary"]',
        '"qualityDisorderSummary": cropModel["trainableBaseline"].get("qualityDisorderSummary")',
    ):
        assert marker in crop


def test_v1960_panel_quality_disorder_inputs_and_summary_contract():
    panel = PANEL.read_text(encoding="utf-8")
    growth_modal = GROWTH_MODAL.read_text(encoding="utf-8")
    frontend = panel + "\n" + growth_modal
    for marker in (
        "qualityDisorderFields",
        "data-growth-quality-disorder-section",
        "품질/생리장해 입력",
        "qualityDisorderSummary",
        "품질/장해 요약",
        "riskFlags",
    ):
        assert marker in frontend
    for key in TOMATO_KEYS + LETTUCE_KEYS:
        assert key in frontend


def test_v1960_version_markers_contract():
    manifest = MANIFEST.read_text(encoding="utf-8")
    panel = PANEL.read_text(encoding="utf-8")
    central = CENTRAL.read_text(encoding="utf-8")
    assert '"version": "1.12.43"' in manifest
    assert 'const VERSION = "1.12.43"' in panel
    assert "v1.12.43" in panel[:200]
    assert 'EDGE_VERSION = "1.9.96"' in central
