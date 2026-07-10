# v1.15.12 모바일 하위탭/도메인 전환 freeze 제거 계획

## 사용자 증상

- v1.15.12 이후 모바일 설정 도메인 페이지 진입은 가능하다.
- 그러나 설정 하위탭을 누르면 이전 페이지에서 약 1분 정도 멈춘 뒤 이전 화면에서 동작하는 것처럼 보인다.
- 다른 설명/도메인 페이지 이동도 일정 시간 멈춘 뒤 설정 페이지로 이동한다.

## 확인한 원인

### 1. v1.15.12 fast landing은 설정 최초 진입에만 적용됨

`_openR7SettingsDomainFromMobile()`은 `data-r7-mobile-settings-fast-landing`을 켜지만, 하위탭 클릭 경로인 `setR7DomainSubtab()`에는 같은 fast path가 없다.

### 2. 하위탭 클릭은 여전히 모든 패널을 동기 렌더함

`renderR7SettingsAdminZoneVisual()`은 fast landing이 꺼진 뒤 다음 구조로 모든 패널을 생성한다.

```js
tabs.map(([key]) => this.renderR7SettingsAdminSubtabPanel(key, activeTab)).join("")
```

환경/관수/장치/자동화/안전/작물 도메인도 동일한 패턴이다. 모바일에서 하위탭/도메인 버튼 클릭 직후 모든 inactive 패널 HTML까지 만들면 메인 스레드가 막혀 이전 화면이 멈춘 것처럼 보인다.

### 3. 기존 전체 테스트는 데스크톱/계약 렌더에서 모든 marker가 HTML에 존재해야 한다

따라서 전체 렌더를 전역 active-only로 바꾸면 과거 계약이 깨진다. v1.15.12 시도에서 실제로 기존 도메인 marker 계약들과 충돌했다.

## 수정 방침

### A. 모바일 액션 전용 fast panel mode 추가

- `_r7MobileFastPanelMode` 상태를 추가한다.
- 모바일 도메인 버튼 클릭, 모바일 설정 버튼 클릭, 모바일/하위탭 클릭에서 true로 켠다.
- 데스크톱 또는 일반 API 호출 경로는 기존 전체 패널 렌더를 유지한다.

### B. fast panel mode에서는 active subtab panel만 렌더

- `renderR7PanelsForDomain(domainKey, tabs, activeTab, renderer, fullPanels)` helper를 둔다.
- `_r7MobileFastPanelMode === true`이면 active panel만 생성하고 inactive는 lightweight `<template data-r7-mobile-deferred-subtab-panel>`로 남긴다.
- false이면 기존처럼 모든 패널을 생성한다.

### C. 하위탭 클릭 이벤트를 모바일/터치 상황에서 즉시 반응하도록 보정

- `_bindR7DomainSubtabs()`에서 `preventDefault()`/`stopPropagation()`을 적용한다.
- 클릭 시 `_r7MobileFastPanelMode = true`를 켜고 `setR7DomainSubtab()`으로 이동한다.
- active 하위탭이 화면 밖에 있으면 오른쪽 끝으로 맞추는 scheduler를 추가한다.

### D. 도메인 버튼/설명 페이지 전환도 mobile fast mode 적용

- `_activateR7DomainFromNavigation()`에서 모바일 domain button 경로는 `_r7MobileFastPanelMode = true`로 처리한다.
- 설정 페이지에서 다른 도메인/설명 페이지로 이동해도 전체 inactive 패널을 만들지 않는다.

## 검증

- 계약 테스트: 모바일 fast panel mode marker, active-only helper, subtab event stopPropagation, deferred template 존재 확인.
- 기존 전체 테스트: 데스크톱/일반 렌더는 full panels 유지하므로 통과해야 한다.
- Prod served smoke: v1.15.12, mobile fast panel mode, deferred subtab panel, subtab no-bubble marker, right-edge scroll marker 확인.
- HA restart 후 stable log 확인.
- commit/tag/push/GitHub Release v1.15.12 생성.

## 성공 기준

- 모바일 설정 하위탭 클릭 시 이전 화면에서 오래 멈추지 않고 active 탭이 즉시 전환된다.
- 모바일 도메인/설명 페이지 전환도 active panel만 먼저 렌더한다.
- 데스크톱/계약 렌더는 기존 full marker 계약을 유지한다.
