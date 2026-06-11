import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components" / "green_smart" / "manifest.json"


def test_manifest_declares_green_smart_domain_and_config_flow():
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))

    assert manifest["domain"] == "green_smart"
    assert manifest["name"] == "Green Smart"
    assert manifest["config_flow"] is True
    assert manifest["iot_class"] == "local_push"


def test_manifest_has_version_and_pinned_runtime_requirements():
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))

    assert manifest["version"]
    assert manifest["requirements"] == ["aiomysql==0.2.0"]
