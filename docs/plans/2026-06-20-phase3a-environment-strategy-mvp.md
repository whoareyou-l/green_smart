# Phase 3A — Environment Strategy MVP

> 기준 버전: v1.9.15
> 상태: 완료

## 목적

SafetyGuard foundation 위에 첫 환경 전략 계산 baseline을 올린다.

범위:

```text
CORP 기본 G-Index
TEMHUM ADT/DIF/VPD
VENT/SCRN 기본 final target 생성
SafetyGuard 우선순위 유지
```

## Backend

파일:

```text
custom_components/green_smart/zone_control_views.py
custom_components/green_smart/__init__.py
```

추가 상수/helper:

```py
ENVIRONMENT_STRATEGY_COMPONENTS = ("CORP", "TEMHUM", "VENT", "SCRN")
_environment_strategy_g_index(...)
_environment_strategy_adt_dif_vpd(...)
_environment_strategy_final_targets(...)
_environment_strategy_preview_response(...)
_insert_final_targets(...)
```

추가 API:

```text
GET  /api/green_smart/environment/strategy-preview
POST /api/green_smart/environment/strategy-preview
```

POST에서 `save_final_targets=true`를 주면 preview target을 `zone_final_control_targets`에 저장한다.

저장 시:

```text
calculated_by = environment_strategy_mvp
action = environment_strategy_final_targets_saved
```

Preview audit action:

```text
environment_strategy_previewed
```

## Response baseline

```json
{
  "ok": true,
  "domain": "environment",
  "components": ["CORP", "TEMHUM", "VENT", "SCRN"],
  "corpGIndex": 63.25,
  "adt": 21.0,
  "dif": 6.0,
  "vpd": 0.895,
  "ventTarget": 35.0,
  "screenTarget": 32.5,
  "targets": {
    "ventTarget": 35.0,
    "screenTarget": 32.5,
    "strategy": "environment_strategy_mvp",
    "safetyPolicy": "SafetyGuard 우선"
  }
}
```

## Panel

파일:

```text
custom_components/green_smart/panel/green-smart-panel.js
```

추가 cache/helper/card/binder:

```js
this._zoneEnvironmentStrategyPreviewCache
_fetchEnvironmentStrategyPreview(domain, { patchOnly })
_saveEnvironmentStrategyFinalTargets(domain)
_renderEnvironmentStrategyPreviewCard(domain)
_bindEnvironmentStrategyPreviewInputs(root)
```

신규 marker:

```text
data-env-strategy-preview-card
data-env-strategy-preview-refresh
data-env-strategy-save-final
```

UI label:

```text
환경 전략 MVP
CORP G-Index
TEMHUM ADT/DIF/VPD
VENT/SCRN 최종 목표
SafetyGuard 우선 적용
전략 최종값 저장
```

환경 제어 페이지 배치:

```text
Control Mode
Interlock Settings
Entity State Summary
SafetyGuard Watchdog
SafetyGuard Event History
Environment Strategy MVP
AI Final Target
Execution Log
Entity Mapping
```

## Safety policy

Phase 3A는 final target 후보/저장까지만 담당한다. 실제 실행은 기존 `execute-final-targets` 경로에서 계속 아래 gate를 통과한다.

```text
Control Mode gate
SafetyGuard decision layer
Interlock/fail-safe
pre/post state verification
```

## Tests

파일:

```text
tests/test_zone_control_api_contract.py
```

추가 테스트:

```text
test_phase3a_environment_strategy_mvp_contract
```

검증 내용:

- 환경 전략 helper/API/view/registration
- CORP/TEMHUM/VENT/SCRN marker
- `corpGIndex`, `adt`, `dif`, `vpd`, `ventTarget`, `screenTarget`
- final target 저장 action/calculated_by
- panel cache/fetch/save/card/binder/marker
- 환경 제어 페이지 배치

## 다음 후보

Phase 3B:

```text
환경 전략 입력값을 실제 HA entity state summary / weather / sensor source와 연결
operator-adjustable strategy input form
strategy preview → final target diff 표시
```
