# R7-008 Environment Control Manual/Base Read-only Detail

> 기준 버전: `v1.13.5`
> Status: R7-008 complete
> Purpose: `환경 제어` 도메인을 manual-first 환경제어 프로그램 구조로 구체화한다.

## 1. Scope

R7-008 adds an operator-visible read-only detail block only inside the `environment-control` domain.

It turns the R7-006 formula into a rendered environment detail:

```text
manualEnvironmentSettings
+ ruleScheduleEnvironmentAutomation
+ aiEnvironmentCorrection if enabled and healthy
→ calculatedEnvironmentTargets
→ environmentSafetyLimits / deviceInterlock clamp
= finalEnvironmentTargets
```

## 2. Runtime boundaries

```text
No API route change in R7-008
No DB migration in R7-008
No HA service call in R7-008
No MQTT/device command in R7-008
No environment setting save in R7-008
No device command execution in R7-008
No SafetyGuard/Interlock runtime behavior change in R7-008
No AI direct control authority in R7-008
```

## 3. Rendered markers

```text
data-r7-environment-control-detail
data-r7-environment-readonly-boundary="true"
data-r7-environment-control-formula

data-r7-environment-manual-settings
 data-r7-environment-manual-setting="주간 온도"
 data-r7-environment-manual-setting="야간 온도"
 data-r7-environment-manual-setting="습도"
 data-r7-environment-manual-setting="VPD"
 data-r7-environment-manual-setting="CO₂"
 data-r7-environment-manual-setting="광/DLI"

data-r7-environment-rule-schedule
 data-r7-environment-rule="주야간 전환"
 data-r7-environment-rule="환기 단계"
 data-r7-environment-rule="난방 최소온도"
 data-r7-environment-rule="CO₂ 시간대"

data-r7-environment-ai-assist
data-r7-environment-ai-authority="assist-only"
data-r7-environment-safety-final
data-r7-environment-fallback
data-r7-environment-ai-fallback-to-manual="true"
```

## 4. Operator copy

The detail must state:

```text
AI 없이도 주간/야간 온도, 습도, VPD, CO₂, 광/DLI 기준으로 운영 가능해야 합니다.
AI 상태가 disabled/unhealthy/timeout/stale이면 aiEnvironmentCorrection을 제외합니다.
환경 제어는 장치 명령을 직접 실행하지 않습니다.
Safety/Interlock/Fail Safe를 우회할 수 없습니다.
```

## 5. Why this comes before AI automation

The environment domain is the first control domain to be deepened because the user corrected the direction:

```text
수동 설정 우선 도메인 재정렬 후 AI를 보조 레이어로 재배치한다.
```

Therefore, R7-008 does not implement AI automation. It first proves that the environment domain has a durable manual/base layer and a visible fallback model.

## 6. Acceptance

```text
R7-008 targeted contract passes
R7-005/R7-006/R7-007 contracts still pass
Full pytest passes
node --check passes for both panel files
Prod HA check_config/restart/static smoke passes before release
```
