# Definition of Done

Status: Draft

A green_smart development task is complete only when:

- Work happened in the assigned dev repo/worktree.
- No production files or runtime data were touched.
- No real secrets or customer data were read, copied, logged, or committed.
- New behavior has tests or a documented reason for no test.
- Relevant tests pass.
- Dev Home Assistant smoke check passes when integration behavior changed.
- `green_smart` loads without critical setup errors.
- Mock backend is used for device/control testing.
- No real device command or real MQTT topic is used.
- Secret scan passes.
- Diff contains only intended changes.
- Security/safety review passes for risky changes.
- User approval is obtained before production deployment.
