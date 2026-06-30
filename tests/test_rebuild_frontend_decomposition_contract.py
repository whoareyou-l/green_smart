from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT / "docs" / "rebuild" / "frontend-decomposition-plan.md"
PRODUCT_PLAN = ROOT / "docs" / "plans" / "2026-06-28-green-smart-product-first-rebuild-plan.md"
MASTER = ROOT / "docs" / "PROJECT_MASTER_PLAN.md"
MANIFEST = ROOT / "custom_components" / "green_smart" / "manifest.json"
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
FRONTEND_PANEL = ROOT / "custom_components" / "green_smart" / "frontend_panel.py"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r2_version_surfaces_are_v1112():
    assert '"version": "1.14.2"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.2"' in _read(PANEL)
    assert "v1.14.2" in _read(PLAN)
    assert "v1.14.2" in _read(PRODUCT_PLAN)
    assert "v1.14.2" in _read(MASTER)


def test_r2_ha_loading_keeps_single_public_panel_entrypoint():
    frontend = _read(FRONTEND_PANEL)
    panel = _read(PANEL)
    plan = _read(PLAN)
    assert 'return f"/green_smart_panel/green-smart-panel.js?v={version}"' in frontend
    assert "async_register_panel" in frontend
    assert "module_url=module_url" in frontend
    assert 'class GreenSmartPanel extends HTMLElement' in panel
    assert 'customElements.define("green-smart-panel", GreenSmartPanel)' in panel
    assert "green-smart-panel.js?v={manifest.version}" in plan
    assert "public compatibility shell" in plan


def test_r2_target_module_structure_is_documented_before_code_split():
    plan = _read(PLAN)
    for marker in (
        "core/state-store.js",
        "core/api-client.js",
        "core/render-shell.js",
        "core/permissions.js",
        "core/formatters.js",
        "domains/home/home-page.js",
        "domains/crop/crop-page.js",
        "domains/environment/environment-page.js",
        "domains/irrigation/irrigation-page.js",
        "domains/device/device-page.js",
        "domains/admin/admin-page.js",
        "components/cards/*.js",
        "components/modals/*.js",
        "components/tabs/*.js",
    ):
        assert marker in plan


def test_r2_module_loading_rules_are_safe_for_home_assistant_webview():
    plan = _read(PLAN)
    for marker in (
        "relative import only",
        "no build step",
        "browser-compatible syntax",
        "side-effect 최소화",
        "shell owns lifecycle",
        "cache busting",
        "native ES modules",
        "top-level에서는 custom element 등록/DOM 접근 금지",
    ):
        assert marker in plan


def test_r2_domain_boundaries_and_pure_component_rules_are_documented():
    plan = _read(PLAN)
    for marker in (
        "`core`",
        "`home`",
        "`crop`",
        "`environment`",
        "`irrigation`",
        "`device`",
        "`admin`",
        "`components`",
        "components",
        "hass.callApi 직접 호출 금지",
        "route path는 절대 변경하지 않는다",
        "response shape를 임의 변경하지 않는다",
    ):
        assert marker in plan


def test_r2_first_extraction_is_admin_system_not_crop_or_execution():
    plan = _read(PLAN)
    product_plan = _read(PRODUCT_PLAN)
    master = _read(MASTER)
    assert "첫 실제 이관 slice는 **Crop이 아니다**" in plan
    assert "RB-001 Admin/System shell 분리" in plan
    assert "RB-002 Panel API client adapter" in plan
    assert "Crop 전체 | 보류" in plan
    assert "Environment/Irrigation execution | 보류" in plan
    assert "상세 산출물은 `docs/rebuild/frontend-decomposition-plan.md`" in product_plan
    assert "docs/rebuild/frontend-decomposition-plan.md" in master


def test_r2_contract_preserves_no_large_split_beyond_rb001_rb002_rb003_shells():
    plan = _read(PLAN)
    # R2 itself was documentation/contract only. After RB-001/RB-002/RB-003,
    # only the low-risk Admin/System shell, API client adapter, and Crop read-only
    # render helper are allowed; render-shell, component and high-risk domain
    # extractions must still not exist.
    assert (ROOT / "custom_components" / "green_smart" / "panel" / "domains/admin/admin-page.js").exists()
    assert (ROOT / "custom_components" / "green_smart" / "panel" / "core/api-client.js").exists()
    assert (ROOT / "custom_components" / "green_smart" / "panel" / "domains/crop/crop-readonly.js").exists()
    for rel in (
        "core/render-shell.js",
        "domains/crop/crop-page.js",
        "domains/environment/environment-page.js",
        "domains/irrigation/irrigation-page.js",
        "domains/device/device-page.js",
        "components/cards",
    ):
        assert not (ROOT / "custom_components" / "green_smart" / "panel" / rel).exists()
    for marker in (
        "R2는 구현 분해 단계가 아니다",
        "대규모 JS 파일 분리 | 금지",
        "Home Assistant panel registration 변경 | 금지",
        "custom element 이름 변경 | 금지",
        "API route 변경 | 금지",
        "prod stack 변경 | 금지",
        "Admin/System render boundary extracted",
        "Panel API client adapter baseline",
        "Crop read-only render helper baseline",
    ):
        assert marker in plan
