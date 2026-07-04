from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CROP = ROOT / "custom_components" / "green_smart" / "crop_views.py"
INIT = ROOT / "custom_components" / "green_smart" / "__init__.py"
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
MANIFEST = ROOT / "custom_components" / "green_smart" / "manifest.json"
CENTRAL = ROOT / "custom_components" / "green_smart" / "central_views.py"
PLAN = ROOT / "docs" / "plans" / "2026-06-24-crop-model-slice-execution-plan.md"
DESIGN = ROOT / "docs" / "plans" / "2026-06-23-crop-model-design-decisions.md"


def test_v1966_dataset_export_documented_contract():
    plan = PLAN.read_text(encoding="utf-8")
    design = DESIGN.read_text(encoding="utf-8")
    for marker in (
        "Slice 7 — v1.9.66 Dataset Export and ML Readiness",
        "GET /api/green_smart/crop/seasons/{season_id}/training-dataset",
        "trainingDatasetVersion",
        "featureColumns",
        "labelColumns",
        "exportWarnings",
        "readiness.reasons",
        "Do not auto-replace production model",
    ):
        assert marker in plan
    for marker in (
        "Confirmed decision 15 — training dataset export remains offline/read-only",
        "trainingDatasetVersion",
        "feature_snapshot_id",
        "actual_validation_json",
        "no automatic ML deployment",
    ):
        assert marker in design


def test_v1966_backend_training_dataset_export_contract():
    crop = CROP.read_text(encoding="utf-8")
    for marker in (
        'CROP_TRAINING_DATASET_EXPORT_VERSION = "crop_training_dataset_export_v1"',
        "_crop_training_dataset_feature_columns(",
        "_crop_training_dataset_label_columns(",
        "_crop_training_dataset_readiness(",
        "_crop_training_dataset_rows(",
        "_crop_training_dataset_response(",
        "feature_snapshot_id AS featureSnapshotId",
        "feature_snapshot_json AS featureSnapshot",
        "prediction_json AS prediction",
        "actual_validation_json AS actualValidation",
        "validation_status AS validationStatus",
        '"trainingDatasetVersion"',
        '"featureColumns"',
        '"labelColumns"',
        '"exportWarnings"',
        '"no automatic ML deployment"',
    ):
        assert marker in crop


def test_v1966_training_dataset_api_registered_contract():
    crop = CROP.read_text(encoding="utf-8")
    init = INIT.read_text(encoding="utf-8")
    assert "class CropModelTrainingDatasetView(HomeAssistantView):" in crop
    assert 'url = "/api/green_smart/crop/seasons/{season_id}/training-dataset"' in crop
    assert 'name = "api:green_smart:crop:training_dataset"' in crop
    assert "CropModelTrainingDatasetView" in init
    assert "hass.http.register_view(CropModelTrainingDatasetView())" in init


def test_v1966_panel_training_dataset_export_read_only_contract():
    panel = PANEL.read_text(encoding="utf-8")
    for marker in (
        "data-crop-training-dataset-export-card",
        "학습 데이터셋 내보내기 준비도",
        "trainingDatasetVersion",
        "featureColumns",
        "labelColumns",
        "exportWarnings",
        "no automatic ML deployment",
        "자동 학습/배포 없음",
    ):
        assert marker in panel
    for forbidden in (
        "data-crop-training-dataset-train",
        "autoDeployCropMlModel",
        "replaceProductionModelFromDataset",
    ):
        assert forbidden not in panel


def test_v1966_version_markers_contract():
    manifest = MANIFEST.read_text(encoding="utf-8")
    panel = PANEL.read_text(encoding="utf-8")
    central = CENTRAL.read_text(encoding="utf-8")
    assert '"version": "1.14.69"' in manifest
    assert 'const VERSION = "1.14.69"' in panel
    assert "v1.14.69" in panel[:200]
    assert 'EDGE_VERSION = "1.9.96"' in central
