# Phase 2F — SafetyGuard Notification Clear + Operator Note

> 기준 버전: v1.9.22
> 상태: 완료

## 목적

Phase 2E에서 추가한 SafetyGuard event lifecycle을 운영 notification과 연결한다.

- critical event 발생 시 생성된 `persistent_notification`을 조치 완료(clear) 시 해제한다.
- notification dedupe cache를 clear 시 reset해서 같은 scope에서 이후 새 critical event가 다시 알림을 만들 수 있게 한다.
- event ack/clear에 운영자 조치 메모(`operatorNote`)를 남긴다.
- panel에서 active/acknowledged/cleared 상태별로 버튼 노출을 제한한다.

## Backend

파일:

```text
custom_components/green_smart/zone_control_views.py
```

추가 helper:

```py
_safety_guard_notification_id(...)
_safety_guard_notification_key(...)
_clear_safety_guard_notification(...)
```

Clear 동작:

```text
POST /api/green_smart/zones/safety-guard-events/clear
```

처리 내용:

1. `persistent_notification.dismiss` 호출
2. `green_smart_safety_guard_{crop_season_id}_{zone_id}_{domain}` notification id 사용
3. `SAFETY_GUARD_LAST_NOTIFIED_KEY` dedupe entry reset
4. lifecycle `after.eventLifecycle.notificationCleared = true` 기록
5. `operatorNote`를 lifecycle에 저장

Ack 동작:

```text
POST /api/green_smart/zones/safety-guard-events/ack
```

처리 내용:

1. `operatorNote` 저장
2. notification은 유지
3. event state를 `acknowledged`로 기록

## Panel

파일:

```text
custom_components/green_smart/panel/green-smart-panel.js
```

추가/변경:

```js
_zoneSafetyGuardEventNote(domain, eventId)
_ackZoneSafetyGuardEvent(domain, eventId, note)
_clearZoneSafetyGuardEvent(domain, eventId, note)
```

신규 marker:

```text
data-zone-safety-event-note
data-zone-safety-event-note-for
```

UI 정책:

| State | 버튼 |
| --- | --- |
| active | 운영자 확인 |
| acknowledged | 조치 완료 |
| cleared | 버튼 없음 |

Panel label:

```text
조치 메모
상태: active
상태: acknowledged
상태: cleared
```

## Tests

파일:

```text
tests/test_zone_control_api_contract.py
```

추가 테스트:

```text
test_phase2f_safety_guard_notification_clear_and_operator_note_contract
```

검증 내용:

- notification id/key helper 존재
- `persistent_notification.dismiss` 사용
- clear 시 dedupe reset
- lifecycle response에 `notificationCleared` 포함
- `operatorNote` 저장
- panel note input marker 존재
- 상태별 ack/clear 버튼 gating 존재

## 검증

```text
pytest tests/test_zone_control_api_contract.py -q
pytest -q
python3 -m py_compile custom_components/green_smart/zone_control_views.py custom_components/green_smart/__init__.py custom_components/green_smart/db.py
node --check custom_components/green_smart/panel/green-smart-panel.js
git diff --check
```

## 다음 후보

Phase 3A부터 환경 전략 MVP로 넘어간다.

- CORP 기본 G-Index
- TEMHUM ADT/DIF/VPD baseline
- VENT/SCRN 기본 final target 생성
- SafetyGuard 우선순위 유지
