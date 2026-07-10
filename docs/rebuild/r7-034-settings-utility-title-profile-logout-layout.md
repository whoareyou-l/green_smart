# R7-034 Settings Utility Title + Profile Logout Layout

> 기준 버전: `v1.15.11`
> Status: R7-034 planned
> Purpose: 하단으로 이동한 설정 utility가 상세형 사이드바에서도 제목/설명을 갖도록 보정하고, v1.15.11부터 프로필 버튼과 Home Assistant 로그아웃 버튼을 분리한다.

## User request

```text
1. 설정 도메인의 탭은 왜 상세화에서 제목과 설명이 없음?
2. 로그아웃 부분은 왼쪽은 동그란 유저 프로필 이미지 가 있고 가운데 유저 정보, 오른쪽은 로그아웃 버튼으로 배치해줘.
```

## Required behavior

```text
Expanded/sidebar-detail mode shows Settings/Admin utility with title and description like a domain tab.
Compact/sidebar-rail mode keeps Settings/Admin icon-only but preserves hidden label/description for accessibility.
Settings/Admin still does not return to the main domain nav.
Settings/Admin remains the second-from-bottom utility item.
Expanded profile area uses avatar + user name/role and is separated from the logout button.
profile button is separated from the Home Assistant logout button.
Compact profile keeps avatar affordance and hidden user info, with a separate logout icon button beside it.
Logout action remains /auth/logout and is marked as HA auth logout.
```

## Required markers

```text
data-r7-settings-admin-utility-detail="true"
data-r7-settings-admin-utility-title
data-r7-settings-admin-utility-description
data-r7-sidebar-user-profile-layout="avatar-info-separated-logout"
data-r7-sidebar-user-avatar
data-r7-sidebar-user-info
data-r7-sidebar-logout-button
data-r7-sidebar-logout-action="ha-auth-logout"
```

## Boundary

```text
No API route change in R7-034
No DB migration in R7-034
No HA service call in R7-034
No MQTT/device command in R7-034
No save/apply/execute control in R7-034
No approval/override release in R7-034
No SafetyGuard/Interlock runtime behavior change in R7-034
No physical device hookup in R7-034
```
