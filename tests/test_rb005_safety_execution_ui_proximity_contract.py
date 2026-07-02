from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
MANIFEST = ROOT / "custom_components" / "green_smart" / "manifest.json"
PRODUCT_PLAN = ROOT / "docs" / "plans" / "2026-06-28-green-smart-product-first-rebuild-plan.md"
FRONTEND_PLAN = ROOT / "docs" / "rebuild" / "frontend-decomposition-plan.md"
UI_DOC = ROOT / "docs" / "design" / "current-ui-design-and-navigation.md"
PROJECT_MASTER = ROOT / "docs" / "PROJECT_MASTER_PLAN.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _section(text: str, start: str, end: str) -> str:
    return text.split(start, 1)[1].split(end, 1)[0]


def test_rb005_version_surfaces_are_v11116():
    assert '"version": "1.14.24"' in _read(MANIFEST)
    panel = _read(PANEL)
    assert 'const VERSION = "1.14.24"' in panel
    assert "v1.14.24" in panel[:240]
    assert "v1.14.24" in _read(PRODUCT_PLAN)


def test_rb005_adds_execution_proximity_safety_summary_helper():
    panel = _read(PANEL)
    for marker in (
        "_renderZoneExecutionProximitySafetySummary(domain)",
        "data-zone-execution-proximity-safety-summary",
        "data-zone-execution-proximity-domain",
        "data-zone-execution-proximity-safetyguard",
        "data-zone-execution-proximity-interlock",
        "data-zone-execution-proximity-failsafe",
        "data-zone-execution-proximity-rehearsal",
        "data-zone-execution-proximity-state-verification",
        "SafetyGuard → Interlock → Fail Safe → State verification",
        "실행 semantics 변경 없음",
        "실제 장비 연결 금지",
    ):
        assert marker in panel


def test_rb005_places_safety_summary_next_to_dry_run_and_final_execute_buttons():
    panel = _read(PANEL)
    dry_run = _section(panel, "  _renderZoneDryRunPreviewCard(domain)", "  _renderZoneExecutionLogCard(domain)")
    operator = _section(panel, "  _renderZoneOperatorConfirmCard(domain)", "  _renderZoneDryRunPreviewCard(domain)")

    assert "this._renderZoneExecutionProximitySafetySummary(domain)" in dry_run
    assert "this._renderZoneExecutionProximitySafetySummary(domain)" in operator
    assert dry_run.index("data-zone-execution-proximity-safety-summary") < dry_run.index("data-zone-dry-run-preview")
    assert operator.index("data-zone-execution-proximity-safety-summary") < operator.index("data-zone-final-execute-confirmed")

    for marker in (
        "data-zone-dry-run-preview",
        "data-zone-final-execute-confirmed",
        "green_smart/zones/execute-final-targets",
        "dry_run: true",
        "dry_run: false",
        "operator_confirmed",
    ):
        assert marker in panel


def test_rb005_is_ui_only_no_execution_semantics_or_backend_boundary_changes():
    panel = _read(PANEL)
    execute_section = _section(panel, "  async _executeZoneFinalTargets(domain)", "  async _fetchZoneSafetyGuardWatchdog(domain)")
    dry_run_section = _section(panel, "  async _previewZoneFinalTargetsDryRun(domain)", "  async _fetchZoneRehearsalReadiness(domain)")

    for marker in (
        '"POST", "green_smart/zones/execute-final-targets"',
        "dry_run: false",
        "...this._operatorExecutionConfirmationPayload(domain)",
        "await this._fetchZoneFinalTargets(domain);",
        "await this._fetchZoneExecutionLogs(domain);",
    ):
        assert marker in execute_section
    for marker in (
        '"POST", "green_smart/zones/execute-final-targets"',
        "dry_run: true",
        "post_state_delay: 0",
    ):
        assert marker in dry_run_section

    forbidden = (
        "new WebSocket",
        "mqtt.publish",
        "hass.services.async_call",
        "/api/green_smart/zones/execute-final-targets-v2",
        "CREATE TABLE",
        "ALTER TABLE",
    )
    rb005_region = _section(panel, "  _renderZoneExecutionProximitySafetySummary(domain)", "  _renderZoneVirtualRehearsalCard(domain)")
    for marker in forbidden:
        assert marker not in rb005_region


def test_rb005_docs_record_safety_execution_ui_proximity_scope():
    combined = "\n".join(_read(path) for path in (PRODUCT_PLAN, FRONTEND_PLAN, UI_DOC, PROJECT_MASTER))
    for marker in (
        "RB-005 Safety/Execution UI proximity",
        "v1.14.24",
        "data-zone-execution-proximity-safety-summary",
        "SafetyGuard/Interlock/Fail Safe summary near execution-capable controls",
        "실행 semantics 변경 없음",
        "API/DB 변경 없음",
        "device execution 변경 없음",
        "actual service call authority 변경 없음",
        "virtual rehearsal before physical device hookup",
    ):
        assert marker in combined
