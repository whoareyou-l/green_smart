# v1.15.22 모바일 DOM patch navigation 계획

## 사용자 피드백

- v1.15.22는 대기 placeholder는 없어졌지만 여전히 실제 반응이 느리다.
- 사용자는 탭/도메인 버튼을 누르면 즉각즉각 동작하는 UX를 원한다.

## 원인

v1.15.22까지는 모바일 fast mode에서도 `setR7DomainSubtab()` 마지막에 `this.render()`를 호출했다. 이 방식은 탭 하나를 바꾸기 위해 Green Smart 전체 shell/sidebar/workspace/footer/modal HTML과 이벤트 바인딩을 다시 생성한다.

Node 문자열 생성은 수 ms로 보여도, 실제 HA 모바일 WebView에서는 `innerHTML` 대량 교체와 레이아웃/reflow 때문에 체감 지연이 생긴다.

## 수정 방침

1. 모바일 하위탭 클릭은 `this.render()`를 호출하지 않는다.
2. active subtab 버튼 속성만 DOM에서 즉시 갱신한다.
3. 현재 `[data-r7-domain-subtab-panel]` 하나만 `outerHTML`로 교체한다.
4. 모바일 도메인 버튼 클릭은 전체 app shell render가 아니라 `[data-r7-page-workspace]`만 `innerHTML`로 교체한다.
5. 부분 패치 후 필요한 이벤트만 재바인딩하되, `data-r7-*-bound` guard로 중복 바인딩을 방지한다.

## 성공 기준

- served JS에 `data-r7-mobile-dom-patch-subtab="true"`, `panel-outerhtml-only` marker가 있다.
- served JS에 `data-r7-mobile-dom-patch-domain="true"`, `workspace-innerhtml-only` marker가 있다.
- `mobileFast && this._patchR7MobileSubtabPanel(domain, tabKey)`가 `this.render()`보다 먼저 return한다.
- 전체 테스트, Prod smoke, GitHub Release 완료.
