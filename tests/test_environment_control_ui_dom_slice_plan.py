from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT / "docs/design/environment-control-ui-dom-slice-plan.md"
CURRENT_UI = ROOT / "docs/design/current-ui-design-and-navigation.md"
MASTER = ROOT / "docs/PROJECT_MASTER_PLAN.md"
PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_env_control_slice_plan_exists_and_is_linked():
    plan = _read(PLAN)
    current = _read(CURRENT_UI)
    master = _read(MASTER)
    assert "Environment Control UI/DOM Vertical Slice Plan" in plan
    assert "environment-control-ui-dom-slice-plan.md" in current
    assert "environment-control-ui-dom-slice-plan.md" in master
    assert "data-env-setvalue-*" in current


def test_env_control_current_tab_inventory_is_documented():
    plan = _read(PLAN)
    panel = _read(PANEL)
    current_tabs = (
        "mode",
        "temperature",
        "humidity",
        "co2",
        "ai",
        "aiOps",
        "safety",
        "safetyOps",
        "deviceMap",
        "logs",
    )
    for tab in current_tabs:
        assert f"`{tab}`" in plan
    for old_tab in ("mode", "temperature", "humidity", "co2", "aiOps", "safety", "safetyOps", "deviceMap"):
        assert f'data-env-legacy-tab="{old_tab}"' in panel
    for new_tab in ("ai", "interlock", "safety", "ai-settings", "operations", "devices", "logs"):
        assert f'key: "{new_tab}"' in panel or f'key:"{new_tab}"' in panel
    assert "현재 `_envStrategyTabs()`는 10개 하위탭" in plan


def test_env_control_target_tab_restructure_is_documented():
    plan = _read(PLAN)
    for tab in ("overview", "setpoints", "rules", "ai", "operations", "devices", "logs"):
        assert f"`{tab}`" in plan
    for phrase in (
        "목표값 설정",
        "인터록·안전 설정",
        "AI 보정·최종값",
        "운영·리허설",
        "장치 매핑·상태",
        "작동 로그",
    ):
        assert phrase in plan


def test_env_control_setvalue_dom_standard_is_documented():
    plan = _read(PLAN)
    for marker in (
        "data-env-setvalue-subtab",
        "data-env-setvalue-summary-card",
        "data-env-setvalue-section",
        "data-env-setvalue-card",
        "data-env-setvalue-card-header",
        "data-env-setvalue-card-body",
        "data-env-setvalue-row",
        "data-env-setvalue-label",
        "data-env-setvalue-control",
        "data-env-setvalue-current",
        "data-env-setvalue-recommended",
        "data-env-setvalue-input",
        "data-env-setvalue-unit",
        "data-env-setvalue-help",
        "data-env-setvalue-safety-boundary",
        "data-env-setvalue-action-row",
        "data-env-setvalue-save",
        "data-env-setvalue-reset",
        "data-env-setvalue-audit-note",
        "data-control-field",
        "data-control-group",
        "data-control-key",
    ):
        assert marker in plan


def test_env_control_setvalue_safety_and_forbidden_markers_are_documented():
    plan = _read(PLAN)
    assert "현장 Edge 인터록과 SafetyGuard가 최종 적용을 제한합니다." in plan
    for marker in (
        "data-env-setvalue-direct-execute",
        "environmentSetValueAllowDirectExecution",
        "data-env-control-bypass-safety",
    ):
        assert marker in plan
