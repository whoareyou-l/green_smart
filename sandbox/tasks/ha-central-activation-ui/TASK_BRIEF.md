# HA central activation wizard UI task brief

## Goal
Expose the existing Greenity central activation baseline in the Home Assistant sidebar wizard, while preserving the no-secret-persistence and demo/local safety boundaries.

## Scope
- Add optional central activation fields to the sidebar setup wizard.
- Submit `activation_code` to the existing HA config flow only when the user enters one.
- Persist only safe central metadata such as `central_base_url` and `central_installation_id`.
- Add user-facing Korean/plain safety wording that this is local/demo central activation, not real vendor readiness.
- Add contract tests and keep product checks green.

## Out of scope
- No real vendor endpoint/schema.
- No production cloud promise.
- No generic `/vendor/proxy` UI.
- No customer data, HA runtime `.storage`, Docker, Cloudflare, MQTT, DB, or physical device work.

## Safety boundaries
- Do not store `activation_code` in localStorage or config-entry data.
- Do not display access/refresh tokens.
- Do not expose arbitrary vendor path/feature/method/host inputs.
- Do not ask users for real paid vendor credentials.
- Do not commit secrets.
- Do not commit Home Assistant runtime data.

## Agent lanes
- Hermes orchestrator: owns scope, safety boundaries, task split, gate artifacts, final verification, commit/report.
- Codex builder: implementation and test/fix loop in `/home/smartfarm/green_smart`.
- Claude Code reviewer: architecture/security/spec review lane.
- Antigravity reviewer: frontend UX/docs/wording review lane.

## Acceptance criteria
- Wizard renders optional central activation UI with `central_base_url` and `activation_code` fields.
- Submission sends activation code only to config flow when non-empty.
- Local storage path strips activation code before persisting.
- Review summary displays central URL and safe installation ID only, never activation code/token material.
- `/vendor/proxy` is not exposed in the panel UI.
- `scripts/green-smart-product-test` passes.
- `scripts/green-smart-agent-pipeline-gate ha-central-activation-ui` passes.
- Token-shaped secret scan passes.

## Verification commands
```bash
scripts/green-smart-product-test
scripts/green-smart-agent-pipeline-gate ha-central-activation-ui
python - <<'PY'
from pathlib import Path
import re
root = Path('.')
patterns = [re.compile(r'github_pat_[A-Za-z0-9_]{20,}'), re.compile(r'gst_[ar]t_[A-Za-z0-9_=-]{16,}'), re.compile(r'sk-[A-Za-z0-9]{32,}')]
for path in root.rglob('*'):
    if path.is_dir() or '.git' in path.parts or '__pycache__' in path.parts or '.pytest_cache' in path.parts:
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
Revert the final commit or remove the panel wizard UI changes, related tests, and this task artifact directory.
