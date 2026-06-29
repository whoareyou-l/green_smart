# R7-007 Sidebar/Page Shell Manual-first Rework

> 기준 버전: `v1.12.79`
> Status: R7-007 complete
> Purpose: 이전 R7 5그룹 sidebar/page shell을 manual-first environment-control target domains로 재정렬한다.

## 1. Scope

R7-007 changes the active rebuild panel sidebar and detail placeholder registry from the old R7 five-group IA to the target manual-first domain IA.

Old/historical IA:

```text
운영 홈 / 작물 중심 운영 / 현장 상태 / 추천·실행 검토 / 설정
```

New active IA:

```text
운영 홈 / 작물 운영 / 환경 제어 / 관수 제어 / 장치 제어 / 자동화 제어 / 안전 제어 / 설정
```

## 2. Product rule

```text
Green Smart = 수동 운영 가능한 환경제어 OS
AI = 보조/추천/최적화 레이어
Safety / Interlock / Fail Safe = 최종 허용/차단 권한
```

## 3. Runtime boundaries

R7-007 is a panel shell/domain rework only.

```text
No API route change in R7-007
No DB migration in R7-007
No HA service call in R7-007
No MQTT/device command in R7-007
No execution authority in R7-007
No approval/override release in R7-007
No SafetyGuard/Interlock runtime behavior change in R7-007
No role/settings mutation in R7-007
```

## 4. Active sidebar groups

| Key | Label | Purpose |
|---|---|---|
| `operations-home` | 운영 홈 | today operating mode, AI fallback, priority issues |
| `crop-operations` | 작물 운영 | currentCrop, crop_cycle, growth target, crop records |
| `environment-control` | 환경 제어 | manual climate setpoints and rule/AI/safety layers |
| `irrigation-fertigation` | 관수 제어 | irrigation/fertigation/manual recipe and fallback layers |
| `device-control` | 장치 제어 | manual/auto/locked/maintenance device mode and interlock |
| `recommendation-automation` | 자동화 제어 | AI assist comparison against manual/rule baseline |
| `safety-history` | 안전 제어 | alarms, interlock/fail-safe, audit/history |
| `settings-admin` | 설정 | RBAC, HA mapping, config, diagnostics, redaction |

## 5. Detail placeholder grammar

Every active domain placeholder renders the same layer grammar:

```text
Manual/Base Settings
→ Rule/Schedule Automation
→ AI Assist / Optimization
→ Safety/Interlock/Fail Safe Finalization
```

DOM markers:

```text
data-r7-manual-first-sidebar="true"
data-r7-manual-first-domain-baseline
data-r7-manual-first-domain="..."
data-r7-domain-layer-grammar
 data-r7-manual-base-settings
 data-r7-rule-schedule-automation
 data-r7-ai-assist-layer
 data-r7-safety-finalization
```

## 6. Deprecated old IA handling

Old R7 keys are preserved only as non-active deprecation/compatibility evidence:

| Old | New |
|---|---|
| `crop-centered` / 작물 중심 운영 | `crop-operations` / 작물 운영 |
| `field-status` / 현장 상태 | `environment-control` + `irrigation-fertigation` + `device-control` |
| `recommendation-review` / 추천·실행 검토 | `recommendation-automation` / 자동화 제어 |

The active sidebar must not render the old five groups as operator choices.

## 7. Visible copy changes

- `추천·실행` visible stage wording is replaced with `자동화 제어` where the target shell speaks about AI/rule assist.
- The hero explains `수동 설정 → 기본 자동제어 → AI 보조 → Safety/Interlock/Fail Safe`.
- Read-only notes state that AI cannot bypass manual settings or Safety/Interlock/Fail Safe.

## 8. Verification summary

R7-007 acceptance requires:

```text
R7-007 targeted contract passes
R7-005/R7-006 planning contracts pass
R7-001~R7-004 compatibility contracts pass after intentional updates
Full pytest passes
node --check for rebuild panel passes
HA check_config/prod smoke passes before release
```
