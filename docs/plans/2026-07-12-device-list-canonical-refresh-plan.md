# 장치 목록 팝업 canonical 최신화 계획

## 목표

`설정 > 장치 연결 작성 > 장치 목록` 팝업을 기존 `deviceSensorMappings` 중심 목록에서, 새 HA Device Registry 기반 canonical 구조를 우선 표시하는 목록/상세 모달로 최신화한다.

## 배경

현재 장치 연결 저장 구조는 다음 canonical 테이블을 사용한다.

```text
green_smart_devices
green_smart_device_entities
green_smart_device_entity_latest_values
green_smart_device_entity_samples
```

하지만 장치 목록 팝업은 아직 기존 `deviceSensorMappings`/legacy settings devices 표현을 섞어 쓰고 있어 다음 정보가 부족하다.

```text
HA Device ID
연결된 Entity N개
Entity 역할
Entity 단위
Entity 현재값/latest freshness
```

## 원칙

1. **canonical 우선**
   - `green_smart_devices`를 장치 목록의 우선 source로 사용한다.
   - 기존 `deviceSensorMappings`는 fallback/legacy 호환으로만 유지한다.

2. **목록은 장치 단위**
   - 좌측 목록 1 row = Green Smart device 1개.
   - entity별 row로 장치 목록을 부풀리지 않는다.

3. **상세는 device + entity N개**
   - 우측 상세는 장치 기본 정보와 HA Device Registry 정보를 보여준다.
   - 아래에 해당 device의 entity N개 표를 보여준다.

4. **현재값은 latest cache 기준**
   - 현재값은 `green_smart_device_entity_latest_values`의 latest snapshot을 우선 사용한다.
   - 값이 없으면 `미수집`으로 표시한다.

5. **기존 기능 보존**
   - 장치 목록 팝업의 수정/삭제 footer action은 유지한다.
   - 기존 legacy mapping row fallback도 깨지지 않게 둔다.

## Backend/API 계획

### 1. Settings snapshot 확장

`settings_snapshot_response()`에 canonical 데이터 추가:

```json
{
  "canonicalDevices": [],
  "canonicalDeviceEntities": {
    "<greenSmartDeviceId>": []
  },
  "canonicalDeviceLatestValues": {
    "<greenSmartDeviceId>": []
  }
}
```

### 2. 신규 helper

```python
list_green_smart_device_entities(hass, farm_id=1)
list_green_smart_device_latest_values_map(hass, farm_id=1)
```

반환 필드:

```text
entityId
entityDomain
unitOfMeasurement
entityRole
readWriteMode
valueKind
state
freshnessState
sampledAt
```

## Frontend/UI 계획

### 1. `_r7SettingsConnectedDeviceRows()` canonical 우선화

- `settingsData.canonicalDevices`가 있으면 이를 우선 사용한다.
- 각 row에 다음 필드를 포함한다.

```text
id
source = canonical-device
haDeviceId
deviceName
deviceType/equipmentKind
zoneId/location
entityCount
latestValueCount
status/statusLabel
note
entities
latestValues
```

### 2. 장치 목록 좌측 컬럼 변경

기존:

```text
장치명 / 장비종류 / 장비 엔티티 ID / 상태
```

변경:

```text
장치명 / 장비종류 / Entity 수 / 상태
```

### 3. 장치 상세 우측 필드 변경

```text
장치명
장비종류
구역
HA Device ID
연결 Entity 수
현재값 수집
상태
메모
```

### 4. Entity N개 표 추가

상세 하단에 `data-r7-settings-device-list-entity-table` 섹션 추가.

컬럼:

```text
Entity ID
종류
단위
역할
현재값
freshness
```

### 5. marker 추가

회귀 방지용 marker:

```text
data-r7-settings-device-list-canonical="true"
data-r7-settings-device-list-ha-device-id
data-r7-settings-device-list-entity-table
data-r7-settings-device-list-entity-row
data-r7-settings-device-list-latest-value
```

## 테스트 계획

Focused contract:

1. synthetic snapshot에 canonicalDevices/canonicalDeviceEntities/canonicalDeviceLatestValues를 주입한다.
2. 장치 목록 팝업 렌더 결과가 다음을 포함하는지 검증한다.
   - canonical marker
   - HA Device ID
   - Entity 수
   - entity row N개
   - 역할/단위/current value/freshness
3. 기존 edit/delete footer action 유지 검증.
4. legacy fallback 장치가 계속 보이는지 기존 테스트 유지.

## 검증/릴리스 계획

1. `node --check` rebuild panel.
2. focused pytest.
3. full pytest.
4. Prod `docker cp` sync.
5. HA config check.
6. HA restart.
7. served JS marker smoke.
8. stable log smoke.
9. commit/tag/push/GitHub Release.
