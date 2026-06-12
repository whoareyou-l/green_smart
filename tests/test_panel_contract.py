import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
MANIFEST = ROOT / "custom_components" / "green_smart" / "manifest.json"


def test_panel_bundle_exists_and_registers_green_smart_element():
    source = PANEL.read_text(encoding="utf-8")

    assert "customElements.define" in source
    assert "green-smart-panel" in source


def test_panel_registration_is_idempotent_for_frontend_reload():
    source = PANEL.read_text(encoding="utf-8")

    guard = 'if (!customElements.get("green-smart-panel")) {'
    define = 'customElements.define("green-smart-panel", GreenSmartPanel);'

    assert guard in source
    assert define in source
    assert source.index(guard) < source.index(define)


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


def test_panel_version_constant_matches_manifest_version():
    source = PANEL.read_text(encoding="utf-8")
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))

    version_match = re.search(r'const VERSION = "([^"]+)";', source)

    assert version_match
    assert version_match.group(1) == manifest["version"]


def test_home_dashboard_renders_version_footer_at_bottom():
    source = PANEL.read_text(encoding="utf-8")
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))

    assert 'class="dashboard-version-footer"' in source
    assert 'data-dashboard-version' in source
    assert 'Green Smart v${VERSION}' in source
    assert f'const VERSION = "{manifest["version"]}";' in source

    equip_grid = source.index("${this._renderEquipGrid()}")
    footer = source.index('class="dashboard-version-footer"')
    home_end = source.index("  _renderKPIStrip", footer)
    assert equip_grid < footer < home_end
