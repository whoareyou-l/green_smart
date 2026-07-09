# R7-039 Sidebar Domain Label Simplification

> 기준 버전: `v1.14.93`
> Status: R7-039 planned
> Purpose: 사용자가 요청한 사이드바/도메인 표시명을 더 짧은 제어 중심 명칭으로 변경한다.

## User request

```text
관수 제어을 관수 제어로
자동화 제어를 자동화 제어로
안전 제어을 안전 제어로
설정를 설정으로 변경
```

## Required label mapping

```text
irrigation-fertigation: 관수 제어
recommendation-automation: 자동화 제어
safety-history: 안전 제어
settings-admin: 설정
```

## Required behavior

```text
Route/domain keys remain unchanged.
Sidebar labels use the new Korean display names.
Domain hero titles use the new Korean display names.
Settings utility title uses 설정.
Old visible labels must not remain in active sidebar/domain titles:
- 관수 제어
- 자동화 제어
- 안전 제어
- 설정
```

## Boundary

```text
No API route change in R7-039
No DB migration in R7-039
No HA service call in R7-039
No MQTT/device command in R7-039
No save/apply/execute control in R7-039
No SafetyGuard/Interlock runtime behavior change in R7-039
No physical device hookup in R7-039
```
