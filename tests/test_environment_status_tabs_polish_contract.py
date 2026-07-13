from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
DOC = ROOT / "docs/design/environment-control-ui-dom-slice-plan.md"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"


def panel_text() -> str:
    return PANEL.read_text(encoding="utf-8")


def test_current_version_is_1_9_97():
    panel = panel_text()
    manifest = MANIFEST.read_text(encoding="utf-8")
    assert '"version": "1.15.57"' in manifest
    assert 'const VERSION = "1.15.57"' in panel


def test_environment_operations_status_polish_contract():
    panel = panel_text()
    assert 'if (tab === "operations")' in panel
    required = [
        'data-env-operations-polish',
        'data-env-status-subtab="operations"',
        'data-env-status-operator-summary',
        'data-env-status-safety-boundary',
        'statusGroup("ai-ops"',
        'statusGroup("safety-rehearsal"',
        'data-env-status-card-grid',
        'data-env-status-card-shell',
        'data-env-status-card-footer',
    ]
    for marker in required:
        assert marker in panel
    assert "실제 실행은 SafetyGuard gate" in panel
    assert "농장주/직원은 리허설 결과를 먼저 확인" in panel


def test_environment_devices_status_polish_contract():
    panel = panel_text()
    assert 'if (tab === "devices")' in panel
    required = [
        'data-env-devices-polish',
        'data-env-status-subtab="devices"',
        'statusGroup("entity-state"',
        'statusGroup("entity-mapping"',
        'statusGroup("mapping-validation"',
        'data-env-device-rbac-note',
        'data-env-device-mapping-save-boundary',
    ]
    for marker in required:
        assert marker in panel
    assert "장치 매핑은 Home Assistant entity 연결만 변경" in panel
    assert "수동 장치 실행 권한을 추가하지 않습니다" in panel


def test_environment_logs_record_polish_contract():
    panel = panel_text()
    assert 'if (tab === "logs")' in panel
    required = [
        'data-env-logs-polish',
        'data-env-status-subtab="logs"',
        'data-env-log-summary',
        'data-env-subtab-list-header',
        'data-env-subtab-record-list',
        'data-env-subtab-record-row',
        'data-env-subtab-record-meta',
        'data-env-subtab-record-actions',
        'data-env-log-empty-state',
    ]
    for marker in required:
        assert marker in panel
    assert "최근 작동 로그" in panel
    assert "로그는 실행/저장 결과 확인용" in panel


def test_environment_status_tabs_keep_execution_boundary():
    panel = panel_text()
    forbidden = [
        'data-env-operations-direct-execute',
        'data-env-devices-manual-execute',
        'environmentStatusTabsAllowDirectExecution',
        'data-env-control-bypass-safety',
    ]
    for marker in forbidden:
        assert marker not in panel


def test_environment_status_slice_documented():
    doc = DOC.read_text(encoding="utf-8")
    assert "Slice 4" in doc
    assert "Status: implemented in `v1.10.9`" in doc
    assert "data-env-operations-polish" in doc
    assert "data-env-devices-polish" in doc
    assert "data-env-logs-polish" in doc
