# R7-012 Safety/History Read-only Detail

> 기준 버전: `v1.14.72`
> Status: R7-012 complete
> Purpose: `안전 제어` 도메인을 authoritative allow/block evidence와 감사 이력 read-only 구조로 구체화한다.

## 1. Scope

R7-012 adds an operator-visible read-only detail block only inside the `safety-history` domain.

It renders the safety/history evidence grammar:

```text
Safety status
+ Interlock status
+ Fail Safe status
+ block/allow reasons
+ manual/rule/AI history
+ audit evidence
= authoritative allow/block history, read-only
```

## 2. Runtime boundaries

```text
No API route change in R7-012
No DB migration in R7-012
No HA service call in R7-012
No MQTT/device command in R7-012
No alarm ack/clear in R7-012
No approval/override release in R7-012
No execution history mutation in R7-012
No SafetyGuard/Interlock runtime behavior change in R7-012
Safety/history is not a normal setpoint owner
```

## 3. Rendered markers

```text
data-r7-safety-history-detail
data-r7-safety-history-readonly-boundary="true"
data-r7-safety-history-authoritative-evidence="true"

data-r7-safety-history-status
 data-r7-safety-history-status-item="Safety 상태"
 data-r7-safety-history-status-item="Interlock 상태"
 data-r7-safety-history-status-item="Fail Safe 상태"
 data-r7-safety-history-status-item="알람"

data-r7-safety-history-reasons
 data-r7-safety-history-reason="차단 이유"
 data-r7-safety-history-reason="허용 이유"
 data-r7-safety-history-reason="센서 stale 이력"
 data-r7-safety-history-reason="오류/Traceback/통신 장애"

data-r7-safety-history-timeline
 data-r7-safety-history-timeline-item="수동 조작 이력"
 data-r7-safety-history-timeline-item="기본 자동제어 이력"
 data-r7-safety-history-timeline-item="AI 추천 이력"
 data-r7-safety-history-timeline-item="AI 적용/미적용 이력"
 data-r7-safety-history-timeline-item="장치 명령 후보 이력"
 data-r7-safety-history-timeline-item="실제 실행 이력, later only"

data-r7-safety-history-audit
data-r7-safety-history-setpoint-owner="false"
```

## 4. Operator copy

The detail must state:

```text
안전 제어은 일반 setpoint owner가 아닙니다.
모든 도메인의 최종 allow/block evidence를 read-only로 모읍니다.
알람 ack/clear, 승인/override, 실행 이력 수정은 R7-012에 포함하지 않습니다.
실제 실행 이력은 later only evidence입니다.
```

## 5. Why this follows R7-011

After environment, irrigation, device, and recommendation details, R7-012 completes the safety/history evidence surface so operators can see why a candidate was allowed or blocked without giving this screen execution or override authority.

## 6. Acceptance

```text
R7-012 targeted contract passes
R7-005/R7-006/R7-007/R7-008/R7-009/R7-010/R7-011 contracts still pass
Full pytest passes
node --check passes for both panel files
Prod HA check_config/restart/static smoke passes before release
```
