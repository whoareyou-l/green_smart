from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
CENTRAL = ROOT / "custom_components/green_smart/central_views.py"
UI_DOC = ROOT / "docs/design/current-ui-design-and-navigation.md"
PLAN = ROOT / "docs/plans/2026-06-24-crop-settings-ui-slice-plan.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_v1968_crop_settings_has_five_subpage_ia_contract():
    panel = _read(PANEL)
    docs = _read(UI_DOC)
    plan = _read(PLAN)

    expected_tabs = {
        'basic': '작기 설정',
        'growth': '생육조사',
        'ai': 'AI 전략',
        'pest': '병해충 예찰',
        'control': '방제 기록',
    }
    for key, label in expected_tabs.items():
        assert f'key: "{key}"' in panel
        assert f'label: "{label}"' in panel
        assert f'| `{key}` | {label} |' in docs
        assert f'| `{key}` | {label} |' in plan

    for render_call in (
        'if (this._cropSubTab === "growth")  return this._renderCropGrowthTab();',
        'if (this._cropSubTab === "ai")      return this._renderCropAiStrategyTab();',
        'if (this._cropSubTab === "pest")    return this._renderCropPestTab();',
        'if (this._cropSubTab === "control") return this._renderCropControlTab();',
        'return this._renderCropBasicTab();',
    ):
        assert render_call in panel


def test_v1968_crop_settings_shared_ui_marker_policy_is_documented_and_present():
    panel = _read(PANEL)
    docs = _read(UI_DOC)
    plan = _read(PLAN)

    for marker in (
        'data-crop-ui-shell',
        'data-crop-ui-tab-bar',
        'data-crop-ui-subpage-summary',
        'data-crop-ui-kpi-grid',
        'data-crop-ui-action-bar',
        'data-crop-ui-record-list',
        'data-crop-ui-advanced-details',
        'data-crop-ui-empty-state',
    ):
        assert marker in panel
        assert marker in docs
        assert marker in plan

    for phrase in (
        '하위페이지 1개 = 슬라이스 1개',
        '카드 병합/삭제/추가/접기',
        '농장주/농장직원',
        '모바일 + PC 반응형',
        'RBAC',
    ):
        assert phrase in docs
        assert phrase in plan


def test_v1968_crop_settings_no_execution_authority_creep_contract():
    panel = _read(PANEL)
    plan = _read(PLAN)

    forbidden_markers = (
        'data-crop-ui-execute-device',
        'data-crop-ui-train-production-model',
        'cropSettingsAllowExecution',
    )
    for marker in forbidden_markers:
        assert marker not in panel
        assert marker in plan


def test_v1968_version_markers_for_crop_settings_ui_slice_zero():
    manifest = _read(MANIFEST)
    panel = _read(PANEL)
    central = _read(CENTRAL)
    docs = _read(UI_DOC)
    plan = _read(PLAN)

    assert '"version": "1.14.75"' in manifest
    assert 'const VERSION = "1.14.75"' in panel
    assert 'v1.14.75' in panel[:200]
    assert 'EDGE_VERSION = "1.9.96"' in central
    assert 'v1.9.72' in docs
    assert 'UI Slice 0 | v1.9.68' in plan
