# Phase 2E — SafetyGuard Event Lifecycle

> 기준 버전: v1.9.18
> 대상: SafetyGuard event history, ack/clear API, panel event card

## 목적

SafetyGuard critical event를 단순 발생 로그에서 끝내지 않고, 운영자가 확인하고 조치 완료 처리할 수 있는 lifecycle baseline을 만든다.

이번 단계는 신규 event table을 만들지 않고 기존 `zone_control_logs`를 source of truth로 사용한다.

## API

```text
GET  /api/green_smart/zones/safety-guard-events
POST /api/green_smart/zones/safety-guard-events/ack
POST /api/green_smart/zones/safety-guard-events/clear
```

## Backend helpers

```text
SAFETY_GUARD_EVENT_ACTIONS
_safety_guard_event_history_response(...)
_safety_guard_event_lifecycle_post(...)
```

## Event actions

History source:

```text
safety_guard_critical_event
safety_guard_watchdog_checked
safety_guard_blocked
execution_safety_blocked
failsafe_applied
```

Lifecycle actions:

```text
safety_guard_event_acknowledged
safety_guard_event_cleared
```

## Response shape

```json
{
  "ok": true,
  "items": [],
  "activeEvents": [],
  "acknowledgedEventIds": [],
  "clearedEventIds": []
}
```

각 event에는 `eventLifecycle`가 포함된다.

```json
{
  "state": "active | acknowledged | cleared",
  "acknowledged": true,
  "cleared": true,
  "note": "..."
}
```

## Panel

추가 card:

```text
data-zone-safety-event-card
SafetyGuard 이벤트 이력
운영자 확인
조치 완료
```

추가 fetch/action:

```text
_fetchZoneSafetyGuardEvents(domain, { patchOnly })
_ackZoneSafetyGuardEvent(domain, eventId)
_clearZoneSafetyGuardEvent(domain, eventId)
```

5초 요소별 refresh loop에도 포함된다.

## 한계

- 아직 별도 `safety_guard_events` table은 없다.
- lifecycle은 `zone_control_logs`의 ack/clear action을 조합해 계산한다.
- notification clear와 HA persistent notification dismiss 연동은 다음 단계 후보로 둔다.

## 검증

```text
pytest -q
→ 108 passed

python3 -m py_compile custom_components/green_smart/zone_control_views.py custom_components/green_smart/db.py custom_components/green_smart/__init__.py
→ pass

node --check custom_components/green_smart/panel/green-smart-panel.js
→ pass
```

## 다음 단계

Phase 2F 완료:

```text
persistent notification dismiss/clear 연동
operator action note 입력 UI
ack/clear lifecycle 상태별 버튼 gating
notification dedupe reset
```

Phase 3A 후보:

```text
환경 전략 MVP 시작
CORP 기본 G-Index
TEMHUM ADT/DIF/VPD
VENT/SCRN 기본 final target 생성
```
