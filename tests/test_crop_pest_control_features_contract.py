from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "custom_components" / "green_smart" / "db.py"
CROP = ROOT / "custom_components" / "green_smart" / "crop_views.py"
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
MANIFEST = ROOT / "custom_components" / "green_smart" / "manifest.json"
CENTRAL = ROOT / "custom_components" / "green_smart" / "central_views.py"
PLAN = ROOT / "docs" / "plans" / "2026-06-24-crop-model-slice-execution-plan.md"
DESIGN = ROOT / "docs" / "plans" / "2026-06-23-crop-model-design-decisions.md"


def test_v1964_pest_vertical_slice_documented_contract():
    plan = PLAN.read_text(encoding="utf-8")
    design = DESIGN.read_text(encoding="utf-8")
    for marker in (
        "Slice 5 — v1.9.64 Pest/Control/PHI/REI Feature Depth",
        "Vertical-slice scope",
        "control_pesticides.phi_days INT NULL",
        "control_pesticides.rei_hours INT NULL",
        "crop_pest_control_features_v1",
        "data-crop-pest-control-features-card",
        "missingControlAfterHighRiskFlag",
        "reviewGuidance",
    ):
        assert marker in plan
    for marker in (
        "Confirmed decision 13 — pest/control PHI/REI feature depth",
        "Persist PHI/REI",
        "phi_days",
        "rei_hours",
        "read-only model evidence",
        "do not grant pesticide/control execution authority",
    ):
        assert marker in design


def test_v1964_db_persists_phi_rei_contract():
    db = DB.read_text(encoding="utf-8")
    for marker in (
        "phi_days INT NULL",
        "rei_hours INT NULL",
        '_ensure_column(cur, "control_pesticides", "phi_days"',
        '_ensure_column(cur, "control_pesticides", "rei_hours"',
    ):
        assert marker in db


def test_v1964_backend_pest_control_feature_contract():
    crop = CROP.read_text(encoding="utf-8")
    for marker in (
        'CROP_PEST_CONTROL_FEATURES_VERSION = "crop_pest_control_features_v1"',
        "_crop_pest_number(",
        "_crop_pest_control_derived_features(",
        "_pest_control_feature_summary(",
        "recentPestSeverityTrend",
        "maxSeverity7d",
        "controlFreshnessDays",
        "plsNonCompliantCount",
        "mixForbiddenCount",
        "mixUnknownCount",
        "phiRiskFlag",
        "reiRiskFlag",
        "missingControlAfterHighRiskFlag",
        "reviewGuidance",
        "staleReasons",
        "sourceStatus",
        "ready",
        "partial",
        "missing",
        "stale",
    ):
        assert marker in crop


def test_v1964_pest_sql_reads_existing_tables_and_phi_rei_contract():
    crop = CROP.read_text(encoding="utf-8")
    body = crop[crop.index("async def _pest_control_feature_summary"):crop.index("async def _operation_history_feature_summary")]
    for marker in (
        "FROM pest_surveys",
        "FROM control_records",
        "control_pesticides",
        "severity",
        "MAX(severity)",
        "AVG(severity)",
        "SUM(CASE WHEN p.pls_compliant = 0 THEN 1 ELSE 0 END) AS plsNonCompliantCount",
        "SUM(CASE WHEN p.mix_check_status = 'forbidden' THEN 1 ELSE 0 END) AS mixForbiddenCount",
        "SUM(CASE WHEN p.mix_check_status = 'unknown' THEN 1 ELSE 0 END) AS mixUnknownCount",
        "MIN(p.phi_days) AS minPhiDays",
        "MAX(p.rei_hours) AS maxReiHours",
        "DATEDIFF(CURDATE(), MAX(r.control_date)) AS controlFreshnessDays",
    ):
        assert marker in body
    for forbidden in ("execute", "spray", "service.call", "pesticide_execute"):
        assert forbidden not in body.lower()


def test_v1964_phi_rei_roundtrip_in_control_api_contract():
    crop = CROP.read_text(encoding="utf-8")
    for marker in (
        "p.phi_days AS phiDays",
        "p.rei_hours AS reiHours",
        '"phiDays": row["phiDays"]',
        '"reiHours": row["reiHours"]',
        "phi_days, rei_hours",
        'p.get("phiDays")',
        'p.get("reiHours")',
    ):
        assert marker in crop


def test_v1964_pest_summary_exposed_to_feature_snapshot_and_growth_report_contract():
    crop = CROP.read_text(encoding="utf-8")
    for marker in (
        '"pestControlSummary7d": pest_control',
        '"pestControlSummary7d": featureSources.get("pestControlSummary7d") or {}',
        'json.dumps(featureSources.get("pestControlSummary7d") or {}',
        '"riskFlags"',
        '"features"',
    ):
        assert marker in crop


def test_v1964_panel_pest_feature_evidence_is_read_only_contract():
    panel = PANEL.read_text(encoding="utf-8")
    for marker in (
        "data-crop-pest-control-features-card",
        "병해/방제 feature",
        "pestControlSummary7d",
        "recentPestSeverityTrend",
        "controlFreshnessDays",
        "phiRiskFlag",
        "reiRiskFlag",
        "missingControlAfterHighRiskFlag",
        "reviewGuidance",
    ):
        assert marker in panel
    for forbidden in (
        "data-crop-pest-control-features-execute",
        "pestControlFeatureAllowExecution",
        "executePesticideFromCropModel",
    ):
        assert forbidden not in panel


def test_v1964_version_markers_contract():
    manifest = MANIFEST.read_text(encoding="utf-8")
    panel = PANEL.read_text(encoding="utf-8")
    central = CENTRAL.read_text(encoding="utf-8")
    assert '"version": "1.10.28"' in manifest
    assert 'const VERSION = "1.10.28"' in panel
    assert "v1.10.28" in panel[:200]
    assert 'EDGE_VERSION = "1.9.96"' in central
