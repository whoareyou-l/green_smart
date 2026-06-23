from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CROP_VIEWS = ROOT / "custom_components" / "green_smart" / "crop_views.py"
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
INIT = ROOT / "custom_components" / "green_smart" / "__init__.py"
DOC = ROOT / "docs" / "design" / "current-backend-api-db-ha-contract.md"
UI_DOC = ROOT / "docs" / "design" / "current-ui-design-and-navigation.md"


def _source(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_crop_policy_notification_backend_contract():
    source = _source(CROP_VIEWS)
    init_source = _source(INIT)
    for marker in (
        "CENTER_CROP_POLICY_NOTIFICATION_VERSION",
        "CROP_POLICY_NOTIFICATION_SETTINGS_KEY",
        "CROP_POLICY_NOTIFICATION_STATE_KEY",
        "_crop_policy_notification_id",
        "_crop_policy_notification_enabled",
        "_maybe_send_crop_policy_notification",
        "_clear_crop_policy_notification",
        "_run_crop_policy_notification_tick",
        "CropPolicyNotificationSettingsView",
        "CropPolicyNotificationDismissView",
        "persistent_notification",
        "create",
        "dismiss",
        "crop_policy_notification_sent",
        "crop_policy_notification_deduped",
        "crop_policy_notification_dismissed",
        "fallback_safe",
        "rejected",
        "stale_restricted",
    ):
        assert marker in source
    assert "_setup_crop_policy_notification_scheduler" in init_source
    assert "_teardown_crop_policy_notification_scheduler" in init_source
    assert "crop_policy_notification_scheduler_started" in init_source
    assert "CENTER_CROP_POLICY_ALERT_STATUSES" in source
    assert "data-center-crop-policy-execute" not in _source(PANEL)


def test_crop_policy_notification_panel_contract():
    panel = _source(PANEL)
    report_card = panel.split("  _renderGrowthReportCard()", 1)[1].split("  _renderCenterCropInterlockAnalyticsCard()", 1)[0]
    for marker in (
        "_cropPolicyNotificationEnabled",
        "_setCropPolicyNotificationEnabled",
        "_dismissCropPolicyNotification",
        "data-center-crop-policy-notification-toggle",
        "data-center-crop-policy-notification-dismiss",
        "data-center-crop-policy-notification-state",
        "작물 정책 알림",
        "알림 사용",
        "알림 해제",
        "green_smart_crop_policy_notifications",
        "crop-policy/notification-settings",
        "crop-policy/notification-dismiss",
    ):
        assert marker in panel or marker in report_card
    assert "data-center-crop-policy-execute" not in panel
    assert "centerCropPolicyAllowExecution" not in panel


def test_crop_policy_notification_docs_contract():
    doc = _source(DOC)
    ui_doc = _source(UI_DOC)
    for marker in (
        "Crop policy notification opt-in",
        "persistent_notification.create",
        "persistent_notification.dismiss",
        "fallback_safe / rejected",
        "stale_restricted는 설정에 따라 알림",
        "상태가 fresh/stale_usable로 회복되면 dismiss",
    ):
        assert marker in doc
    for marker in (
        "v1.9.56 Crop policy notification opt-in",
        "data-center-crop-policy-notification-toggle",
        "data-center-crop-policy-notification-dismiss",
        "작물 정책 알림",
        "실행 버튼 없음",
    ):
        assert marker in ui_doc
