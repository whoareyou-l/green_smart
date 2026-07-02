# R7-033 Sidebar Settings Utility + User Exit

> 기준 버전: `v1.14.54`
> Status: R7-033 planned
> Purpose: 설정 도메인을 사이드바 메인 탭 목록에서 제거하고 하단 두 번째 utility로만 제공하며, 하단 나가기 버튼에 로그인 사용자 정보를 표시하면서 기존 로그아웃/나가기 기능을 유지한다.

## User request

```text
1. 설정 관리 도메인의 탭을 아래에서 두번째로 옮겨주고 기존은 없애줘.
2. 사이드바 하단의 나가기 버튼에 로그인한 사람의 정보를 보여주는 기능을 추가하고 로그아웃 기능도 유지해줘.
```

## Required behavior

```text
settings-admin is not rendered in the main sidebar domain navigation list.
settings-admin remains routable and renderable as a domain page.
settings-admin appears only as the second item from the bottom utility area.
The bottom exit/logout utility displays the currently logged-in user's name/role.
The bottom exit/logout utility keeps logout/exit semantics.
The implementation remains UI/layout only.
```

## Required markers

```text
data-r7-sidebar-main-domain-list="without-settings-admin"
data-r7-sidebar-utility-domain="settings-admin"
data-r7-sidebar-utility-position="second-from-bottom"
data-r7-sidebar-user-exit="true"
data-r7-sidebar-user-name
data-r7-sidebar-user-role
data-r7-sidebar-utility="exit"
data-r7-sidebar-logout-action="preserved"
```

## Required rendered constraints

```text
Main nav must not contain data-r7-sidebar-group="settings-admin" inside data-r7-sidebar-nav-list.
Utility group must contain data-r7-sidebar-group="settings-admin" exactly once.
Utility group must contain data-r7-sidebar-user-name and data-r7-sidebar-user-role.
Exit utility must preserve data-r7-sidebar-utility="exit".
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
