# 관수그룹 장치 연결: 디바이스 + 엔티티 N개 반복 연결 계획

## 요청 요지

`관수그룹 장치 연결` 팝업 모달은 `구역 장치 연결` 팝업 모달을 참고하여 다음 항목을 포함해야 한다.

```text
관수그룹
디바이스 ID
디바이스 명
엔티티ID N개
```

특히 양액기를 하나의 디바이스로 선택하고, 그 양액기 안에 포함된 모든 세부 entity를 관수그룹에 연결할 수 있어야 한다.

예시 entity:

```text
EC 센서
pH 센서
유량계
A통 솔밸브
B통 솔밸브
C통 솔밸브
D통 솔밸브
구역 솔밸브
원수 유입 모터
급수 모터
관수그룹 공급 솔밸브
```

## 현재 문제

`v1.15.60` 기준 모달은 세부 구성요소 분류는 갖고 있지만, 저장 단위가 아직 단일 row이다.

```text
관수그룹 1개
장치 1개
대표 Entity 1개
구성요소 유형 1개
```

이 구조에서는 양액기 1대에 포함된 여러 HA entity를 한 번에 연결할 수 없다. 사용자는 양액기 디바이스 하나에 포함된 모든 entity를 보고, 각 entity별로 역할/구성요소를 지정해 저장해야 한다.

## 목표 UX

`구역 장치 연결` 모달의 `엔티티 N 그룹` 패턴을 재사용한다.

### 1. 관수그룹 선택

- 관수그룹
- 구역 표시

### 2. 디바이스 선택

- 디바이스 ID
- 디바이스 명
- 장비종류 기본값: 양액기

### 3. 엔티티 N 그룹

각 entity row는 다음 필드를 가진다.

```text
엔티티ID
종류/domain
단위
상위 역할
구성요소 유형
입출력 유형
제어/측정 대상
계통/채널
정상 범위
```

### 4. 연결 상태

- 상태
- 표시 순서 시작값

### 5. 운영 메모

- 공통 메모

## 구성요소 유형 보강

기존 구성요소 유형에 `A~D통 솔밸브`, `구역 솔밸브`를 추가한다.

```text
A통 솔밸브
B통 솔밸브
C통 솔밸브
D통 솔밸브
구역 솔밸브
```

## 저장 구조

DB 테이블은 기존을 유지한다.

```text
green_smart_settings_irrigation_group_device_links
```

다만 POST payload가 단일 row뿐 아니라 `entities` 배열을 받을 수 있게 한다.

```json
{
  "irrigationGroupId": 7,
  "deviceId": "ha-device-id-or-green-smart-device-id",
  "deviceName": "A구역 양액기",
  "entities": [
    {
      "entityId": "sensor.fertigation_ec",
      "linkRole": "양액기 센서",
      "componentType": "EC 센서",
      "ioType": "sensor",
      "controlTarget": "EC",
      "nutrientChannel": "급액",
      "unit": "mS/cm",
      "normalRange": "1.8~2.4",
      "sortOrder": 0
    },
    {
      "entityId": "switch.tank_a_valve",
      "linkRole": "양액기 액추에이터",
      "componentType": "A통 솔밸브",
      "ioType": "valve",
      "controlTarget": "EC",
      "nutrientChannel": "A액",
      "unit": "",
      "normalRange": "",
      "sortOrder": 1
    }
  ]
}
```

백엔드는 `entities`가 있으면 각 entity를 개별 row로 insert/upsert한다. `entities`가 없으면 기존 단일 row payload도 계속 지원한다.

## 자동 추론

프론트는 entity_id/domain/name을 바탕으로 기본값을 추론한다.

예:

```text
ec → EC 센서 / sensor / EC / 급액
ph → pH 센서 / sensor / pH / 급액
flow → 급액 유량계 / meter / 유량 / 급액
a_tank, tank_a, a_valve → A통 솔밸브 / valve / EC / A액
b_tank, tank_b, b_valve → B통 솔밸브 / valve / EC / B액
c_tank, tank_c, c_valve → C통 솔밸브 / valve / pH / 산
d_tank, tank_d, d_valve → D통 솔밸브 / valve / pH / 알칼리
zone_valve, group_valve → 구역 솔밸브 또는 관수그룹 공급 솔밸브 / valve / 공급 / 관수그룹 공급
raw_water → 원수 유입 모터 또는 원수 유량계
supply_motor → 급수 모터
```

## 검증 기준

- 모달에 `디바이스 ID`, `디바이스 명`, `엔티티 N 그룹`이 표시된다.
- 선택 디바이스에 포함된 EC/pH/유량계/A~D통 솔밸브/구역 솔밸브 entity row가 렌더된다.
- 각 row에 구성요소 유형/입출력 유형/제어대상/계통/정상범위가 존재한다.
- 백엔드는 `entities` 배열을 받아 여러 row를 저장할 수 있다.
- 기존 단일 row 저장 호환성은 유지된다.
- focused/full pytest 통과 후 Prod served JS, API auth boundary, DB 컬럼 smoke를 확인한다.
