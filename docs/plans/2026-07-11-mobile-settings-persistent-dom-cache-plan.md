# v1.15.51 모바일 설정 persistent DOM cache 전환 계획

## 배경

사용자 피드백:

- 모바일 설정 하위탭 이동이 아직 느리다.
- `render`/`innerHTML`로 갈아끼우는 방식이 아니라, 큰 틀과 변경 틀을 캐시하고 변경된 부분만 반영하는 구조를 원한다.
- 모달은 버튼을 눌렀을 때만 생성하고, 생성한 모달도 캐시해야 한다.

## 현재 v1.15.51 구조의 한계

v1.15.51은 전체 `this.render()`는 많이 줄였지만, 모바일 하위탭 전환은 여전히 다음 구조다.

```text
하위탭 클릭
→ _patchR7MobileSubtabPanel()
→ subtabSection.innerHTML 재생성
→ panelSection.innerHTML = light panel
→ 120ms 뒤 full panel HTML 생성
→ panelSection.innerHTML = full panel
```

즉, 전체 app render는 피했지만 아직 `innerHTML` 기반 패널 교체와 full panel 문자열 렌더가 남아 있다.

## 목표 구조

설정 도메인 모바일 한정으로 우선 적용한다.

```text
설정 도메인 진입
→ settings shell 유지
→ panel host 유지
→ 각 하위탭 panel DOM을 Map에 캐시

하위탭 클릭
→ 탭바 active만 갱신
→ 캐시 panel show/hide
→ 데이터 변경이 있을 때만 dirty patch/hydrate
→ full render fallback 금지
```

## 핵심 설계

### 1. cache store

```js
this._r7SettingsPanelCache = new Map();
this._r7SettingsPanelDirty = new Set();
this._r7ModalCache = new Map();
```

캐시 키:

```text
settings:greenhouse-zones
settings:device-sensor-mapping
settings:users-permissions
settings:system-integration
modal:permission-matrix
modal:audit-log
modal:approval-list
```

### 2. 설정 하위탭 전환

기존:

```js
panelSection.innerHTML = ...
```

목표:

```js
const panel = this._getOrCreateR7CachedSettingsPanel(tabKey);
this._showR7CachedSettingsPanel(panelSection, tabKey);
```

전환 시 수행:

- 모든 cached panel `hidden = true`
- 선택 panel만 `hidden = false`
- 이미 연결된 DOM은 제거하지 않음
- 이벤트는 캐시 panel에 중복 바인딩하지 않음

### 3. light shell 최초 생성

panel 최초 생성 시에는 매우 작은 실제 shell만 넣는다.

```text
탭 제목
도메인 이름
상태/요약 count placeholder
```

### 4. dirty patch

데이터 로드 완료 시:

```js
this._markR7SettingsPanelsDirty("users-permissions")
this._markR7SettingsPanelsDirty("greenhouse-zones")
```

active panel이면:

```js
_patchR7CachedSettingsPanelData(tabKey)
```

비활성 panel이면 dirty 상태만 유지하고, 다음에 열 때 patch한다.

### 5. full hydrate는 1회/dirty일 때만

한 번 full hydrate된 panel은 다시 만들지 않는다.

```js
if (panel.dataset.r7CachedPanelHydrated !== "true" || dirty) {
  hydrate
}
```

단, 클릭 프레임에서는 hydrate하지 않는다. show/hide 먼저, hydrate는 idle/timer에서만 한다.

### 6. 모달 lazy cache

v1.15.51에서는 먼저 cache 기반 modal root와 marker를 도입한다.

- 탭 전환 경로에서 모달을 생성하지 않는 marker를 둔다.
- 모달 open 함수는 이후 단계에서 cached modal로 확장 가능한 `_getOrCreateR7CachedModal(type)` 경로를 사용한다.
- 기존 modal render fallback은 유지하되, 모바일 cached settings panel 전환 시에는 모달 생성이 탭 전환을 막지 않도록 분리한다.

## 성공 기준

- 모바일 설정 하위탭 전환에서 `panelSection.innerHTML = ...` 기반 교체를 사용하지 않는다.
- `data-r7-settings-panel-cache="persistent-dom"` marker가 존재한다.
- `data-r7-settings-panel-cache-hit` / `data-r7-settings-panel-cache-miss` marker가 존재한다.
- `data-r7-settings-panel-dirty-patch="true"` marker가 존재한다.
- `data-r7-settings-modal-cache="lazy-on-open"` marker가 존재한다.
- 전체 테스트 통과.
- Prod served smoke 통과.
- GitHub Release v1.15.51 생성.
