import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
KMA_GRID = ROOT / "custom_components" / "green_smart" / "kma_grid.py"


def _load_kma_grid():
    spec = importlib.util.spec_from_file_location("green_smart_kma_grid_for_tests", KMA_GRID)
    assert spec is not None
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def test_search_locations_finds_seoul_gangnam_with_grid_and_regids():
    kma_grid = _load_kma_grid()

    results = kma_grid.search_locations("서울 강남", max_results=3)

    assert results
    first = results[0]
    assert first["name"] == "서울특별시 강남구"
    assert first["nx"] == 61
    assert first["ny"] == 126
    assert first["ta_regid"] == "11B10101"
    assert first["land_regid"] == "11B00000"


def test_search_locations_supports_short_sido_names_dedupes_grid_and_respects_limit():
    kma_grid = _load_kma_grid()

    results = kma_grid.search_locations("경기 수원", max_results=2)

    assert len(results) == 2
    assert [item["name"] for item in results] == [
        "경기도 수원시 장안구",
        "경기도 수원시 영통구",
    ]
    assert {(item["nx"], item["ny"]) for item in results} == {(60, 121), (61, 121)}


def test_search_locations_returns_empty_for_blank_query():
    kma_grid = _load_kma_grid()

    assert kma_grid.search_locations("   ") == []


def test_get_regids_prefers_longer_specific_region_keys():
    kma_grid = _load_kma_grid()

    assert kma_grid.get_regids("전북특별자치도 전주시 완산구") == ("11F10501", "11F10000")
    assert kma_grid.get_regids("제주특별자치도 제주시") == ("11G00201", "11G00000")


def test_get_regids_defaults_to_seoul_when_unknown_or_blank():
    kma_grid = _load_kma_grid()

    assert kma_grid.get_regids("") == ("11B10101", "11B00000")
    assert kma_grid.get_regids("없는 지역") == ("11B10101", "11B00000")
