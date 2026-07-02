# RS-012 Rebuild currentCrop/crop_cycle Adapter

> 기준 버전: `v1.14.35`
> Status: active frontend adapter boundary
> 목적: rebuild frontend가 legacy fixture/API shape에 직접 묶이지 않도록 `currentCrop` + `crop_cycle` product DTO adapter를 분리한다.

## 0. Boundary decision

```text
legacy fixture shape may contain cropSeasonId
product-facing rebuild DTO uses crop_cycle/currentCrop
No production route removal in RS-012
No DB migration in RS-012
```

RS-012는 frontend adapter boundary만 다룬다. 운영 route 제거, DB migration, legacy panel rewrite는 하지 않는다.

---

## 1. Adapter contract

| Input compatibility field | Product-facing DTO |
|---|---|
| `currentCrop.cropSeasonId` | `currentCrop.crop_cycle_id` |
| `currentCrop.cropType` | `currentCrop.crop_type` |
| `currentCrop.cropLabelKo` | `currentCrop.crop_label_ko` |
| `currentCrop.growthStage` | `currentCrop.growth_stage` |
| zone selected crop id | `activeCropCycleId` + `crop_cycle` |
| legacy alias evidence | `compatibilityAliases.cropSeasonId` |

Rules:

1. Rebuild panel imports `current-crop-adapter.js` instead of embedding DTO normalization inline.
2. Rendered rebuild UI consumes product-facing `currentCrop` / `crop_cycle` fields.
3. Legacy aliases may be preserved only under `compatibilityAliases`.
4. Future API adapter can replace static fixture input without changing page render logic.

---

## 2. Files

| File | Role |
|---|---|
| `panel/rebuild/current-crop-adapter.js` | Product DTO normalization boundary |
| `panel/rebuild/green-smart-rebuild-panel.js` | Render shell consuming normalized context |
| `docs/master/02-interface-spec.md` | Interface source-of-truth marker |

---

## 3. Completion criteria

- [x] `normalizeCurrentCrop()` maps legacy fixture fields to target DTO fields.
- [x] `normalizeRebuildZoneContext()` produces `activeCropCycleId`, `crop_cycle`, `currentCrop`, and `compatibilityAliases`.
- [x] `normalizeRebuildHomeContext()` normalizes all zones.
- [x] Rebuild panel imports adapter instead of owning inline normalization.
- [x] No production route removal in RS-012.
- [x] No DB migration in RS-012.
