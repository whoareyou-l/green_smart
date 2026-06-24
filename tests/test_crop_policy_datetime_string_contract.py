from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CROP = ROOT / "custom_components/green_smart/crop_views.py"


def test_crop_policy_datetime_fields_are_normalized_before_replace_tzinfo():
    source = CROP.read_text(encoding="utf-8")

    assert "def _coerce_naive_datetime(" in source
    assert "received_at_dt = _coerce_naive_datetime(received_at)" in source
    assert "valid_until_dt = _coerce_naive_datetime(valid_until)" in source
    assert "received_at.replace(tzinfo=None)" not in source
    assert "valid_until.replace(tzinfo=None)" not in source
    assert "policy_datetime_parse_failed" in source
