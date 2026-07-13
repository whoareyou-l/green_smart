# R7-062 Record save callApi path hotfix

Status: current baseline for `crop-operations.records-workflow` as of `v1.15.59`.

## 저장 실패 실제 원인

The rebuild records modal used Home Assistant `hass.callApi` with an absolute API path:

```js
hass.callApi("POST", "/api/green_smart/rebuild/crop-records/...")
```

Existing Green Smart and HA frontend patterns pass paths **without** `/api/`:

```js
hass.callApi("POST", "green_smart/...")
```

`hass.callApi` prepends the Home Assistant API prefix itself. Passing `/api/...` risks an `/api/ 중복` path such as `/api/api/...`, so the request can fail before reaching the custom integration. This also explains why recent HA logs showed no backend error for the user's save attempt.

## Fix

Both records workflow calls now use HA-relative paths:

```js
hass.callApi("GET", `green_smart/rebuild/crop-records/${seasonId}/history/${recordType}`)
hass.callApi(writeMethod, `green_smart/rebuild/crop-records/${normalizedSeasonId}/${recordType}`, payload)
```

The backend view URL remains `/api/green_smart/rebuild/crop-records/...`; only the frontend `hass.callApi` argument omits `/api/`.

## Boundary

No device/MQTT/automatic execution authority is added.
