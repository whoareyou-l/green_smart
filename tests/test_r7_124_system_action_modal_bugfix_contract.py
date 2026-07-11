from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_124_system_action_buttons_have_distinct_handlers_and_center_list_modal():
    panel = _read(PANEL)
    for marker in (
        'data-r7-settings-system-update-deferred-button',
        'this._openSettingsSystemUpdateModal()',
        'data-r7-settings-system-db-api-error-log-button',
        'this._openSettingsSystemErrorsModal()',
        'data-r7-settings-system-center-auth-connect-button',
        'this._openSettingsSystemCenterConnectionModal()',
        'data-r7-settings-system-center-connection-list-button',
        'this._openSettingsSystemCenterListModal()',
        '_openSettingsSystemCenterListModal',
        'kind: "center-list"',
        'data-r7-settings-system-center-list-cda-modal',
        'data-r7-settings-system-center-list-panel',
        'data-r7-settings-system-center-detail-panel',
    ):
        assert marker in panel


def test_r7_124_system_common_modal_close_buttons_include_record_shell_x():
    panel = _read(PANEL)
    for marker in (
        'data-r7-record-modal-type="${modal.recordType}"',
        'data-r7-record-modal-close',
        'this._closeR7SettingsRecordModalFromButton(button)',
        '"system-center-connection": "system-action"',
        'this._closeSettingsDetailActionModal(closeKind || "all")',
        '[data-r7-settings-system-action-modal-close]',
    ):
        assert marker in panel


def test_r7_124_cards_show_real_action_summary_and_center_list_label():
    panel = _read(PANEL)
    for marker in (
        'const updateRows = [["Green Smart", system.gsUpdateStatus || "최신 확인 중"], ["HACS", system.hacsUpdateStatus || "최신 확인 중"], ["HA/DB", system.haDbUpdateStatus || "Update Agent 도입 후"]]',
        'rows: updateRows.map(([label, value]) => this._r7SettingsGreenhouseValueRow(label, value))',
        'buttonLabel: "업데이트 목록"',
        'const errorRows = [["DB", errorLabel(dbErrorCount)], ["Center", errorLabel(centerApiErrorCount)], ["Edge", errorLabel(edgeApiErrorCount)]]',
        'rows: errorRows.map(([label, value]) => this._r7SettingsGreenhouseValueRow(label, value))',
        'secondLabel: "Center 목록"',
    ):
        assert marker in panel
    assert 'secondLabel: "Center 연결 목록"' not in panel


def test_r7_124_token_registration_guidance_is_visible_without_secret_exposure():
    panel = _read(PANEL)
    for marker in (
        'Center에서 발급한 허용 토큰을 1회 붙여넣어 저장합니다',
        '토큰 원문은 저장 후 다시 표시하지 않습니다',
        'credentialState',
        '[REDACTED]',
    ):
        assert marker in panel
    assert 'rawSecret' not in panel
