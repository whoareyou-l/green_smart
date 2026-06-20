# Green Smart Control Engine Contracts

> Phase 0 control-engine contract baseline.  
> Parent: `docs/PROJECT_MASTER_PLAN.md`

## 1. Engine stack

```text
CORP  -> crop intelligence / G-Index / growth steering
TEMHUM -> ADT/DIF/VPD climate target strategy
IRR   -> irrigation/nutrient/VWC/dryback strategy
VENT  -> ventilation/fan execution target generation
SCRN  -> shading/thermal screen target generation
SafetyGuard -> independent interlock/fail-safe validation
HAServiceAdapter -> Home Assistant service calls
```

## 2. Non-negotiable priority

```text
SafetyGuard > Manual emergency/override policy > final target > AI/strategy recommendation > optimization
```

AI output cannot directly move hardware.

Required path:

```text
ai_zone_control_outputs
→ zone_final_control_targets
→ SafetyGuard
→ zone_device_entity_mappings
→ Home Assistant service call
→ zone_control_logs
```

## 3. Common strategy output DTO

Strategy engines must return deterministic DTOs, not direct DB writes scattered across the codebase.

```json
{
  "farmId": 1,
  "cropSeasonId": 1,
  "zoneId": 1,
  "domain": "environment",
  "source": "TEMHUM",
  "intentType": "CLIMATE_TARGET",
  "targets": {
    "airTemperatureC": 18.5,
    "relativeHumidityPct": 78,
    "vpdKpa": 0.9
  },
  "safety": {
    "blockOnUnavailable": true,
    "applySafeStateOnBlock": true
  },
  "reason": "G-Index -3.2로 세력 회복을 위해 ADT를 상향했습니다.",
  "validUntil": "2026-06-20T10:05:00+09:00"
}
```

## 4. SafetyGuard input contract

SafetyGuard receives:

```text
zone scope
candidate/final targets
HA entity state snapshots
zone_device_entity_mappings
interlock settings
sensor quality state
weather/wind critical state
manual override/emergency state
```

## 5. SafetyGuard output contract

```json
{
  "okToExecute": false,
  "safetyStatus": "blocked",
  "blockedByInterlock": true,
  "failSafeApplied": true,
  "reasons": ["strong_wind", "entity_unavailable"],
  "allowedCalls": [],
  "blockedCalls": [],
  "safeStateCalls": [],
  "notifications": []
}
```

## 6. Required interlock categories

Phase 2 must cover at least:

| Category | Example action |
|---|---|
| emergency stop | block all non-safe execution |
| entity unavailable | block target or apply safe_state |
| strong wind | close/limit windows/screens |
| absolute low temperature | close vents, protect crop |
| absolute high temperature | maximize safe ventilation/cooling path |
| sensor integrity fault | pause automation relying on bad sensor |
| EC over-concentration | stop nutrient/pump path, alert |
| VWC low floor | emergency irrigation if safe |
| device command failure | mark device unavailable, alert/log |

## 7. Timing contract

| Loop | Cadence |
|---|---|
| panel live value update | 5s, element-level |
| control decision | 1 minute |
| interlock check | event-based + immediately before execution + 1 minute fallback |
| strategy snapshot | every 5 minutes + immediately on target change |
| raw sensor long-term history | HA recorder/InfluxDB |

## 8. Notification contract

MVP notification channels:

```text
1. Green Smart panel banner/card
2. Home Assistant persistent notification
3. DB log/event row
```

Remote notification channels are second-phase extensions, not MVP.

## 9. Engine module recommendation

Future implementation should split new logic out of `zone_control_views.py` gradually:

```text
custom_components/green_smart/control/
  __init__.py
  safety_guard.py
  service_adapter.py
  strategy_snapshot.py
  corp_engine.py
  temhum_engine.py
  irrigation_engine.py
  vent_engine.py
  screen_engine.py
```

Do not move existing code all at once. Introduce wrappers and tests first, then migrate internals task-by-task.
