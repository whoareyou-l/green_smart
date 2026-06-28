from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REBUILD_PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "rebuild" / "green-smart-rebuild-panel.js"
RESEARCH_DOC = ROOT / "docs" / "rebuild" / "rs-002-home-dashboard-research.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_rs002_home_dashboard_uses_crop_centered_os_flow():
    source = _read(REBUILD_PANEL)
    for marker in (
        "renderOperatingHome",
        "data-crop-os-home",
        "data-crop-os-stage=\"crop-status\"",
        "data-crop-os-stage=\"growth-goal\"",
        "data-crop-os-stage=\"environment-impact\"",
        "data-crop-os-stage=\"recommend-act\"",
    ):
        assert marker in source


def test_rs002_home_dashboard_labels_are_crop_first_not_function_first():
    source = _read(REBUILD_PANEL)
    for label in (
        "작물 중심 운영체계",
        "작물상태",
        "생육목표",
        "환경·관수·장치 영향",
        "추천·실행",
        "작물이 먼저이고 제어는 그 다음입니다",
        "데이터 연결 전",
        "추천은 실행 전 승인과 안전검사를 거칩니다",
    ):
        assert label in source


def test_rs002_home_dashboard_supports_zone_specific_crop_contexts():
    source = _read(REBUILD_PANEL)
    for marker in (
        "REBUILD_ZONE_CONTEXTS",
        "data-crop-os-zone-contexts",
        "data-zone-context-card",
        "data-zone-context-id",
        "data-zone-context-crop",
        "data-zone-context-state",
        "data-zone-context-equipment",
        "구역별 작물 운영",
        "구역마다 작물·상태·장비 구성이 다릅니다",
        "토마토",
        "딸기",
        "천창",
        "측창",
        "양액기",
        "보온커튼",
    ):
        assert marker in source


def test_rs002_zone_context_keeps_crop_as_main_frame_but_zones_as_detail_frame():
    source = _read(REBUILD_PANEL)
    assert "작물 중심" in source
    assert "구역별" in source
    assert source.index("작물 중심 운영체계") < source.index("구역별 작물 운영")


def test_rs002_rebuild_nav_does_not_present_legacy_domain_tabs_as_primary_frame():
    source = _read(REBUILD_PANEL)
    nav_section = source.split("const REBUILD_PAGES", 1)[1].split("]);", 1)[0]
    for forbidden in (
        'key: "crop"',
        'key: "environment"',
        'key: "irrigation"',
        'key: "device"',
        'key: "admin"',
    ):
        assert forbidden not in nav_section
    for marker in (
        'key: "crop-status"',
        'key: "growth-goal"',
        'key: "influence-map"',
        'key: "recommend-act"',
    ):
        assert marker in nav_section


def test_rs002_home_dashboard_is_not_legacy_dashboard_copy():
    source = _read(REBUILD_PANEL)
    forbidden = (
        "dashboard-version-footer",
        "_renderDashboard",
        "_renderHomePage",
        "data-home-status-card",
        "data-vs001-sensor-refresh",
        "crop_seasons",
        "growth_surveys",
        "SafetyGuard Watchdog",
        "환경 전략 MVP",
        "관수 전략 MVP",
        "Green Smart — Modern SaaS greenhouse dashboard",
    )
    for marker in forbidden:
        assert marker not in source


def test_rs002_research_doc_records_product_pattern_and_chosen_direction():
    doc = _read(RESEARCH_DOC)
    for marker in (
        "Priva / Priva One",
        "Hoogendoorn IIVO",
        "Ridder Climate",
        "Argus Controls",
        "Climate Control Systems",
        "Netafim GrowSphere",
        "Korean Nongsaro",
        "Crop-centered OS: 작물상태 → 생육목표 → 환경/관수/장치 영향 → 추천/실행",
        "Home / Crop / Environment / Irrigation / Device / Admin as the main conceptual frame is too legacy-like",
    ):
        assert marker in doc
