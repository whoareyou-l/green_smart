# Phase 3B — Environment Strategy Input Source + Preview Diff

> 기준 버전: v1.9.14
> 상태: 완료

## 목적

Phase 3A의 환경 전략 MVP를 운영 입력 source와 연결하고, 저장 전 현재 final target 대비 차이를 보여준다.

범위:

```text
HA entity state summary 기반 입력 source baseline
weatherSource/manualOverrides 입력 merge
operator-adjustable input form
preview targetDiff/diffCount
최신 final target 대비 diff 표시
```

## Backend

파일:

```text
custom_components/green_smart/zone_control_views.py
```

추가 helper:

```py
_environment_strategy_inputs_from_sources(...)
_environment_strategy_diff_against_latest_target(...)
```

`_environment_strategy_preview_response(...)` 확장:

```py
source_mode
manual_overrides
weather_source
entityStateSummary
latestFinalTarget
targetDiff
diffCount
sourceSummary
```

입력 source merge 순서:

```text
default baseline
→ HA entity state summary
→ weatherSource
→ manualOverrides/operatorOverride
```

Audit action:

```text
environment_strategy_input_source_resolved
environment_strategy_previewed
```

## API

기존 Phase 3A API 유지:

```text
GET  /api/green_smart/environment/strategy-preview
POST /api/green_smart/environment/strategy-preview
```

POST payload baseline:

```json
{
  "crop_season_id": 1,
  "zone_id": 1,
  "sourceMode": "auto | entity_state | operator",
  "manualOverrides": {
    "radiation": 450,
    "temperature": 24,
    "humidity": 70,
    "co2": 420
  },
  "weatherSource": {},
  "save_final_targets": false
}
```

## Response additions

```json
{
  "sourceMode": "auto",
  "sourceSummary": {
    "entityStateSummary": true,
    "weatherSource": false,
    "operatorOverride": true
  },
  "manualOverrides": {},
  "entityStateSummary": {},
  "weatherSource": {},
  "latestFinalTarget": {},
  "targetDiff": [
    { "key": "ventTarget", "previous": 35, "next": 42, "delta": 7 }
  ],
  "diffCount": 2
}
```

## Panel

파일:

```text
custom_components/green_smart/panel/green-smart-panel.js
```

추가 helper:

```js
_readEnvironmentStrategyInputs(root, domain)
_environmentStrategyPreviewPayload(domain)
```

추가 UI markers:

```text
data-env-strategy-source-mode
data-env-strategy-manual-radiation
data-env-strategy-manual-temperature
data-env-strategy-manual-humidity
data-env-strategy-manual-co2
data-env-strategy-manual-override
```

추가 label:

```text
입력 소스
HA 상태 요약
날씨/센서 자동
운영자 수동 보정
Preview Diff
targetDiff
diffCount
```

## Safety policy

Phase 3B도 preview/save 전 단계만 확장한다. 실제 장비 이동은 여전히 기존 execution path에서 아래를 통과한다.

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
test_phase3b_environment_strategy_input_source_and_diff_contract
```

검증 내용:

- input source helper
- latest final target diff helper
- sourceMode/sourceSummary/manualOverrides/weatherSource
- entityStateSummary/latestFinalTarget/targetDiff/diffCount
- panel input selectors/manual override markers
- preview diff UI markers

## 다음 후보

Phase 3C:

```text
환경 전략 source를 실제 특정 HA entity role mapping과 더 정밀하게 연결
operator preset 저장
dry-run preview UX 강화
strategy history 비교
```