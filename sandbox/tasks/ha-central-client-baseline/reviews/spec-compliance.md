# Spec/security review

Reviewer lane: Claude Code reviewer

Verdict: PASS

Evidence:
- Central API client exposes only `/activation/exchange`, `/tokens/refresh`, `/tokens/revoke`, and `/vendor/adapters/demo/status`.
- Generic `/vendor/proxy` is not exposed in the Home Assistant client/user-facing implementation.
- Demo adapter accepts only `device_id`, not arbitrary feature key/path/method/host proxy fields.
- Activation code is accepted during config flow but excluded from `_WIZARD_KEYS`, so it is not persisted in config-entry data.
- Access/refresh tokens are saved through dedicated `CentralTokenStore`, not config-entry data.
- No central activation/access/refresh token logging found in the changed central-client path.
- Refresh path saves the returned new refresh token, preserving central refresh-token rotation.

Reviewer verification:
```text
36 passed in 0.09s
TOKEN_SHAPED_SECRET_SCAN_OK
```

Requested changes: none.
