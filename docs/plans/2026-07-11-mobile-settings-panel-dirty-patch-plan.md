# v1.15.19 모바일 설정 panel full hydrate 분해 계획

## 목표

v1.15.17~18에서 설정 하위탭은 persistent DOM cache/show-hide와 lazy modal cache를 갖췄다. 하지만 cached panel hydrate 단계에는 아직 full panel 문자열 생성/대형 innerHTML 교체가 남아 있다.

v1.15.19 목표는 설정 모바일 cached panel에서 다음 코드를 제거하는 것이다.

```js
const fullHtml = this._renderR7SubtabPanelForDomain("settings-admin", tabKey);
panel.innerHTML = fullHtml;
```

대신 cached panel 안에는 작은 summary/action 카드 DOM만 만들고, 데이터 변경은 textContent/dataset으로 patch한다.

## 현재 문제

- `users-permissions`, `system-integration` 등은 full panel이 수만 자까지 커질 수 있다.
- 클릭 프레임은 피했지만 120ms 뒤 hydrate에서 큰 DOM 삽입/layout/reflow가 발생할 수 있다.
- 캐시 DOM 구조의 장점을 살리려면 full hydrate도 큰 innerHTML이 아니라 작은 node patch여야 한다.

## 구현 방침

### 1. compact patch model

각 설정 탭에 대해 작은 모델을 만든다.

- greenhouse-zones: 온실 수, 구역 수, 장치/센서 매핑 수
- device-sensor-mapping: 장치 수, 그룹 수, 매핑 수
- users-permissions: 사용자 수, 승인 수, 권한 matrix 수
- system-integration: DB/Center/API 상태와 오류 수

### 2. compact DOM builder

```js
_buildR7CachedSettingsPanelPatchNode(tabKey)
```

- `document.createElement` 기반으로 작은 section을 만든다.
- marker: `data-r7-settings-panel-patch-mode="summary-card-dirty-patch"`
- marker: `data-r7-settings-panel-full-hydrate="not-used-compact-patch"`

### 3. field patch

```js
_patchR7CachedSettingsPanelData(tabKey)
```

- count/status node를 찾아 `textContent`만 변경한다.
- dirty flag를 해제한다.
- 전체 render/large HTML 생성 없음.

### 4. hydrate 변경

기존:

```js
const fullHtml = ...
panel.innerHTML = fullHtml
```

변경:

```js
const patchNode = this._buildR7CachedSettingsPanelPatchNode(tabKey)
panel.replaceChildren(patchNode)
this._patchR7CachedSettingsPanelData(tabKey)
```

### 5. full panel fallback은 desktop/full render 경로에만 유지

`renderR7SettingsAdminSubtabPanel`과 desktop/full render 계약은 유지한다. 모바일 cached panel hydrate만 compact patch 경로를 사용한다.

## 성공 기준

- `_hydrateR7CachedSettingsPanel` 안에 `_renderR7SubtabPanelForDomain("settings-admin", tabKey)` 호출이 없어야 한다.
- `_hydrateR7CachedSettingsPanel` 안에 `panel.innerHTML = fullHtml`이 없어야 한다.
- `replaceChildren` 또는 field patch 기반 compact node가 사용되어야 한다.
- `summary-card-dirty-patch`, `not-used-compact-patch` marker가 served JS에 존재한다.
- 전체 테스트/Prod smoke/GitHub Release v1.15.19 완료.
