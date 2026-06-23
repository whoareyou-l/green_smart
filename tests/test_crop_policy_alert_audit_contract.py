from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CROP_VIEWS = ROOT / "custom_components" / "green_smart" / "crop_views.py"
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
DB = ROOT / "custom_components" / "green_smart" / "db.py"
DOC = ROOT / "docs" / "design" / "current-backend-api-db-ha-contract.md"
UI_DOC = ROOT / "docs" / "design" / "current-ui-design-and-navigation.md"


def _source(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_crop_policy_alert_audit_backend_contract():
    source = _source(CROP_VIEWS)
    db = _source(DB)
    for marker in (
        "CENTER_CROP_POLICY_ALERT_VERSION",
        "CENTER_CROP_POLICY_ALERT_STATUSES",
        "_center_crop_policy_audit_key",
        "_record_center_crop_policy_status_audit",
        "crop_policy_status_change",
        "crop_policy_alert_audit_deduped",
        "INSERT INTO audit_logs",
        "edge_crop_policy_cache",
        "fallback_safe",
        "stale_restricted",
        "rejected",
        "auditLogged",
        "alertSeverity",
    ):
        assert marker in source
    assert "audit_logs" in db
    alert_section = source.split("async def _record_center_crop_policy_status_audit", 1)[1].split("def _crop_policy_notification_maps", 1)[0]
    assert "persistent_notification.create" not in alert_section
    assert "data-center-crop-policy-execute" not in _source(PANEL)


def test_crop_policy_alert_summary_panel_contract():
    panel = _source(PANEL)
    report_card = panel.split("  _renderGrowthReportCard()", 1)[1].split("  _renderCenterCropInterlockAnalyticsCard()", 1)[0]
    for marker in (
        "CENTER_CROP_POLICY_ALERT_STATUSES",
        "policyAlertActive",
        "policyAlertMessage",
        "data-center-crop-policy-alert-summary",
        "작물 정책 경고",
        "기록/알림 기준 상태",
        "stale_restricted",
        "fallback_safe",
        "rejected",
        "실행 버튼 없음",
    ):
        assert marker in report_card or marker in panel
    assert "data-center-crop-policy-execute" not in panel
    assert "centerCropPolicyAllowExecution" not in panel


def test_crop_policy_alert_audit_docs_contract():
    doc = _source(DOC)
    ui_doc = _source(UI_DOC)
    for marker in (
        "Crop policy alert/audit baseline",
        "crop_policy_status_change",
        "fallback_safe / stale_restricted / rejected",
        "중복 audit 방지",
        "persistent notification은 아직 기본 생성하지 않는다",
    ):
        assert marker in doc
    for marker in (
        "v1.9.56 Crop policy alert/audit",
        "data-center-crop-policy-alert-summary",
        "작물 정책 경고",
        "실행 버튼 없음",
    ):
        assert marker in ui_doc
