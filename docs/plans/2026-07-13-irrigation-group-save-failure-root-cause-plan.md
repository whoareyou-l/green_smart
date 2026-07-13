# 관수그룹 저장 `device-group-create-failed` 재발 원인 분석 및 작업 계획

## 현상

관수그룹 저장 버튼을 누르면 프론트에는 동일하게 `device-group-create-failed`가 표시된다.

## 핵심 요지

`device-group-create-failed`는 실제 원인명이 아니라 프론트 catch block의 포괄 오류 메시지다. 따라서 같은 메시지가 떠도 원인은 매번 다를 수 있다.

현재 재진단에서 확인된 실제 서버 원인은 다음이다.

```text
Unable to serialize to JSON.
Bad data found at $.irrigationGroup.flowRatePerOutlet=3.000(<class 'decimal.Decimal'>)
```

즉 저장 INSERT 자체는 성공하고 DB에는 관수그룹이 생성되지만, 저장 후 응답 JSON에 MariaDB DECIMAL 값이 Python `Decimal` 객체로 포함되어 Home Assistant JSON 응답 직렬화가 실패한다. 프론트는 이 실패를 catch하여 기존 메시지 `device-group-create-failed`로 표시한다.

## 이전 원인과 현재 원인의 차이

1. 이전 원인
   - 구역 배드 수가 `6개` 표시 문자열로 넘어옴
   - 백엔드에서 `int('6개')` 변환 실패
   - INSERT 전 실패

2. 현재 원인
   - `flow_rate_per_outlet` DECIMAL 값이 `Decimal('3.000')`로 반환됨
   - INSERT는 성공
   - 응답 DTO/snapshot JSON 직렬화 단계에서 실패

## 문제 지점

1. `create_settings_irrigation_group()`
   - INSERT 후 `list_settings_irrigation_groups()`로 저장된 row를 다시 읽음
   - 반환 DTO가 API 응답의 `irrigationGroup`으로 들어감

2. `_irrigation_group_dto()`
   - `flow_rate_per_outlet`를 그대로 `flowRatePerOutlet`에 넣고 있었음
   - MariaDB DECIMAL 컬럼은 aiomysql에서 `Decimal`로 들어올 수 있음

3. `settings_snapshot_response()`
   - `irrigationGroups` 목록에도 동일 DTO가 들어감
   - zones 내부 `irrigationGroups`에도 같은 객체가 들어감

4. Home Assistant JSON 응답
   - `Decimal`은 HA JSON 직렬화에서 허용되지 않음
   - 따라서 저장 성공 후에도 HTTP 응답 생성 실패

## 수정 계획

1. DTO 계층에서 JSON-safe 변환을 강제한다.
   - `_json_number()` 추가
   - Decimal → float → 정수값이면 int로 normalize
   - 예: `Decimal('3.000')` → `3`

2. 정수 필드도 DTO에서 명확하게 normalize한다.
   - `irrigationGroupNo`
   - `outletCount`
   - `bedCount`

3. 회귀 테스트를 추가한다.
   - `_irrigation_group_dto()`에 `Decimal('3.000')`을 넣었을 때 `Decimal`이 남지 않는지 검증

4. 기존 검증을 유지한다.
   - Focused tests
   - Full pytest
   - Python compile
   - JS syntax check

5. Prod 배포 후 실제 served/backend marker와 로그를 확인한다.
   - v1.15.58 served marker
   - backend `_json_number`, `Decimal` marker
   - API auth boundary 401
   - restart 후 stable log에서 JSON serialization error 재발 여부 확인

## 완료 기준

- `flowRatePerOutlet`가 더 이상 Decimal 객체로 JSON 응답에 포함되지 않는다.
- 관수그룹 저장 후 DB INSERT 성공 + HTTP 응답 성공이 가능해야 한다.
- 같은 문제가 재발하지 않도록 Decimal DTO 회귀 테스트가 통과해야 한다.
