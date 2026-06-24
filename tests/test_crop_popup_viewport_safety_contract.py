from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"


def test_crop_popup_card_is_viewport_safe_for_long_control_modal():
    panel = PANEL.read_text(encoding="utf-8")
    styles = panel.split(".popup-card{", 1)[1].split(".pop-header", 1)[0]
    assert "max-height:min(88vh" in styles
    assert "overflow-y:auto" in styles
    assert "overscroll-behavior:contain" in styles
    assert "data-control-dose-grid" in panel
    assert "data-pyeong-amount-output" in panel
