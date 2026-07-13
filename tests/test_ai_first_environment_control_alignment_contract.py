from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
UI_DOC = ROOT / "docs/design/current-ui-design-and-navigation.md"
MASTER = ROOT / "docs/PROJECT_MASTER_PLAN.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _method(panel: str, start: str, end: str) -> str:
    return panel.split(start, 1)[1].split(end, 1)[0]


def test_v1103_ai_first_versions_and_docs():
    panel = _read(PANEL)
    docs = _read(UI_DOC) + "\n" + _read(MASTER)
    assert '"version": "1.15.59"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.59"' in panel
    assert 'v1.15.59' in panel[:200]
    assert "v1.10.9 AI-first control tab alignment" in docs


def test_crop_settings_ai_strategy_tab_is_first():
    panel = _read(PANEL)
    crop_page = _method(panel, '  _renderCropSettingsPage() {', '  _renderSeasonSelector() {')
    assert crop_page.index('{ key: "ai",      label: "AI 전략"') < crop_page.index('{ key: "basic",   label: "작기 설정"')
    assert 'if (!tabs.some((t) => t.key === this._cropSubTab)) this._cropSubTab = "ai";' in crop_page
    content = _method(panel, '  _renderCropTabContent() {', '  _seasonZoneLabel(s) {')
    assert 'return this._renderCropAiStrategyTab();' in content.split('return this._renderCropBasicTab();', 1)[0]


def test_environment_ai_strategy_tab_is_first_and_named_like_crop():
    panel = _read(PANEL)
    tabs = _method(panel, '  _envStrategyTabs() {', '  _renderEnvStrategyTabBar() {')
    assert tabs.index('{ key: "ai", label: "AI 전략", icon: "mdi:brain" }') < tabs.index('{ key: "interlock", label: "인터록 설정"')
    tabbar = _method(panel, '  _renderEnvStrategyTabBar() {', '  _renderEnvStrategyTabContent')
    assert 'this._envStrategyTab = "ai";' in tabbar
    ai = _method(panel, '  _renderEnvAiStrategyTabContent(s, modeOptions, aiStatusOptions, statusText) {', '  _renderEnvStrategyTabContent')
    for marker in (
        'data-env-ai-strategy-panel',
        'data-env-ai-main-card="environment-status"',
        'data-env-ai-main-card="interlock-status"',
        'data-env-ai-main-card="model-status"',
        'data-env-ai-readonly-boundary',
        'AI 전략',
        '현장 Edge가 최종 판단 · read-only · 자동 실행 없음',
    ):
        assert marker in ai


def test_environment_control_mode_card_removed_from_visible_composition():
    panel = _read(PANEL)
    safety = _method(panel, '  _renderControlSafetyOpsTabContent(domain) {', '  _renderControlDeviceMapTabContent(domain) {')
    patcher = _method(panel, '  _patchZoneControlElementCards(domain) {', '  _renderZoneControlModeCard(domain) {')
    assert '_renderZoneControlModeCard(domain)' not in safety
    assert '[data-zone-control-mode-card]' not in safety
    assert '_renderZoneControlModeCard(domain)' not in patcher
    assert 'data-env-control-mode-card-removed' in panel


def test_setvalue_rows_use_fixed_alignment_columns_not_content_width():
    panel = _read(PANEL)
    for name, next_name in (
        ('  _strategyInput(group, key, label, val, unit = "", min = 0, max = 100, step = 1, marker = "") {', '  _strategyToggle'),
        ('  _strategyToggle(group, key, label, checked, marker = "") {', '  _strategySelect'),
        ('  _strategySelect(group, key, label, value, options, marker = "") {', '  _strategySection'),
    ):
        method = _method(panel, name, next_name)
        assert 'data-env-setvalue-row-main' in method
        assert 'grid-template-columns:160px minmax(112px,1fr) minmax(118px,1fr) minmax(156px,156px)' in method
        assert 'data-env-setvalue-fixed-alignment' in method
        assert 'text-align:right' in method
        assert 'justify-self:stretch' in method
