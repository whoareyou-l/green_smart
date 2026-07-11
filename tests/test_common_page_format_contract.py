from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
CENTRAL = ROOT / "custom_components/green_smart/central_views.py"
UI_DOC = ROOT / "docs/design/current-ui-design-and-navigation.md"
PLAN = ROOT / "docs/plans/2026-06-24-crop-settings-ui-slice-plan.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_v1970_common_main_page_format_helper_and_targets_are_documented():
    panel = _read(PANEL)
    docs = _read(UI_DOC)
    plan = _read(PLAN)

    for marker in (
        '_renderCommonMainPageShell(',
        'data-common-main-page',
        'data-common-main-hero',
        'data-common-main-body',
        'data-common-main-page="crop"',
        'data-common-main-page="environment"',
        'data-common-main-page="irrigation"',
        'data-common-main-page="device"',
        'data-common-main-page="admin-system"',
    ):
        assert marker in panel
        assert marker in docs
        assert marker in plan

    for phrase in (
        '공통 메인 포맷',
        '작물 설정 / 환경 제어 / 관수 제어 / 장치 제어 / Admin/System',
        'hero + scope/status summary + content card',
    ):
        assert phrase in docs
        assert phrase in plan


def test_v1970_crop_tabs_use_environment_style_icon_and_text_tabs():
    panel = _read(PANEL)
    docs = _read(UI_DOC)
    plan = _read(PLAN)

    for marker in (
        'data-crop-ui-icon-tab',
        'data-crop-tab-icon',
        'data-crop-tab-label',
    ):
        assert marker in panel
        assert marker in docs
        assert marker in plan

    for icon in (
        'mdi:sprout',
        'mdi:clipboard-pulse-outline',
        'mdi:brain',
        'mdi:bug-outline',
        'mdi:spray',
    ):
        assert icon in panel

    assert '<ha-icon icon="${t.icon}"' in panel
    assert '${t.label}' in panel
    assert 'display:flex;align-items:center;gap:5px' in panel


def test_v1970_common_format_is_planned_before_growth_slice_and_versions_shifted():
    plan = _read(PLAN)

    assert 'UI Foundation | v1.9.70 | 공통 메인 포맷 + 작물 아이콘 탭' in plan
    assert 'UI Slice 2 | v1.9.71 | 생육조사' in plan
    assert 'UI Slice 3 | v1.9.74 | AI 전략' in plan
    assert 'UI Slice 4 | v1.9.75 | 병해충 예찰' in plan
    assert 'UI Slice 5 | v1.9.76 | 방제 기록' in plan
    assert 'UI Slice 6 | v1.9.77 | Cross-subpage consistency pass' in plan


def test_v1970_common_format_version_markers():
    manifest = _read(MANIFEST)
    panel = _read(PANEL)
    central = _read(CENTRAL)
    docs = _read(UI_DOC)
    plan = _read(PLAN)

    assert '"version": "1.15.33"' in manifest
    assert 'const VERSION = "1.15.33"' in panel
    assert 'v1.15.33' in panel[:200]
    assert 'EDGE_VERSION = "1.9.96"' in central
    assert 'v1.9.72' in docs
    assert 'UI Foundation | v1.9.70' in plan
