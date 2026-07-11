# v1.15.29 모바일 설정 버튼 freeze 및 도메인 탭 스크롤 보정 계획

## 사용자 증상

1. 모바일 상단의 설정 버튼을 눌러도 설정 도메인으로 들어가지 않고, 잠깐 화면이 멈춘 뒤 이전 화면처럼 보인다.
2. 모바일 도메인 버튼 전환 시 선택된 버튼이 화면 밖에 있으면 사용자가 직접 스크롤해야 한다. 선택된 버튼이 우측 끝에 오도록 자동 보정해야 한다.

## 확인한 현재 상태(v1.15.29)

- 운영 served 파일은 `/green_smart_panel/rebuild/green-smart-rebuild-panel.js?v=1.15.29`에서 v1.15.29이 정상 제공된다.
- 모바일 설정 버튼은 `<button>`으로 바뀌었지만, 여전히 일반 `[data-r7-sidebar-target]` 라우팅 바인딩을 함께 사용한다.
- 설정 도메인 렌더링은 active tab이 `greenhouse-zones`여도 `greenhouse-zones`, `device-sensor-mapping`, `users-permissions`, `system-integration` 전체 패널 HTML을 한 번에 생성한다.
- 작물/환경/관수/장치/자동화/안전 도메인도 active 하위탭만 보이지만, inactive 하위탭 패널 body까지 모두 HTML로 만든 뒤 `display:none` 처리한다.
- 모바일 도메인 버튼 row에는 active 버튼을 우측으로 스크롤시키는 후처리 로직이 없다.

## 원인 가설

### A. 설정 버튼 라우팅 경로가 모바일 전용이 아님

설정 버튼이 일반 sidebar target과 같은 경로를 타면 PC sidebar, 모바일 domain button, utility button이 모두 같은 selector로 묶인다. 이 자체가 실패 원인은 아니지만, 모바일 설정처럼 빠른 top-nav action은 별도 action으로 분리해야 추적과 회귀 방지가 가능하다.

### B. 설정 도메인 진입 시 inactive 패널까지 즉시 렌더되어 메인 스레드가 막힘

설정 화면은 사용자/권한, 시스템/연동 등 카드가 많은 패널을 포함한다. 모바일에서 설정 버튼 클릭 직후 모든 패널 HTML을 한 번에 조립하면 수 초 freeze처럼 보일 수 있다. 사용자는 이 동안 화면이 바뀌지 않으므로 “작동 안 함”으로 인식한다.

### C. 도메인 전환도 inactive 하위탭 전체 렌더 때문에 지연됨

도메인 버튼 클릭 시 해당 도메인 안의 모든 하위탭 패널을 생성한다. 특히 작물 운영의 기록/작업 패널은 내용이 커서 active가 아니어도 렌더 비용이 크다.

### D. active 도메인 버튼 스크롤 보정 없음

버튼 row가 horizontal scroll인데 active button에 대한 `scrollIntoView` 또는 `scrollLeft` 보정이 없어, 선택한 버튼이 화면 밖에 남을 수 있다.

## 수정 계획

1. 모바일 설정 버튼을 전용 action으로 분리한다.
   - `data-r7-mobile-settings-action="open-settings-domain"` 추가.
   - `_bindR7MobileTopNavigationActions()` 추가.
   - 설정 버튼 클릭은 `_openR7SettingsDomainFromMobile()`로 직접 연결한다.
   - 이 함수는 active domain을 `settings-admin`, active settings subtab을 `greenhouse-zones`로 보정한다.

2. 도메인/설정 렌더링을 active panel only로 변경한다.
   - `renderR7ActiveOnlySubtabPanels(tabs, activeTab, renderer, attrs)` helper 추가.
   - active panel만 실제 HTML body를 생성한다.
   - inactive tab은 무거운 body 없이 lightweight placeholder/template marker만 남긴다.
   - 기존 계약 marker는 hidden compatibility template로 유지한다.

3. 모바일 도메인 active 버튼 우측 정렬을 추가한다.
   - active 도메인 버튼 우측 정렬을 명시적인 UX 계약으로 둔다.
   - render 후 `_scheduleR7MobileActiveDomainButtonScroll()` 호출.
   - 다음 frame에서 `[data-r7-mobile-domain-button][data-r7-sidebar-active="true"]`를 찾아 row의 우측 끝에 맞도록 `scrollLeft` 계산.
   - marker: `data-r7-mobile-active-domain-scroll-align="right-edge"`.

4. 검증
   - 설정 버튼이 `<button>`이고 전용 action marker가 있는지 계약 테스트.
   - settings button이 일반 hash link가 아닌지 재검증.
   - active-only subtab panel helper/markers 계약 테스트.
   - active domain button right-edge scroll scheduler 계약 테스트.
   - `node --check`, 집중 pytest, 전체 pytest.
   - Prod served smoke에서 v1.15.29, settings dedicated action, active-only panels, right-edge scroll markers 확인.

## 성공 기준

- 모바일 설정 버튼 클릭 시 브라우저 hash/HA route가 아니라 Green Smart 내부 state만 바뀐다.
- 설정 도메인 첫 진입 시 inactive 설정 패널 body를 생성하지 않는다.
- 도메인 버튼 전환 시 active 도메인 버튼이 모바일 row의 오른쪽 끝으로 자동 보정된다.
- 전체 테스트와 Prod served smoke가 통과한다.
