# R7-013 Settings/Admin Manual-first Realignment

> 기준 버전: `v1.14.50`
> Status: R7-013 complete
> Purpose: R7-004 `설정` detail을 R7-005~R7-012 이후의 8도메인 manual-first 구조에 맞게 재보정한다.

## 1. Scope

R7-013 keeps the R7-004 Settings/Admin read-only detail and adds the missing manual-first ownership layer.

It answers the operator question:

```text
설정는 어떤 운영 도메인을 직접 운영하지 않고,
어떤 권한/매핑/설정/감사 boundary로 각 도메인을 제한하는가?
```

## 2. Active domain ownership matrix

R7-013 maps Settings/Admin ownership to all active R7 domains:

```text
운영 홈 → visibility/config summary only
작물 운영 → crop_cycle/currentCrop permission and record ownership evidence
환경 제어 → environment settings ownership boundary
관수 제어 → irrigation/fertigation settings ownership boundary
장치 제어 → HA entity mapping / device mapping ownership boundary
자동화 제어 → recommendation/AI assist configuration boundary
안전 제어 → audit/log visibility and backend enforcement boundary
설정 → RBAC, role, mapping, config, diagnostics, backup, secret redaction
```

## 3. Rendered markers

```text
data-r7-settings-admin-manual-first-realigned="true"
data-r7-settings-admin-domain-ownership
 data-r7-settings-admin-domain="operations-home"
 data-r7-settings-admin-domain="crop-operations"
 data-r7-settings-admin-domain="environment-control"
 data-r7-settings-admin-domain="irrigation-fertigation"
 data-r7-settings-admin-domain="device-control"
 data-r7-settings-admin-domain="recommendation-automation"
 data-r7-settings-admin-domain="safety-history"
 data-r7-settings-admin-domain="settings-admin"

data-r7-settings-admin-mapping-boundary
 data-r7-settings-admin-mapping-item="HA entity mapping"
 data-r7-settings-admin-mapping-item="구역/장치 매핑"
 data-r7-settings-admin-mapping-item="MQTT topic mapping later only"
 data-r7-settings-admin-mapping-item="mapping health evidence"

data-r7-settings-admin-system-boundary
 data-r7-settings-admin-system-item="RBAC"
 data-r7-settings-admin-system-item="사용자 역할"
 data-r7-settings-admin-system-item="권한 정책"
 data-r7-settings-admin-system-item="시스템 설정"
 data-r7-settings-admin-system-item="진단"
 data-r7-settings-admin-system-item="백업"
 data-r7-settings-admin-system-item="secret redaction"
 data-r7-settings-admin-system-item="감사 설정"
```

R7-004 markers remain valid compatibility evidence:

```text
data-r7-settings-admin-detail
data-r7-settings-admin-role-ownership
data-r7-settings-admin-permission-buckets
data-r7-settings-admin-secret-redaction
data-r7-settings-admin-backend-enforcement
```

## 4. Operator copy

The detail must state:

```text
설정는 daily grower workflow가 아닙니다.
운영 홈/작물/환경/관수 제어/장치/자동화 제어/안전 제어의 권한·매핑·설정 ownership을 read-only로 보여줍니다.
HA entity mapping은 장치 제어의 상태 판단에 쓰이지만, 매핑 소유권은 설정에 있습니다.
Secret values render as [REDACTED] only.
Role/settings mutation remains separately approved work.
```

## 5. Runtime boundaries

```text
No API route change in R7-013
No DB migration in R7-013
No HA service call in R7-013
No MQTT/device command in R7-013
No role assignment mutation in R7-013
No settings save/delete in R7-013
No mapping edit in R7-013
No raw secrets in R7-013
No approval/override release in R7-013
No SafetyGuard/Interlock runtime behavior change in R7-013
```

## 6. Why this follows R7-012

R7-004 was implemented before the manual-first reset. R7-013 makes it explicit that Settings/Admin is not another grower operation page; it is the system ownership and configuration boundary behind the active eight-domain shell.

## 7. Acceptance

```text
R7-013 targeted contract passes
R7-004 compatibility contract still passes
R7-007 through R7-012 contracts still pass
Full pytest passes
node --check passes for both panel files
Prod HA check_config/restart/static smoke passes before release
```
