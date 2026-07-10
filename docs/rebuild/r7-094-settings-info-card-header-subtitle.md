# R7-094 Settings info card header subtitle

Status: current baseline for `v1.15.11`.

## Change

`온실 기본 정보`, `구역 기본 정보`, `장비 구성` 카드의 부연 설명 위치를 헤더 내부로 이동한다.

## Required visual structure

```text
아이콘 ㅣ 제목                         상태 뱃지
      ㅣ 부연 설명
```

## Implementation

- `renderR7CommonCardHeader`에 `subtitle` 옵션을 추가한다.
- 제목과 부연 설명은 `data-r7-common-card-title-stack` 제목 stack 안에 세로로 표시한다.
- 부연 설명은 `data-r7-common-card-subtitle`로 렌더한다.
- `renderR7SettingsInfoCard`의 `primary`는 더 이상 별도 body line이 아니라 헤더 subtitle로 전달한다.
- 아이콘은 제목과 부연 설명 전체의 왼쪽에 고정된다.
