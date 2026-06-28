from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REBUILD_PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "rebuild" / "green-smart-rebuild-panel.js"
CBA_DOC = ROOT / "docs" / "master" / "01-cba-ui-ux-spec.md"
RESEARCH_DOC = ROOT / "docs" / "rebuild" / "rs-002-home-dashboard-research.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_rs005_cba_state_components_are_registered_in_master_docs():
    doc = _read(CBA_DOC)
    for marker in (
        "COM-StateBadge",
        "COM-EmptyState",
        "COM-LoadingSkeleton",
        "COM-DataFreshnessPill",
        "상태 배지",
        "데이터 없음 안내",
        "로딩 스켈레톤",
        "데이터 신선도",
    ):
        assert marker in doc


def test_rs005_zone_contexts_have_product_state_grammar_not_only_static_copy():
    source = _read(REBUILD_PANEL)
    for marker in (
        "dataStatus",
        "freshnessMinutes",
        "_zoneStateTone",
        "_zoneStateLabel",
        "renderStateBadge",
        "renderDataFreshnessPill",
        "renderLoadingSkeleton",
        "renderEmptyState",
        "data-cba-component=\"COM-StateBadge\"",
        "data-cba-component=\"COM-DataFreshnessPill\"",
        "data-cba-component=\"COM-LoadingSkeleton\"",
        "data-cba-component=\"COM-EmptyState\"",
    ):
        assert marker in source

    for state in (
        "ok",
        "partial",
        "stale",
        "empty",
        "loading",
        "error",
    ):
        assert f'state: "{state}"' in source


def test_rs005_each_zone_panel_surfaces_state_without_execution_controls():
    source = _read(REBUILD_PANEL)
    for marker in (
        "data-zone-state-row",
        "data-zone-state-badge",
        "data-zone-freshness-pill",
        "data-zone-empty-state",
        "data-zone-loading-skeleton",
        "data-zone-readonly-note",
        "읽기 전용",
        "실행 전 승인과 안전검사",
    ):
        assert marker in source

    for forbidden in (
        "data-zone-execute-button",
        "data-zone-apply-final-target",
        "executeFinalTargets",
        "callService(",
        "실행하기</button>",
    ):
        assert forbidden not in source


def test_rs005_docs_record_state_grammar_vertical_slice():
    doc = _read(RESEARCH_DOC)
    for marker in (
        "RS-005 state grammar vertical slice",
        "loading / empty / partial / stale / error / ok",
        "read-only 상태 문법",
        "실행 버튼 금지",
        "COM-StateBadge + COM-DataFreshnessPill + COM-EmptyState + COM-LoadingSkeleton",
    ):
        assert marker in doc
