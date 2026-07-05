from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
VIEWS = ROOT / "custom_components/green_smart/rebuild_settings_write_views.py"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_125_system_modal_rows_are_selectable_and_stateful():
    panel = _read(PANEL)
    for marker in (
        '_selectSettingsSystemUpdateTarget',
        '_selectSettingsSystemErrorScope',
        '_selectSettingsSystemCenterRow',
        'selectedTarget',
        'selectedScope',
        'selectedCenterId',
        'data-r7-settings-system-update-row-selected',
        'data-r7-settings-system-errors-row-selected',
        'data-r7-settings-system-center-row-selected',
        'data-r7-settings-system-update-list-item-button',
        'data-r7-settings-system-errors-list-item-button',
        'data-r7-settings-system-center-list-item-button',
    ):
        assert marker in panel


def test_r7_125_system_update_action_does_not_throw_failed_for_missing_entities():
    views = _read(VIEWS)
    for marker in (
        'try:',
        'except Exception as err:',
        '"state": "error"',
        '"message": str(err)',
        '"system-update-action-failed"',
    ):
        assert marker in views


def test_r7_125_center_list_has_negative_and_positive_actions_without_add_button():
    panel = _read(PANEL)
    for marker in (
        'data-r7-settings-system-center-delete-button',
        'data-r7-cdb-modal-action="negative"',
        'data-r7-cdb-negative-action="delete"',
        'data-r7-settings-system-center-auth-connect-button',
        'data-r7-cdb-modal-action="positive"',
        'data-r7-cdb-positive-action="edit"',
    ):
        assert marker in panel
    assert 'Center 연결 추가</button>' not in panel


def test_r7_125_action_card_summaries_render_in_body_between_header_and_button():
    panel = _read(PANEL)
    for marker in (
        'data-r7-settings-system-update-summary-body',
        'data-r7-settings-system-error-summary-body',
        'data-r7-settings-system-card-summary-row',
        'renderR7CdbButtonOneCard({ kind: "system-update-deferred"',
        'html: summaryHtml',
    ):
        assert marker in panel
