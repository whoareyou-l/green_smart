from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MASTER = ROOT / "docs" / "PROJECT_MASTER_PLAN.md"
BACKEND = ROOT / "docs" / "design" / "current-backend-api-db-ha-contract.md"
UI = ROOT / "docs" / "design" / "current-ui-design-and-navigation.md"
ROADMAP = ROOT / "docs" / "design" / "zone-control-roadmap-and-data-model.md"
GUIDE = ROOT / "docs" / "PROJECT_GUIDE.md"
PLAN = ROOT / "docs" / "plans" / "2026-06-23-integrated-crop-environment-irrigation-device-models.md"


def test_integrated_model_docs_define_four_model_relationships_and_next_phases():
    master = MASTER.read_text(encoding="utf-8")
    plan = PLAN.read_text(encoding="utf-8")
    combined = master + "\n" + plan

    for marker in (
        "통합 모델 트랙: 작기·환경·관수·장치 모델 관계",
        "작기 모델(Crop Season Model)",
        "환경 전략 모델(Environment Strategy Model)",
        "관수 전략 모델(Irrigation Strategy Model)",
        "장치 운영 모델(Device Operation Model)",
        "SafetyGuard/Interlock/Control Mode",
        "Model Phase M0~M8",
        "Task M0: User-facing terminology contract",
        "Task M1: Crop Season Model contract",
        "Task M2: Environment Strategy Model consumes Crop Model",
        "Task M3: Irrigation Strategy Model consumes Crop + Environment Models",
        "Task M4: Device Operation Model baseline",
        "Task M8: Virtual rehearsal evidence for model chain",
    ):
        assert marker in combined


def test_backend_ui_and_roadmap_docs_use_model_language_with_legacy_identifier_boundary():
    backend = BACKEND.read_text(encoding="utf-8")
    ui = UI.read_text(encoding="utf-8")
    roadmap = ROADMAP.read_text(encoding="utf-8")
    guide = GUIDE.read_text(encoding="utf-8")
    combined = "\n".join([backend, ui, roadmap, guide])

    for marker in (
        "## 9A. 통합 모델 contract",
        "환경 전략 모델",
        "관수 전략 모델",
        "장치 운영 모델",
        "작기 모델",
        "legacy identifier",
        "calculated_by = environment_strategy_mvp",
        "calculated_by = irrigation_strategy_mvp",
        "내부 `calculated_by` 값인 `environment_strategy_mvp`, `irrigation_strategy_mvp`는 기존 DB/API 호환을 위해 유지",
    ):
        assert marker in combined

    assert "### 10.4 환경 전략 모델 카드" in ui
    assert "### 11.4 관수 전략 모델 카드" in ui
    assert "사용자-facing UI에서는 `MVP`가 아니라 `환경 전략 모델`, `관수 전략 모델`, `장치 운영 모델`로 표시" in roadmap
