from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
VIEWS = ROOT / "custom_components/green_smart/rebuild_settings_write_views.py"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_126_update_card_labels_latest_status():
    panel = _read(PANEL)
    for marker in (
        '"Green Smart", system.gsUpdateStatus || "최신 확인 중"',
        '"HACS", system.hacsUpdateStatus || "최신 확인 중"',
        '"HA/DB", system.haDbUpdateStatus || "Update Agent 도입 후"',
        'data-r7-settings-system-update-row-label="green-smart"',
        'data-r7-settings-system-update-row-label="hacs"',
    ):
        assert marker in panel
    assert '"GS/HACS", "확인·업데이트 가능"' not in panel
    assert '"방식", "HA update entity 기반"' not in panel


def test_r7_126_errors_modal_refresh_button_only_in_detail_footer():
    panel = _read(PANEL)
    assert 'attrs: \'data-r7-settings-system-errors-list-panel\'' in panel
    assert 'footer: `<span>총 ${rows.length}건</span>`' in panel
    assert 'secret 값은 표시하지 않습니다' not in panel
    assert 'data-r7-settings-system-errors-action-state' in panel
    assert 'data-r7-settings-system-errors-action="refresh-watchdog"' in panel


def test_r7_126_center_connection_status_distinguishes_configured_from_reachable():
    views = _read(VIEWS)
    for marker in (
        'connectionStatus": "설정됨"',
        'reachabilityStatus',
        '미검증',
        'reachable',
        'configured',
        'credentialPreview',
    ):
        assert marker in views


def test_r7_126_center_modal_uses_redacted_credential_default_only():
    panel = _read(PANEL)
    for marker in (
        'name="allowedCredential"',
        'center.allowedCredentialPreview || "[REDACTED]"',
        'credential_payload == "[REDACTED]"',
    ):
        assert marker in (panel + "\n" + _read(VIEWS))
    assert 'GS_CENTER_ALLOW_' not in panel
