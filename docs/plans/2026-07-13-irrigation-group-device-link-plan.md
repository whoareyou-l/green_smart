# 관수그룹 장치 연결 전환 계획

## 요청 요지

`장치` 하위탭의 기존 `관수그룹 연결` 명칭을 `관수그룹 장치 연결`로 바꾸고, 버튼 클릭 시 관수그룹 마스터 생성 모달이 아니라 관수그룹에 양액기/배액기 센서·장치를 연결하는 전용 팝업 모달을 제공한다.

## 원인

기존 장치 하위탭의 `관수그룹 연결` 버튼은 `data-r7-settings-device-group-create-button`을 사용했다. 이 attribute는 관수그룹 마스터 생성 버튼과 동일한 핸들러에 바인딩되어 `_openSettingsDeviceGroupCreateModal()`을 호출한다. 따라서 사용자가 장치 연결을 하려는 상황에서도 `관수그룹 생성` 모달이 열리는 구조적 혼선이 있었다.

## 분리 원칙

1. 관수그룹 마스터 생성/수정은 `green_smart_settings_irrigation_groups`에 저장한다.
2. 관수그룹에 장치/센서를 연결하는 행위는 별도 연결 테이블에 저장한다.
3. 장치 하위탭의 버튼은 `관수그룹 장치 연결` 전용 핸들러를 사용한다.
4. 관수그룹 생성 모달에는 장치 선택/센서 선택을 다시 넣지 않는다.
5. 연결 역할은 현재 요구 범위 기준으로 `양액기 센서`, `양액기 장치`, `배액기 센서` 3개로 제한한다.

## UI 변경

### 장치 하위탭 액션 카드

- 기존 제목: `관수그룹 연결`
- 변경 제목: `관수그룹 장치 연결`
- 기존 버튼: `관수그룹 연결`
- 변경 버튼: `관수그룹 장치 연결`
- 기존 클릭 핸들러: `data-r7-settings-device-group-create-button`
- 변경 클릭 핸들러: `data-r7-settings-irrigation-group-device-link-button`

## 신규 모달 항목

### 1. 관수그룹 선택

- 관수그룹 FK
- 연결 역할
  - 양액기 센서
  - 양액기 장치
  - 배액기 센서

### 2. 연결 장치

- 장치 FK
- 대표 Entity

### 3. 연결 상태

- 상태
  - 연결
  - 미연결
  - 장치오류
- 표시 순서

### 4. 운영 메모

- 연결 사유 또는 현장 위치 메모

## 신규 DB 테이블

```sql
CREATE TABLE IF NOT EXISTS green_smart_settings_irrigation_group_device_links (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    farm_id BIGINT NOT NULL DEFAULT 1,
    irrigation_group_id BIGINT NOT NULL,
    device_id VARCHAR(128) NOT NULL DEFAULT '',
    device_entity VARCHAR(255) NOT NULL DEFAULT '',
    link_role VARCHAR(64) NOT NULL DEFAULT '양액기 장치',
    sort_order INT NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    note TEXT NULL,
    created_by VARCHAR(128) NULL,
    updated_by VARCHAR(128) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_settings_irrigation_group_device_link (farm_id, irrigation_group_id, device_id, device_entity, link_role),
    KEY idx_settings_irrigation_group_device_link_group (farm_id, irrigation_group_id, status),
    KEY idx_settings_irrigation_group_device_link_device (farm_id, device_id, status),
    KEY idx_settings_irrigation_group_device_link_role (farm_id, link_role, status)
);
```

## API

```text
GET  /api/green_smart/rebuild/settings/irrigation-group-device-links
POST /api/green_smart/rebuild/settings/irrigation-group-device-links
```

POST payload 방향:

```json
{
  "irrigationGroupId": 1,
  "deviceId": "9",
  "entityId": "sensor.fertigation_ec",
  "linkRole": "양액기 센서",
  "status": "active",
  "sortOrder": 0,
  "note": "A구역 관수그룹 1 EC 센서"
}
```

## Snapshot

`settings_snapshot_response()`에 다음 배열을 추가한다.

```text
irrigationGroupDeviceLinks
```

## 검증

- 버튼 카드에 `관수그룹 장치 연결` 문구가 표시된다.
- 버튼은 `data-r7-settings-irrigation-group-device-link-button`을 사용한다.
- 버튼 카드에는 `data-r7-settings-device-group-create-button`이 없어야 한다.
- 신규 모달은 `관수그룹 장치 연결` 제목과 저장 버튼을 가진다.
- 신규 모달은 관수그룹 FK, 장치 FK, 대표 Entity, 연결 역할, 상태, 표시 순서, 메모를 가진다.
- DB/API 계약에 신규 테이블과 endpoint가 존재한다.
- full pytest를 통과한다.
