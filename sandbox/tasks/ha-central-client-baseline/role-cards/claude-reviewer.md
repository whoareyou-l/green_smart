# Claude Code reviewer role card

Mission: independent architecture/security/spec review for the HA central client baseline.

Checks:
- activation exchange, refresh/revoke, and demo adapter contracts match central API
- activation code is not stored
- tokens are not logged/exposed in frontend/config-entry data
- generic `/vendor/proxy` is not exposed to HA user-facing code
- refresh rotation replaces old refresh token

Expected output:
- PASS or REQUEST_CHANGES with exact file/line issues
