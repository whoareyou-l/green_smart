# Phase 2C — SafetyGuard Watchdog / Critical Notification Baseline

> 기준 버전: v1.9.16
> 대상: SafetyGuard watchdog API, persistent notification hook, panel watchdog card

## 목적

실행 버튼을 누르지 않아도 현재 zone/entity 상태와 interlock settings를 1분 fallback 기준으로 평가할 수 있는 baseline을 만든다.

이번 단계는 실제 scheduler/background loop를 켜지 않는다. 먼저 수동/패널 호출 가능한 watchdog API와 UI, critical notification hook을 고정한다.

## Backend

상수:

```text
SAFETY_GUARD_WATCHDOG_INTERVAL_SECONDS = 60
```

Helper:

```text
_safety_guard_watchdog_item(...)
_safety_guard_watchdog_response(...)
_notify_safety_guard_critical(...)
```

API:

```text
GET /api/green_smart/zones/safety-guard-watchdog
```

Response shape:

```json
{
  "ok": true,
  "watchdogStatus": "clear | critical",
  "checkedAt": "...",
  "lastCheckedAt": "...",
  "staleThresholdSeconds": 120,
  "intervalSeconds": 60,
  "criticalEvents": [],
  "items": []
}
```

## Notification

Critical event가 있고 query `notify=true`일 때 Home Assistant persistent notification hook을 호출한다.

```text
persistent_notification.create
```

## Audit log

```text
safety_guard_watchdog_checked
safety_guard_critical_event
```

## Panel

추가 card:

```text
data-zone-safety-watchdog-card
SafetyGuard Watchdog
1분 fallback 검사
criticalEvents
critical safety event
```

Panel refresh loop에도 포함한다.

```text
_fetchZoneSafetyGuardWatchdog(domain, { patchOnly })
```

## 현재 한계

- 실제 background scheduler는 아직 켜지지 않았다.
- stale timestamp age 계산은 baseline marker만 있으며, 실제 timestamp 정책은 Phase 2D 후보로 둔다.
- notification은 API 호출 시 `notify=true`일 때만 생성한다.

## 검증

```text
pytest -q
→ 106 passed

python3 -m py_compile custom_components/green_smart/zone_control_views.py custom_components/green_smart/db.py custom_components/green_smart/__init__.py
→ pass

node --check custom_components/green_smart/panel/green-smart-panel.js
→ pass
```

## 다음 단계

Phase 2D 후보:

```text
실제 1분 scheduler wiring
stale timestamp age policy
persistent notification dedup/ack flow
SafetyGuard event detail/history panel
```
