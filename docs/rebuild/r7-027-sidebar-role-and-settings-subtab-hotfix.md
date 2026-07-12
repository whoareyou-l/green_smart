# R7-027 Sidebar Role Layout and Settings Subtab Hotfix

> 기준 버전: `v1.15.40`
> Status: R7-027 planned
> Purpose: 사용자 QA에서 확인된 설정 하위탭 미동작과 sidebar UX 요구를 수정한다.

## 1. Settings/Admin subtab hotfix

설정 도메인의 하위탭은 다른 도메인과 동일하게 클릭 시 active tab/panel이 바뀌어야 한다.

Required tabs:

```text
domain-ownership
role-permissions
mapping-devices
system-security
rbac-policy
```

## 2. Sidebar role layout policy

운영자 role은 HA 기본 sidebar 바로 오른쪽에 Green Smart sidebar가 표시되어야 한다.

운영자를 제외한 나머지 role은 Green Smart 화면이 화면 최왼쪽에 붙어야 하며, HA sidebar를 숨기는 class/policy marker를 제공한다.

```text
data-r7-sidebar-layout-mode="operator-ha-adjacent"
data-r7-sidebar-layout-mode="full-left-no-ha-sidebar"
data-r7-ha-sidebar-policy="keep"
data-r7-ha-sidebar-policy="hide"
```

Implementation note: frontend applies body classes:

```text
green-smart-operator-ha-sidebar-adjacent
green-smart-hide-ha-sidebar
```

## 3. Sidebar icon/logo/collapse UX

Sidebar must include:

```text
data-r7-sidebar-logo-image
Green Smart logo image
각 도메인 대표 emoji/icon
운영 홈: 🏠
작물 운영: 🌱
환경 제어: 🌡️
관수 제어: 💧
장치 제어: ⚙️
자동화 제어: 🤖
안전 제어: 🛡️
설정: 🧩
data-r7-sidebar-collapse-toggle
data-r7-sidebar-collapsed="false"
data-r7-sidebar-collapsed="true"
```

간략형에서는 label/icon 중심으로 보이고 summary는 숨긴다. 상세형에서는 label + summary가 보인다.

## Boundary

```text
No API route change in R7-027
No DB migration in R7-027
No HA service call in R7-027
No MQTT/device command in R7-027
No save/apply/execute control in R7-027
No approval/override release in R7-027
No SafetyGuard/Interlock runtime behavior change in R7-027
No physical device hookup in R7-027
```
