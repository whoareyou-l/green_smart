# 관수그룹 생성 모달 v3 구현 계획

## 목표

관수그룹 생성 모달은 장치 연결 모달이 아니라 구역 FK 기반의 관수그룹 마스터 생성 모달로 동작한다.

## 포함 항목

1. 관수그룹 정보
   - 구역: 기존 구역 FK 선택
   - 관수그룹: 저장 직전 서버에서 `{구역명} 관수그룹 {구역별 다음 번호}`로 자동 생성
   - 상태: 사용/미사용/점검

2. 관수방법
   - 관수방법: 순수경 / 배지경
   - 관수방법 상세: 관수방법 선택값에 따라 드롭다운 옵션 자동 변경
     - 순수경: DFT, NFT, 분무수경, 담액수경, 박막수경, 기타
     - 배지경: 코코피트, 암면, 펄라이트, 피트모스, 혼합배지, 토양, 기타
   - 순환 방식: 순환식 / 비순환식 / 해당 없음
   - 배액 재활용: 배액 재활용 / 배액 재활용 안함 / 해당 없음

3. 토출/재배 기준
   - 토출구 수
   - 기준 유량: L/h 고정
   - 배드 수: 선택 구역의 bedCount를 기본값/최대값으로 참고하며 연결 구역의 배드 수와 같거나 낮아야 함

4. 운영 메모
   - 현장 메모 입력

## 제외 항목

- 장치 선택/체크박스
- HA device/entity 연결
- 밸브/펌프/센서 연결
- 공급 방식: 양액 재배 전제라 입력 제외
- 배액 관리: 배액 관리 전제라 입력 제외
- 관수 시간/목표 물량/작물당 공급량: 추후 관수 제어 도메인에서 관리

## DB/API

신규 테이블: `green_smart_settings_irrigation_groups`

주요 컬럼:

- `zone_id`
- `irrigation_group_no`
- `irrigation_group_name`
- `irrigation_method`
- `irrigation_method_detail`
- `outlet_count`
- `flow_rate_per_outlet`
- `flow_rate_unit` = `L/h`
- `bed_count`
- `circulation_type`
- `drainage_reuse`
- `status`
- `note`

신규 API:

- `GET /api/green_smart/rebuild/settings/irrigation-groups`
- `POST /api/green_smart/rebuild/settings/irrigation-groups`

## 카드 집계

온실/구역 하위탭의 관수그룹 정보 카드는 `settingsSnapshot.irrigationGroups` 기반으로 표시한다.

- 그룹 수: 선택 구역 irrigationGroups 개수
- 관수 방식: 대표 `irrigationMethod · irrigationMethodDetail`
- 토출구 수: 선택 구역 irrigationGroups의 `outletCount` 합계

## 장치 연결과의 관계

이번 작업에서는 장치를 연결하지 않는다. 추후 장치 하위탭에서 장치가 `irrigation_group_id` 또는 관수그룹 FK를 선택해 연결된다.
