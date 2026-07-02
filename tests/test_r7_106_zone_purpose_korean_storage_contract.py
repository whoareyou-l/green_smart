from pathlib import Path
import importlib.util
import sys
import types

ROOT = Path(__file__).resolve().parents[1]
MODULE_PATH = ROOT / "custom_components/green_smart/rebuild_settings_write_views.py"


def _load_module():
    sys.modules.setdefault("homeassistant", types.ModuleType("homeassistant"))
    components = sys.modules.setdefault("homeassistant.components", types.ModuleType("homeassistant.components"))
    http = sys.modules.setdefault("homeassistant.components.http", types.ModuleType("homeassistant.components.http"))
    if not hasattr(http, "HomeAssistantView"):
        class HomeAssistantView:
            requires_auth = True
            def json(self, payload):
                return payload
        http.HomeAssistantView = HomeAssistantView
    aiohttp = sys.modules.setdefault("aiohttp", types.ModuleType("aiohttp"))
    web = sys.modules.setdefault("aiohttp.web", types.ModuleType("aiohttp.web"))
    if not hasattr(web, "Request"):
        web.Request = object
    aiohttp.web = web
    package = "custom_components.green_smart"
    sys.modules.setdefault("custom_components", types.ModuleType("custom_components"))
    sys.modules.setdefault("custom_components.green_smart", types.ModuleType("custom_components.green_smart"))
    db = types.ModuleType(f"{package}.db")
    async def fetchall(*args, **kwargs):
        return []
    async def execute(*args, **kwargs):
        return None
    db.fetchall = fetchall
    db.execute = execute
    sys.modules[f"{package}.db"] = db
    spec = importlib.util.spec_from_file_location(f"{package}.rebuild_settings_write_views", MODULE_PATH)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_zone_purpose_normalizer_stores_korean_labels_for_english_legacy_codes():
    module = _load_module()
    assert module._zone_purpose_label({"purpose": "cultivation"}) == "재배 구역"
    assert module._zone_purpose_label({"purpose": "nursery"}) == "육묘 구역"
    assert module._zone_purpose_label({"purpose": "office"}) == "사무 구역"
    assert module._zone_purpose_label({"purpose": "experiment"}) == "실험 구역"
    assert module._zone_purpose_label({"purpose": "storage"}) == "자재 보관 구역"
    assert module._zone_purpose_label({"purpose": "quarantine"}) == "격리·검역 구역"


def test_zone_purpose_normalizer_preserves_korean_labels_and_defaults_to_cultivation_label():
    module = _load_module()
    assert module._zone_purpose_label({"purpose": "재배 구역"}) == "재배 구역"
    assert module._zone_purpose_label({"purpose": "육묘 구역"}) == "육묘 구역"
    assert module._zone_purpose_label({"purpose": ""}) == "재배 구역"
    assert module._zone_purpose_label({}) == "재배 구역"


def test_zone_insert_uses_zone_purpose_label_before_writing_to_db():
    source = MODULE_PATH.read_text(encoding="utf-8")
    assert "ZONE_PURPOSE_LABELS" in source
    assert "_zone_purpose_label(payload)" in source
    insert_arg_tail = source.split("VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)", 1)[1]
    assert "_str(payload, \"purpose\", default=\"재배\")" not in insert_arg_tail
