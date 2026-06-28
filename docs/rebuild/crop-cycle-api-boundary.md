# RS-010 Crop Cycle API Naming Boundary

> 기준 버전: `v1.12.19`
> Status: active boundary contract
> 목적: 기존 `crop/seasons`, `season_id`, `crop_season_id`가 새 제품 방향으로 새지 않도록 compatibility adapter와 product-facing DTO/API naming 경계를 고정한다.

## 0. Boundary decision

```text
Compatibility route names are adapter-only
Product-facing DTO names are crop_cycle/currentCrop
No production route removal in RS-010
No DB migration in RS-010
```

RS-010은 이름 경계와 문서/계약만 다룬다. 운영 중인 Home Assistant route, physical DB schema, legacy panel API call을 제거하지 않는다.

---

## 1. Compatibility route vs product route direction

| Layer | Current compatibility | Product-facing target |
|---|---|---|
| Crop cycle list | legacy route: /api/green_smart/crop/seasons | product route direction: /api/green_smart/crop/cycles |
| Current crop context | current fixture/legacy selected season | product route direction: /api/green_smart/crop/current |
| Growth records | `/api/green_smart/crop/seasons/{season_id}/growth` | `/api/green_smart/crop/cycles/{crop_cycle_id}/growth-observations` |
| Pest scouting | `/api/green_smart/crop/seasons/{season_id}/pest` | `/api/green_smart/crop/cycles/{crop_cycle_id}/pest-scouting` |
| Treatment records | `/api/green_smart/crop/seasons/{season_id}/control` | `/api/green_smart/crop/cycles/{crop_cycle_id}/treatment-records` |

Rules:

1. Existing `crop/seasons` routes stay available as compatibility adapters until an explicit migration/cutover slice is approved.
2. New product docs, new rebuild UI, and new API DTO names must use `crop_cycle` / `currentCrop` terms.
3. Compatibility adapter response may include legacy aliases only under compatibilityAliases.
4. New service contracts must not present `crop_seasons` or `season_id` as product direction.

---

## 2. Naming map

| Legacy/compatibility name | Product-facing target |
|---|---|
| season_id -> crop_cycle_id | `crop_cycle_id` |
| crop_season_id -> crop_cycle_id | `crop_cycle_id` |
| cropSeasons -> cropCycles | `cropCycles` |
| activeSeasonId -> activeCropCycleId | `activeCropCycleId` |
| selectedSeason | `currentCrop` / `currentCropCycle` |
| crop_seasons physical table | `gs_crop_cycles` target schema, adapter-only until migration |

Canonical DTO keys:

```json
{
  "crop_cycle_id": "cycle-tomato-a",
  "currentCrop": {
    "crop_cycle_id": "cycle-tomato-a",
    "crop_type": "tomato",
    "crop_label_ko": "토마토",
    "growth_stage": "착과·비대 관찰"
  },
  "compatibilityAliases": {
    "cropSeasonId": "season-tomato-a"
  }
}
```

`compatibilityAliases` is allowed only at adapter boundaries. It is not a product model.

---

## 3. Frontend boundary

| Surface | Rule |
|---|---|
| `green-smart-panel.js` | Green Smart Legacy panel compatibility surface; may call `crop/seasons`. |
| `panel/rebuild/green-smart-rebuild-panel.js` | Product-facing rebuild UI; must use `currentCrop`, `crop_cycle`, CBA page structure. |
| future `services/crop-service.js` | May call compatibility routes internally, but must return crop-cycle DTO names outward. |

Rendered rebuild frontend must not show developer migration copy such as “legacy season migration” or old route names.

---

## 4. Backend boundary

| File | RS-010 treatment |
|---|---|
| `crop_views.py` | Compatibility HomeAssistantView route layer. No route removal. |
| `repositories/crop_repo.py` | Physical schema adapter. Legacy SQL names allowed internally. |
| future `services/crop_cycle_service.py` | Product-facing DTO normalization boundary. |
| `docs/master/02-interface-spec.md` | Target interface must document crop-cycle/currentCrop first and quarantine `crop/seasons` as compatibility. |

---

## 5. Completion criteria

- [x] `crop/seasons` is documented as compatibility adapter only.
- [x] `crop_cycle/currentCrop` is documented as the product-facing target.
- [x] No production route removal in RS-010.
- [x] No DB migration in RS-010.
- [x] Rebuild UI includes `currentCrop` and `crop_cycle` product DTO markers.
- [x] Legacy panel is explicitly labeled as compatibility surface.
