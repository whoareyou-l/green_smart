from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
ADAPTER = ROOT / "custom_components/green_smart/panel/rebuild/current-crop-adapter.js"
DOC = ROOT / "docs/rebuild/rebuild-panel-async-context-loading.md"
INTERFACE_SPEC = ROOT / "docs/master/02-interface-spec.md"
PRODUCT_PLAN = ROOT / "docs/plans/2026-06-28-green-smart-product-first-rebuild-plan.md"
LEGACY_INVENTORY = ROOT / "docs/rebuild/legacy-direction-inventory.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_rs015_version_surfaces_are_aligned_to_1_12_14():
    assert '"version": "1.15.41"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.41"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.41"' in _read(REBUILD_PANEL)
    for path in (DOC, INTERFACE_SPEC, PRODUCT_PLAN, LEGACY_INVENTORY):
        assert "v1.15.41" in _read(path)


def test_rs015_document_records_frontend_async_loading_boundary():
    text = _read(DOC)
    required = (
        "# RS-015 Rebuild Panel Async Context Loading",
        "Status: active frontend async context loading boundary",
        "GET /api/green_smart/rebuild/home/context",
        "panel fetches protected API through hass.callApi",
        "No production route removal in RS-015",
        "No DB migration in RS-015",
        "No write/mutation in RS-015",
        "fallback remains static read-only context",
        "render states: loading, ready, error",
    )
    for marker in required:
        assert marker in text


def test_rebuild_panel_fetches_api_and_normalizes_response_before_render():
    source = _read(REBUILD_PANEL)
    required = (
        "RS-015 async context loading",
        "REBUILD_CONTEXT_API_PATH = \"green_smart/rebuild/home/context\"",
        "this._contextLoadState = \"loading\"",
        "this._contextLoadError = null",
        "this._contextRequestId = 0",
        "connectedCallback()",
        "this._loadHomeContext()",
        "async _loadHomeContext()",
        "this.hass.callApi(\"GET\", REBUILD_CONTEXT_API_PATH)",
        "normalizeRebuildHomeContext(response)",
        "this._contextLoadState = \"ready\"",
        "this._contextLoadState = \"error\"",
        "this._contextLoadError = error?.message || \"context-load-failed\"",
        "data-rebuild-context-load-state",
        "data-rebuild-context-error",
    )
    for marker in required:
        assert marker in source

    forbidden = (
        "hass.callService",
        "executeFinalTargets",
        "data-zone-execute-button",
        "POST",
        "PUT",
        "DELETE",
    )
    for marker in forbidden:
        assert marker not in source


def test_adapter_preserves_api_target_keys_and_fallback_static_context():
    adapter = _read(ADAPTER)
    panel = _read(REBUILD_PANEL)
    for marker in (
        "normalizeRebuildHomeContext",
        "currentCrop.crop_cycle_id",
        "compatibilityAliases",
        "context.contextSource || \"static-fixture-before-api\"",
    ):
        assert marker in adapter
    for marker in (
        "REBUILD_HOME_CONTEXT",
        "static-fixture-before-api",
        "getRebuildHomeContext(REBUILD_HOME_CONTEXT)",
    ):
        assert marker in panel


def test_docs_inventory_and_plan_record_rs015_completion_and_next_step():
    spec = _read(INTERFACE_SPEC)
    plan = _read(PRODUCT_PLAN)
    inventory = _read(LEGACY_INVENTORY)
    for marker in (
        "Rebuild panel async context loading",
        "GET /api/green_smart/rebuild/home/context",
        "hass.callApi(\"GET\", REBUILD_CONTEXT_API_PATH)",
        "loading, ready, error",
        "No write/mutation in RS-015",
    ):
        assert marker in spec
    for marker in (
        "Phase R4.11 — Rebuild panel async context loading",
        "Status:** `v1.15.41`에서 rebuild panel이 protected home context API를 비동기로 호출하도록 연결 완료",
        "No production route removal in RS-015",
        "No DB migration in RS-015",
        "No write/mutation in RS-015",
    ):
        assert marker in plan
    assert "RS-015" in inventory
    assert "Rebuild panel async context loading completed" in inventory
    assert "RS-016" in inventory
    assert "Crop cycle read-only page slice" in inventory
