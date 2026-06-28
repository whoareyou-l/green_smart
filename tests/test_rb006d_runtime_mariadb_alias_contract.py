from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CROP_VIEWS = ROOT / "custom_components" / "green_smart" / "crop_views.py"


def test_environment_feature_summary_quotes_mariadb_camelcase_aliases():
    source = CROP_VIEWS.read_text(encoding="utf-8")
    section = source.split("async def _environment_feature_summary", 1)[1].split("async def _irrigation_nutrient_feature_summary", 1)[0]
    for marker in (
        "COUNT(*) AS `sampleCount`",
        "AVG(value) AS `avgValue`",
        "MIN(value) AS `minValue`",
        "MAX(value) AS `maxValue`",
        "SUM(value) AS `sumValue`",
        "AS `dayAvg`",
        "AS `nightAvg`",
        "AS `lastCapturedAt`",
    ):
        assert marker in section
    for forbidden in (
        " AS sampleCount",
        " AS avgValue",
        " AS minValue",
        " AS maxValue",
        " AS sumValue",
    ):
        assert forbidden not in section
