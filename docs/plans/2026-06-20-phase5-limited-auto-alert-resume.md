# Phase 5 — Limited Auto Control + Alert Resume

> 기준 버전: v1.9.18
> 상태: 완료
> 대상: `zone_control_views.py`, `green-smart-panel.js`, 제한적 자동제어 실행 gate 및 알림 재개 lifecycle

## 목표

Phase 5는 실제 실행 경로에 제한적 자동제어 정책 gate를 추가하고, 운영자가 알림 확인/조치 후 재개 요청을 기록할 수 있는 baseline을 만든다.

## Backend contract

```text
LIMITED_AUTO_DEVICE_GROUPS
LIMITED_AUTO_POLICY_DEFAULTS
_limited_auto_policy_response
_limited_auto_policy_post
_device_group_auto_allowance
_limited_auto_execution_policy
_alert_resume_lifecycle_response
ZoneLimitedAutoPolicyView
ZoneAlertResumeView
/api/green_smart/zones/limited-auto-policy
/api/green_smart/zones/alert-resume
```

실행 log action:

```text
limited_auto_policy_saved
limited_auto_execution_allowed
limited_auto_execution_blocked
alert_resume_requested
alert_resume_approved
alert_resume_rejected
```

## Panel contract

```text
data-zone-limited-auto-card
data-zone-limited-auto-refresh
data-zone-limited-auto-save
data-zone-limited-auto-group
data-zone-limited-auto-enabled
data-zone-limited-auto-semi-ack
data-zone-limited-auto-duration
data-zone-alert-resume-request
제한적 자동제어
장비군별 자동 허용
반자동 승인 필요
자동 최대 지속 시간
알림 확인/조치/재개
재개 요청
SafetyGuard 우선 적용
```

## 안전 경계

정책은 기존 `zone_control_settings.settings_json.limitedAutoPolicy`에 저장한다. 새 DB table은 추가하지 않는다. 실제 실행 순서는 다음을 유지한다.

```text
Control Mode
→ Limited Auto Policy
→ SafetyGuard
→ Interlock/fail-safe
→ pre/post state verification
→ zone_control_logs
```
