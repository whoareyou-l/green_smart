# RS-015 Rebuild Panel Async Context Loading

> 기준 버전: `v1.14.92`
> Status: active frontend async context loading boundary
> 목적: rebuild panel이 static fixture에만 의존하지 않고 protected home context API를 비동기로 호출해 `crop_cycle/currentCrop` context를 렌더링한다.

## 0. Boundary decision

```text
GET /api/green_smart/rebuild/home/context
panel fetches protected API through hass.callApi
No production route removal in RS-015
No DB migration in RS-015
No write/mutation in RS-015
fallback remains static read-only context
render states: loading, ready, error
```

RS-015는 frontend async loading만 연결한다. API route, DB schema, write/mutation, execution 버튼은 범위 밖이다.

---

## 1. Frontend flow

```text
connectedCallback()
→ render static read-only fallback while loading
→ _loadHomeContext()
→ hass.callApi("GET", REBUILD_CONTEXT_API_PATH)
→ normalizeRebuildHomeContext(response)
→ render ready state with API context
```

Error path:

```text
callApi failure
→ keep getRebuildHomeContext(REBUILD_HOME_CONTEXT) fallback
→ _contextLoadState = "error"
→ data-rebuild-context-error marker rendered
```

---

## 2. Files

| File | Role |
|---|---|
| `custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js` | async API loading + loading/ready/error render state |
| `custom_components/green_smart/panel/rebuild/current-crop-adapter.js` | response normalization to product DTO |
| `custom_components/green_smart/rebuild_views.py` | protected backend API source from RS-014 |

---

## 3. Non-goals

```text
No production route removal in RS-015
No DB migration in RS-015
No write/mutation in RS-015
No device execution UI in RS-015
No real-device hookup in RS-015
```

---

## 4. Completion criteria

- [x] Panel calls `hass.callApi("GET", REBUILD_CONTEXT_API_PATH)`.
- [x] Response is normalized through `normalizeRebuildHomeContext(response)`.
- [x] UI carries `data-rebuild-context-load-state`.
- [x] Error fallback carries `data-rebuild-context-error`.
- [x] Static read-only fallback remains available.
- [x] No write/mutation or execution control is added.
