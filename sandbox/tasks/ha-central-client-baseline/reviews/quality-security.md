# UX/docs/quality review

Reviewer lane: Antigravity reviewer

Verdict: APPROVED

Initial review requested changes:
- Add user-understandable activation error messages.
- Add activation/local-demo wording for the HA form description.
- Document the central/vendor boundary in user-facing docs.
- Clarify that users should not enter real paid vendor credentials unless a supported adapter is confirmed.

Fixes verified:
- `strings.json`, `translations/en.json`, and `translations/ko.json` include plain-language activation errors.
- User-facing descriptions state central activation is optional and local/demo-oriented.
- `README.md` documents central activation baseline, credential safety boundary, and `/vendor/proxy` non-exposure.

Reviewer verification:
```text
15 passed in 0.03s
```

Remaining issues: none.
