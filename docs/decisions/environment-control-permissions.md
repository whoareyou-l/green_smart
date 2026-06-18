# Environment Control Permissions

The Environment Control page keeps permission rules in documentation instead of rendering a separate UI tab.

## Roles

| Role | Permission scope |
|---|---|
| Admin | Full edit access. Can change AI usage, base control values, and all safety limits. |
| Farm Owner | Can edit base interlock values, change AI usage, and edit selected safety limits. |
| Farm Worker | Read-only. Can inspect current values and operation logs only. |

## Product rule

Permission enforcement must be handled by the backend/Home Assistant user context before exposing write actions. The frontend may hide or disable controls for convenience, but frontend-only checks are not sufficient for safety-critical environment control.
