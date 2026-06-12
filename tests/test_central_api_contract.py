import ast
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CENTRAL_API = ROOT / "custom_components" / "green_smart" / "central_api.py"


def _source() -> str:
    return CENTRAL_API.read_text(encoding="utf-8")


def _module() -> ast.Module:
    return ast.parse(_source(), filename=str(CENTRAL_API))


def _constant_assignments(module: ast.Module) -> dict[str, object]:
    values: dict[str, object] = {}
    for node in module.body:
        if (
            isinstance(node, ast.Assign)
            and len(node.targets) == 1
            and isinstance(node.targets[0], ast.Name)
            and isinstance(node.value, ast.Constant)
        ):
            values[node.targets[0].id] = node.value.value
    return values


def test_central_api_declares_allowlisted_endpoints_only():
    constants = _constant_assignments(_module())

    assert constants["ACTIVATION_EXCHANGE_PATH"] == "/activation/exchange"
    assert constants["TOKEN_REFRESH_PATH"] == "/tokens/refresh"
    assert constants["TOKEN_REVOKE_PATH"] == "/tokens/revoke"
    assert constants["DEMO_STATUS_PATH"] == "/vendor/adapters/demo/status"
    assert "/vendor/proxy" not in _source()


def test_central_api_uses_ha_aiohttp_session_and_json_methods():
    source = _source()

    assert "async_get_clientsession" in source
    assert "ClientTimeout" in source
    assert "async def exchange_activation_code" in source
    assert "async def refresh_tokens" in source
    assert "async def revoke_token" in source
    assert "async def demo_status" in source
    assert "async def ensure_access_token" in source


def test_central_api_payloads_match_central_contract_without_generic_proxy_fields():
    source = _source()

    assert '"code": code' in source
    assert '"ha_instance_id": ha_instance_id' in source
    assert '"refresh_token": refresh_token' in source
    assert '"token": token' in source
    assert '"token_type": token_type' in source
    assert '"device_id": device_id' in source
    assert "feature_key" not in source
    assert "method" not in source
    assert "path" not in source


def test_central_api_authorization_header_only_uses_access_token_for_adapter():
    source = _source()

    assert '"Authorization": f"Bearer {access_token}"' in source
    assert "demo_status" in source
    assert source.count("Authorization") == 1


def test_central_api_errors_do_not_embed_raw_secret_material():
    source = _source()

    forbidden_fragments = [
        "logging",
        "logger",
        "repr(payload)",
        "str(payload)",
        "access_token=",
        "refresh_token=",
        "activation_code=",
    ]
    for fragment in forbidden_fragments:
        assert fragment not in source

    assert "CentralApiError" in source
    assert "detail" in source
