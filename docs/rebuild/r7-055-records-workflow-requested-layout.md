# R7-055 Records Workflow requested layout

Status: current baseline for `crop-operations.records-workflow` as of `v1.14.30`.

## User-requested layout

`작물 운영 > 기록·작업` uses a three-row dashboard layout:

```text
[오늘 할 일] [누락/검증 필요] [AI 근거 연결]
[생육조사] [병해충 예찰] [방제 기록]
[최근 기록 — 전체 폭]
```

## Product decision: 품질/생리장해

`품질/생리장해`는 현재 `기록·작업` 화면에서 독립 카드로 노출하지 않는다.

이 항목은 문서상 고려 항목으로 존재한다. 추후 생육조사 조사 양식에 포함할 예정이다.

Implications:

- No visible `품질/생리장해` card in the records-workflow dashboard.
- No standalone `품질/생리장해` action button in this dashboard.
- Growth survey remains the future owner for these fields.
- Backend/API/write behavior is not added in this slice.

## Markers

Required row markers:

```text
data-r7-record-row="top-actions"
data-r7-record-row="core-records"
data-r7-record-row="recent-records"
```

Required card markers:

```text
data-r7-record-image-card="today-work"
data-r7-record-image-card="missing-verification"
data-r7-record-ai-card
data-r7-record-image-card="growth-survey"
data-r7-record-image-card="pest-scouting"
data-r7-record-image-card="control-treatment"
data-r7-record-recent-log-panel
```

Forbidden visible markers/copy:

```text
data-r7-record-image-card="quality-physiology"
품질/생리장해
SPAD/칼슘/수분/숯가루
측정값 입력
이미지 분석
```

## Boundary

This is a layout/content correction only.

No DB migration, no route/API implementation, no submit binding, no HA service call, no MQTT/device command, and no automatic apply/execute authority are introduced.
