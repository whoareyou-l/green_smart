import ast
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONFIG_FLOW = ROOT / "custom_components" / "green_smart" / "config_flow.py"
CONST = ROOT / "custom_components" / "green_smart" / "const.py"


def _module(path: Path) -> ast.Module:
    return ast.parse(path.read_text(encoding="utf-8"), filename=str(path))


def test_const_domain_is_green_smart():
    module = _module(CONST)
    assignments = {
        node.targets[0].id: node.value.value
        for node in module.body
        if isinstance(node, ast.Assign)
        and len(node.targets) == 1
        and isinstance(node.targets[0], ast.Name)
        and isinstance(node.value, ast.Constant)
    }

    assert assignments["DOMAIN"] == "green_smart"


def test_config_flow_filters_user_input_to_wizard_keys_only():
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
    assert isinstance(wizard_tuple, ast.Tuple)
    wizard_keys = {item.value for item in wizard_tuple.elts if isinstance(item, ast.Constant)}

    assert wizard_keys == {
        "host",
        "port",
        "unit_id",
        "greenhouse_zones",
        "nutrient_zones",
        "stevenson_screens",
        "weatherflow_prefix",
        "virtual",
    }


def test_config_flow_exposes_single_user_step():
    module = _module(CONFIG_FLOW)
    classes = [node for node in module.body if isinstance(node, ast.ClassDef)]
    flow = next(node for node in classes if node.name == "GreenSmartConfigFlow")
    method_names = {node.name for node in flow.body if isinstance(node, ast.AsyncFunctionDef)}

    assert method_names == {"async_step_user"}
