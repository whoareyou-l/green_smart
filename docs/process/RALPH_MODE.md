# Ralph Mode

Status: Draft

Ralph Mode is a bounded build/run/test/inspect/fix loop. It repeats until all acceptance checks pass or an abort condition is reached.

## Default loop
1. Build dev artifacts.
2. Start dev Home Assistant stack.
3. Run health checks.
4. Run backend tests.
5. Run frontend build/tests.
6. Run Home Assistant smoke test.
7. Inspect redacted logs.
8. Run secret/prod-path scans.
9. Classify failure.
10. Assign fix to Codex/Antigravity/Claude according to failure type.

## Success conditions
- dev HA boots.
- `green_smart` integration loads.
- sidebar panel is reachable in dev.
- mock sensor/control flow works without real devices.
- tests pass.
- no critical HA logs from green_smart.
- gitleaks passes.
- no prod path, real credential, or real device access appears in diff/logs.

## Abort conditions
- Secret detected.
- Production config/volume accessed.
- Real device, real MQTT, or real HA token used.
- `git push`, `docker push`, SSH, or release publishing attempted without approval.
- Same failure repeats 3 times.
- Max rounds/time/budget exceeded.

## Current dev implementation

The deployment repo contains the first executable Ralph loop:

```bash
cd /home/smartfarm/green_smart-deploy
RALPH_MAX_ROUNDS=1 scripts/greenity-ralph-loop
```

Current executable steps:

```text
compose config → secret scan → product test → dev healthcheck → HA smoke → MQTT smoke
```

The loop writes redacted failure logs under:

```text
/home/smartfarm/green_smart-deploy/reports/ralph/
```

`reports/` is ignored by git.

## Defaults
- Max rounds: 10 planned; current script default is 1 unless `RALPH_MAX_ROUNDS` is set.
- Same-failure limit: 3 planned.
- Claude escalation: repeated failure, architecture ambiguity, or security/safety issue only
