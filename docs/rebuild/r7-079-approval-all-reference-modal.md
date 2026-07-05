# R7-079 Approval-all reference modal

Status: current baseline for `v1.14.80`.

## Goal

`모든 승인 요청 확인` opens a large approval review popup matching the supplied reference image, not a small generic list.

## Layout

- Header: `승인 필요 작업`, context subtitle, close button.
- Filter/search bar: 작업 검색, 전체, 안전 확인, 자동제어, 장치 매핑, 권한 변경, 긴급.
- 좌측 승인 대기 목록: request date, type, risk, content, requester, selected row indicator.
- 우측 선택 작업 검토:
  - 요청 정보
  - 변경 내용
  - 영향 분석
  - 검증 체크
  - 승인/반려 메모
- Footer actions: 상세 로그 보기, 반려, 승인, 닫기.

## Binding boundary

The modal is still isolated from crop record/history modal routing. `모든 승인 요청 확인` keeps the approval-list button marker and skip-record-binding guard.

## Decision behavior

The list row changes the selected review pane. `승인` calls the approval decision API and activates the target Green Smart user; `반려` calls the same decision API with reject, records the user as rejected, and writes an audit log row.
