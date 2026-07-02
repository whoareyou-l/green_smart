# R7-058 Records Workflow modal UX and badge correction

Status: current baseline for `crop-operations.records-workflow` as of `v1.14.43`.

## Scope

This slice fixes the visible status badge duplication and deepens the records-workflow modal UX.

## Badge policy

상태 뱃지는 화면에 하나의 라벨만 표시한다.

Examples:

- `정상`
- `확인 필요`
- `근거 부족`
- `오늘 필요`
- `주의`
- `확인`

단계 설명은 data/aria/title 메타데이터로 유지한다.

Examples:

- `data-r7-record-status-stage="운영 가능"`
- `aria-label="정상 · 운영 가능"`
- `title="정상 · 운영 가능"`

The visible pill must not render a second `<small>` text such as `운영 가능` beside `정상`.

## 작성 모달 UX

The write modal now uses an operator-facing shell:

- operator summary
- required note
- common field group
- record-type field group
- action row
- save/cancel controls
- saving/saved/error state copy

## 히스토리 모달 UX

The history modal now uses a structured grammar:

- history summary
- loading state
- empty state
- error state
- row date
- row summary

## Boundary

장치/MQTT/자동실행 제외.

This slice only changes records-workflow UI and crop-record write/history APIs. It does not add HA service calls, MQTT publishing, device command authority, automatic execution, or final control authority.
