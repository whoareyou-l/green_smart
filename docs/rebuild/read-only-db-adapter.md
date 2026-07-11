# RS-013 Read-only DB Adapter

> 기준 버전: `v1.15.38`
> Status: active read-only backend adapter boundary
> 목적: legacy physical schema를 제품 방향으로 노출하지 않고, read-only repository/service boundary에서 `crop_cycle/currentCrop` target DTO로 변환한다.

## 0. Boundary decision

```text
legacy physical schema is adapter-only
Product-facing DTO names are crop_cycle/currentCrop
No production route removal in RS-013
No DB migration in RS-013
read-only adapter must not INSERT/UPDATE/DELETE
```

RS-013은 읽기 전용 backend adapter만 추가한다. 기존 `crop_seasons`, `season_id`, `crop_season_id` 물리 schema는 변경하지 않는다.

---

## 1. Physical source to DTO map

| Legacy physical/source | Product-facing DTO |
|---|---|
| crop_seasons -> cropCycles | `cropCycles` / zone contexts |
| crop_season_id -> crop_cycle_id | `crop_cycle_id` |
| season_id -> crop_cycle_id | `crop_cycle_id` |
| `crop_seasons.id` | `currentCrop.crop_cycle_id` |
| `crop_seasons.crop_type` | `currentCrop.crop_type` |
| `crop_seasons.variety` | `currentCrop.variety` |
| `zones.name` | zone `name` |
| legacy evidence | `compatibilityAliases.cropSeasonId` |

---

## 2. Files

| File | Role |
|---|---|
| `repositories/rebuild_crop_context_repo.py` | read-only SQL over `crop_seasons` + `zones` |
| `services/rebuild_crop_context_service.py` | product DTO mapper and read-only context service |
| `docs/master/02-interface-spec.md` | interface source-of-truth marker |
| `docs/master/03-database-schema.md` | DB target schema/read adapter boundary |

---

## 3. Non-goals

```text
No production route removal in RS-013
No DB migration in RS-013
No physical table rename in RS-013
No write/mutation API in RS-013
```

---

## 4. Completion criteria

- [x] Repository uses `SELECT` only.
- [x] Repository reads `crop_seasons` and aliases fields to target row names.
- [x] Service maps rows into `currentCrop`, `crop_cycle`, `activeCropCycleId`, and `compatibilityAliases`.
- [x] Returned context is `readOnly: true` and `executionEnabled: false`.
- [x] Product docs mark legacy physical schema as adapter-only.
