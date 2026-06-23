from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CROP = ROOT / "custom_components" / "green_smart" / "crop_views.py"
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
MANIFEST = ROOT / "custom_components" / "green_smart" / "manifest.json"
CENTRAL = ROOT / "custom_components" / "green_smart" / "central_views.py"
PLAN = ROOT / "docs" / "plans" / "2026-06-24-crop-model-slice-execution-plan.md"
DECISIONS = ROOT / "docs" / "plans" / "2026-06-23-crop-model-design-decisions.md"


def test_v1960_plan_documents_vertical_quality_disorder_slice():
    plan = PLAN.read_text(encoding="utf-8")
    for marker in (
        "Slice 2 — v1.9.60 Crop Quality/Disorder Survey Inputs",
        "Vertical-slice scope",
        "DB schema remains unchanged: quality/disorder metrics are stored only in `growth_surveys.metrics_json`",
        "featureSnapshot.growthSurvey.qualityDisorderSummary",
        "trainableBaseline.qualityDisorderSummary",
        "data-growth-quality-disorder-section",
    ):
        assert marker in plan


def test_v1960_backend_quality_disorder_metric_contract():
    crop = CROP.read_text(encoding="utf-8")
    for marker in (
        'CROP_QUALITY_DISORDER_METRICS_VERSION = "crop_quality_disorder_metrics_v1"',
        "CROP_QUALITY_DISORDER_METRIC_KEYS",
        "fruitSetRate",
        "fruitCrackingCount",
        "blossomEndRotCount",
        "leafCurlScore",
        "vigorScore",
        "spadValue",
        "tipburnScore",
        "boltingRiskScore",
        "leafColorScore",
        "marketableWeight",
        "outerLeafDamageScore",
        "_crop_quality_disorder_metrics_from_growth(",
        "qualityDisorderSummary",
        "riskFlags",
        "missingMetrics",
        "tomato_blossom_end_rot_observed",
        "lettuce_tipburn_risk_observed",
    ):
        assert marker in crop


def test_v1960_feature_snapshot_surfaces_quality_disorder_summary_contract():
    crop = CROP.read_text(encoding="utf-8")
    assert '"qualityDisorderSummary": qualityDisorderSummary' in crop
    assert "qualityDisorderSummary = _crop_quality_disorder_metrics_from_growth" in crop
    assert '"featureSources": featureSources or {}' in crop
    assert '"growthSurvey": {' in crop


def test_v1960_panel_quality_disorder_inputs_contract():
    panel = PANEL.read_text(encoding="utf-8")
    for marker in (
        "data-growth-quality-disorder-section",
        "품질/생리장해",
        "fruitSetRate",
        "fruitCrackingCount",
        "blossomEndRotCount",
        "leafCurlScore",
        "vigorScore",
        "tipburnScore",
        "boltingRiskScore",
        "leafColorScore",
        "marketableWeight",
        "outerLeafDamageScore",
        "qualityDisorderSummary",
    ):
        assert marker in panel

    legacy_block = panel[panel.index("_growthLegacyPayloadFromMetrics"): panel.index("_parseGrowthMetrics")]
    for quality_key in (
        "fruitSetRate",
        "fruitCrackingCount",
        "blossomEndRotCount",
        "leafCurlScore",
        "vigorScore",
        "tipburnScore",
        "boltingRiskScore",
        "leafColorScore",
        "marketableWeight",
        "outerLeafDamageScore",
    ):
        assert quality_key not in legacy_block


def test_v1960_docs_record_quality_disorder_decision():
    decisions = DECISIONS.read_text(encoding="utf-8")
    for marker in (
        "Confirmed decision 10 — crop quality/disorder survey metrics",
        "fruitSetRate",
        "blossomEndRotCount",
        "tipburnScore",
        "boltingRiskScore",
        "metrics_json only",
        "qualityDisorderSummary",
    ):
        assert marker in decisions


def test_v1960_version_markers_contract():
    manifest = MANIFEST.read_text(encoding="utf-8")
    panel = PANEL.read_text(encoding="utf-8")
    central = CENTRAL.read_text(encoding="utf-8")
    assert '"version": "1.9.60"' in manifest
    assert 'const VERSION = "1.9.60"' in panel
    assert "v1.9.60" in panel[:200]
    assert 'EDGE_VERSION = "1.9.60"' in central
