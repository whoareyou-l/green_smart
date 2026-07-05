# R7-098 Settings greenhouse/zone real DB/API

## 목적

R7-095~R7-097에서 만든 온실·구역·장치/센서 모달을 UI shell이 아니라 실제 작동 기능으로 연결한다.

## 실제 DB

`ensure_schema()`가 다음 실제 설정 테이블을 생성한다.

```sql
green_smart_settings_greenhouses
green_smart_settings_zones
green_smart_settings_device_sensor_mappings
```

각 테이블은 `UNIQUE KEY` 기반 upsert를 사용해 같은 온실명/구역명/매핑 조합을 중복 생성하지 않고 갱신한다.

## GET/POST API

```text
GET  /api/green_smart/rebuild/settings/snapshot
GET  /api/green_smart/rebuild/settings/greenhouses
POST /api/green_smart/rebuild/settings/greenhouses
GET  /api/green_smart/rebuild/settings/zones
POST /api/green_smart/rebuild/settings/zones
GET  /api/green_smart/rebuild/settings/device-sensor-mappings
POST /api/green_smart/rebuild/settings/device-sensor-mappings
```

POST 응답은 더 이상 `approval-gated-settings-shell` ack가 아니다. 실제 DB 저장 후 아래 형태를 반환한다.

```json
{
  "ok": true,
  "saved": true,
  "approvalRequired": false,
  "settingsSnapshot": {
    "greenhouses": [],
    "zones": [],
    "deviceSensorMappings": []
  }
}
```

## 프론트 기능

- 생성 버튼 저장 성공 후 `GET green_smart/rebuild/settings/snapshot`을 다시 호출한다.
- `settingsSnapshot`은 `this._settingsGreenhouseZoneData`에 저장된다.
- 목록 버튼 모달은 `settingsData.greenhouses`, `settingsData.zones`, `settingsData.deviceSensorMappings`를 우선 사용한다.
- DB 데이터가 없을 때만 기존 home context fallback을 사용한다.

## 범위

이번 slice는 온실·구역·장치/그룹의 실제 DB/API CRUD baseline 중 생성/조회 흐름이다. 삭제/수정 전용 UI, 승인 워크플로우와 감사 로그 DB 세분화는 별도 slice에서 다룬다.
