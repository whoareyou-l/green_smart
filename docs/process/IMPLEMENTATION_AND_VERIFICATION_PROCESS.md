# Implementation and Verification Process

Status: Draft

## Core rule
All implementation must happen inside the active product repo/worktree and dev environment. Production Home Assistant config, production Docker volumes, real secrets, and real device credentials are out of scope unless the user explicitly approves a bounded deployment task.

## Test-first implementation
For behavior changes:
1. Write or update a failing test.
2. Run the smallest relevant test and confirm expected failure.
3. Implement the smallest change that should pass.
4. Re-run the exact failing test.
5. Run the related test group.
6. Run security checks and diff review.

## Verification commands
Default checks, adjusted per task:

```bash
git status --short
python -m pytest tests -q
# frontend build/test command, if package tooling exists
# Home Assistant dev smoke test, if dev stack is available
gitleaks detect --source . --no-git
git diff --stat
git diff
```

## Failure handling
Do not patch randomly. For each failure:
1. Reproduce with the smallest command.
2. Read the exact error.
3. Identify component: backend, HA integration, frontend, Docker/dev stack, security, or safety.
4. Form one root-cause hypothesis.
5. Make one minimal fix.
6. Re-run the same command.
7. Broaden verification only after the specific failure passes.

If the same failure category repeats 3 times, stop and escalate to Claude Code CLI or the user.
