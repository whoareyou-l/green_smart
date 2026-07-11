# R7-011 Recommendation/Automation Manual-baseline Read-only Detail

> 기준 버전: `v1.15.26`
> Status: R7-011 complete
> Purpose: `자동화 제어` 도메인을 manual-baseline-first 비교 구조로 구체화한다.

## 1. Scope

R7-011 adds an operator-visible read-only detail block only inside the `recommendation-automation` domain.

It turns the R7-006 comparison grammar into a rendered recommendation/automation detail:

```text
Manual baseline
→ Rule/schedule candidate
→ AI recommendation/correction
→ Safety-final candidate
→ Fallback value when AI is off
```

## 2. Runtime boundaries

```text
No API route change in R7-011
No DB migration in R7-011
No HA service call in R7-011
No MQTT/device command in R7-011
No recommendation apply/execute in R7-011
No operator approval release in R7-011
No automatic work order in R7-011
No final command authority in R7-011
No AI direct execution authority in R7-011
```

## 3. Rendered markers

```text
data-r7-recommendation-automation-detail
data-r7-recommendation-readonly-boundary="true"
data-r7-recommendation-comparison-grammar

data-r7-recommendation-manual-baseline
 data-r7-recommendation-manual-item="환경 수동 기준"
 data-r7-recommendation-manual-item="관수 제어 수동 기준"
 data-r7-recommendation-manual-item="장치 모드 기준"
 data-r7-recommendation-manual-item="AI off fallback value"

data-r7-recommendation-rule-candidate
 data-r7-recommendation-rule="rule/schedule candidate"
 data-r7-recommendation-rule="automation eligibility"
 data-r7-recommendation-rule="difference from manual baseline"

data-r7-recommendation-ai-assist
data-r7-recommendation-ai-authority="assist-only"
data-r7-recommendation-safety-final
data-r7-recommendation-fallback
data-r7-recommendation-final-command-authority="none"
```

## 4. Operator copy

The detail must state:

```text
자동화 제어는 실행 버튼 중심 화면이 아닙니다.
수동 기준값을 먼저 보여주고 rule/schedule 후보와 AI 추천·보정 차이를 비교합니다.
AI 상태가 disabled/unhealthy/timeout/stale이면 AI recommendation/correction을 제외하고 fallback value를 표시합니다.
Safety-final candidate는 최종 명령이 아니며 final command authority를 갖지 않습니다.
```

## 5. Why this follows R7-010

After manual-first details for Environment, Irrigation/Fertigation, and Device Control, R7-011 aligns the recommendation layer so AI remains an assist/comparison layer rather than an execution center.

## 6. Acceptance

```text
R7-011 targeted contract passes
R7-005/R7-006/R7-007/R7-008/R7-009/R7-010 contracts still pass
Full pytest passes
node --check passes for both panel files
Prod HA check_config/restart/static smoke passes before release
```
