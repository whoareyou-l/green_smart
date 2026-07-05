# R7-089 Settings greenhouse/zone simplified cards

Status: current baseline for `v1.14.73`.

## Scope

사용자 요청에 따라 `설정 > 온실·구역` 화면을 더 단순하게 정리한다.

## Changes

- 데이터 상태 삭제: 상단 `데이터 상태` 카드는 렌더하지 않는다.
- 선택 구역 상세 삭제: 우측 `선택 구역 상세` 패널과 기본 정보/대표 센서/제어 장비 매핑 카드는 렌더하지 않는다.
- 구역별 현재 작기 삭제: 상단 요약 카드에서는 제거하고, 현재 작기 정보는 `구역 목록` row 안에서만 표시한다.
- 구역 생성 카드 추가: `구역 구성` 옆에 `구역 생성` 카드를 추가한다.
- 화면 layout marker는 `basic-composition-create-list`로 고정한다.

## Current layout

```text
[온실 기본 정보] [구역 구성] [구역 생성]

[구역 목록 ------------------------------------------------]
```

## Boundary

`+ 새 구역 추가`는 생성 affordance와 marker를 제공한다. 실제 DB 저장/구역 생성 mutation은 별도 승인/저장 단계에서 처리한다.
