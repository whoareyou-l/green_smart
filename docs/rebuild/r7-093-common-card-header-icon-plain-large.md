# R7-093 Common card header icon plain large

Status: current baseline for `v1.15.52`.

## Change

공통 카드 헤더의 최좌측 `헤더 아이콘` 표시를 수정한다.

- `data-r7-common-card-icon-wrap`의 배경색 제거.
- 아이콘 뒤의 rounded badge/background box 제거.
- 아이콘 wrap은 정렬 슬롯만 유지한다.
- 실제 `ha-icon` 크기는 기존 17px에서 `22px`로 키운다.
- 적용 범위는 `renderR7CommonCardHeader`를 사용하는 카드 전체다.

## Marker

```html
data-r7-common-card-icon-wrap
data-r7-common-card-icon-style="plain-large"
```
