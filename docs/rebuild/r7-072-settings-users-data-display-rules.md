# R7-072 Settings users data display rules

Status: current baseline for `v1.15.11`.

## Scope

`설정 > 사용자·권한` 화면의 공통 컴포넌트 구조는 유지하되, 샘플/설명 중심 문구를 줄이고 데이터 표시 규칙을 명확히 한다.

## Rules

1. `승인 필요 작업` 카드의 개별 `허락` / `반려` 버튼은 표시하지 않는다.
   - 승인 세부 처리 버튼은 별도 workflow/모달/후속 slice에서 다룬다.
   - 현재 카드는 `모든 승인 요청 확인` affordance만 유지한다.

2. 카드의 굵은 primary 문구는 실제 연동 데이터 요약만 표시한다.
   - 예: `기록 없음`, `승인 대기 3건`, `최근 2건`, `최근 5일 전`
   - `사용자 승인 요청 · 자동제어 활성화 · 안전 리밋 변경` 같은 정적 설명형 굵은 문구는 금지한다.

3. 부연 설명은 데이터가 없을 때만 표시한다.
   - 예: `승인 요청 데이터가 없으면 요청자와 요청 역할을 추가하세요.`
   - 데이터가 있으면 row 자체가 설명 역할을 하므로 안내 문구를 숨긴다.

4. 최신 N개 표시는 감사 로그 전용 규칙이 아니라 공통 컴포넌트 규칙이다.
   - 공통 marker: `data-r7-common-data-limit="N"`
   - `감사 로그`는 해당 카드 limit `2`를 적용해 최신 2개만 보여준다.

5. 표형 공통 컴포넌트의 사용자 목록은 limit `5`를 적용한다.
   - 공통 marker: `data-r7-common-table-limit="5"`
   - 원본 rows가 6개 이상이어도 화면에는 최신 5개만 표시한다.

## Verification

- `tests/test_r7_072_settings_users_data_display_rules_contract.py`
- Related settings users contracts R7-068~R7-071
