# v1.15.48 설정 cache prewarm 실행 계획

## 배경
v1.15.48까지 settings-admin은 기존 full render fallback 없이 `settings-shell-cache-show-hide` 경로로만 진입한다. 하지만 cache는 브라우저/WebView 메모리 안에서 생성되는 DOM cache이므로 첫 진입 전에는 비어 있다.

현재 구조:

```text
설정 클릭/hash 진입
→ _openR7SettingsDomainFromCache()
→ _attachR7CachedSettingsDomainShell()
→ cache miss이면 settings shell/panel 생성
→ workspace에 attach/show
```

이 구조는 두 번째 진입부터 빠르지만, 사용자가 문제를 겪는 지점은 “첫 설정 진입”이다. 따라서 첫 클릭 시 cache miss가 발생하지 않도록 패널 초기 렌더 직후 idle 시간에 settings shell/panel을 선생성한다.

## 목표
1. Green Smart 패널이 표시된 직후 settings domain shell cache를 prewarm한다.
2. 기본 settings panel(`greenhouse-zones`)도 prewarm한다.
3. prewarm은 workspace에 붙이지 않고 메모리 DOM cache만 만든다.
4. 첫 설정 클릭은 cache hit 상태로 `_attachR7CachedSettingsDomainShell()`을 수행한다.
5. 기존 settings full render fallback은 되살리지 않는다.
6. PC/모바일/해시 진입 모두 동일한 cache-only 경로를 유지한다.
7. 모바일 viewport smoke에서 첫 설정 클릭 전 prewarm 완료와 클릭 후 cache hit를 확인한다.

## 구현 단계

### 1. 상태값 추가
constructor에 아래 상태를 추가한다.

```js
this._r7SettingsCachePrewarmTimer = 0;
this._r7SettingsCachePrewarmIdle = 0;
this._r7SettingsCachePrewarmed = false;
```

### 2. connectedCallback에서 prewarm 예약
`render()`와 hash route 처리 후 아래 순서로 예약한다.

```text
render()
_handleR7SettingsHashRoute("connected")
_scheduleR7SettingsCachePrewarm("connected")
```

단, 현재 hash가 이미 `#settings-admin`이면 즉시 settings를 열어야 하므로 prewarm이 아니라 open 경로가 우선된다. 그래도 open 이후 cache marker는 이미 생성된 상태로 남는다.

### 3. idle/timer 기반 prewarm
가능하면 `requestIdleCallback`을 사용하고, 없으면 짧은 `setTimeout`으로 실행한다.

```js
_scheduleR7SettingsCachePrewarm(source = "idle")
_runR7SettingsCachePrewarm(source = "idle")
```

prewarm은 아래만 수행한다.

```text
_getOrCreateR7CachedSettingsDomainShell()
_getOrCreateR7CachedSettingsPanel(active/default tab)
_patchR7CachedSettingsPanelData(active/default tab)
```

주의: workspace attach, full hydrate, modal open, 전체 render는 하지 않는다.

### 4. 클릭 시 cache hit marker
`_attachR7CachedSettingsDomainShell()`에서 attach 직전 cache 존재 여부를 marker로 남긴다.

```text
data-r7-settings-domain-shell-attach-cache-state="hit-prewarmed|hit|miss-created"
```

prewarm 이후 첫 클릭이면 `hit-prewarmed`가 되어야 한다.

### 5. cleanup
`disconnectedCallback()`에서 예약된 idle/timer를 해제한다.

### 6. 계약 테스트
신규 테스트:

- prewarm 상태값 존재
- connectedCallback에서 prewarm 예약
- requestIdleCallback/setTimeout fallback 존재
- prewarm이 shell/panel 생성 함수를 호출
- prewarm이 workspace attach/render fallback을 호출하지 않음
- attach marker가 hit-prewarmed를 기록
- settings full render fallback 문자열 부재 유지

### 7. 모바일 viewport smoke
Chromium 390×844 조건에서:

1. element 생성
2. 설정 클릭 전 prewarm 완료 대기
3. `data-r7-settings-cache-prewarm="done"` 확인
4. settings 버튼 click
5. `active=settings-admin` 확인
6. attach cache state가 `hit-prewarmed`인지 확인
7. fallback 없음 확인

## 성공 기준

```text
전체 pytest 통과
모바일 viewport first-click prewarmed cache-hit smoke 통과
Prod served JS v1.15.48 확인
HA HTTP 200
served smoke: PREWARM markers ok
Git commit/tag/release 완료
```
