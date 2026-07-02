# R7-068 Settings users-permissions image layout

Status: current baseline for `v1.14.35`.

## Scope

`설정 > 사용자·권한` 하위탭의 내용 카드를 사용자가 제공한 이미지 구조에 맞춘다.

## Visible card structure

이미지 기준으로 다음 4개 카드만 표시한다.

1. 사용자 목록
   - 사용자 / 역할 / 상태 / 최근 활동 / 권한 요약 열
   - 예시 row: `admin`, `owner01`, `staff01`
   - 하단 버튼: `사용자 초대`, `역할 변경`

2. 권한 버킷 매트릭스
   - 역할 열: `admin`, `farm_owner`, `farm_staff`
   - 권한 row: `조회`, `기록`, `전략`, `실행`, `안전`, `고급설정`
   - 상태 표현: `허용`, `읽기 전용`, `확인`, `없음`

3. 승인 필요 작업
   - 자동제어 활성화
   - 안전 리밋 변경
   - HA entity mapping 변경
   - 하단 버튼: `모든 승인 요청 확인`

4. 감사 로그
   - admin / owner01 / staff01 활동 row
   - 하단 버튼: `전체 감사 로그 보기`

## Explicit exclusion

권한 정책 메모 제외.

The reference image includes a lower-right `권한 정책 메모` card, but the user said it is unnecessary. Do not render that card or its `정책 상세 보기` button in the visible `사용자·권한` subtab.

## Boundary

This is still a read-only layout slice. The buttons are UI affordances only for this slice and do not add role mutation, save/delete/apply, or backend permission changes.
