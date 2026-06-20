# Phase 2D — SafetyGuard Scheduler + Stale Policy

> 기준 버전: v1.9.11
> 대상: Home Assistant scheduler wiring, SafetyGuard stale timestamp policy, notification dedup baseline

## 목적

Phase 2C에서 만든 수동 watchdog API를 실제 Home Assistant 1분 interval scheduler에 연결한다.

이번 단계는 다음을 고정한다.

```text
async_track_time_interval 기반 1분 scheduler
scheduler setup/teardown lifecycle
watchdog scope 기억
stale timestamp age 계산
persistent notification dedup baseline
```

## Scheduler

`async_setup()`에서 다음 helper를 호출한다.

```text
_setup_safety_guard_watchdog_scheduler(hass)
```

등록 방식:

```text
async_track_time_interval(hass, _tick, timedelta(seconds=SAFETY_GUARD_WATCHDOG_INTERVAL_SECONDS))
```

unload 시:

```text
_teardown_safety_guard_watchdog_scheduler(hass)
```

저장 marker:

```text
unsub_safety_guard_watchdog
safety_guard_watchdog_scheduler_started
safety_guard_watchdog_scheduler_stopped
```

## Tick behavior

```text
_run_safety_guard_watchdog_tick(hass, now)
```

현재 scheduler는 API/panel에서 호출된 scope를 기억한 뒤, 그 scope를 대상으로 watchdog을 실행한다.

```text
safety_guard_watchdog_scopes
```

## Stale policy

추가 helper:

```text
_safety_guard_state_age_seconds(pre_state)
_safety_guard_is_stale(pre_state, stale_threshold_seconds)
```

계산 기준:

```text
preState.lastUpdated 우선
preState.lastChanged fallback
age_seconds > staleThresholdSeconds 이면 stale=true
```

Watchdog item에 추가:

```text
ageSeconds
stale
staleThresholdSeconds
```

## Notification dedup

추가 marker:

```text
SAFETY_GUARD_LAST_NOTIFIED_KEY
safety_guard_notification_deduped
```

같은 cropSeason/zone/domain/entity set에 대해 이미 알림을 보낸 경우 중복 notification을 막는다.

## 검증

```text
pytest -q
→ 107 passed

python3 -m py_compile custom_components/green_smart/zone_control_views.py custom_components/green_smart/db.py custom_components/green_smart/__init__.py
→ pass

node --check custom_components/green_smart/panel/green-smart-panel.js
→ pass
```

## 다음 단계

Phase 2E 후보:

```text
SafetyGuard event detail/history panel
notification ack/clear flow
operator acknowledgement API
critical event lifecycle state
```
