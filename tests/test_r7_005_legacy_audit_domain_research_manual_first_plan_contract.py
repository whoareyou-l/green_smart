from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / "docs/rebuild/r7-005-legacy-audit-domain-research-manual-first-plan.md"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
FRONTEND_PANEL = ROOT / "custom_components/green_smart/frontend_panel.py"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_005_locks_user_requested_sequence_before_more_ui_work():
    text = _read(DOC)
    required_order = [
        "1. Legacy Influence Audit",
        "2. Environment-Control Program Domain Research",
        "3. Research Synthesis",
        "4. Green Smart Manual-first Target Domain Plan",
        "5. Reclassification of prior R7 work",
        "6. Manual/Base Settings-first Domain Reset",
        "7. AI Assist Layer Repositioning",
        "8. Later UI/API/contract rework",
    ]
    for item in required_order:
        assert item in text
    indexes = [text.index(item) for item in required_order]
    assert indexes == sorted(indexes)
    assert "must not skip directly from current R7-004 to recommendation/execution UI" in text


def test_r7_005_audits_legacy_influence_without_calling_main_panel_legacy():
    text = _read(DOC)
    frontend = _read(FRONTEND_PANEL)
    rebuild = _read(REBUILD_PANEL)
    legacy = _read(LEGACY_PANEL)

    assert '_PANEL_COMPONENT_BASE = "green-smart-rebuild-panel"' in frontend
    assert 'webcomponent_name=component_name' in frontend
    assert '_LEGACY_PANEL_COMPONENT = "green-smart-panel"' not in frontend
    assert "main panel is not the legacy panel" in text
    assert "legacy panel remains a file-only reference asset" in text
    assert "R7-003 five placeholder subpages | DEPRECATE/REWRITE" in text
    assert "R7-004 settings/admin read-only detail | KEEP/ADAPT" in text
    assert "legacy panel | LEGACY" in text
    assert "data-r7-" in rebuild
    assert "Legacy panel compatibility surface" in legacy


def test_r7_005_synthesizes_real_environment_control_domains():
    text = _read(DOC)
    vendors = ["Priva", "Hoogendoorn IIVO", "Ridder Hortimax", "Argus Controls", "Autogrow/MultiGrow"]
    for vendor in vendors:
        assert vendor in text
    target_domains = [
        "운영 홈",
        "작물 운영",
        "환경 제어",
        "관수 제어",
        "장치 제어",
        "자동화 제어",
        "안전 제어",
        "설정",
    ]
    for domain in target_domains:
        assert domain in text
    common_patterns = [
        "Climate / Environment",
        "Irrigation / Fertigation / Water / Reservoirs",
        "Devices / Actuators / Screens / Lighting / CO2 / Technical rooms",
        "Alarms / Audit / Safety / Diagnostics",
        "Data / AI / Optimization / Reporting",
    ]
    for pattern in common_patterns:
        assert pattern in text


def test_r7_005_ai_is_assist_layer_not_primary_control_path():
    text = _read(DOC)
    required = [
        "Manual/Base Settings",
        "Rule/Schedule Automation",
        "AI Assist / Optimization",
        "Safety/Interlock/Fail Safe Finalization",
        "수동 설정이 원본이다.",
        "AI는 보정/추천/최적화만 한다.",
        "Safety/Interlock/Fail Safe가 최종 제한을 건다.",
    ]
    for phrase in required:
        assert phrase in text
    fallback = [
        "Remove AI corrections from final target computation.",
        "Continue operation from manual/base settings and rule/schedule automation if safe.",
        "Keep Safety/Interlock/Fail Safe active.",
        "Do not stop greenhouse operation solely because AI failed.",
        "Do not allow AI to bypass manual settings, permissions, safety, interlock, or fail-safe.",
    ]
    for phrase in fallback:
        assert phrase in text


def test_r7_005_is_planning_only_no_runtime_change_scope():
    text = _read(DOC)
    non_goals = [
        "No panel DOM rewrite in R7-005.",
        "No API route change.",
        "No DB migration.",
        "No HA service call or MQTT/device command.",
        "No AI execution authority.",
        "No role/settings mutation.",
        "No production cutover change.",
    ]
    for phrase in non_goals:
        assert phrase in text
