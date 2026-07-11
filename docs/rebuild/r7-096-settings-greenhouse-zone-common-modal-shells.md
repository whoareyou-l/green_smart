# R7-096 Settings greenhouse/zone common modal shells

Status: current baseline for `v1.15.20`.

## Rule

- 생성 버튼은 record common modal shell을 사용한다.
- 목록 버튼과 바로가기 버튼은 CDA split modal을 사용한다.

## Creation buttons

`+ 새 온실 추가`, `+ 새 구역 추가`, `장치 연결 작성`는 `renderR7RecordCommonModalShell`을 통해 렌더한다. 직접 CDA overlay/card를 조립하지 않는다.

## Shortcut/list buttons

`온실 정보`, `구역 목록`, `장치 목록` 버튼은 `renderR7CdaSplitModal`을 통해 목록/상세 2분할 팝업을 연다.
