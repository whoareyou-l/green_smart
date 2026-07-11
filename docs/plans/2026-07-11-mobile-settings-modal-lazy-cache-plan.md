# v1.15.20 모바일 설정 모달 lazy cache 전환 계획

## 목표

v1.15.20에서 설정 하위탭 panel은 persistent DOM cache/show-hide로 바뀌었다. v1.15.20은 다음 단계로, 대표 설정 모달을 전체 render가 아니라 lazy cache root에 mount한다.

## 문제

v1.15.20 기준 주요 설정 모달 open/select/close 함수는 여전히 `this.render()`를 호출했다.

- `_openSettingsApprovalModal`
- `_openSettingsApprovalListModal`
- `_selectSettingsApprovalListRequest`
- `_openSettingsAuditLogModal`
- `_selectSettingsAuditLogRow`
- `_openSettingsPermissionMatrixModal`
- `_selectSettingsPermissionMatrixBucket`
- `_selectSettingsPermissionMatrixRole`

이 구조는 모달 버튼을 누를 때 설정 panel 전체 render를 다시 유발한다.

## 구현 방침

1. lazy modal root를 만든다.

```js
_ensureR7SettingsModalRoot()
```

2. 모달 type별 HTML renderer를 둔다.

```js
_renderR7CachedSettingsModalHtml(type)
```

3. 버튼 클릭 시에만 모달을 만든다.

```js
_mountR7CachedSettingsModal(type)
```

4. 닫기는 전체 render가 아니라 root 비우기/hidden 처리로 수행한다.

```js
_hideR7CachedSettingsModal(type)
```

5. 대표 모달 4종을 우선 이관한다.

- approval-detail
- approval-list
- audit-log
- permission-matrix

## 성공 기준

- 대표 모달 open/select 함수에서 `_mountR7CachedSettingsModal(type)`이 `this.render()`보다 먼저 실행된다.
- 대표 모달 close 함수에서 `_hideR7CachedSettingsModal(type)`이 `this.render()`보다 먼저 실행된다.
- served JS에 `data-r7-settings-modal-root="lazy-cache"`, `lazy-cache-on-open-no-full-render`, `data-r7-settings-modal-cache-mounted` marker가 존재한다.
- 전체 테스트/Prod smoke/GitHub Release를 통과한다.
