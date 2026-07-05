# R7-025 Settings/Admin Detail Absorption

> 기준 버전: `v1.14.81`
> Status: R7-025 planned
> Purpose: 기존 `renderR7SettingsAdminDetail()` detail card를 설정 visual Admin boundary 화면으로 흡수한다.

## 1. Source inventory

기존 R7-013 detail card는 아래 정보를 하나의 긴 read-only card로 렌더했다.

| Old detail section | Old items | Visual tab/card destination |
|---|---|---|
| Domain ownership | operations-home, crop-operations, environment-control, irrigation-fertigation, device-control, recommendation-automation, safety-history, settings-admin | `도메인 소유권` cards with `data-r7-settings-domain-card` |
| Role ownership | admin, farm_owner, farm_staff | `역할·권한` cards with `data-r7-settings-role-card` |
| Permission buckets | 조회, 기록, 전략, 실행, 안전, 고급설정; backend-enforced action classes | `역할·권한` / `RBAC 정책` cards with `data-r7-settings-permission-card` |
| Mapping boundary | HA entity mapping, 구역/장치 매핑, MQTT topic mapping later only, mapping health evidence | `매핑·장치` cards with `data-r7-settings-mapping-card` |
| System/config/admin boundary | RBAC, 사용자 역할, 권한 정책, 시스템 설정, 진단, 백업, secret redaction, 감사 설정 | `시스템·보안` cards with `data-r7-settings-system-card` |
| User/role mapping | admin owns all role mapping; farm_owner scope limited to farm_staff evidence | `역할·권한` cards with `data-r7-settings-role-card` |
| Diagnostics/backup/audit export metadata | diagnostics, backup, audit export ownership | `진단·감사` cards with `data-r7-settings-diagnostics-card` |
| RBAC policy contract | write / execute / save / delete / ack / clear / apply backend enforcement | `RBAC 정책` cards with `data-r7-settings-rbac-card` |

## 2. Visual destination

R7-025 converts Settings/Admin into a visual global-admin boundary page, not a zone operation page.

Required tabs:

```text
도메인 소유권
역할·권한
매핑·장치
시스템·보안
진단·감사
RBAC 정책
```

Required markers:

```text
data-r7-settings-admin-zone-visual="true"
data-r7-settings-admin-global-boundary="true"
data-r7-settings-admin-detail-absorbed="true"
data-r7-settings-admin-subtab="domain-ownership"
data-r7-settings-admin-subtab="role-permissions"
data-r7-settings-admin-subtab="mapping-devices"
data-r7-settings-admin-subtab="system-security"
data-r7-settings-admin-subtab="diagnostics-audit"
data-r7-settings-admin-subtab="rbac-policy"
data-r7-settings-domain-card
data-r7-settings-role-card
data-r7-settings-permission-card
data-r7-settings-mapping-card
data-r7-settings-system-card
data-r7-settings-diagnostics-card
data-r7-settings-rbac-card
```

Old rendered marker that should be absent from product render after absorption:

```text
data-r7-settings-admin-detail
```

## 3. Admin/global boundary

설정는 daily grower workflow가 아니며, zone data를 직접 변경하지 않는다. 화면은 visual evidence를 제공하지만 mutation authority를 갖지 않는다.

```text
No API route change in R7-025
No DB migration in R7-025
No HA service call in R7-025
No MQTT/device command in R7-025
No role assignment mutation in R7-025
No settings save/delete in R7-025
No mapping edit in R7-025
No raw secrets in R7-025
No approval/override release in R7-025
No SafetyGuard/Interlock runtime behavior change in R7-025
```

## 4. Acceptance

```text
R7-025 focused contract passes
R7-013 stale contract is updated to visual absorption baseline
Related R7 routing/common visual contracts pass
Full pytest passes
node --check passes for both panel files
Prod HA check_config/restart/served-source/render smoke passes before release
```
