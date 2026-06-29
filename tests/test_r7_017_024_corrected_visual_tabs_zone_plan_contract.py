from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT / "docs/rebuild/r7-017-024-domain-tabs-zone-qa-plan.md"
EXECUTION_PLAN = ROOT / "docs/plans/2026-06-28-from-scratch-rebuild-execution-plan.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_017_024_corrected_plan_exists_and_records_user_direction():
    text = _read(PLAN)
    for phrase in (
        "# R7-017~R7-024 Domain Tabs, Zone Context, and Browser QA Plan",
        "Main IA remains crop-centered.",
        "Detailed work is zone-scoped.",
        "Domain pages must use sub-tabs.",
        "Do not stack all domain content on one long page.",
        "R7-024 Browser QA is allowed and expected to modify visual components",
        "Domain visual rewrite = visual dashboard + sub-tabs + zone context",
    ):
        assert phrase in text


def test_r7_017_024_domain_sequence_requires_subtabs_and_zone_context():
    text = _read(PLAN)
    for marker in (
        "data-r7-domain-subtabs",
        "data-r7-domain-subtab",
        'data-r7-domain-subtab-active="true"',
        "data-r7-domain-subtab-panel",
        "data-r7-zone-context-bar",
        "data-r7-zone-selector",
        "data-r7-zone-card",
        "data-r7-active-zone",
        "data-r7-global-admin-context",
    ):
        assert marker in text
    for row in (
        "R7-017 | 환경 제어",
        "R7-020 | 관수·양액",
        "R7-021 | 장치 제어",
        "R7-022 | 추천·자동화",
        "R7-023 | 작물 운영",
        "R7-024 | 안전·이력",
        "R7-025 | 설정·관리",
        "R7-026 | Browser QA + visual component correction",
    ):
        assert row in text


def test_r7_024_browser_qa_is_a_visual_correction_loop_not_passive_smoke():
    text = _read(PLAN)
    for phrase in (
        "R7-024 is not just a passive smoke test",
        "Open actual HA panel in browser",
        "Capture console errors and visual issues",
        "Modify shared visual components if needed",
        "visual spacing tweaks",
        "card hierarchy changes",
        "zone selector/card layout fixes",
        "shared visual component refinements",
    ):
        assert phrase in text


def test_execution_plan_points_to_corrected_r7_017_024_plan():
    text = _read(EXECUTION_PLAN)
    for phrase in (
        "## R7-017~R7-024 Corrected Domain Tabs / Zone Context / Browser QA Plan",
        "docs/rebuild/r7-017-024-domain-tabs-zone-qa-plan.md",
        "R7-017 환경 제어 visual rewrite with sub-tabs + zone context",
        "R7-024 Browser QA + shared visual component correction loop",
        "Every domain page from 작물 운영 through 설정·관리 must use sub-tabs.",
        "Detail work must be zone-scoped.",
    ):
        assert phrase in text


def test_corrected_r7_plan_preserves_runtime_boundaries():
    text = _read(PLAN) + "\n" + _read(EXECUTION_PLAN)
    for forbidden_boundary in (
        "No API route change unless explicitly scoped",
        "No DB migration unless explicitly scoped",
        "No HA service call",
        "No MQTT/device command",
        "No save/apply/execute controls",
        "No approval/override release",
        "No SafetyGuard/Interlock runtime behavior change",
        "No physical device hookup",
    ):
        assert forbidden_boundary in text
