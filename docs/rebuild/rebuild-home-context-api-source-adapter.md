# RS-014 Rebuild Home Context API Source Adapter

> 기준 버전: `v1.14.62`
> Status: active API source adapter boundary
> 목적: `GET /api/green_smart/rebuild/home/context` route shape는 유지하면서 response source를 static fixture에서 RS-013 read-only DB adapter service로 전환한다.

## 0. Boundary decision

```text
GET /api/green_smart/rebuild/home/context
source = legacy-physical-readonly-adapter service
No production route removal in RS-014
No DB migration in RS-014
No write/mutation in RS-014
auth boundary remains requires_auth = True
API response remains readOnly: true and executionEnabled: false
```

RS-014는 API source adapter만 연결한다. Frontend async loading, write/mutation, DB migration, route removal은 범위 밖이다.

---

## 1. Data flow

```text
Home Assistant authenticated request
→ RebuildHomeContextView.get()
→ rebuild_home_context_response(hass)
→ get_rebuild_home_context_from_legacy_db(hass)
→ rebuild_crop_context_repo.list_current_crop_cycle_rows(hass)
→ crop_cycle/currentCrop product DTO
```

---

## 2. Files

| File | Role |
|---|---|
| `custom_components/green_smart/rebuild_views.py` | existing protected API route, now backed by service source |
| `custom_components/green_smart/services/rebuild_crop_context_service.py` | read-only DTO service source |
| `custom_components/green_smart/repositories/rebuild_crop_context_repo.py` | SELECT-only legacy physical DB adapter |

---

## 3. Non-goals

```text
No production route removal in RS-014
No DB migration in RS-014
No write/mutation in RS-014
No frontend fetch wiring in RS-014
No physical table rename in RS-014
```

---

## 4. Completion criteria

- [x] Existing route path stays `GET /api/green_smart/rebuild/home/context`.
- [x] `requires_auth = True` remains unchanged.
- [x] Route calls `get_rebuild_home_context_from_legacy_db(hass)`.
- [x] Response source is `legacy-physical-readonly-adapter`.
- [x] Response remains `readOnly: true` and `executionEnabled: false`.
- [x] No DB migration or write API is introduced.
