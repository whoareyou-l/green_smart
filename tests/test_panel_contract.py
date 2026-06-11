import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"


def test_panel_bundle_exists_and_registers_green_smart_element():
    source = PANEL.read_text(encoding="utf-8")

    assert "customElements.define" in source
    assert "green-smart-panel" in source


def test_panel_does_not_embed_obvious_secrets_or_prod_urls():
    source = PANEL.read_text(encoding="utf-8")

    forbidden_patterns = [
        r"gh[pousr]_[0-9A-Za-z]{30,}",
        r"sk-[A-Za-z0-9]{32,}",
        r"AKIA[0-9A-Z]{16}",
        r"cloudflared.{0,40}token",
        r"127\.0\.0\.1:8123",
        r"greenhouse-control",
    ]
    assert not any(re.search(pattern, source, flags=re.IGNORECASE) for pattern in forbidden_patterns)
