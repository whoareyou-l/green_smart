# HA central client baseline task brief

## Goal
Add the first Home Assistant custom integration baseline for talking to the Greenity central API without exposing raw central/vendor secrets.

## Scope
- Add a small async central API client for activation exchange, token refresh/revoke, and the allowlisted demo adapter endpoint.
- Add a dedicated HA Store wrapper for central token material.
- Extend the config-flow contract so activation input is accepted but not persisted in config-entry data.
- Add fast product contract tests that can run without a full Home Assistant runtime.

## Out of scope
- No real customer data.
- No real vendor endpoint/schema.
- No generic `/vendor/proxy` frontend/client exposure.
- No production Docker, Cloudflare, MQTT, DB, HA runtime, or Docker socket changes.

## Safety boundaries
- Do not commit secrets, tokens, activation codes, HA `.storage`, runtime data, or customer data.
- Raw activation code is one-time input only and must not be stored.
- Access/refresh tokens may only live in the dedicated HA Store helper and must not be logged or exposed to frontend/config-entry data.
- Demo adapter is allowlisted: only `device_id`, no arbitrary feature key/path/method/host from HA.

## Agent lanes
- Hermes orchestrator: owns scope, safety boundaries, gate artifacts, final verification, commit/report.
- Codex builder: implementation and test/fix loop in `/home/smartfarm/green_smart`.
- Claude Code reviewer: architecture/security/spec review lane.
- Antigravity reviewer: UX/docs/alternate review lane for user-facing flow wording and docs safety.

## Acceptance criteria
- Contract tests exist for central API endpoints, token storage boundary, config-flow secret filtering, and lack of generic proxy references.
- `env -u VIRTUAL_ENV uv run --python 3.12 pytest tests -q` passes.
- Token-shaped secret scan passes.
- Role/review reports exist before integration is considered complete.

## Verification commands
```bash
env -u VIRTUAL_ENV uv run --python 3.12 pytest tests -q
python - <<'PY'
from pathlib import Path
import re
root = Path('.')
patterns = [re.compile(r'github_pat_[A-Za-z0-9_]{20,}'), re.compile(r'gst_[ar]t_[A-Za-z0-9_=-]{16,}'), re.compile(r'sk-[A-Za-z0-9]{32,}')]
for path in root.rglob('*'):
    if path.is_dir() or '.git' in path.parts or '__pycache__' in path.parts:
        continue
    try:
        text = path.read_text(encoding='utf-8')
    except UnicodeDecodeError:
        continue
    for pattern in patterns:
        assert not pattern.search(text), f'token-shaped secret in {path}'
print('TOKEN_SHAPED_SECRET_SCAN_OK')
PY
```

## Rollback
Revert the final commit or remove the added central client/store modules, central tests, and config-flow key additions.
