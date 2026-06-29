from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
CENTRAL = ROOT / "custom_components/green_smart/central_views.py"
UI_DOC = ROOT / "docs/design/current-ui-design-and-navigation.md"
PLAN = ROOT / "docs/plans/2026-06-24-crop-settings-ui-slice-plan.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _crop_settings(panel: str) -> str:
    return panel.split("  _renderCropSettingsPage()", 1)[1].split("  _renderSeasonSelector()", 1)[0]


def _growth_tab(panel: str) -> str:
    return panel.split("  _renderCropGrowthTab()", 1)[1].split("  _growthMetricGroups", 1)[0]


def _bind_crop_content(panel: str) -> str:
    return panel.split("  _bindCropContent(root)", 1)[1].split("  _bindSeasonButtons", 1)[0]


def test_v1973_crop_tabs_have_visible_basic_icon_without_duplicate_emoji():
    panel = _read(PANEL)
    crop = _crop_settings(panel)
    docs = _read(UI_DOC)
    plan = _read(PLAN)

    assert 'icon: "mdi:sprout"' in crop
    assert 'data-crop-tab-icon' in crop
    assert 'data-crop-tab-label' in crop
    for marker in (
        'emoji: "🌱"',
        'data-crop-tab-emoji',
        '${t.emoji}',
    ):
        assert marker not in crop
    assert '이모티콘 + 하위탭명만 표시' in docs
    assert '이모티콘 + 하위탭명만 표시' in plan
    assert 'mdi:calendar-leaf' not in crop


def test_v1973_growth_latest_survey_uses_korean_crop_label():
    panel = _read(PANEL)
    growth = _growth_tab(panel)
    docs = _read(UI_DOC)
    plan = _read(PLAN)

    for marker in (
        '_cropLabelForDisplay(',
        'const latestCropLabel = this._cropLabelForDisplay(',
        '토마토',
        '상추',
        '파프리카',
        '오이',
        '허브',
    ):
        assert marker in panel
        assert marker in docs
        assert marker in plan

    assert '${latestCropLabel}' in growth
    assert 'latest.cropType || this._selectedSeason()?.cropType' not in growth


def test_v1973_growth_record_rows_have_edit_button_and_binding():
    panel = _read(PANEL)
    growth = _growth_tab(panel)
    bind = _bind_crop_content(panel)
    docs = _read(UI_DOC)
    plan = _read(PLAN)

    for marker in (
        'data-growth-edit',
        'data-crop-growth-edit-action',
        'data-growth-edit="${i}"',
        '_openGrowthEditPopup(',
        'PUT", `green_smart/crop/growth/${id}`',
    ):
        assert marker in panel
        assert marker in docs
        assert marker in plan

    assert '수정' in growth
    assert 'root.querySelectorAll("[data-growth-edit]")' in bind
    assert 'this._openGrowthEditPopup(idx)' in bind


def test_v1973_crop_visual_corrections_version_and_plan_shift():
    manifest = _read(MANIFEST)
    panel = _read(PANEL)
    central = _read(CENTRAL)
    docs = _read(UI_DOC)
    plan = _read(PLAN)

    assert '"version": "1.12.53"' in manifest
    assert 'const VERSION = "1.12.53"' in panel
    assert 'v1.12.53' in panel[:200]
    assert 'EDGE_VERSION = "1.9.96"' in central
    assert '기준 버전: `v1.12.53`' in docs
    assert 'UI Hotfix | v1.9.73 | 작물 설정 시각/표기/수정 UX 보정' in plan
    assert 'UI Slice 3 | v1.9.74 | AI 전략' in plan
