# v1.15.41 모바일 2단계 패널 hydrate 계획

## 남은 증상

- v1.15.41에서도 설정 하위탭 이동/설명·도메인 페이지 이동 시 이전 화면에서 멈춘 것처럼 보인다.
- 설정 도메인 최초 진입은 가능하지만, 큰 하위탭을 누르면 전환 프레임 자체가 막힌다.

## 재분석

v1.15.41는 모바일 fast mode에서 inactive panel 렌더는 막았지만, active panel body는 클릭 이벤트와 같은 렌더 사이클에서 즉시 만든다.

Node 환경에서는 빠르게 보이지만, 실제 모바일 HA WebView에서는 큰 HTML 삽입과 CSS layout/reflow가 클릭 프레임을 막을 수 있다. 즉 문제는 JS 문자열 생성 시간만이 아니라 **DOM 삽입/레이아웃 비용**이다.

## 수정 방침

1. 모바일 도메인/하위탭 클릭 시 `_requestR7MobilePanelHydration(domain, tab)`을 호출한다.
2. 첫 render에서는 active panel body 대신 lightweight placeholder만 렌더한다.
   - marker: `data-r7-mobile-panel-hydration="pending"`
   - marker: `data-r7-mobile-panel-placeholder="true"`
3. `requestAnimationFrame` + `setTimeout` 후 hydration pending을 해제하고 한 번 더 render한다.
4. 두 번째 render에서 기존 active panel body를 삽입한다.
5. 데스크톱/일반 render 계약은 유지한다.

## 성공 기준

- 클릭 즉시 active 도메인/하위탭 shell이 먼저 바뀐다.
- 이전 화면에서 긴 시간 멈추는 현상을 피한다.
- heavy panel DOM 삽입은 사용자에게 전환 상태가 보인 뒤 수행된다.
- 전체 테스트/Prod served smoke/GitHub Release까지 완료한다.
