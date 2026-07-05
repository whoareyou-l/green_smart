# R7-108 Zone detail DB alignment and Korean labels

Version: v1.14.84
Status: prod verified

## Scope

The zone CDA split modal detail panel was still exposing non-DB fields and English tokens:

- `currentCrop` appeared in the Settings zone detail panel even though it is not a column in `green_smart_settings_zones`.
- `bedCount` was rendered as `6 bed`.
- `status` could be stored/rendered as `active` / `inactive`.

## Detail field order

`구역 목록 > 선택 항목 상세` now follows the `green_smart.green_smart_settings_zones` DB model:

1. `zoneName` — 구역명
2. `greenhouseName` — 온실
3. `purpose` — 용도
4. `area` — 면적
5. `bedCount` — 베드 수
6. `status` — 상태
7. `createdAt` — 생성시각
8. `updatedAt` — 수정시각
9. `note` — 메모

`currentCrop` is removed from this Settings zone detail panel because it belongs to crop operations/current-crop read models, not the settings zone table.

## Korean label policy

- `bed_count` remains a numeric DB column, but API/UI labels are normalized to Korean count labels such as `6개`.
- `green_smart_settings_zones.status` now defaults to Korean `정상`.
- Existing English DB status values are migrated:
  - `active` → `정상`
  - `inactive` → `비활성`
  - `deleted` → `삭제됨`
- Zone create/upsert now writes Korean status labels.

## Verification

- Focused contracts: pass
- Full suite: 1492 passed
- JS syntax checks: pass
- Python compile checks: pass
- Prod DB smoke confirms status stored as Korean and bed count rendered as Korean API label.
