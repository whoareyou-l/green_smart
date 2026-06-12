import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STRINGS = ROOT / "custom_components" / "green_smart" / "strings.json"
KO = ROOT / "custom_components" / "green_smart" / "translations" / "ko.json"
EN = ROOT / "custom_components" / "green_smart" / "translations" / "en.json"
README = ROOT / "README.md"

ERROR_KEYS = {
    "invalid_activation_code",
    "activation_code_expired",
    "activation_code_not_active",
    "cannot_connect",
}


def _load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def test_activation_error_messages_are_translated_for_plain_troubleshooting():
    for path in (STRINGS, KO, EN):
        errors = _load(path)["config"]["error"]
        assert ERROR_KEYS.issubset(errors)
        for key in ERROR_KEYS:
            assert errors[key]
            assert key not in errors[key]


def test_activation_form_description_explains_local_demo_boundary():
    for path in (STRINGS, KO, EN):
        description = _load(path)["config"]["step"]["user"]["description"]
        assert "activation" in description.lower() or "활성화" in description
        assert "local" in description.lower() or "로컬" in description
        assert "demo" in description.lower() or "데모" in description


def test_readme_documents_central_baseline_boundaries_for_users():
    readme = README.read_text(encoding="utf-8")

    assert "Central activation baseline" in readme
    assert "demo/local" in readme
    assert "Do not enter real paid vendor credentials" in readme
    assert "/vendor/proxy" in readme
    assert "not exposed" in readme
