# R7-033 Sidebar Settings Utility + User Exit

> 기준 버전: `v1.15.37`
> Status: R7-033 planned
> Purpose: 설정 도메인을 사이드바 메인 탭 목록에서 제거하고 하단 두 번째 utility로 제공한다. v1.15.37부터 하단 사용자 영역과 Home Assistant 로그아웃 버튼을 분리한다.

## User request

```text
1. 설정 관리 도메인의 탭을 아래에서 두번째로 옮겨주고 기존은 없애줘.
2. 사이드바 하단의 사용자 영역은 사용자 정보 변경 페이지로 이동하고, 로그아웃 버튼은 Home Assistant 로그아웃과 동일하게 동작하게 분리한다.
```

## Required behavior

```text
settings-admin is not rendered in the main sidebar domain navigation list.
settings-admin remains routable and renderable as a domain page.
settings-admin appears only as the second item from the bottom utility area.
The bottom profile utility displays the currently logged-in user's name/role.
The bottom profile utility opens settings-admin/users-permissions.
The bottom logout utility is a separate HA auth logout action.
separates profile and Home Assistant logout semantics.
The implementation remains UI/layout only.
```

## Required markers

```text
data-r7-sidebar-main-domain-list="without-settings-admin"
data-r7-sidebar-utility-domain="settings-admin"
data-r7-sidebar-utility-position="second-from-bottom"
data-r7-sidebar-user-profile-button="true"
data-r7-sidebar-logout-button="true"
data-r7-sidebar-user-name
data-r7-sidebar-user-role
data-r7-sidebar-utility="profile"
data-r7-sidebar-utility="logout"
data-r7-sidebar-logout-action="ha-auth-logout"
```

## Required rendered constraints

```text
Main nav must not contain data-r7-sidebar-group="settings-admin" inside data-r7-sidebar-nav-list.
Utility group must contain data-r7-sidebar-group="settings-admin" exactly once.
Utility group must contain data-r7-sidebar-user-name and data-r7-sidebar-user-role in the profile button.
Logout utility must be separate from the profile button and use data-r7-sidebar-logout-action="ha-auth-logout".
```

## Boundary

```text
No API route change in R7-033
No DB migration in R7-033
No HA service call in R7-033
No MQTT/device command in R7-033
No save/apply/execute control in R7-033
No approval/override release in R7-033
No SafetyGuard/Interlock runtime behavior change in R7-033
No physical device hookup in R7-033
```
