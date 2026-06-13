import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"


def _source() -> str:
    return PANEL.read_text(encoding="utf-8")


def test_wizard_exposes_optional_central_activation_fields_with_safety_copy():
    source = _source()

    assert "중앙 활성화" in source
    assert "선택 사항" in source
    assert "로컬/데모" in source
    assert "실제 유료 벤더" in source
    assert 'id="central_base_url"' in source
    assert 'id="activation_code"' in source
    assert 'type="password" id="activation_code"' in source
    assert "placeholder=\"http://127.0.0.1:18000\"" in source


def test_wizard_submission_sends_activation_code_only_as_transient_flow_payload():
    source = _source()

    assert "_submissionData" in source
    assert "activation_code" in source
    assert "trimmedActivationCode" in source
    assert "delete data.activation_code" in source
    assert "config/config_entries/flow/${flow.flow_id}" in source


def test_wizard_local_storage_strips_activation_code_before_persisting():
    source = _source()

    assert "_safeStorageData" in source
    assert "delete safe.activation_code" in source
    assert "this._saveStorage(this._safeStorageData(data))" in source
    assert "this._saveStorage(this._safeStorageData(this._form))" in source
    assert "this._saveStorage(this._form)" not in source
    assert "localStorage.setItem(\"green_smart_cfg\", JSON.stringify(d))" in source


def test_wizard_summary_shows_safe_central_metadata_not_secret_material():
    source = _source()

    assert "중앙 API" in source
    assert "central_installation_id" in source
    assert "활성화 코드는 저장하지 않습니다" in source
    summary_start = source.index("_renderSummary")
    summary_end = source.index("  }", summary_start)
    summary_source = source[summary_start:summary_end]
    assert "activation_code" not in summary_source
    assert "access_token" not in source
    assert "refresh_token" not in source


def test_panel_does_not_expose_generic_vendor_proxy_ui():
    source = _source()

    assert "/vendor/proxy" not in source
    for forbidden in ("feature_key", "vendor path", "vendor_path", "vendor method", "vendor_method"):
        assert forbidden not in source
