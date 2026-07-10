# R7-127 Common Sticky Sidebar Component

> 기준 버전: `v1.15.02`
> Status: planned
> Purpose: Green Smart rebuild shell sidebar를 공통 컴포넌트 렌더러로 분리하고, 화면을 위/아래로 스크롤해도 자기 grid column 옆에 따라 붙어 있도록 sticky/follow-scroll 정책을 명시한다.

## 요구사항

1. 사이드바는 단일 공통 컴포넌트 렌더러에서 생성한다.
2. compact rail / expanded sidebar는 같은 컴포넌트가 variant만 바꿔 렌더링한다.
3. product shell은 기존 `renderR7Sidebar()` 직접 구현이 아니라 공통 컴포넌트 호출 결과를 사용한다.
4. sidebar는 grid layout 안에 남아 있으면서 viewport 기준으로 따라 붙는다.

## Sticky / follow-scroll policy

```text
position:sticky
top:0
height:100vh
max-height:100vh
overflow-y:auto
overscroll-behavior:contain
```

## Required markers

```text
data-r7-sidebar-component="common"
data-r7-sidebar-component-version="r7-127"
data-r7-sidebar-follow-scroll="sticky"
data-r7-sidebar-fixed-viewport="true"
data-r7-sidebar-height-policy="100vh-sticky"
data-r7-sidebar-scroll-policy="internal-auto"
data-r7-sidebar-position-policy="sticky-grid-safe"
data-r7-sidebar-shell-component="common-sidebar"
```

## Boundary

```text
No API route change in R7-127
No DB migration in R7-127
No HA service call in R7-127
No MQTT/device command in R7-127
No save/apply/execute control in R7-127
```
