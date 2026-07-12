# R7-095 Settings greenhouse/zone detail actions

Status: current baseline for `v1.15.51`.

## Scope

온실/구역 설정 화면을 상세 기능으로 확장한다.

## Equipment composition

`관수그룹 정보`는 선택 구역의 관수그룹 상태 카드다. 표시 값은 `관수그룹, 연결 장치, 미연결`이다.

## Device/sensor mapping

기존 `장비 생성` 카드는 `관수그룹 생성` 진입 카드로 변경한다. 주요 버튼은 `관수그룹 생성`이며 관수그룹 생성 팝업 모달을 연다.

## Modals and API

- 온실 생성 팝업 모달: `POST /api/green_smart/rebuild/settings/greenhouses`
- 구역 생성 팝업 모달: `POST /api/green_smart/rebuild/settings/zones`
- 장치 연결 작성 팝업 모달: `POST /api/green_smart/rebuild/settings/device-sensor-mappings`

API는 현재 approval-gated shell이며 실제 장치 실행은 하지 않는다.
