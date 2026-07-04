# R7-080 Approval modal domain model

Status: current baseline for `v1.14.66`.

This updates the `모든 승인 요청 확인 → 승인 필요 작업` popup so it is no longer an image-value mockup. Every visible region is backed by a normalized approval request model.

## Normalized fields

Each approval row is normalized to:

- `id`: approval request id.
- `requestedAt`: request timestamp from `createdAt` / `created_at`; otherwise `데이터 없음`.
- `approvalType`: `안전 확인`, `자동제어`, `장치 매핑`, `권한 변경`, or explicit request type.
- `riskLevel`: `높음`, `중간`, `낮음`.
- `riskTone`: red / amber / green color family.
- `summary`: note/meta/request label; otherwise `요청 내용 미입력`.
- `requester`: requester/createdBy; otherwise `요청자 미확인`.
- `target`: explicit target/zone/user label; role approval derives `사용자 계정 · requester`; otherwise `대상 미지정`.
- `status`: raw request status.
- `stageLabel`: status-derived workflow label such as `승인 대기`, `승인 완료`, `반려`, `보류`, `상태 미확인`.
- `stageKey`: `review-pending`, `approved`, `rejected`, `hold`, `unknown`.
- `beforeValue`: explicit before value or `status=pending` for user approvals; otherwise `데이터 없음`.
- `afterValue`: explicit after value or requested role for user approvals; otherwise `데이터 없음`.
- `scope`: explicit scope or `사용자·권한`; otherwise `적용 범위 미지정`.
- `validationChecks`: requester, target, reason, approver memo checks.
- `decisionEnabled`: true only when the request has an id and status is `pending`/`requested`.

## UI mapping

- Header subtitle = `target · approvalType · stageLabel`.
- Left list columns = `requestedAt`, `approvalType`, `riskLevel`, `summary`, `requester`.
- Right request info = `requester`, `requestedAt`, `target`, `stageLabel`.
- Change table = `approvalType`, `beforeValue`, `afterValue`, `scope`.
- Impact analysis = `riskLevel` plus domain-specific badges.
- Validation checks = normalized check states, not image sample values.
- Apply button = enabled/disabled from `decisionEnabled`.

## Removed mock values

The frontend must not hardcode the supplied screenshot's sample values such as `1구역 · 토마토`, `2026-07-01 09:20`, `10 m/s`, `12 m/s`, or `강풍 폐쇄 기준 10→12m/s` as fallback values.
