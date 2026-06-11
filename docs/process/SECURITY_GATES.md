# Security Gates

Status: Draft

## Protected assets
- Home Assistant tokens and `.storage`
- API keys: KMA, PSIS, GitHub, MQTT, Cloudflare, etc.
- DB credentials
- Customer data and domains
- Production Docker volumes and compose files
- Real device/MQTT credentials

## Hard denies for agents
Agents must not read or modify:
- `/home/smartfarm/greenhouse-control/homeassistant/config/.storage/**`
- production `secrets.yaml`, `.env`, key files, DB files, logs containing secrets
- production Docker volumes
- real MQTT/device credentials

## Required scans
- `gitleaks detect --source . --no-git`
- diff review for prod paths and secret-like strings
- redacted log review before sharing with agents

## Admin-only actions
- API key save/delete
- DB/MQTT credential changes
- device mapping changes
- automation mode changes beyond read-only/alert
- deployment, rollback, backup restore

## Frontend storage policy
Allowed in localStorage: UI state and non-sensitive drafts.
Forbidden in localStorage: API keys, HA tokens, MQTT/DB passwords, customer secrets, real credentials.
