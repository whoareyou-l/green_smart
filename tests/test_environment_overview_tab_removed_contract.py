from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
UI_DOC = ROOT / "docs/design/current-ui-design-and-navigation.md"
MASTER = ROOT / "docs/PROJECT_MASTER_PLAN.md"
PLAN = ROOT / "docs/design/environment-control-ui-dom-slice-plan.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _section(text: str, start: str, end: str) -> str:
    return text.split(start, 1)[1].split(end, 1)[0]


def test_v1108_versions_and_docs_for_overview_tab_removed():
    panel = _read(PANEL)
    docs = _read(UI_DOC) + "\n" + _read(MASTER) + "\n" + _read(PLAN)
    assert '"version": "1.14.78"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.78"' in panel
    assert 'v1.14.78' in panel[:200]
    assert "v1.10.9 Environment overview tab removed" in docs


def test_environment_tab_order_no_overview_and_interlock_follows_ai():
    panel = _read(PANEL)
    tabs = _section(panel, '  _envStrategyTabs() {', '  _renderEnvStrategyTabBar() {')
    assert 'key: "overview"' not in tabs
    assert 'label: "운영 요약"' not in tabs
    expected = [
        '{ key: "ai", label: "AI 전략"',
        '{ key: "interlock", label: "인터록 설정"',
        '{ key: "safety", label: "안전 설정"',
        '{ key: "ai-settings", label: "AI 보정 설정"',
        '{ key: "operations", label: "운영·리허설"',
        '{ key: "logs", label: "작동 로그"',
    ]
    positions = [tabs.index(marker) for marker in expected]
    assert positions == sorted(positions)


def test_environment_overview_content_branch_removed_but_legacy_marker_retained():
    panel = _read(PANEL)
    content = _section(panel, '  _renderEnvStrategyTabContent(s, modeOptions, aiStatusOptions, statusText) {', '  _loadControlScope() {')
    assert 'if (tab === "overview")' not in content
    assert '환경 제어 운영 요약' not in content
    assert 'data-env-legacy-tab="overview"' in panel


def test_environment_unified_shell_and_core_tabs_remain():
    panel = _read(PANEL)
    env_page = _section(panel, '  _renderEnvSettingsPage() {', '  _cloneIrrigationDefaults() {')
    for marker in (
        'data-env-unified-scope-tab-card',
        'data-env-scope-inline',
        'data-env-strategy-content',
        'data-env-zone-card-helper-doc-only',
        'data-env-storage-scope-doc-only',
    ):
        assert marker in panel
    assert '_renderEnvStrategyTabBar()' in env_page
    assert '_renderControlScopeBar("environment")' in env_page
    assert 'data-env-control-bypass-safety' not in panel
