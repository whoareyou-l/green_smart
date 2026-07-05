from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _fn(text: str, name: str) -> str:
    start = text.index(f"  {name}(")
    next_start = text.find("\n  renderR7SettingsRolePermissionEditModal", start)
    if next_start == -1:
        next_start = text.find("\n  renderR7SettingsRolePermissionEditModal", start)
    return text[start:next_start]


def test_r7_123_system_action_popups_reuse_existing_common_modal_shells():
    panel = _read(PANEL)
    system_fn = _fn(panel, "renderR7SettingsSystemActionModal")
    for marker in (
        "renderR7SettingsDetailActionModal",
        "renderR7CdaSplitModal",
        "renderR7CdaModalHeader",
        "renderR7CdaListPanel",
        "renderR7CdaDetailPanel",
        "renderR7CdaActionFooter",
        'data-r7-settings-system-update-cda-modal',
        'data-r7-settings-system-errors-cda-modal',
        'data-r7-settings-system-center-form',
        'data-r7-settings-system-center-common-modal',
    ):
        assert marker in system_fn


def test_r7_123_system_action_popups_do_not_use_bespoke_overlay_shell():
    panel = _read(PANEL)
    system_fn = _fn(panel, "renderR7SettingsSystemActionModal")
    for forbidden in (
        "position:fixed;inset:0",
        "box-shadow:0 18px 50px",
        "data-r7-settings-system-action-modal-kind",
        "<section style=\"width:min(860px",
    ):
        assert forbidden not in system_fn


def test_r7_123_center_connection_uses_role_permission_create_edit_form_grammar():
    panel = _read(PANEL)
    system_fn = _fn(panel, "renderR7SettingsSystemActionModal")
    for marker in (
        'kind: "system-center-connection"',
        'title: center.credentialState === "configured" ? "Center 연결 수정" : "Center 연결 추가"',
        'subtitle: "역활별 권한 추가/수정 팝업과 같은 공통 작성 모달에서 Center URL과 허용 토큰을 저장합니다"',
        'formAttr: "data-r7-settings-system-center-form"',
        'closeKind: "system-action"',
        'submitLabel: "Center 연결 저장/검증"',
        '_r7SettingsCreateSection("center-connection"',
        '_r7SettingsCreateField("baseUrl"',
        '_r7SettingsCreateField("allowedCredential"',
    ):
        assert marker in system_fn


def test_r7_123_update_and_error_popups_use_role_permission_list_cda_grammar():
    panel = _read(PANEL)
    system_fn = _fn(panel, "renderR7SettingsSystemActionModal")
    for marker in (
        'title: "업데이트 목록"',
        'title: "DB/API 오류 목록"',
        'data-r7-settings-system-update-list-panel',
        'data-r7-settings-system-errors-list-panel',
        'data-r7-settings-system-update-detail-panel',
        'data-r7-settings-system-errors-detail-panel',
        'data-r7-settings-system-update-row',
        'data-r7-settings-system-errors-row',
        'GS/HACS만 이 화면에서 요청합니다',
        'watchdog 재검사',
    ):
        assert marker in system_fn


def test_r7_123_system_action_common_modal_close_is_shared_with_detail_action_modal():
    panel = _read(PANEL)
    assert 'if (kind === "system-action" || kind === "all") this._settingsSystemActionModal = { open: false, kind: "", state: "idle", data: null, error: "" };' in panel
