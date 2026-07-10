# DB Legacy Usage Manifest

Version: `1.14.99`

HA recorder tables are protected. This file is the DB-01 quarantine manifest for known direct Green Smart legacy table references. New direct references outside `db.py`, migrations, tests/docs, or future `legacy_adapters/*` must fail contract tests unless listed here intentionally as tracked migration debt.

## Protected HA recorder tables

- `event_data`
- `event_types`
- `events`
- `migration_changes`
- `recorder_runs`
- `schema_changes`
- `state_attributes`
- `states`
- `states_meta`
- `statistics`
- `statistics_meta`
- `statistics_runs`
- `statistics_short_term`

## Known direct legacy references to retire

- `__init__.py` -> `zones`
- `__init__.py` -> `crop_seasons`
- `central_views.py` -> `sensor_readings`
- `crop_cycle_scaffold.py` -> `crop_seasons`
- `crop_views.py` -> `zones`
- `crop_views.py` -> `crop_seasons`
- `crop_views.py` -> `growth_surveys`
- `crop_views.py` -> `pest_surveys`
- `crop_views.py` -> `control_records`
- `crop_views.py` -> `control_pesticides`
- `crop_views.py` -> `irrigation_settings`
- `crop_views.py` -> `sensor_readings`
- `crop_views.py` -> `irrigation_drain_feedback`
- `crop_views.py` -> `irrigation_control_logs`
- `crop_views.py` -> `audit_logs`
- `frontend_panel.py` -> `zones`
- `rbac_policy.py` -> `crop_seasons`
- `rbac_policy.py` -> `audit_logs`
- `realtime_monitoring_scaffold.py` -> `devices`
- `rebuild_crop_records_views.py` -> `crop_seasons`
- `rebuild_crop_records_views.py` -> `growth_surveys`
- `rebuild_crop_records_views.py` -> `pest_surveys`
- `rebuild_crop_records_views.py` -> `control_records`
- `rebuild_crop_records_views.py` -> `control_pesticides`
- `rebuild_settings_views.py` -> `audit_logs`
- `rebuild_settings_write_views.py` -> `zones`
- `repositories/crop_repo.py` -> `crop_seasons`
- `repositories/crop_repo.py` -> `growth_surveys`
- `repositories/crop_repo.py` -> `pest_surveys`
- `repositories/crop_repo.py` -> `control_records`
- `repositories/crop_repo.py` -> `control_pesticides`
- `repositories/rebuild_crop_context_repo.py` -> `crop_seasons`
- `repositories/legacy_adapters/environment_telemetry.py` -> `sensor_readings`
- `repositories/legacy_adapters/zones.py` -> `zones`
- `services/crop_service.py` -> `crop_seasons`
- `services/crop_service.py` -> `growth_surveys`
- `services/crop_service.py` -> `control_records`
- `services/rebuild_crop_context_service.py` -> `zones`
- `services/rebuild_crop_context_service.py` -> `crop_seasons`
- `services/rebuild_crop_context_service.py` -> `control_records`
- `zone_control_views.py` -> `zones`
- `zone_control_views.py` -> `devices`
- `zone_control_views.py` -> `sensor_readings`

## Retirement rule

DB-02 adapter migration: `__init__.py` scheduler no longer queries `sensor_readings` directly; the remaining legacy telemetry zone lookup is quarantined in `repositories/legacy_adapters/environment_telemetry.py`.

DB-02B zone adapter migration: `crop_repo.py` no longer embeds `LEFT JOIN zones`; crop-season zone-name fragments are quarantined in `repositories/legacy_adapters/zones.py`. Stale `config_flow.py -> zones` debt marker was removed because current `config_flow.py` no longer references `zones`.

DB-02C rebuild crop context zone adapter migration: `rebuild_crop_context_repo.py` no longer embeds `LEFT JOIN zones`; rebuild crop-context zone-name fragments are quarantined in `repositories/legacy_adapters/zones.py`.

- Do not add new markers casually; remove markers by moving access behind canonical repositories or `legacy_adapters/*`.
- Product code must eventually stop writing to every listed legacy table.
- This manifest is a baseline, not permission to expand legacy usage.
