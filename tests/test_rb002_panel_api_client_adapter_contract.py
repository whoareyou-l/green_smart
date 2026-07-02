from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
API_CLIENT = ROOT / "custom_components" / "green_smart" / "panel" / "core" / "api-client.js"
FRONTEND_PLAN = ROOT / "docs" / "rebuild" / "frontend-decomposition-plan.md"
MANIFEST = ROOT / "custom_components" / "green_smart" / "manifest.json"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_rb002_version_surfaces_are_v1116():
    assert '"version": "1.14.43"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.43"' in _read(PANEL)
    assert "v1.14.43" in _read(FRONTEND_PLAN)


def test_rb002_core_api_client_module_exists_and_exports_contract():
    assert API_CLIENT.exists()
    module = _read(API_CLIENT)
    for marker in (
        "export function createApiClient",
        "function normalizeApiError",
        "async function request",
        "hass.callApi(method, path, payload)",
        "method",
        "path",
        "status",
        "message",
        "admin: {",
        "getCurrentUser",
        "crop: {",
        "listSeasons",
        "getGrowthRecords",
        "getPestRecords",
        "getControlRecords",
        "getGrowthReport",
        "weather: {",
        "getCurrent",
        "getConfig",
        "zone: {",
        "getControlSettings",
        "executeFinalTargets",
    ):
        assert marker in module


def test_rb002_panel_imports_client_and_initializes_without_replacing_shell():
    panel = _read(PANEL)
    assert 'from "./core/api-client.js"' in panel
    assert "createApiClient" in panel
    assert "this._api = createApiClient(this._hass);" in panel
    assert "customElements.define(\"green-smart-panel\"" in panel
    assert "_renderAdminSystemPage()" in panel
    assert "renderAdminSystemPage(this)" in panel


def test_rb002_targeted_call_sites_use_adapter_but_bulk_direct_calls_remain_allowed():
    panel = _read(PANEL)
    for marker in (
        "this._api.admin.getCurrentUser()",
        "this._api.crop.listSeasons()",
        "this._api.crop.getGrowthRecords(seasonId)",
        "this._api.crop.getPestRecords(seasonId)",
        "this._api.crop.getControlRecords(seasonId)",
        "this._api.crop.getGrowthReport(seasonId)",
        "this._api.weather.getCurrent()",
        "this._api.weather.getConfig()",
    ):
        assert marker in panel
    # RB-002 is an adapter-first slice, not a full rewrite.
    assert panel.count("this._hass.callApi") >= 40


def test_rb002_frontend_plan_records_adapter_completion_and_boundaries():
    plan = _read(FRONTEND_PLAN)
    for marker in (
        "RB-002 Panel API client adapter",
        "v1.14.43",
        "core/api-client.js",
        "Adapter-first targeted call sites only",
        "response shape 변경 없음",
        "route path 변경 없음",
        "full call-site rewrite deferred",
    ):
        assert marker in plan
