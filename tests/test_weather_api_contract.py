import ast
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WEATHER_API = ROOT / "custom_components" / "green_smart" / "weather_api.py"


def _module() -> ast.Module:
    return ast.parse(WEATHER_API.read_text(encoding="utf-8"), filename=str(WEATHER_API))


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


def test_weather_api_storage_and_cache_constants_are_stable():
    constants = _constant_assignments(_module())

    assert constants["STORAGE_KEY"] == "green_smart_weather"
    assert constants["STORAGE_VERSION"] == 1
    assert constants["CACHE_TTL"] == 600
    assert isinstance(constants["KMA_BASE"], str)
    assert isinstance(constants["KMA_MID_BASE"], str)
    assert constants["KMA_BASE"].startswith("https://apis.data.go.kr/1360000/")
    assert constants["KMA_MID_BASE"].startswith("https://apis.data.go.kr/1360000/")


def test_weather_api_masks_keys_and_never_returns_plain_short_key():
    source = WEATHER_API.read_text(encoding="utf-8")

    assert "return \"****\" + key[-4:]" in source
    assert "if len(key) <= 4:" in source
    assert "return \"****\"" in source


def test_weather_api_error_paths_avoid_leaking_service_key_url():
    source = WEATHER_API.read_text(encoding="utf-8")

    assert "KMA API 연결 실패" in source
    assert "from None" in source
    assert "serviceKey" in source
    assert "URL이 로그에 찍히지 않도록 주의" in source
    assert "raise RuntimeError(f\"KMA API HTTP {resp.status}\")" in source


def test_weather_store_exposes_masked_key_methods_for_frontend():
    module = _module()
    classes = [node for node in module.body if isinstance(node, ast.ClassDef)]
    weather_store = next(node for node in classes if node.name == "WeatherStore")
    methods = {node.name for node in weather_store.body if isinstance(node, ast.AsyncFunctionDef)}

    assert {"get_masked_key", "get_masked_mid_key", "get_masked_psis_key"}.issubset(methods)
    assert {"get_api_key", "get_mid_api_key", "get_psis_api_key"}.issubset(methods)
