# R7-041 End-to-End UI QA Baseline

> 기준 버전: `v1.14.22`
> Status: R7-041 planned
> Purpose: v1.14.22까지 만든 R7 화면/네비게이션/하위탭 UI를 실제 HA 브라우저와 render smoke로 QA하고, 하위탭 상세화/기능 연결 전 기준선을 잠근다.

## Scope

QA 대상:

```text
operations-home
crop-operations
environment-control
irrigation-fertigation
device-control
recommendation-automation
safety-history
settings-admin
```

최근 변경 기준선:

```text
HA-adjacent sticky sidebar
Green Smart MDI ha-icon sidebar
short domain labels
unified domain content card
shared domain subtab top navbar
zone selector / zone context bar
active domain and active subtab state
```

## QA checklist

For each screen/domain:

```text
sidebar exists and is sticky/grid-safe
sidebar uses ha-icon domain icons
main nav excludes settings-admin and utility contains settings-admin
hero/title appears before unified content card
domain subtab navbar appears before zone selector
domain subtab navbar uses ha-icon + visible title
active domain and active subtab are visually distinguishable
zone selector/context is present for domain pages
active subtab panel is visible and non-empty
no old pill-cluster subtab style is rendered
no old emoji sidebar icons are rendered
no console error blocks the screen
```

## Browser QA evidence target

```text
actual HA URL: http://127.0.0.1:8123/
served rebuild panel JS version: 1.14.10
browser console: no blocking JavaScript errors from green-smart-panel / green-smart-rebuild-panel
render smoke: all shared domains produce top-navbar subtabs with ha-icon + title
```

## Known scope boundary

R7-041 is QA baseline + minimum visual/runtime hotfix only.

Do not add:

```text
new API route
DB migration
HA service call
MQTT/device command
save/apply/execute control
SafetyGuard/Interlock runtime behavior change
physical device hookup
```

## Completion criteria

```text
R7-041 contract passes
related sidebar/domain contracts pass
full pytest passes
Home Assistant check_config passes
Prod served-source smoke passes
Prod render smoke passes
recent HA logs have no new matching Green Smart errors
QA report records findings and pass/fail summary
release tag v1.14.22 exists
```


## v1.14.22 served JS note

served rebuild panel JS version: 1.14.22
