# v1.15.37 모바일 설정 domain shell cache 계획

## 목표

v1.15.17~19에서 설정 하위탭 panel, 모달, panel hydrate는 캐시/dirty patch로 전환했다. 그러나 설정 버튼 첫 진입 경로에는 아직 다음 구조가 남아 있다.

```js
workspace.innerHTML = this.renderR7ActiveDomainPage();
```

v1.15.37 목표는 **모바일 설정 도메인 한정**으로 domain page shell 자체를 persistent DOM cache에 보관하고, 설정 버튼 클릭 시 workspace 전체 innerHTML 교체 대신 cached shell attach/show를 사용하도록 바꾸는 것이다.

## 현재 문제

- 설정 버튼 첫 진입은 여전히 `renderR7ActiveDomainPage()`로 큰 HTML 문자열을 만든다.
- 그 결과를 `workspace.innerHTML`로 교체하므로, 설정 domain header/frame/subtab host를 매번 새로 만든다.
- 하위 panel cache가 있어도, shell이 새로 만들어지면 cache panel을 다시 attach해야 한다.

## 구현 방침

### 1. domain shell cache store

```js
this._r7DomainShellCache = new Map();
```

cache key:

```text
domain:settings-admin
```

### 2. settings shell 생성

```js
_getOrCreateR7CachedSettingsDomainShell()
```

최초 1회만 `renderR7ActiveDomainPage()`로 shell을 만들고 DOM node에 넣는다. 이후에는 cached node를 재사용한다.

### 3. workspace attach

```js
_attachR7CachedSettingsDomainShell(workspace)
```

- workspace children을 숨김
- cached settings shell이 workspace에 없으면 append
- cached settings shell만 `hidden=false`
- active tab panel을 `_showR7CachedSettingsPanel`로 연결
- metric values patch

### 4. fallback 유지

비설정 도메인이나 cache 실패 시 기존 `workspace.innerHTML = this.renderR7ActiveDomainPage()` fallback을 유지한다.

### 5. marker

- `data-r7-settings-domain-shell-cache="persistent-dom"`
- `data-r7-settings-domain-shell-cache-hit`
- `data-r7-settings-domain-shell-cache-miss`
- `data-r7-mobile-domain-render-mode="settings-shell-cache-show-hide"`

## 성공 기준

- 설정 branch에서는 `workspace.innerHTML = this.renderR7ActiveDomainPage()`보다 cached shell attach가 먼저 실행된다.
- cached settings shell path marker가 served JS에 존재한다.
- 기존 generic domain fallback은 유지된다.
- 전체 테스트/Prod smoke/GitHub Release v1.15.37 완료.
