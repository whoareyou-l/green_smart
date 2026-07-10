# R7-095 Settings greenhouse/zone detail actions

Status: current baseline for `v1.15.09`.

## Scope

온실/구역 설정 화면을 상세 기능으로 확장한다.

## Equipment composition

`장치 목록`은 전체 합계가 아니라 선택 구역 상태 카드다. 표시 값은 `센서, 장비, 미연결`이다.

## Device/sensor mapping

기존 `장비 생성` 카드는 `장치 연결 작성` 진입 카드로 변경한다. 주요 버튼은 `장치 연결 작성`이며 장치 연결 작성 팝업 모달을 연다.

## Modals and API

- 온실 생성 팝업 모달: `POST /api/green_smart/rebuild/settings/greenhouses`
- 구역 생성 팝업 모달: `POST /api/green_smart/rebuild/settings/zones`
- 장치 연결 작성 팝업 모달: `POST /api/green_smart/rebuild/settings/device-sensor-mappings`

API는 현재 approval-gated shell이며 실제 장치 실행은 하지 않는다.
