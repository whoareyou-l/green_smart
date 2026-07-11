# v1.15.38 모바일 설정 event delegation 계획

## 목표

v1.15.17~20에서 설정 도메인은 shell cache, panel cache, dirty patch, lazy modal cache를 갖췄다. 하지만 캐시 DOM을 attach/hydrate한 뒤에도 `_bindR7PatchedInteractiveActions()` → `_bindSettingsApprovalActions()`가 반복 호출되며 다수의 `querySelectorAll(...).addEventListener(...)`가 다시 수행된다.

v1.15.38 목표는 설정 shell/root에 delegated click handler를 1회만 붙여 cached DOM 버튼을 처리하는 것이다.

## 현재 문제

- cached panel show/hide 후 `_bindR7PatchedInteractiveActions()`가 호출된다.
- cached modal mount 후 `_bindSettingsApprovalActions()`가 호출된다.
- 버튼에 개별 listener를 반복 추가하면 모바일 WebView에서 불필요한 JS 작업과 중복 listener 위험이 생긴다.

## 구현 방침

### 1. delegated root

```js
_bindR7SettingsDelegatedEvents(root)
```

- root가 없으면 host(this)를 사용한다.
- `data-r7-settings-delegated-events-bound="true"` guard로 1회만 binding한다.

### 2. 처리 대상

- `[data-r7-domain-subtab][data-r7-domain-subtab-for="settings-admin"]`
- `[data-r7-open-settings-modal]`
- `[data-r7-settings-approval-list-button]`
- `[data-r7-settings-audit-log-button]`
- `[data-r7-settings-permission-matrix-button]`
- close/select 버튼 일부

### 3. 기존 개별 binding fallback 유지

기존 `_bindSettingsApprovalActions()`는 PC/full-render fallback을 위해 유지한다. 단, delegated root가 있는 cached settings shell에서는 delegated handler가 우선 처리한다.

### 4. attach 지점

- `_attachR7CachedSettingsDomainShell(workspace)` 후 shell에 delegated event bind
- `_mountR7CachedSettingsModal(type)` 후 modal root에도 delegated event bind

## 성공 기준

- served JS에 `_bindR7SettingsDelegatedEvents(root)` 존재
- delegated bound marker 존재
- settings shell attach에서 delegated bind 호출
- modal mount에서 delegated bind 호출
- cached action 버튼은 delegated handler로 처리 가능
- 전체 테스트/Prod smoke/GitHub Release v1.15.38 완료
