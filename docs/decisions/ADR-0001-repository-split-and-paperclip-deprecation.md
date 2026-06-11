# ADR-0001: Repository Split and Paperclip Deprecation

Status: Accepted Draft

## Context

`green_smart` development previously left artifacts across:

- `/home/smartfarm/greenity-bot-docs`: Paperclip-era agent/docs/reporting repository
- `/home/smartfarm/greenhouse-control/homeassistant/config/custom_components/green_smart`: live Home Assistant custom component code
- `/home/smartfarm/greenhouse-control`: Home Assistant runtime/config area

Paperclip is no longer used for `green_smart`. Existing Paperclip documents and reports are historical traces only.

## Decision

Use two active repositories:

1. `green_smart`
   - Home Assistant custom integration product code
   - HACS metadata
   - sidebar panel frontend
   - tests
   - product/process/security/testing docs

2. `green_smart-deploy`
   - NUC Docker prod/dev/sandbox topology
   - bounded helper scripts
   - dev stack, fake data, sandbox policy
   - deployment/backup/rollback docs

Treat `greenity-bot-docs` as a historical archive, not an active source of truth.

## Boundaries

### `green_smart`

Allowed:

- `custom_components/green_smart/**`
- tests
- product documentation
- process/security/testing docs

Forbidden:

- Home Assistant `.storage/**`
- DB files
- real secrets
- production Docker volumes
- customer data
- runtime logs

### `green_smart-deploy`

Allowed:

- template compose files
- `.env.example`
- dev/mock stack
- sandbox policies
- bounded scripts

Forbidden:

- real `.env`
- real DB/MQTT/HA tokens
- backup contents
- customer data

### `greenity-bot-docs`

Allowed:

- historical archive
- old reports retained with deprecation notice

Forbidden as active source:

- new product plans
- active implementation process
- active deployment instructions

## Migration Plan

1. Copy current custom component from live HA config to `green_smart/custom_components/green_smart`.
2. Initialize `green_smart` as the active product repo.
3. Initialize `green_smart-deploy` for deployment and sandbox structure.
4. Add process docs for implementation, Ralph Mode, security gates, and DoD.
5. Do not delete or rewrite live HA config until dev repo validation and sync strategy are approved.
6. Later, replace live HA custom component with a controlled sync/symlink/mount from a tested release.
7. Mark old Paperclip-era docs as historical if they remain in `greenity-bot-docs`.

## Consequences

Benefits:

- Clear active source of truth
- Safer agent access boundaries
- Easier HACS/release workflow
- Cleaner dev/prod/sandbox separation

Costs:

- Need one-time migration of docs and deployment scripts
- Need a controlled sync path from product repo to dev HA
- Need GitHub remotes to be created for the new repos
