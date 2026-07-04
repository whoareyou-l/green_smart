# R7-051 Records Workflow Write/History Flow Skeleton Plan

> **For Hermes:** Continue the records-workflow vertical slice. Do not restore old content-card wrappers. The previous visible cards are reference-only. Add UI-only flow skeletons for write/history/edit/PLS destinations so the product layout has real operator pathways before backend write APIs are connected.

**Target version:** v1.14.64
**Scope:** `작물 운영 > 기록·작업` subtab only
**Previous baseline:** v1.14.64 removed old records content-card wrappers from visible UI.

---

## 1. Goal

The current records workflow has product action buttons, but their destination is still only marked as `pending-api` or `navigation-only`.

This slice adds visible, read-only/pending skeleton destinations for:

```text
생육조사 작성
생육 히스토리
최근 기록 수정
예찰 작성
예찰 히스토리
방제 기록으로 연결
방제 기록 작성
방제 히스토리
PLS 확인
```

No backend write is connected yet.

---

## 2. Required visible structure

Append a flow skeleton region below the records workflow product layout:

```text
data-r7-record-flow-skeleton="write-history-pls"
```

It contains:

```text
작성 플로우
히스토리 플로우
PLS 확인
API 연결 상태
```

---

## 3. Write modal skeletons

### 3.1 생육조사 작성

Marker:

```text
data-r7-record-modal="growth-survey-write"
```

Fields:

```text
조사일
초장
엽수
생육단계
특이사항
작기/구역 연결
```

State:

```text
data-r7-record-submit-state="pending-api"
```

### 3.2 병해충 예찰 작성

Marker:

```text
data-r7-record-modal="pest-scouting-write"
```

Fields:

```text
예찰일
병해충명
severity
발생 위치
확산 여부
사진/메모
방제 필요 여부
```

State:

```text
data-r7-record-submit-state="pending-api"
```

### 3.3 방제 기록 작성

Marker:

```text
data-r7-record-modal="control-treatment-write"
```

Fields:

```text
방제일
대상 병해충
약제명
희석배수/사용량
PLS 상태
작업자
안전 메모
```

Boundary:

```text
data-r7-record-boundary="record-only-no-execution"
```

---

## 4. History drawer skeletons

Markers:

```text
data-r7-record-history-drawer="growth-survey"
data-r7-record-history-drawer="pest-scouting"
data-r7-record-history-drawer="control-treatment"
```

Each drawer shows:

```text
최근 N건
날짜
요약
작성자/수정 여부는 API 연결 후
```

State:

```text
data-r7-record-history-state="navigation-only"
```

---

## 5. Edit latest skeleton

Marker:

```text
data-r7-record-edit-flow="growth-survey-latest"
```

State:

```text
data-r7-record-submit-state="pending-api"
```

Visible text:

```text
최근 생육조사 수정
저장 API 연결 전
```

---

## 6. PLS check skeleton

Marker:

```text
data-r7-record-pls-check-flow
```

Visible text:

```text
PLS 확인
약제명
PLS 상태
PSIS/약제 DB 확인은 후속 API slice
```

State:

```text
data-r7-record-submit-state="pending-api"
```

---

## 7. API boundary

Required marker:

```text
data-r7-record-api-boundary="ui-skeleton-only"
```

Forbidden:

```text
fetch("/api/green_smart/crop-records
.callService
mqtt
execute
saveRecord
```

This slice must not connect writes.

---

## 8. Test requirements

Create:

```text
tests/test_r7_051_records_workflow_flow_skeleton_contract.py
```

It must verify:

1. Version surfaces are `1.14.64`.
2. This plan exists.
3. Rendered records-workflow contains the flow skeleton region.
4. All three write modal skeletons exist with field labels.
5. All three history drawer skeletons exist.
6. Growth latest edit flow exists.
7. PLS check flow exists.
8. API boundary is explicitly UI-only.
9. Old records content-card wrappers remain absent.
10. Execution/HA/MQTT/write API markers remain absent.

---

## 9. Definition of done

The `기록·작업` screen now has real visible destinations for the action buttons, but every destination is still explicit about being UI-only/pending API. The operator can understand the intended flow before backend write integration begins.
