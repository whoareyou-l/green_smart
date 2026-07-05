# RS-009 Legacy Direction Inventory

> 기준 버전: `v1.14.76` / updated in `v1.14.76`
> Status: active boundary contract
> 목적: Green Smart rebuild에서 legacy가 제품 방향성으로 남지 않도록, historical reference / adapter-only / legacy panel / current source of truth 경계를 명확히 한다.

## 0. Boundary decision

```text
legacy physical schema is adapter-only
historical reference, not product direction
adapter-only code may contain legacy names
legacy names must not leak into new product API/docs/frontend direction
No production migration in RS-009
```

Current source of truth:

| Domain | current source of truth |
|---|---|
| DB target schema | `docs/master/03-database-schema.md` |
| CBA UI structure | `docs/master/01-cba-ui-ux-spec.md` |
| API/interface direction | `docs/master/02-interface-spec.md` |
| Product-first rebuild plan | `docs/plans/2026-06-28-green-smart-product-first-rebuild-plan.md` |
| Legacy boundary inventory | `docs/rebuild/legacy-direction-inventory.md` |

Frontend boundary:

```text
Green Smart Legacy panel = compatibility surface
rebuild panel only for new product slices
```

New product slices must use rebuild panel/API/docs terms: `crop_cycle`, `currentCrop`, `gs_` target schema, CBA `COM/MOD/PAGE`, RBAC permissions.

---

## 1. P0 — Historical design data/API docs

These files still contain old DB/API direction such as `crop_seasons`, `crop_season_id`, `season_id`, old phase naming, or old route shapes. They are historical reference, not product direction.

| File | Legacy content | Boundary |
|---|---|---|
| `docs/design/data-model.md` | `farm_id + crop_season_id + zone_id + domain`, `crop_seasons` ERD | Historical/adapter reference only. Use `docs/master/03-database-schema.md` for target schema. |
| `docs/design/api-spec.md` | `/api/green_smart/crop/seasons/{season_id}` route list | Historical API reference only. Use `docs/master/02-interface-spec.md` for new API direction. |
| `docs/design/zone-scoped-control-settings.md` | `crop_season_id` setting scope and legacy global key mirror | Historical control compatibility reference only. New target uses crop_cycle/currentCrop. |
| `docs/design/zone-control-roadmap-and-data-model.md` | old zone-control data model and phase plan | Historical roadmap reference only. New execution/safety target comes from `docs/master/03-database-schema.md`. |
| `docs/design/current-backend-api-db-ha-contract.md` | current implementation tables/routes | Current implementation inventory, not target schema. |
| `docs/design/current-ui-design-and-navigation.md` | legacy panel details and retained markers | Current/legacy UI inventory, not new rebuild direction. |

Required marker for historical docs:

```text
Status: historical/adapter reference
Do not use as product direction
Current source of truth: ...
```

---

## 2. P0 — Backend route/API naming compatibility

Adapter-only code may contain legacy names because production compatibility still depends on current routes and physical schema.

| File | Legacy/compat area | Boundary |
|---|---|---|
| `custom_components/green_smart/repositories/crop_repo.py` | `list_crop_seasons`, `crop_seasons`, `season_id` SQL | Adapter-only repository. New product DTO must expose crop_cycle/currentCrop terms. |
| `custom_components/green_smart/crop_views.py` | `/crop/seasons/{season_id}` routes | Compatibility route layer. New routes should be crop-cycle/currentCrop named. |
| `custom_components/green_smart/zone_control_views.py` | `crop_season_id` scope parameters | Compatibility route/query adapter. New service DTO should normalize to `crop_cycle_id`. |
| `custom_components/green_smart/db.py` | current physical schema bootstrap | Physical compatibility only. Target schema is documented in `docs/master/03-database-schema.md`. |

Rules:

1. Do not rename/remove production routes without explicit migration/cutover approval.
2. New endpoints must not expose legacy names as product direction.
3. Compatibility adapters may read/write old physical names but must map outward to target DTO names when used by rebuild flows.

---

## 3. P1 — Legacy frontend panel state/API calls

`custom_components/green_smart/panel/green-smart-panel.js` is the Green Smart Legacy panel compatibility surface. It still includes old state/API names such as `_cropSeasons`, `_activeSeasonId`, `crop/seasons/*`, and `gs_legacy_*` localStorage fallback.

Boundary:

```text
Green Smart Legacy panel = compatibility surface
rebuild panel only for new product slices
```

Rules:

1. Do not add new product features to legacy panel unless explicitly scoped.
2. New UI work must target `custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js`.
3. Rebuild UI must use `currentCrop`, `crop_cycle`, CBA markers, and operator-facing copy.
4. Developer/rebuild/legacy transition copy must not appear in the rendered rebuild frontend.

---

## 4. P1 — RBAC permission naming compatibility

Old permission labels such as `manage_crop_seasons`, `edit_crop_records`, `run_dry_run`, `execute_final_targets`, and the old `green_smart_admin_role_mappings` table are compatibility concepts.

New target permissions are defined in `docs/master/03-database-schema.md`:

```text
home_context.read
crop_cycle.read
crop_cycle.write
growth_observation.write
pest_scouting.write
treatment_record.write
device.mapping.manage
recommendation.approve
execution.dry_run
execution.command
safety.event.ack
safety.event.clear
settings.manage
rbac.manage
```

Boundary:

- Old permission strings may be mapped by adapter/middleware while legacy routes exist.
- New docs/API/tests should use target permission names.
- Backend enforcement must resolve HA user → `gs_users` → roles → permissions before write/approve/execute in the target model.

---

## 5. P2 — Old phase/MVP/legacy transition language

Old docs may contain phase names, MVP labels, legacy global key mirror notes, hidden legacy marker notes, or compatibility transition notes.

Boundary:

- Allowed in historical docs if status marker is present.
- Allowed in tests when asserting compatibility.
- Forbidden in rendered rebuild frontend.
- Not a product direction unless promoted into `docs/master/*` or a current rebuild `RS-*` document.

---

## 6. Next slices recommended by this inventory

| Slice | Goal |
|---|---|
| RS-010 | Crop Cycle API naming boundary completed: Compatibility routes stay adapter-only and product-facing docs/DTO names use crop_cycle/currentCrop. |
| RS-011 | RBAC permission naming cleanup / RBAC permission naming boundary completed: Compatibility permissions stay adapter-only and product-facing docs/checks use target `gs_permissions` codes. |
| RS-012 | Rebuild frontend activeCropCycle/currentCrop service adapter completed: Compatibility aliases remain adapter-only and rebuild render shell consumes normalized crop_cycle/currentCrop DTO. |
| RS-013 | Read-only DB adapter from legacy physical source to target DTO completed: legacy physical schema stays adapter-only and product context exposes crop_cycle/currentCrop. |
| RS-014 | Rebuild home context API source adapter completed: existing protected route now uses the RS-013 legacy-physical-readonly-adapter service as source. |
| RS-015 | Rebuild panel async context loading completed: rebuild panel fetches the protected home context API with `hass.callApi`, normalizes the response, and keeps static read-only fallback. |
| RS-016 | Crop cycle read-only page slice completed: 작물상태/생육목표 now render currentCrop crop_cycle read-only cards from normalized API context. |
| RS-017 | Zone current crop assignment read model completed: each zone now exposes currentCropAssignment linking currentCrop/crop_cycle, equipmentProfile, and dataAvailability as read-only projection. |
| RS-018 | Growth target read-only projection completed: 생육목표 now renders growthTargetProjection from currentCropAssignment as read-only target status. |
| RS-019 | Environment impact read-only projection completed: 영향지도 now renders environmentImpactProjection from currentCropAssignment, equipmentProfile, and dataAvailability. |
| RS-020 | Recommendation review read-only projection completed: 추천·실행 now renders recommendationReviewProjection from assignment, growth target, and environment impact projections. |
| RS-021 | Operator approval scaffold completed: 추천·실행 now renders operatorApprovalScaffold as disabled/read-only approval state before safety preflight. |
| RS-022 | Safety/Interlock preflight projection completed: 추천·실행 now renders safetyInterlockPreflightProjection as read-only preflight state. |
| RS-023 | Virtual execution rehearsal scaffold completed: 추천·실행 now renders virtualExecutionRehearsalScaffold as read-only rehearsal status. |
| RS-024 | Rehearsal result review projection completed: 추천·실행 now renders rehearsalResultReviewProjection as read-only result review. |
| RS-025 | Virtual runner input contract completed: 추천·실행 now renders virtualRunnerInputContract as read-only runner input shape. |
| RS-026 | Virtual runner dry-run result adapter completed: 추천·실행 now renders virtualRunnerDryRunResultAdapter as read-only simulated result shape. |
| RS-027 | Virtual rehearsal pass/fail review projection completed: 추천·실행 now renders virtualRehearsalPassFailReviewProjection as read-only operator review shape. |
| RS sequence complete before R5 scaffold | R4 RS-series is complete; next work moves to Phase R5 Product rebuild execution scaffold. |

---

## 7. Completion criteria

- [x] P0/P1/P2 legacy areas are listed.
- [x] Current source-of-truth docs are named.
- [x] Historical design docs carry status markers.
- [x] Adapter-only code is allowed but bounded.
- [x] New rebuild product slices are protected from legacy direction leakage.
