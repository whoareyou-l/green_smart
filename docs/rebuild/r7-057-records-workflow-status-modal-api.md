# R7-057 Records Workflow status, modal, and API vertical slice

Status: current baseline for `crop-operations.records-workflow` as of `v1.14.76`.

## Scope

This slice makes the records-workflow cards operational enough for real use:

- 상태 뱃지 구체화
- 작성 팝업과 히스토리 팝업
- 검증/AI 근거 팝업
- rebuild crop-records API wrapper
- existing DB table reuse

## Status badge policy

Each card uses an explicit status key, label, stage label, tone, background, border, and text color.

| Card | Status key | Label | Stage | Tone |
|---|---|---|---|---|
| 오늘 할 일 | `normal-ready` | 정상 | 운영 가능 | green |
| 누락/검증 필요 | `needs-verification` | 확인 필요 | 누락 확인 | amber |
| AI 근거 연결 | `evidence-limited` | 근거 부족 | 신뢰도 제한 | red |
| 생육조사 | `due-today` | 오늘 필요 | 오늘 작성 | blue |
| 병해충 예찰 | `attention-stale` | 주의 | 지연 확인 | amber |
| 방제 기록 | `safety-check` | 확인 | 안전 확인 | amber/green depending latest data |

## Modal policy

Buttons open one of these modes:

- `write`: 작성 팝업
- `history`: 히스토리 팝업
- `verification`: 누락/검증 팝업
- `evidence`: AI 근거 팝업

## API/DB policy

Use the existing legacy physical DB tables rather than adding new tables.

기존 growth_surveys/pest_surveys/control_records 테이블 재사용.

Tables:

- `growth_surveys`
- `pest_surveys`
- `control_records`
- `control_pesticides`

The rebuild surface gets thin API wrappers:

```text
GET  /api/green_smart/rebuild/crop-records/{season_id}/history/{record_type}
POST /api/green_smart/rebuild/crop-records/{season_id}/{record_type}
```

These wrappers call the same legacy table family used by the existing crop panel APIs.

## Boundary

This is crop-record UI/API/DB work only.

장치/MQTT/자동실행 제외. No HA service calls, MQTT/device commands, greenhouse actuator execution, or automatic apply/execute authority are introduced.
