# Claude Code reviewer role card

Mission: independent architecture/security/spec review.

Checks:
- activation UI submits code only when entered
- activation code is stripped from localStorage and safe summaries
- no access/refresh token UI
- no generic `/vendor/proxy` UI or arbitrary vendor inputs
- tests/gate/secret scan evidence is credible

Expected output: PASS or REQUEST_CHANGES.
