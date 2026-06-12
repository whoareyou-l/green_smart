import ast
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CENTRAL_STORE = ROOT / "custom_components" / "green_smart" / "central_store.py"
CONFIG_FLOW = ROOT / "custom_components" / "green_smart" / "config_flow.py"


def _module(path: Path) -> ast.Module:
    return ast.parse(path.read_text(encoding="utf-8"), filename=str(path))


def _source(path: Path) -> str:
    return path.read_text(encoding="utf-8")


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


def test_central_store_uses_dedicated_storage_key_and_version():
    constants = _constant_assignments(_module(CENTRAL_STORE))

    assert constants["CENTRAL_STORAGE_KEY"] == "green_smart_central"
    assert constants["CENTRAL_STORAGE_VERSION"] == 1


def test_central_store_keeps_activation_code_out_and_supports_refresh_rotation():
    source = _source(CENTRAL_STORE)

    assert "activation_code" not in source
    assert "Store(" in source
    assert "async def save_token_pair" in source
    assert "async def get_access_token" in source
    assert "async def get_refresh_token" in source
    assert "async def clear_tokens" in source
    assert "async def get_masked_installation_id" in source
    assert '"refresh_token": refresh_token' in source
    assert '"expires_at":' in source


def test_config_flow_accepts_activation_input_but_filters_it_from_entry_data():
    source = _source(CONFIG_FLOW)
    module = _module(CONFIG_FLOW)
    wizard_tuple = next(
        node.value
        for node in module.body
        if isinstance(node, ast.Assign)
        and len(node.targets) == 1
        and isinstance(node.targets[0], ast.Name)
        and node.targets[0].id == "_WIZARD_KEYS"
        and isinstance(node.value, ast.Tuple)
    )
    wizard_keys = {item.value for item in wizard_tuple.elts if isinstance(item, ast.Constant)}

    assert "central_base_url" in wizard_keys
    assert "central_installation_id" in wizard_keys
    assert "activation_code" not in wizard_keys
    assert "activation_code" in source
    assert "exchange_activation_code" in source
    assert "CentralTokenStore" in source
    assert "central_installation_id" in source


def test_config_flow_maps_activation_errors_to_user_form_errors():
    source = _source(CONFIG_FLOW)

    for detail in (
        "invalid_activation_code",
        "activation_code_expired",
        "activation_code_not_active",
        "cannot_connect",
    ):
        assert detail in source
