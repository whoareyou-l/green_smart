# v1.15.12 모바일/로그아웃/반응형 보정 계획

## 배경
v1.15.12에서 HA sidebar-aware root와 모바일 top nav를 적용했지만 실제 사용 피드백에서 다음 문제가 남았다.

1. PC 사이드바 간략/상세/로그아웃 버튼 모양이 원하는 형태와 다름.
2. 로그아웃이 `/auth/authorize` 직접 이동으로 Invalid redirect URI를 유발.
3. 모바일 사용자 영역이 버튼처럼 보이고, 로그아웃이 외부 링크처럼 동작하며, 도메인 버튼 UI가 하위탭과 다름.
4. 모바일에서 도메인 카드/내용이 화면 밖으로 넘치며 하위탭·현재 선택 구역을 좌우 스크롤해야 함.

## 범위
- HA 로그아웃은 URL 직접 이동이 아니라 Home Assistant frontend와 동일하게 `hass-logout` 이벤트를 dispatch한다.
- 이벤트를 처리하지 못하는 독립 실행/테스트 환경 fallback은 auth storage를 정리한 뒤 `/`로 이동한다. `/auth/authorize`는 직접 fallback으로 사용하지 않는다.
- 모바일 사용자 영역은 버튼 tile이 아닌 텍스트/프로필 정보 영역으로 렌더한다.
  - 1줄: 사용자명
  - 2줄: 역할
- 모바일 로그아웃은 anchor가 아니라 `button type="button"`으로 렌더하고 같은 `_performR7HaLogout()`을 호출한다.
- 모바일 도메인 버튼은 하위탭과 동일한 top-navbar tab grammar를 사용한다.
- 모바일 카드/그리드/zone selector/subtab은 `min-width:0`, `max-width:100%`, `overflow-x:auto`, 단일 컬럼/가로 스크롤 정책으로 보정한다.

## 보류/추가 입력 필요
- PC 사이드바의 간략/상세/로그아웃 버튼의 정확한 모양은 샘플 이미지가 필요하다. 이번 릴리스에서는 기능/위치/안전성을 유지하며 과한 스타일 변경은 하지 않는다.

## 검증
- 신규 R7-136 계약: logout event, fallback `/`, no `/auth/authorize`, mobile account text, mobile logout button, mobile tab grammar, responsive card/zone scroll markers.
- 기존 R7-134/R7-135 계약을 v1.15.12 기준으로 갱신.
- node --check, 집중 pytest, 전체 pytest.
- Prod served smoke: version, no invalid redirect route, event logout markers, mobile responsive markers.
