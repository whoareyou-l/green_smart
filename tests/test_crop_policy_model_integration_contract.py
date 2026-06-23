from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CROP_VIEWS = ROOT / "custom_components" / "green_smart" / "crop_views.py"
DOC = ROOT / "docs" / "design" / "current-backend-api-db-ha-contract.md"


def _source(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_crop_views_reads_active_center_crop_policy_cache():
    source = _source(CROP_VIEWS)
    for marker in (
        "CENTER_CROP_POLICY_INTEGRATION_VERSION",
        "async def _active_center_crop_policy",
        "edge_crop_policy_cache",
        "policy_json",
        "valid_until",
        "stale_after_seconds",
        "fallback_after_seconds",
        "fresh",
        "stale_usable",
        "stale_restricted",
        "fallback_safe",
        "rejected",
        "centerCropPolicy",
    ):
        assert marker in source


def test_crop_model_snapshot_includes_center_policy_inputs_without_control_scope():
    source = _source(CROP_VIEWS)
    for marker in (
        "centerCropPolicy: dict | None = None",
        "cropPolicyAppliedToModel",
        "cropPolicyAppliedToInterlock",
        "cropModelVariables",
        "cropInterlockVariables",
        "recommendationHints",
        "policyStatus",
        "applyMode",
        "recommend_only",
        "center_policy_stale_restricted",
        "center_policy_fallback_safe",
        "center_policy_rejected",
        "center_policy_recommend_only",
    ):
        assert marker in source
    assert "pidHints" not in source
    assert "ventilation" not in source
    assert "device_pid" not in source


def test_crop_interlock_uses_center_policy_as_recommendation_only():
    source = _source(CROP_VIEWS)
    for marker in (
        "centerCropPolicy: dict | None = None",
        "center_policy_stale_restricted",
        "center_policy_fallback_safe",
        "center_policy_recommend_only",
        "center_policy_recommendation_hint",
        "approvalGateStatus",
        "blockAutoExecution",
        "recommend_only",
    ):
        assert marker in source
    assert "Center policy may not unblock crop interlock" in source


def test_docs_define_crop_policy_model_integration_boundary():
    doc = _source(DOC)
    for marker in (
        "Crop policy model/interlock integration",
        "centerCropPolicy",
        "cropPolicyAppliedToModel",
        "cropPolicyAppliedToInterlock",
        "Center policy may not unblock crop interlock",
        "recommend_only",
        "현재 범위는 Crop이며 환경/관수/장치 PID 적용은 제외",
    ):
        assert marker in doc
