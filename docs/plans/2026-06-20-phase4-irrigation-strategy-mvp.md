# Phase 4 — Irrigation Strategy MVP

> 기준 버전: v1.9.16
> 상태: 완료
> 대상: `zone_control_views.py`, `green-smart-panel.js`, 관수 final target preview/save flow

## 1. 목표

Phase 4는 관수 domain에 전략 preview/save 흐름을 추가한다. 기존 final target 실행 경로는 그대로 유지하며, 실제 장비 이동은 Control Mode + SafetyGuard + Interlock/fail-safe + state verification을 통과해야 한다.

구현 범위:

- IRR 기본 EC/pH/VWC/드라이백/일사 누적 관수 baseline
- VWC 하한 긴급 관수 marker
- 관수 final target 생성/저장
- latest final target 대비 Preview Diff
- Green Smart panel 관수 전략 MVP 카드

## 2. Backend contract

추가된 주요 marker:

```text
IRRIGATION_STRATEGY_COMPONENTS
_irrigation_strategy_inputs_from_sources
_irrigation_strategy_ec_ph_vwc_dryback
_irrigation_strategy_final_targets
_irrigation_strategy_preview_response
ZoneIrrigationStrategyPreviewView
/api/green_smart/irrigation/strategy-preview
irrigation_strategy_previewed
irrigation_strategy_final_targets_saved
calculated_by="irrigation_strategy_mvp"
```

응답 핵심 필드:

```text
accumulatedRadiation
currentVwc
currentEc
currentPh
dryback
shotAmountL
minIntervalMin
targetEc
targetPh
targetDryback
targetDrainRate
emergencyIrrigation
targetDiff
diffCount
```

## 3. Panel contract

추가된 주요 marker:

```text
data-irrigation-strategy-preview-card
data-irrigation-strategy-preview-refresh
data-irrigation-strategy-save-final
data-irrigation-strategy-source-mode
data-irrigation-strategy-manual-radiation
data-irrigation-strategy-manual-vwc
data-irrigation-strategy-manual-ec
data-irrigation-strategy-manual-ph
data-irrigation-strategy-manual-override
관수 전략 MVP
IRR EC/pH/VWC/드라이백
일사 누적 관수
VWC 하한 긴급 관수
관수 최종 목표
SafetyGuard 우선 적용
관수 전략 최종값 저장
```

## 4. 안전 경계

Phase 4는 preview/save까지만 확장한다. 저장된 관수 final target은 기존 `/api/green_smart/zones/execute-final-targets` 경로에서만 실행되며, 실행 시 다음 gate가 우선한다.

```text
Control Mode
→ SafetyGuard
→ Interlock/fail-safe
→ pre/post state verification
→ zone_control_logs
```

## 5. 검증

```text
pytest -q
python3 -m py_compile custom_components/green_smart/zone_control_views.py custom_components/green_smart/__init__.py
node --check custom_components/green_smart/panel/green-smart-panel.js
git diff --check
stale version scan
secret scan
```
