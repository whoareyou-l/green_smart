# Green Smart API Spec

> Phase 0 API baseline.  
> Parent: `docs/PROJECT_MASTER_PLAN.md`

## 1. API style

All product APIs are Home Assistant `HomeAssistantView` endpoints under `/api/green_smart/...`.

Do not introduce a separate FastAPI/Express/SaaS API inside the product repo unless explicitly approved. Central/SaaS belongs to a separate service layer.

## 2. Existing API groups

### Crop

```text
GET/POST      /api/green_smart/crop/seasons
PATCH         /api/green_smart/crop/seasons/{season_id}/demolish
PATCH/DELETE  /api/green_smart/crop/seasons/{season_id}
GET/POST      /api/green_smart/crop/seasons/{season_id}/growth
DELETE        /api/green_smart/crop/growth/{record_id}
GET/POST      /api/green_smart/crop/seasons/{season_id}/pest
DELETE        /api/green_smart/crop/pest/{record_id}
GET/POST      /api/green_smart/crop/seasons/{season_id}/control
DELETE        /api/green_smart/crop/control/{record_id}
```

### Weather/pesticide

```text
GET             /api/green_smart/weather/current
GET             /api/green_smart/weather/forecast
GET             /api/green_smart/weather/weekly
GET/POST/DELETE /api/green_smart/weather/config
POST            /api/green_smart/weather/validate-key
POST            /api/green_smart/weather/validate-mid-key
POST            /api/green_smart/weather/search-location
GET             /api/green_smart/pesticide/search
POST            /api/green_smart/pesticide/config
POST            /api/green_smart/pesticide/mix-check
```

### Central allowlisted adapters

```text
POST /api/green_smart/central/weather/current
POST /api/green_smart/central/weather/forecast
POST /api/green_smart/central/weather/mid
POST /api/green_smart/central/pesticide/search
```

No generic vendor proxy.

### Zone control

```text
GET/POST       /api/green_smart/zones/control-settings
GET/POST       /api/green_smart/zones/interlock-settings
GET            /api/green_smart/zones/entity-state-summary
POST           /api/green_smart/zones/copy-control-settings
GET/POST       /api/green_smart/zones/final-targets
GET/POST       /api/green_smart/zones/ai-control-outputs
POST           /api/green_smart/zones/ai-control-outputs/{output_id}/apply
GET/POST/DELETE /api/green_smart/zones/device-entity-mappings
POST           /api/green_smart/zones/execute-final-targets
GET            /api/green_smart/zones/control-logs
```

### Domain wrappers

```text
/api/green_smart/environment/...
/api/green_smart/irrigation/...
/api/green_smart/devices/...
```

## 3. Required future APIs

Add through RED contract tests first.

### Dry run / simulation

```text
POST /api/green_smart/zones/dry-run-final-targets
```

Purpose: planned service calls, current entity state, SafetyGuard decision, blocked reasons, safe_state calls, without moving hardware.

### Strategy snapshots

```text
GET/POST /api/green_smart/zones/strategy-snapshots
```

Purpose: 5-minute and target-change strategy decision snapshots.

### Safety events

```text
GET/POST/PATCH /api/green_smart/zones/safety-events
```

Purpose: safety event lifecycle, HA persistent notification linkage, acknowledged/resolved state.

### Entity state summary

```text
GET /api/green_smart/zones/entity-state-summary
```

Purpose: HA entity existence/current state/service compatibility summary for dashboard and setup assistant.

## 4. API compatibility rules

1. Keep existing route paths stable.
2. Add fields rather than removing/renaming fields.
3. DB/API contract changes require tests.
4. Secrets must never be echoed.
5. Activation/raw token values must never be returned.
6. All execution APIs must log to `zone_control_logs`.
7. All future automatic execution APIs must pass SafetyGuard.
