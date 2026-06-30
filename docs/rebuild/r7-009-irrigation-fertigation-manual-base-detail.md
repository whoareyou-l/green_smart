# R7-009 Irrigation/Fertigation Manual/Base Read-only Detail

> 기준 버전: `v1.14.3`
> Status: R7-009 complete
> Purpose: `관수 제어` 도메인을 manual-first 관수 제어 운영 구조로 구체화한다.

## 1. Scope

R7-009 adds an operator-visible read-only detail block only inside the `irrigation-fertigation` domain.

It turns the R7-006 formula into a rendered irrigation/fertigation detail:

```text
baseIrrigationSettings
+ ruleScheduleIrrigationAutomation
+ aiIrrigationCorrection if enabled and healthy
→ calculatedIrrigationTargets
→ irrigationSafetyLimits clamp
= finalIrrigationTargets
```

## 2. Runtime boundaries

```text
No API route change in R7-009
No DB migration in R7-009
No HA service call in R7-009
No MQTT/device command in R7-009
No irrigation/fertigation setting save in R7-009
No pump/valve/fertigation device execution in R7-009
No SafetyGuard/Interlock runtime behavior change in R7-009
No AI direct irrigation authority in R7-009
```

## 3. Rendered markers

```text
data-r7-irrigation-fertigation-detail
data-r7-irrigation-readonly-boundary="true"
data-r7-irrigation-control-formula

data-r7-irrigation-manual-settings
 data-r7-irrigation-manual-setting="관수 스케줄"
 data-r7-irrigation-manual-setting="일사 누적 관수"
 data-r7-irrigation-manual-setting="EC 목표"
 data-r7-irrigation-manual-setting="pH 목표"
 data-r7-irrigation-manual-setting="급액량"
 data-r7-irrigation-manual-setting="배액률"
 data-r7-irrigation-manual-setting="드라이백"
 data-r7-irrigation-manual-setting="양액 레시피"

data-r7-irrigation-rule-schedule
 data-r7-irrigation-rule="시간 기반 관수"
 data-r7-irrigation-rule="일사 누적 관수"
 data-r7-irrigation-rule="근권 수분 기준 관수"
 data-r7-irrigation-rule="저수조/배액 재활용 점검"

data-r7-irrigation-ai-assist
data-r7-irrigation-ai-authority="assist-only"
data-r7-irrigation-safety-final
data-r7-irrigation-fallback
data-r7-irrigation-ai-fallback-to-manual="true"
```

## 4. Operator copy

The detail must state:

```text
AI 없이도 관수 스케줄, EC/pH, 급액량, 배액률, 드라이백, 양액 레시피 기준으로 운영 가능해야 합니다.
AI 상태가 disabled/unhealthy/timeout/stale이면 aiIrrigationCorrection을 제외합니다.
관수 제어 도메인은 환경 actuator strategy를 직접 소유하지 않습니다.
센서 stale, 배액 오류, 장치 장애, 권한 제한은 AI 관수 보정보다 우선합니다.
```

## 5. Why this follows R7-008

After R7-008 proved the environment-control detail pattern, R7-009 applies the same manual-first/fallback grammar to irrigation/fertigation.

It still does not implement irrigation automation or device execution. It first proves that the irrigation/fertigation domain has a durable manual/base layer and a visible safety clamp/fallback model.

## 6. Acceptance

```text
R7-009 targeted contract passes
R7-005/R7-006/R7-007/R7-008 contracts still pass
Full pytest passes
node --check passes for both panel files
Prod HA check_config/restart/static smoke passes before release
```
