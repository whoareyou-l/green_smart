# Control Phase C14 — Dry Run UI

> 기준 버전: v1.9.16
> 상태: 완료
> 대상: `green-smart-panel.js`, 기존 `POST /api/green_smart/zones/execute-final-targets` dry_run 경로

## 목표

실제 장비를 움직이기 전에 운영자가 예정 service call, 현재 entity 상태, SafetyGuard 판단, 제한적 자동제어 gate, 안전 차단, Fail Safe 대체 call을 확인한다.

## Backend 기준

기존 execution API의 `dry_run: true` 경로를 사용한다.

```text
POST /api/green_smart/zones/execute-final-targets
 dry_run: true
 executedCount: 0
 plannedCount
 calls
 blockedCalls
 safeStateCalls
 preState
 stateVerification: dry_run
```

`dry_run`에서는 HA service call을 실행하지 않는다.

## Panel contract

```text
_zoneDryRunPreviewCache
_previewZoneFinalTargetsDryRun(domain)
_renderZoneDryRunPreviewCard(domain)
_bindZoneDryRunPreviewInputs(root)
data-zone-dry-run-card
data-zone-dry-run-preview
data-zone-dry-run-call-row
data-zone-dry-run-blocked-row
data-zone-dry-run-failsafe-row
Dry Run UI
실행 전 확인
예정 service call
현재 상태
안전 차단
Fail Safe
SafetyGuard 판단
제한적 자동제어 gate
실제 장비는 움직이지 않습니다
```

## 다음 단계

Control Phase C15 — Entity Mapping 검증 / Setup Assistant.
