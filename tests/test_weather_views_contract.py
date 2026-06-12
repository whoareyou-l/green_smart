import ast
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WEATHER_VIEWS = ROOT / "custom_components" / "green_smart" / "weather_views.py"


def _module() -> ast.Module:
    return ast.parse(WEATHER_VIEWS.read_text(encoding="utf-8"), filename=str(WEATHER_VIEWS))


def _class(name: str) -> ast.ClassDef:
    return next(node for node in _module().body if isinstance(node, ast.ClassDef) and node.name == name)


def _method(class_node: ast.ClassDef, name: str) -> ast.AsyncFunctionDef:
    return next(node for node in class_node.body if isinstance(node, ast.AsyncFunctionDef) and node.name == name)


def _json_response_keys(method: ast.AsyncFunctionDef) -> set[str]:
    keys: set[str] = set()
    for node in ast.walk(method):
        if not (
            isinstance(node, ast.Call)
            and isinstance(node.func, ast.Attribute)
            and node.func.attr == "json"
            and node.args
            and isinstance(node.args[0], ast.Dict)
        ):
            continue
        for key_node in node.args[0].keys:
            if isinstance(key_node, ast.Constant) and isinstance(key_node.value, str):
                keys.add(key_node.value)
    return keys


def test_weather_and_pesticide_config_views_require_home_assistant_auth():
    auth_required_views = {
        "WeatherConfigView",
        "WeatherValidateKeyView",
        "WeatherValidateMidKeyView",
        "WeatherLocationSearchView",
        "PesticideSearchView",
        "PesticideKeyConfigView",
        "PesticideMixCheckView",
    }

    for view_name in auth_required_views:
        view = _class(view_name)
        assignments = {
            target.id: node.value.value
            for node in view.body
            if isinstance(node, ast.Assign)
            for target in node.targets
            if isinstance(target, ast.Name) and isinstance(node.value, ast.Constant)
        }
        assert assignments["requires_auth"] is True


def test_weather_config_get_and_post_return_only_masked_keys():
    view = _class("WeatherConfigView")
    get_method = _method(view, "get")
    post_method = _method(view, "post")
    get_source = ast.unparse(get_method)
    post_source = ast.unparse(post_method)

    assert "get_masked_key" in get_source
    assert "get_masked_mid_key" in get_source
    assert "get_api_key" not in get_source
    assert "get_mid_api_key" not in get_source
    assert {"masked_key", "masked_mid_key"}.issubset(_json_response_keys(get_method))
    assert not {"api_key", "mid_api_key"}.intersection(_json_response_keys(get_method))

    assert "save_config" in post_source
    assert "get_masked_key" in post_source
    assert "get_masked_mid_key" in post_source
    assert {"masked_key", "masked_mid_key"}.issubset(_json_response_keys(post_method))
    assert not {"api_key", "mid_api_key"}.intersection(_json_response_keys(post_method))


def test_pesticide_config_post_never_echoes_psis_api_key():
    view = _class("PesticideKeyConfigView")
    post_method = _method(view, "post")
    get_method = _method(view, "get")
    post_source = ast.unparse(post_method)
    get_source = ast.unparse(get_method)

    assert "save_psis_api_key" in post_source
    assert "delete_psis_api_key" in post_source
    assert "get_masked_psis_key" not in post_source
    assert "psis_api_key" not in _json_response_keys(post_method)

    assert "get_masked_psis_key" in get_source
    assert "get_psis_api_key" not in get_source
    assert "psis_api_key" in _json_response_keys(get_method)


def test_upstream_api_error_logging_does_not_log_key_bearing_urls():
    source = WEATHER_VIEWS.read_text(encoding="utf-8")

    assert "KMA API 연결 실패" not in source  # lower-level weather_api owns this message
    assert "키 마스킹됨" in source
    assert "PSIS API 호출 실패 (키 마스킹됨)" in source
    assert "serviceKey" in source
    assert "_LOGGER.warning(\"PSIS API 호출 실패 (키 마스킹됨): %s\", type(exc).__name__)" in source
