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
        "return self.json(rebuild_home_context_response())",
    ):
        assert marker in source


def test_rs007_fixture_response_shape_is_summary_plus_zones_read_only():
    source = _read(REBUILD_VIEWS)
    for marker in (
        "REBUILD_HOME_CONTEXT_SOURCE = \"static-fixture-before-api\"",
        "def rebuild_home_context_response()",
        '"contextSource": REBUILD_HOME_CONTEXT_SOURCE',
        '"readOnly": True',
        '"executionEnabled": False',
        '"summary"',
        '"zones"',
        '"currentCrop"',
        '"cropSeasonId"',
        '"cropType"',
        '"cropLabelKo"',
        '"growthStage"',
        '"equipmentProfile"',
        '"dataAvailability"',
        '"static-fixture-before-api"',
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
    required = (
        "RS-007 read-only home context API shell",
        "GET /api/green_smart/rebuild/home/context",
        "summary + zones",
        "static-fixture-before-api",
        "readOnly: true",
        "executionEnabled: false",
        "DB 연결 없음",
        "서비스 실행 없음",
    )
    for name, content in docs.items():
        for marker in required:
            assert marker in content, f"{name} missing {marker}"
