from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
REBUILD_VIEWS = ROOT / "custom_components/green_smart/rebuild_views.py"
SERVICE = ROOT / "custom_components/green_smart/services/rebuild_crop_context_service.py"
API_DOC = ROOT / "docs/rebuild/rebuild-home-context-api-source-adapter.md"
INTERFACE_SPEC = ROOT / "docs/master/02-interface-spec.md"
PRODUCT_PLAN = ROOT / "docs/plans/2026-06-28-green-smart-product-first-rebuild-plan.md"
LEGACY_INVENTORY = ROOT / "docs/rebuild/legacy-direction-inventory.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_rs014_version_surfaces_are_aligned_to_1_12_13():
    assert '"version": "1.12.35"' in _read(MANIFEST)
    assert 'const VERSION = "1.12.35"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.12.35"' in _read(REBUILD_PANEL)
    for path in (API_DOC, INTERFACE_SPEC, PRODUCT_PLAN, LEGACY_INVENTORY):
        assert "v1.12.35" in _read(path)


def test_rs014_api_source_adapter_document_records_db_backed_readonly_contract():
    text = _read(API_DOC)
    required = (
        "# RS-014 Rebuild Home Context API Source Adapter",
        "Status: active API source adapter boundary",
        "GET /api/green_smart/rebuild/home/context",
        "source = legacy-physical-readonly-adapter service",
        "No production route removal in RS-014",
        "No DB migration in RS-014",
        "No write/mutation in RS-014",
        "auth boundary remains requires_auth = True",
        "API response remains readOnly: true and executionEnabled: false",
    )
    for marker in required:
        assert marker in text


def test_rebuild_view_uses_readonly_db_service_instead_of_static_fixture_response():
    source = _read(REBUILD_VIEWS)
    required = (
        "RS-014 API source adapter",
        "from .services.rebuild_crop_context_service import get_rebuild_home_context_from_legacy_db",
        "REBUILD_HOME_CONTEXT_SOURCE = \"legacy-physical-readonly-adapter\"",
        "async def rebuild_home_context_response(hass) -> dict:",
        "await get_rebuild_home_context_from_legacy_db(hass)",
        "async def get(self, request: web.Request) -> web.Response:",
        "request.app[\"hass\"]",
        "requires_auth = True",
    )
    for marker in required:
        assert marker in source

    forbidden = (
        'REBUILD_HOME_CONTEXT_SOURCE = "static-fixture-before-api"',
        '"cropSeasonId": "season-tomato-a"',
        '"cropType": "tomato"',
        '"generatedAt": "2026-06-28T00:00:00+09:00"',
    )
    for marker in forbidden:
        assert marker not in source


def test_service_keeps_rs014_response_safe_for_api_source():
    source = _read(SERVICE)
    required = (
        "legacy-physical-readonly-adapter",
        '"readOnly": True',
        '"executionEnabled": False',
        "compatibilityAliases",
        "currentCrop",
        "activeCropCycleId",
        "crop_cycle",
    )
    for marker in required:
        assert marker in source
    for forbidden in ("create_crop", "update_crop", "delete_crop", "execute("):
        assert forbidden not in source


def test_docs_inventory_and_plan_record_rs014_completion_and_next_step():
    spec = _read(INTERFACE_SPEC)
    plan = _read(PRODUCT_PLAN)
    inventory = _read(LEGACY_INVENTORY)
    for marker in (
        "Rebuild home context API source adapter",
        "GET /api/green_smart/rebuild/home/context",
        "legacy-physical-readonly-adapter service",
        "readOnly: true",
        "executionEnabled: false",
        "No DB migration in RS-014",
    ):
        assert marker in spec
    for marker in (
        "Phase R4.10 — Rebuild home context API source adapter",
        "Status:** `v1.12.35`에서 rebuild home context API가 RS-013 read-only DB adapter service를 source로 사용하도록 연결 완료",
        "No production route removal in RS-014",
        "No DB migration in RS-014",
        "No write/mutation in RS-014",
    ):
        assert marker in plan
    assert "RS-014" in inventory
    assert "Rebuild home context API source adapter completed" in inventory
    assert "RS-015" in inventory
    assert "Rebuild panel async context loading" in inventory
