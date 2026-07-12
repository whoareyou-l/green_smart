from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
PLAN = ROOT / "docs/plans/2026-07-11-settings-cache-prewarm-plan.md"


def source() -> str:
    return PANEL.read_text()


def test_v1_15_29_settings_cache_prewarm_state_and_lifecycle():
    text = source()
    assert 'const REBUILD_VERSION = "1.15.47"' in text
    for marker in [
        'this._r7SettingsCachePrewarmTimer = 0;',
        'this._r7SettingsCachePrewarmIdle = 0;',
        'this._r7SettingsCachePrewarmed = false;',
        'this._scheduleR7SettingsCachePrewarm("connected-idle");',
        'this._cancelR7SettingsCachePrewarm();',
    ]:
        assert marker in text


def test_v1_15_29_settings_cache_prewarm_uses_idle_with_timer_fallback():
    text = source()
    block = text[text.index('_scheduleR7SettingsCachePrewarm(source = "idle")'):text.index('_runR7SettingsCachePrewarm(source = "idle")')]
    assert 'createElement?.("section")' in block
    assert 'createElement?.("template")?.content' in block
    assert 'data-r7-settings-cache-prewarm", "scheduled"' in block
    assert 'requestIdleCallback(run, { timeout: 600 })' in block
    assert 'setTimeout(run, 120)' in block
    assert 'this._r7SettingsCachePrewarmed' in block


def test_v1_15_29_settings_cache_prewarm_creates_shell_and_panel_without_attach():
    text = source()
    block = text[text.index('_runR7SettingsCachePrewarm(source = "idle")'):text.index('_openR7SettingsDomainFromCache(source = "settings-navigation")')]
    assert 'this._getOrCreateR7CachedSettingsDomainShell();' in block
    assert 'this._getOrCreateR7CachedSettingsPanel(activeTab);' in block
    assert 'this._patchR7CachedSettingsPanelData(activeTab);' in block
    assert 'data-r7-settings-cache-prewarm", "done"' in block
    assert 'data-r7-settings-domain-shell-prewarmed", "true"' in block
    assert 'data-r7-settings-panel-prewarmed", activeTab' in block
    assert '_attachR7CachedSettingsDomainShell' not in block
    assert 'renderR7ActiveDomainPage' not in block


def test_v1_15_29_first_settings_attach_records_prewarmed_cache_hit():
    text = source()
    start = text.index('  _attachR7CachedSettingsDomainShell(workspace)')
    block = text[start:text.index('  _patchR7MobileActiveDomainPage()', start)]
    assert 'const hadShellBeforeAttach = Boolean(this._r7DomainShellCache?.get?.(cacheKey));' in block
    assert 'const wasPrewarmed = Boolean(this._r7SettingsCachePrewarmed && hadShellBeforeAttach);' in block
    assert 'data-r7-settings-domain-shell-attach-cache-state' in block
    assert 'hit-prewarmed' in block
    assert 'miss-created' in block


def test_v1_15_29_prewarm_plan_documents_first_click_cache_hit_strategy():
    plan = PLAN.read_text()
    assert '첫 설정 클릭' in plan
    assert 'cache miss가 발생하지 않도록' in plan
    assert 'requestIdleCallback' in plan
    assert 'hit-prewarmed' in plan
