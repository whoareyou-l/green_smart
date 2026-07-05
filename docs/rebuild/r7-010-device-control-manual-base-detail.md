# R7-010 Device Control Manual/Base Read-only Detail

> 기준 버전: `v1.14.79`
> Status: R7-010 complete
> Purpose: `장치 제어` 도메인을 manual-first 장치 운영/권한/안전 판단 구조로 구체화한다.

## 1. Scope

R7-010 adds an operator-visible read-only detail block only inside the `device-control` domain.

It turns the R7-006 formula into a rendered device-control detail:

```text
deviceMode: manual / auto / locked / maintenance
+ operatorRequestedAction or automationCandidate
+ optional aiStrategyHint
→ permission check
→ Safety check
→ Interlock check
→ Fail Safe check
= allowed command or blocked reason
```

## 2. Runtime boundaries

```text
No API route change in R7-010
No DB migration in R7-010
No HA service call in R7-010
No MQTT/device command in R7-010
No device mode save in R7-010
No manual device operation in R7-010
No automatic device execution in R7-010
No SafetyGuard/Interlock runtime behavior change in R7-010
No AI direct device command authority in R7-010
Physical MQTT/device hookup remains blocked until virtual scenario verification passes
```

## 3. Rendered markers

```text
data-r7-device-control-detail
data-r7-device-readonly-boundary="true"
data-r7-device-control-formula

data-r7-device-manual-settings
 data-r7-device-manual-setting="manual"
 data-r7-device-manual-setting="auto"
 data-r7-device-manual-setting="locked"
 data-r7-device-manual-setting="maintenance"
 data-r7-device-manual-setting="HA entity mapping"
 data-r7-device-manual-setting="MQTT topic mapping later only"

data-r7-device-rule-schedule
 data-r7-device-rule="operatorRequestedAction"
 data-r7-device-rule="automationCandidate"
 data-r7-device-rule="mode gate"
 data-r7-device-rule="mapping health"

data-r7-device-ai-assist
data-r7-device-ai-authority="hint-only"
data-r7-device-safety-final
data-r7-device-fallback
data-r7-device-physical-hookup-blocked="true"
```

## 4. Operator copy

The detail must state:

```text
AI 없이도 수동/자동/잠금/점검 모드와 장치 매핑 상태를 확인할 수 있어야 합니다.
AI는 optional aiStrategyHint만 제공하며 장치 명령을 직접 내리지 않습니다.
장치 실행은 권한, 모드, Safety, Interlock, Fail Safe, HA/MQTT 상태를 통과해야 합니다.
Physical MQTT/device hookup remains blocked until virtual scenario verification passes.
```

## 5. Why this follows R7-009

After environment and irrigation/fertigation details, R7-010 applies the same manual-first/fallback grammar to device control. This is intentionally read-only: it exposes mode and gating evidence without adding operation buttons.

## 6. Acceptance

```text
R7-010 targeted contract passes
R7-005/R7-006/R7-007/R7-008/R7-009 contracts still pass
Full pytest passes
node --check passes for both panel files
Prod HA check_config/restart/static smoke passes before release
```
