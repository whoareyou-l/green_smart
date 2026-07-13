# 관수그룹 장치 연결 상세 확장 계획

## 요청 요지

기존 `관수그룹 장치 연결` 모달은 `양액기 센서`, `양액기 장치`, `배액기 센서` 정도만 제공하여 실제 양액기 구성요소를 저장하기에 부족하다. 실제 양액기에는 EC/pH 센서, 유량계, EC/pH 조절 솔밸브, 원수 유입 모터, 급수 모터, 관수그룹으로 보내는 공급 솔밸브 등이 있고, 이들은 모두 Home Assistant entity로 저장되어야 한다.

## 문제의 원인

현재 연결 테이블은 다음 필드 중심이다.

```text
irrigation_group_id
device_id
device_entity
link_role
sort_order
status
note
```

이 구조는 “양액기 장치”라는 큰 역할만 저장할 수 있고, 다음 구성요소를 구분하지 못한다.

```text
EC 센서
pH 센서
급액 유량계
원수 유량계
배액 유량계
EC 조절 솔밸브
pH 조절 솔밸브
A/B액 주입 솔밸브
산/알칼리 주입 솔밸브
원수 유입 모터
급수 모터
교반 모터
관수그룹 공급 솔밸브
배액 EC/pH 센서
배액 수위 센서
```

따라서 “상위 역할”과 “실제 구성요소 유형”을 분리해서 저장해야 한다.

## 설계 원칙

1. 관수그룹 마스터(`green_smart_settings_irrigation_groups`)는 계속 관수 설계 기준만 저장한다.
2. 장치/센서/밸브/모터 연결은 `green_smart_settings_irrigation_group_device_links`에 저장한다.
3. `link_role`은 상위 분류로 유지한다.
4. 실제 판단/제어에 필요한 세부 구분은 `component_type`, `io_type`, `control_target`, `nutrient_channel`로 저장한다.
5. 모든 연결은 entity 단위로 추적할 수 있어야 한다.
6. 한 관수그룹에 여러 개의 센서/밸브/모터/entity가 연결될 수 있어야 한다.

## 신규/확장 필드

### 상위 역할 `link_role`

```text
양액기 센서
양액기 액추에이터
양액기 유량계
원수/급수 장치
관수그룹 공급장치
배액기 센서
배액기 장치
기타
```

### 구성요소 유형 `component_type`

센서:

```text
EC 센서
pH 센서
수온 센서
원수 EC 센서
원수 pH 센서
급액 EC 센서
급액 pH 센서
배액 EC 센서
배액 pH 센서
수위 센서
압력 센서
```

유량계:

```text
원수 유량계
급액 유량계
관수그룹 유량계
배액 유량계
```

밸브/솔밸브:

```text
EC 조절 솔밸브
pH 조절 솔밸브
A액 주입 솔밸브
B액 주입 솔밸브
산 주입 솔밸브
알칼리 주입 솔밸브
원수 유입 솔밸브
급수 솔밸브
관수그룹 공급 솔밸브
배액 솔밸브
```

모터/펌프:

```text
원수 유입 모터
급수 모터
양액 공급 펌프
비료 주입 펌프
산 주입 펌프
알칼리 주입 펌프
교반 모터
배액 펌프
```

기타:

```text
양액기 상태
양액기 알람
기타
```

### 입출력 유형 `io_type`

```text
sensor
meter
valve
motor
pump
actuator
status
alarm
```

### 제어/측정 대상 `control_target`

```text
EC
pH
유량
수위
압력
수온
원수
급수
급액
배액
공급
교반
알람
상태
```

### 계통/채널 `nutrient_channel`

```text
A액
B액
산
알칼리
원수
급수
급액
배액
관수그룹 공급
공통
```

## DB 변경

기존 테이블에 컬럼을 추가한다.

```sql
ALTER TABLE green_smart_settings_irrigation_group_device_links
  ADD COLUMN component_type VARCHAR(96) NOT NULL DEFAULT '' AFTER link_role,
  ADD COLUMN io_type VARCHAR(32) NOT NULL DEFAULT '' AFTER component_type,
  ADD COLUMN control_target VARCHAR(64) NOT NULL DEFAULT '' AFTER io_type,
  ADD COLUMN nutrient_channel VARCHAR(64) NOT NULL DEFAULT '' AFTER control_target,
  ADD COLUMN unit VARCHAR(32) NOT NULL DEFAULT '' AFTER nutrient_channel,
  ADD COLUMN normal_range VARCHAR(64) NOT NULL DEFAULT '' AFTER unit;
```

신규 설치용 CREATE TABLE에도 동일 컬럼을 포함한다.

## API 변경

기존 API는 유지한다.

```text
GET  /api/green_smart/rebuild/settings/irrigation-group-device-links
POST /api/green_smart/rebuild/settings/irrigation-group-device-links
```

POST payload는 다음 값을 추가로 받는다.

```json
{
  "irrigationGroupId": 1,
  "deviceId": "9",
  "entityId": "sensor.a_ec",
  "linkRole": "양액기 센서",
  "componentType": "EC 센서",
  "ioType": "sensor",
  "controlTarget": "EC",
  "nutrientChannel": "급액",
  "unit": "mS/cm",
  "normalRange": "1.8~2.4",
  "status": "active",
  "sortOrder": 0,
  "note": "A구역 관수그룹 급액 EC 센서"
}
```

## UI 변경

`관수그룹 장치 연결` 모달을 다음 섹션으로 재구성한다.

### 1. 관수그룹 선택

- 관수그룹
- 상위 역할

### 2. 구성요소 상세

- 구성요소 유형
- 입출력 유형
- 제어/측정 대상
- 계통/채널

### 3. Entity 연결

- 장치
- 대표 Entity
- 단위
- 정상 범위

### 4. 연결 상태

- 상태
- 표시 순서

### 5. 운영 메모

- 메모

## 검증 기준

- 기존 `관수그룹 장치 연결` 버튼은 계속 신규 모달만 연다.
- 모달에 EC 센서, pH 센서, 유량계, EC 조절 솔밸브, pH 조절 솔밸브, 원수 유입 모터, 급수 모터, 관수그룹 공급 솔밸브가 표시된다.
- DB DDL에 신규 컬럼이 포함된다.
- DTO에 신규 필드가 포함된다.
- POST payload에서 신규 필드를 저장한다.
- snapshot의 `irrigationGroupDeviceLinks`에 신규 필드가 포함된다.
- focused/full pytest를 통과한다.
