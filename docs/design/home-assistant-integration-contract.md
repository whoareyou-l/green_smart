# Green Smart Home Assistant Integration Contract

> Phase 0 Home Assistant integration contract.  
> Parent: `docs/PROJECT_MASTER_PLAN.md`

## 1. Integration identity

```json
{
  "domain": "green_smart",
  "name": "Green Smart",
  "config_flow": true,
  "iot_class": "local_push",
  "requirements": ["aiomysql==0.2.0"]
}
```

## 2. Product packaging

Green Smart remains a HACS-compatible custom integration:

```text
custom_components/green_smart/
```

Do not move product runtime into a separate web server or deploy repo.

## 3. Setup contract

`async_setup_entry` must:

1. bootstrap/ensure MariaDB schema
2. register weather/crop/central/zone control views
3. register sidebar panel
4. avoid duplicate view/panel registration on reload
5. keep secrets out of logs

## 4. Panel contract

Panel is a Vanilla JavaScript Web Component:

```text
custom_components/green_smart/panel/green-smart-panel.js
```

Required:

- `DOMAIN === "green_smart"`
- panel version matches `manifest.json`
- no obvious embedded secrets/prod URLs
- partial/no-flicker data refresh for live values
- form dirty state is not overwritten by background refresh

Adopted refresh target:

```text
panel base refresh: 5 seconds
full-screen rerender for live data: forbidden
settings forms: manual save/refresh and dirty-state protection
```

## 5. HA entity/service-call contract

Green Smart official device interface is HA entity/service call.

Supported/common mapping:

| HA domain | Expected service |
|---|---|
| `cover` | `open_cover`, `close_cover`, `set_cover_position` |
| `switch` | `turn_on`, `turn_off` |
| `fan` | `turn_on`, `turn_off` |
| `light` | `turn_on`, `turn_off` |
| `climate` | `set_temperature` |
| `number`, `input_number` | `set_value` |

MQTT/Modbus/PLC/relay integrations belong behind HA entities or deploy-side adapters.

## 6. Persistent notification contract

MVP safety notifications must use Home Assistant persistent notifications for critical events.

Required behavior for future implementation:

```text
critical safety event
→ zone_control_logs / safety event row
→ panel banner/card
→ persistent_notification.create
→ acknowledge/resolved path updates event/log
```

## 7. Offline contract

Local NUC/HA/Green Smart must keep these functions working without internet:

- HA entity state reads
- interlock checks
- manual/semiautomatic local command safety validation
- safe_state fallback
- local DB logging
- panel local status/log display

Central/SaaS sync may fail or delay; safety must not.

## 8. Test contract

Every Phase touching HA integration must keep:

```bash
pytest -q
node --check custom_components/green_smart/panel/green-smart-panel.js
python3 -m py_compile custom_components/green_smart/db.py custom_components/green_smart/zone_control_views.py custom_components/green_smart/__init__.py
```

Expected current baseline: `99 passed`.
