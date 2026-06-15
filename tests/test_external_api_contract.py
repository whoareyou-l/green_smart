import ast
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WEATHER = ROOT / "custom_components" / "green_smart" / "api" / "weather.py"
PESTICIDE = ROOT / "custom_components" / "green_smart" / "api" / "pesticide.py"


def _source(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _class_methods(path: Path, class_name: str) -> set[str]:
    module = ast.parse(_source(path), filename=str(path))
    klass = next(
        node for node in module.body
        if isinstance(node, ast.ClassDef) and node.name == class_name
    )
    return {node.name for node in klass.body if isinstance(node, ast.AsyncFunctionDef | ast.FunctionDef)}


def test_weather_client_contract():
    """Verify weather client interface for short/mid term forecasts without network calls."""
    source = _source(WEATHER)
    methods = _class_methods(WEATHER, "WeatherClient")

    assert "__init__" in methods
    assert "get_short_term_forecast" in methods
    assert "get_mid_term_forecast" in methods
    assert "nx" in source
    assert "ny" in source
    assert "serviceKey" in source


def test_pesticide_client_contract():
    """Verify pesticide client interface for PSIS integration without network calls."""
    source = _source(PESTICIDE)
    methods = _class_methods(PESTICIDE, "PesticideClient")

    assert "__init__" in methods
    assert "search_pesticide" in methods
    assert "query" in source
    assert "serviceKey" in source
