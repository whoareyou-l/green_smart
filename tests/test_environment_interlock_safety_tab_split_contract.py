from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
UI_DOC = ROOT / "docs/design/current-ui-design-and-navigation.md"
MASTER = ROOT / "docs/PROJECT_MASTER_PLAN.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _section(text: str, start: str, end: str) -> str:
    return text.split(start, 1)[1].split(end, 1)[0]


def test_v1104_interlock_safety_split_versions_and_docs():
    panel = _read(PANEL)
    docs = _read(UI_DOC) + "\n" + _read(MASTER)
    assert '"version": "1.12.34"' in _read(MANIFEST)
    assert 'const VERSION = "1.12.34"' in panel
    assert 'v1.12.34' in panel[:200]
    assert "v1.10.9 Environment interlock/safety tab split" in docs


def test_environment_tabs_merge_targets_and_interlock_then_safety():
    panel = _read(PANEL)
    tabs = _section(panel, '  _envStrategyTabs() {', '  _renderEnvStrategyTabBar() {')
    expected_order = [
        '{ key: "ai", label: "AI 전략"',
        '{ key: "interlock", label: "인터록 설정"',
        '{ key: "safety", label: "안전 설정"',
        '{ key: "ai-settings", label: "AI 보정 설정"',
    ]
    positions = [tabs.index(marker) for marker in expected_order]
    assert positions == sorted(positions)
    for removed in ('key: "setpoints"', 'key: "rules"'):
        assert removed not in tabs
    for legacy in ('data-env-legacy-tab="setpoints"', 'data-env-legacy-tab="rules"'):
        assert legacy in panel


def test_interlock_tab_contains_targets_and_pid_interlock_rules_together():
    panel = _read(PANEL)
    content = _section(panel, '  _renderEnvStrategyTabContent(s, modeOptions, aiStatusOptions, statusText) {', '    const statusSummary =')
    assert 'if (tab === "interlock")' in content
    interlock = content.split('if (tab === "interlock")', 1)[1].split('if (tab === "safety")', 1)[0]
    for marker in (
        'data-env-interlock-settings-tab',
        '인터록 설정',
        '목표값은 인터록 PID 기준값으로 함께 관리합니다',
        '온도 PID 목표값',
        '습도·VPD PID 목표값',
        'CO₂ PID 목표값',
        '온도 인터록',
        '습도·CO₂ 인터록',
        '_strategyInput("baseInterlockSettings", "dayTargetTemp"',
        '_strategyInput("temperatureControl", "heatingStartTemp"',
        'data-env-setvalue-save',
    ):
        assert marker in interlock
    assert '제어 모드' not in interlock
    assert '_strategySelect("root", "controlMode"' not in interlock


def test_safety_tab_contains_safety_boundaries_not_target_pid_values():
    panel = _read(PANEL)
    content = _section(panel, '  _renderEnvStrategyTabContent(s, modeOptions, aiStatusOptions, statusText) {', '    const statusSummary =')
    assert 'if (tab === "safety")' in content
    safety = content.split('if (tab === "safety")', 1)[1].split('if (tab === "ai-settings")', 1)[0]
    for marker in (
        'data-env-safety-settings-tab',
        '안전 설정',
        '절대 안전 한계',
        '센서 오류 시 제어 방식',
        '강풍 폐쇄 풍속',
        'SafetyGuard',
        '_strategyInput("safetyLimits", "absoluteMaxTemp"',
        '_strategySelect("safetyLimits", "sensorErrorMode"',
        'data-env-setvalue-save',
    ):
        assert marker in safety
    assert '_strategyInput("baseInterlockSettings", "dayTargetTemp"' not in safety
    assert '온도 PID 목표값' not in safety


def test_control_mode_card_removed_from_interlock_safety_composition():
    panel = _read(PANEL)
    content = _section(panel, '  _renderEnvStrategyTabContent(s, modeOptions, aiStatusOptions, statusText) {', '  _loadControlScope() {')
    interlock = content.split('if (tab === "interlock")', 1)[1].split('if (tab === "safety")', 1)[0]
    safety_ops = _section(panel, '  _renderControlSafetyOpsTabContent(domain) {', '  _renderControlDeviceMapTabContent(domain) {')
    assert '제어 모드' not in interlock
    assert 'data-zone-control-mode-card' not in interlock
    assert '_renderZoneControlModeCard(domain)' not in safety_ops
    assert 'data-env-control-mode-card-removed' in safety_ops


def test_fixed_alignment_survives_merged_interlock_and_safety_tabs():
    panel = _read(PANEL)
    for method_name, next_name in (
        ('  _strategyInput(group, key, label, val, unit = "", min = 0, max = 100, step = 1, marker = "") {', '  _strategyToggle'),
        ('  _strategySelect(group, key, label, value, options, marker = "") {', '  _strategySection'),
    ):
        method = _section(panel, method_name, next_name)
        assert 'data-env-setvalue-fixed-alignment' in method
        assert 'grid-template-columns:160px minmax(112px,1fr) minmax(118px,1fr) minmax(156px,156px)' in method
        assert 'text-align:right' in method
