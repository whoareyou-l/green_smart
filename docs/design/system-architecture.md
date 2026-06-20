# Green Smart System Architecture

> Phase 0 architecture baseline.  
> Parent: `docs/PROJECT_MASTER_PLAN.md`

## 1. Architecture summary

Green Smart is a Home Assistant custom integration, not a standalone SaaS web app. The product code lives in `custom_components/green_smart/` and is installed through HACS or manual release zip.

```text
Central/SaaS Layer
  └─ activation, customer/site registry, remote support, backup/update policy

Customer Edge Layer
  └─ Linux NUC + Docker
     ├─ Home Assistant
     ├─ Green Smart custom integration
     ├─ MariaDB
     ├─ MQTT / InfluxDB / Cloudflare tunnel managed by green_smart-deploy
     └─ local interlock/control must work without internet

Device Layer
  └─ HA entities wrapping MQTT/Modbus/PLC/ESPHome/relay devices
```

## 2. Product repo boundary

`green_smart` contains:

- Home Assistant integration code
- Python API views
- MariaDB schema bootstrap
- Vanilla JS panel
- HACS metadata
- static/contract tests
- product docs

`green_smart` must not contain:

- Docker production compose files
- Home Assistant runtime `.storage`
- customer data
- DB/MQTT/Cloudflare/GitHub secrets
- operational backups

`green_smart-deploy` contains:

- Linux NUC edge appliance deployment
- Docker topology for HA/MariaDB/MQTT/InfluxDB/Cloudflare
- environment and runtime wiring
- backup/restore/monitoring scripts

## 3. Module map

| Module | File(s) | Responsibility |
|---|---|---|
| Integration core | `__init__.py`, `manifest.json`, `config_flow.py` | HA setup, config flow, view/panel registration |
| DB/storage | `db.py` | MariaDB pool, schema, query helpers |
| Crop domain | `crop_views.py` | crop seasons, growth, pest, pesticide/control records |
| Weather/pesticide | `weather_api.py`, `weather_views.py`, `kma_grid.py`, `api/pesticide.py` | KMA/PSIS integration |
| Central baseline | `central_api.py`, `central_store.py`, `central_views.py` | allowlisted central adapters and token store |
| Zone control | `zone_control_views.py` | settings, AI outputs, final targets, mappings, execution, logs |
| Panel registration | `frontend_panel.py` | HA sidebar `panel_custom` |
| Frontend | `panel/green-smart-panel.js` | full UI |
| Future engines | `corp_engine.py`, `temhum_engine.py`, `irrigation_engine.py`, `safety_guard.py` | strategy and safety modules |

## 4. Control execution architecture

Official hardware control standard:

```text
Green Smart final target
→ zone_device_entity_mappings
→ Home Assistant service call
→ HA entity integration handles MQTT/Modbus/PLC/relay
```

Green Smart must not implement raw PLC/relay/Modbus packets in product code. If special hardware requires protocol handling, wrap it as a HA entity or limited deploy-side adapter.

## 5. Offline-first safety

The local edge appliance must be able to protect crop/devices without internet:

- Safety Guard reads HA entity state and local DB.
- Interlock does not depend on Central/SaaS or AI.
- Critical actions write local `zone_control_logs`/safety event rows.
- Central sync is optional and delayed when offline.

## 6. Frontend refresh architecture

Adopted target:

- panel base refresh: 5 seconds
- no full-screen rerender for live values
- element/card-level updates
- settings forms must preserve dirty state
- graphs/reports can refresh slower

Current code has mixed intervals and partial update helpers. Phase 1 must standardize the refresh contract without breaking existing UI.
