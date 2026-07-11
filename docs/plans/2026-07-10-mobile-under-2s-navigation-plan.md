# v1.15.34 모바일 2초 이내 체감 전환 계획

## 사용자 기준

- 모바일에서 설정 버튼/하위탭 전환은 즉각 반응해야 한다.
- 모든 내용을 불러들이는 데 2초 이상 걸리면 실패로 본다.
- 단순히 "표시만 바뀜"이 아니라 실제 선택 탭의 내용이 바로 보이고, 상세 내용도 빠르게 채워져야 한다.

## 실제 재분석 결과

### 1. v1.15.34의 핵심 버그

v1.15.34는 light-first panel을 넣었지만 `_patchR7MobileSubtabPanel()` 시작부에서 여전히 full panel을 먼저 생성했다.

```js
const panelHtml = this._renderR7SubtabPanelForDomain(domain, tabKey);
```

이 때문에 경량 패널을 먼저 보여주기 전에 이미 `사용자·권한` 약 43KB, `records-workflow` 약 34KB 등의 HTML 생성 비용이 클릭 프레임에 들어갔다.

### 2. 실제 지연 후보

- 프론트 JS served 파일 크기: 약 560KB. 서버 응답은 2~6ms로 빠르므로 네트워크/정적 파일 서버 병목은 아님.
- Node 문자열 생성은 수 ms지만, 모바일 HA WebView에서는 큰 `innerHTML` 삽입/layout/reflow가 병목일 가능성이 높음.
- 설정 데이터 API는 인증 라우트라 unauth curl로는 404/401처럼 보일 수 있으나, 프론트는 `hass.callApi`로 호출한다. 초기 연결 시 `_loadHomeContext`, `_loadSettingsUsersPermissions`, `_loadSettingsGreenhouseZoneData`가 각각 render를 유발하므로 모바일에서 클릭과 겹치면 jank 가능성이 있다.

## v1.15.34 수정 방침

1. 하위탭 클릭 프레임에서 full panel HTML 생성 금지.
   - `_patchR7MobileSubtabPanel()`은 먼저 light panel만 생성/삽입한다.
   - full panel 생성은 setTimeout 이후 hydrate 단계에서만 수행한다.

2. 2초 SLA marker 추가.
   - 클릭 시 `data-r7-mobile-subtab-sla="under-2s"`.
   - light first paint marker: `data-r7-mobile-first-paint-target-ms="100"`.
   - full hydrate target marker: `data-r7-mobile-full-hydrate-target-ms="2000"`.

3. 설정 버튼 첫 진입도 full settings panel 생성 금지.
   - workspace patch는 유지.
   - Settings fast landing은 light panel만 렌더.

4. API/data load render jank 완화.
   - 설정 데이터 로드 완료 후 `render()`를 무조건 호출하지 않고, 모바일 DOM patch 모드에서는 현재 설정 화면의 active panel만 refresh하도록 시도한다.
   - 실패할 때만 full render fallback.

5. 계약 테스트/Prod smoke에서 다음을 확인한다.
   - `_patchR7MobileSubtabPanel()` 블록 안에서 light panel 삽입 전 `_renderR7SubtabPanelForDomain` 호출이 없어야 한다.
   - full render는 `_scheduleR7MobileFullSubtabHydration()` 내부에서만 수행된다.
   - 2초 SLA marker가 served JS에 존재한다.

## 성공 기준

- 탭 클릭 즉시 경량 실제 탭 화면이 표시된다.
- full hydrate는 2초 목표 marker와 함께 뒤에서 수행된다.
- 전체 테스트 통과.
- Prod served smoke 통과.
- GitHub Release 생성까지 완료.
