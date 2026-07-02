# R7-052 Records Workflow Write/History API Contract Plan

> **For Hermes:** This slice defines the next API contract for `작물 운영 > 기록·작업`. It must not implement real writes yet. Keep R7-051 UI skeleton visible and pending. The next implementation slice may use this contract to add routes/repositories after a separate RED cycle.

**Target version:** v1.14.37
**Scope:** `작물 운영 > 기록·작업` only
**Mode:** API contract/design + source-boundary markers only

---

## 1. Goal

Freeze the API shape before connecting the UI skeleton to backend writes/history.

This prevents the next slice from inventing endpoint names, payloads, RBAC rules, audit behavior, or PLS boundaries while implementing.

---

## 2. Canonical endpoint family

All records-workflow write/history APIs use this prefix:

```text
/api/green_smart/rebuild/crop-records
```

The prefix is intentionally under `rebuild` because this is the R7 product-first rebuild surface. Legacy Crop Settings routes remain compatibility/reference only.

---

## 3. Planned endpoints

### 3.1 History/read endpoints

```text
GET /api/green_smart/rebuild/crop-records/history
GET /api/green_smart/rebuild/crop-records/history/{recordType}
GET /api/green_smart/rebuild/crop-records/latest/{recordType}
```

Allowed `recordType` values:

```text
growth-survey
pest-scouting
control-treatment
```

Required query fields:

```text
zoneId
cropCycleId
limit
cursor
```

Response envelope:

```json
{
  "ok": true,
  "mode": "read_only_history",
  "recordType": "growth-survey",
  "zoneId": "zone-1",
  "cropCycleId": "cycle-1",
  "items": [],
  "nextCursor": null,
  "source": "crop_records_repository",
  "readOnly": true,
  "executionEnabled": false
}
```

### 3.2 Write endpoints

```text
POST /api/green_smart/rebuild/crop-records/growth-survey
POST /api/green_smart/rebuild/crop-records/pest-scouting
POST /api/green_smart/rebuild/crop-records/control-treatment
```

### 3.3 Edit endpoint

```text
PATCH /api/green_smart/rebuild/crop-records/{recordType}/{recordId}
```

### 3.4 PLS check endpoint

```text
POST /api/green_smart/rebuild/crop-records/pls-check
```

`pls-check` is a validation/check endpoint only. It must not execute spraying, schedule work, or issue device/service commands.

---

## 4. Payload contracts

### 4.1 Shared required payload fields

Every write/edit payload must include:

```text
zoneId
cropCycleId
recordedAt
actorRole
actorUserId
sourceSurface
idempotencyKey
```

`sourceSurface` must be:

```text
crop-operations.records-workflow
```

### 4.2 Growth survey payload

```json
{
  "zoneId": "zone-1",
  "cropCycleId": "cycle-1",
  "recordedAt": "2026-06-30T09:00:00+09:00",
  "heightCm": 18.4,
  "leafCount": 9,
  "growthStage": "활착기",
  "notes": "특이사항 없음",
  "actorRole": "operator",
  "actorUserId": "user-1",
  "sourceSurface": "crop-operations.records-workflow",
  "idempotencyKey": "uuid"
}
```

### 4.3 Pest scouting payload

```json
{
  "zoneId": "zone-1",
  "cropCycleId": "cycle-1",
  "recordedAt": "2026-06-30T09:00:00+09:00",
  "pestName": "진딧물",
  "severityCode": "low|medium|high",
  "locationLabel": "1구역 북측",
  "spreadObserved": false,
  "photoMemo": "사진/메모",
  "controlNeeded": true,
  "actorRole": "operator",
  "actorUserId": "user-1",
  "sourceSurface": "crop-operations.records-workflow",
  "idempotencyKey": "uuid"
}
```

### 4.4 Control treatment payload

```json
{
  "zoneId": "zone-1",
  "cropCycleId": "cycle-1",
  "recordedAt": "2026-06-30T09:00:00+09:00",
  "targetPestName": "진딧물",
  "pesticideName": "약제명",
  "dilutionRatio": "1000x",
  "usageAmount": "1L",
  "plsStatus": "verified|needs_review|blocked",
  "workerName": "작업자",
  "safetyMemo": "안전 메모",
  "actorRole": "operator",
  "actorUserId": "user-1",
  "sourceSurface": "crop-operations.records-workflow",
  "idempotencyKey": "uuid"
}
```

---

## 5. RBAC contract

Read/history:

```text
admin: allowed
farm_owner: allowed
farm_staff: allowed
```

Write/edit:

```text
admin: allowed
farm_owner: allowed
farm_staff: allowed only when permission crop_records_write is granted
```

Delete:

```text
not in this phase
```

Execution/device authority:

```text
never granted by these APIs
```

---

## 6. Audit contract

Every successful POST/PATCH must create an audit event:

```text
crop_record_created
crop_record_updated
pls_check_requested
```

Audit event fields:

```text
eventType
recordType
recordId
zoneId
cropCycleId
actorRole
actorUserId
sourceSurface
idempotencyKey
createdAt
payloadHash
```

Audit must not store secrets or raw tokens.

---

## 7. Validation and safety contract

Required validation:

```text
zoneId exists
cropCycleId belongs to zoneId
recordedAt is valid ISO datetime
actorRole is known
idempotencyKey is present
```

Growth survey validation:

```text
heightCm numeric or omitted
leafCount numeric integer or omitted
growthStage text accepted but not used for automatic model override
```

Pest scouting validation:

```text
severityCode in low|medium|high
controlNeeded boolean
```

Control treatment validation:

```text
plsStatus in verified|needs_review|blocked
blocked/needs_review must not create execution authority
```

---

## 8. Explicit non-goals for v1.14.37

```text
No route implementation
No DB migration
No repository write
No UI submit binding
No actual save/edit/delete
No HA service call
No MQTT/device command
No automatic apply/execute
No pesticide DB/PSIS integration
No spray scheduling
```

---

## 9. Source-boundary marker

The rebuild panel may expose a static contract descriptor, but it must not call the endpoints yet.

Required source marker:

```text
R7_RECORDS_WORKFLOW_API_CONTRACT
```

Required render marker:

```text
data-r7-record-api-contract="planned-v1.14.37"
```

The render marker is informational only and must stay paired with:

```text
data-r7-record-api-boundary="ui-skeleton-only"
```

---

## 10. Definition of done

- The API family, endpoint names, payloads, RBAC rules, audit events, and explicit non-goals are documented.
- Contract tests prove this is still UI-only and no route/write implementation has been added.
- R7-051 skeleton remains visible.
- Old records content-card wrappers remain absent.
