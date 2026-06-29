from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = ROOT / "docs/rebuild/r7-006-manual-first-target-domain-spec.md"
PLAN = ROOT / "docs/rebuild/r7-005-legacy-audit-domain-research-manual-first-plan.md"
FRONTEND_PLAN = ROOT / "docs/rebuild/frontend-decomposition-plan.md"
R7_DOCS = [
    ROOT / "docs/rebuild/r7-001-main-dashboard-redesign.md",
    ROOT / "docs/rebuild/r7-002-sidebar-navigation-page-shell.md",
    ROOT / "docs/rebuild/r7-003-detail-configuration-subpages-baseline.md",
    ROOT / "docs/rebuild/r7-004-settings-admin-readonly-detail.md",
]


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_006_target_domain_spec_exists_and_defines_product_thesis():
    text = _read(SPEC)
    required = [
        "Green Smart is a manual-operable environment-control OS.",
        "AI is an assist/optimization layer.",
        "Safety/Interlock/Fail Safe is the final authority.",
        "AI 없이도 온실은 운영되어야 한다.",
        "수동 설정값은 항상 존재해야 한다.",
        "AI는 추천/보정/설명/최적화만 담당한다.",
    ]
    for phrase in required:
        assert phrase in text


def test_r7_006_target_domains_are_explicit_and_replace_old_five_group_ia():
    text = _read(SPEC)
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
    assert "OLD: 운영 홈 / 작물 중심 운영 / 현장 상태 / 추천·실행 검토 / 설정" in text
    assert "NEW: 운영 홈 / 작물 운영 / 환경 제어 / 관수 제어 / 장치 제어 / 자동화 제어 / 안전 제어 / 설정" in text
    assert "old IA remains historical/compatibility evidence only" in text


def test_r7_006_every_control_domain_uses_four_layer_control_grammar():
    text = _read(SPEC)
    grammar = [
        "Manual/Base Settings",
        "Rule/Schedule Automation",
        "AI Assist / Optimization",
        "Safety/Interlock/Fail Safe Finalization",
    ]
    for phrase in grammar:
        assert phrase in text
    formulas = [
        "manualEnvironmentSettings",
        "ruleScheduleEnvironmentAutomation",
        "aiEnvironmentCorrection if enabled and healthy",
        "baseIrrigationSettings",
        "ruleScheduleIrrigationAutomation",
        "aiIrrigationCorrection if enabled and healthy",
        "deviceMode: manual / auto / locked / maintenance",
        "optional aiStrategyHint",
    ]
    for phrase in formulas:
        assert phrase in text


def test_r7_006_domain_boundaries_prevent_ai_first_or_execution_first_design():
    text = _read(SPEC)
    boundaries = [
        "작물 운영은 환경/관수/장치 명령을 직접 실행하지 않는다.",
        "환경 AI 보정은 Safety/Interlock/Fail Safe를 우회할 수 없다.",
        "AI 관수 보정은 센서 stale, 배액 오류, 장치 장애, 권한 제한을 넘을 수 없다.",
        "AI는 장치 명령을 직접 내리지 않는다.",
        "자동화 제어는 실행 버튼 중심 화면이 아니다.",
        "자동화 제어는 final command authority를 갖지 않는다.",
        "안전 제어은 일반 setpoint owner가 아니다.",
        "Secret values render as [REDACTED] only.",
    ]
    for phrase in boundaries:
        assert phrase in text


def test_r7_006_ai_fallback_states_keep_manual_operation_available():
    text = _read(SPEC)
    states = [
        "enabled_healthy",
        "manual_only",
        "ai_disabled",
        "ai_unhealthy",
        "ai_timeout",
        "ai_stale",
        "ai_rejected",
        "fallback_safe",
    ]
    for state in states:
        assert state in text
    fallback_rules = [
        "AI corrections are removed from final target computation.",
        "Manual/base settings remain available.",
        "Rule/schedule automation may continue when safe.",
        "Safety/Interlock/Fail Safe remains active.",
        "Greenhouse operation does not stop solely because AI failed.",
    ]
    for rule in fallback_rules:
        assert rule in text


def test_r7_006_old_ia_deprecation_map_is_explicit():
    text = _read(SPEC)
    mappings = [
        "`crop-centered` / `작물 중심 운영` | adapt to `crop-operations` / `작물 운영`",
        "`field-status` / `현장 상태` | split into `environment-control`, `irrigation-fertigation`, `device-control`",
        "`recommendation-review` / `추천·실행 검토` | adapt to `recommendation-automation` / `자동화 제어`",
        "R7-003 five placeholders | rewrite after R7-006/R7-007 target shell contracts",
        "R7-004 settings/admin | keep/adapt under `settings-admin` / `설정`",
    ]
    for mapping in mappings:
        assert mapping in text


def test_prior_r7_docs_are_marked_as_historical_or_adapted_under_manual_first_plan():
    for doc in R7_DOCS:
        text = _read(doc)
        assert "R7-005+ direction note" in text
        assert "r7-006-manual-first-target-domain-spec.md" in text
    r7_003 = _read(ROOT / "docs/rebuild/r7-003-detail-configuration-subpages-baseline.md")
    assert "DEPRECATE/REWRITE" in r7_003
    r7_004 = _read(ROOT / "docs/rebuild/r7-004-settings-admin-readonly-detail.md")
    assert "KEEP/ADAPT" in r7_004


def test_frontend_decomposition_plan_points_to_current_manual_first_direction():
    text = _read(FRONTEND_PLAN)
    assert "R7-005+ Manual-first domain reset notice" in text
    assert "Green Smart = 수동 운영 가능한 환경제어 OS" in text
    assert "AI = 보조/추천/최적화 레이어" in text
    assert "운영 홈 / 작물 운영 / 환경 제어 / 관수 제어 / 장치 제어 / 자동화 제어 / 안전 제어 / 설정" in text
    assert "must not be extended as the future product IA" in text


def test_r7_005_plan_links_to_r7_006_detailed_spec():
    text = _read(PLAN)
    assert "docs/rebuild/r7-006-manual-first-target-domain-spec.md" in text
    assert "R7-006 Manual-first Target Domain Specification + target IA contract" in text
