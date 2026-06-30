# RS-017 Zone Current Crop Assignment Read Model

> 기준 버전: `v1.12.94`
> Status: zone current crop assignment read model
> 목적: 구역별 currentCrop 배정 상태를 `currentCropAssignment` 읽기 전용 read model로 분리해 frontend와 API DTO가 같은 경계를 보도록 한다.

## 0. Boundary decision

```text
currentCropAssignment
zone → currentCrop/crop_cycle
zone → equipmentProfile
zone → dataAvailability
assignmentState
sourceRowId
No production route removal in RS-017
No DB migration in RS-017
No write/mutation in RS-017
No real-device hookup in RS-017
```

RS-017은 read model slice다. 기존 protected API와 read-only DB adapter를 유지하고, 배정 변경/저장/삭제, DB migration, 실제 장치 연결은 하지 않는다.

---

## 1. DTO shape

Each zone exposes a read-only assignment object:

```json
{
  "currentCropAssignment": {
    "assignmentState": "assigned",
    "zone_id": 2,
    "sourceRowId": 18,
    "currentCrop": { "crop_cycle_id": 18 },
    "equipmentProfile": { "labels": ["구역 장비 요약 대기"] },
    "dataAvailability": { "source": "legacy_physical_readonly_adapter" },
    "readOnly": true,
    "executionEnabled": false
  }
}
```

`sourceRowId`는 legacy physical row evidence로만 사용한다. Product-facing UI는 `currentCropAssignment`와 `currentCrop.crop_cycle_id`를 우선한다.

---

## 2. UI markers

```text
data-current-crop-assignment-card
data-current-crop-assignment-state
data-current-crop-assignment-source-row-id
data-current-crop-assignment-readonly
data-current-crop-assignment-execution-enabled
data-current-crop-assignment-equipment-profile
data-current-crop-assignment-data-availability
```

---

## 3. Non-goals

```text
No production route removal in RS-017
No DB migration in RS-017
No write/mutation in RS-017
No real-device hookup in RS-017
No currentCropAssignment edit/save/delete controls in RS-017
```

---

## 4. Completion criteria

- [x] Service mapper emits `currentCropAssignment` for each zone.
- [x] Frontend adapter normalizes `currentCropAssignment` from API or fallback context.
- [x] Rebuild panel renders a read-only assignment card with stable markers.
- [x] Assignment card links `currentCrop/crop_cycle`, `equipmentProfile`, and `dataAvailability` without mutation affordances.
