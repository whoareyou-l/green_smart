# R7-088 Settings greenhouse/zone reference card detail layout

Status: current baseline for `v1.14.50`.

## Scope

`설정 > 온실·구역` 하위탭의 내용카드를 사용자가 제공한 이미지와 기존 설정 카드 내용을 참고해 운영자용 카드/목록/상세 패널로 재구성한다.

## Layout

- 상단 요약 카드 4개:
  - 온실 기본 정보
  - 구역 구성
  - 구역별 현재 작기
  - 데이터 상태
- 하단 workspace:
  - 좌측: 구역 목록 + 구역 생성 버튼 (`+ 새 구역 추가`)
  - 우측: 선택 구역 상세
- 선택 구역 상세는 기본 정보, 대표 센서, 제어 장비 매핑, 센서 freshness 알림, 하단 액션 버튼을 가진다.

## Markers

- `data-r7-settings-greenhouse-zones-layout="reference-card-detail"`
- `data-r7-settings-greenhouse-summary-card="greenhouse-basic-info"`
- `data-r7-settings-greenhouse-summary-card="zone-composition"`
- `data-r7-settings-greenhouse-summary-card="zone-current-crop"`
- `data-r7-settings-greenhouse-summary-card="data-health"`
- `data-r7-settings-zone-list-panel`
- `data-r7-settings-zone-create-button`
- `data-r7-settings-zone-detail-panel`
- `data-r7-settings-selected-zone-detail-card`

## Boundary

구역 생성/편집/작기 연결 변경 버튼은 이번 slice에서 화면 affordance와 marker만 제공한다. 실제 DB mutation/save는 별도 승인/저장 slice에서 처리한다.
