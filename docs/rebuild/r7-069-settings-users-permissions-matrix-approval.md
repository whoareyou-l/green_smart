# R7-069 Settings users-permissions matrix and approval flow

Status: current baseline for `v1.15.53`.

## Scope

`설정 > 사용자·권한` 하위탭의 사용자 피드백 반영.

## Changes

### 1. 권한 버킷 매트릭스 상세화

권한 버킷 매트릭스 상세화:

- 조회: 기본 조회 / 상세 조회
- 기록: 기록 작성 / 기록 수정
- 전략: 전략 검토 / 전략 승인
- 실행: 실행 요청 / 실행 허락
- 안전: 안전 확인 / 인터록 해제 검토
- 고급설정: 구역/작기 설정 / 권한 설정

각 권한 row에는 `수정 버튼`을 표시한다.

### 2. 글자 수평 정렬

글자 수평 정렬과 위치/크기 조정:

- compact typography
- centered grid alignment
- `font-size:12px`
- `line-height:1.35`
- matrix cell `text-align:center`

### 3. 사용자 승인 요청 방식

초대 방식 제외.

`사용자 초대`가 아니라 `사용자 승인 요청`을 표시하고, 요청을 `허락` / `반려`하는 방식으로 표현한다.

Visible approval request fields:

- 요청자
- 요청 역할
- 요청 상태
- 승인 요청 허락

## Boundary

This remains a read-only layout/affordance slice. Buttons document the intended workflow but do not add backend mutation or real role assignment authority in this slice.
