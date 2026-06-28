from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REBUILD_VIEWS = ROOT / "custom_components" / "green_smart" / "rebuild_views.py"
INIT = ROOT / "custom_components" / "green_smart" / "__init__.py"
CBA_DOC = ROOT / "docs" / "master" / "01-cba-ui-ux-spec.md"
INTERFACE_DOC = ROOT / "docs" / "master" / "02-interface-spec.md"
BACKEND_DOC = ROOT / "docs" / "design" / "current-backend-api-db-ha-contract.md"
RESEARCH_DOC = ROOT / "docs" / "rebuild" / "rs-002-home-dashboard-research.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_rs007_rebuild_home_context_api_view_shell_exists():
    source = _read(REBUILD_VIEWS)
    for marker in (
        "class RebuildHomeContextView(HomeAssistantView)",
        'url = "/api/green_smart/rebuild/home/context"',
        'name = "api:green_smart:rebuild:home:context"',
        "requires_auth = True",
        "async def get(self, request: web.Request) -> web.Response:",
        "return self.json(await rebuild_home_context_response(hass))",
    ):
        assert marker in source


def test_rs007_route_shell_is_now_backed_by_rs014_readonly_source_adapter():
    source = _read(REBUILD_VIEWS)
    for marker in (
        "REBUILD_HOME_CONTEXT_SOURCE = \"legacy-physical-readonly-adapter\"",
        "async def rebuild_home_context_response(hass) -> dict:",
        "RS-014 API source adapter",
        "await get_rebuild_home_context_from_legacy_db(hass)",
        "request.app[\"hass\"]",
    ):
        assert marker in source

    for forbidden in (
        "fetchall(",
        "executeFinalTargets",
        "call_service",
        "async_call",
        "hass.services",
        "INSERT INTO",
        "UPDATE ",
        "DELETE ",
        'REBUILD_HOME_CONTEXT_SOURCE = "static-fixture-before-api"',
    ):
        assert forbidden not in source


def test_rs007_view_is_registered_in_integration_setup():
    init_source = _read(INIT)
    for marker in (
        "from .rebuild_views import RebuildHomeContextView",
        "hass.http.register_view(RebuildHomeContextView())",
    ):
        assert marker in init_source


def test_rs007_documents_api_contract_in_all_confirmed_docs():
    docs = {
        "cba": _read(CBA_DOC),
        "interface": _read(INTERFACE_DOC),
        "backend": _read(BACKEND_DOC),
        "research": _read(RESEARCH_DOC),
    }
    baseline_required = (
        "RS-007 read-only home context API shell",
        "GET /api/green_smart/rebuild/home/context",
        "readOnly: true",
        "executionEnabled: false",
    )
    for name, content in docs.items():
        for marker in baseline_required:
            assert marker in content, f"{name} missing {marker}"

    interface = docs["interface"]
    for marker in (
        "Rebuild home context API source adapter",
        "legacy-physical-readonly-adapter service",
        "No DB migration in RS-014",
    ):
        assert marker in interface
