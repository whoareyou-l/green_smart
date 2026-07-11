# v1.15.29 Green Smart 사이드바 계정/로그아웃/모바일 네비게이션 계획

## 사용자 요구

1. Green Smart 사이드바 하단 로그아웃 버튼은 HA 메인 이동이 아니라 Home Assistant 로그아웃과 동일하게 동작한다.
2. 사이드바 하단 사용자 영역은 로그아웃과 분리하고, 누르면 사용자 정보 변경 도메인 페이지로 이동한다.
3. PC 간략화 상태에서 로고를 누르는 토글을 제거하고, 로고 오른쪽 바깥에 별도 사이드바 토글 버튼을 둔다. 간략화 하단에서도 사용자 버튼 옆에 별도 로그아웃 버튼을 둔다.
4. 모바일에서는 좌측 사이드바가 아니라 최상단 2줄 네비게이션으로 표시한다.
   - 1줄: 로고, 설정, 계정
   - 2줄: 도메인 페이지 버튼들
   - 도메인 버튼 줄은 좌우 스크롤 가능
   - 느낌은 PC 간략화와 유사한 아이콘 중심 구성

## 기존 문제

- 사용자 정보와 로그아웃이 `data-r7-sidebar-user-exit` 하나의 `<a>`로 묶여 있다.
- compact/reference slim rail에서 로고 자체가 `data-r7-sidebar-collapse-toggle` 버튼이다.
- 로그아웃은 `/auth/logout` href 이동만 하므로 Green Smart 이탈처럼 보일 수 있다.
- 모바일 전용 Green Smart top navigation이 없다.

## 구현 원칙

### 계정 영역

- `data-r7-sidebar-user-profile-button`을 별도 버튼으로 둔다.
- 클릭 시 `settings-admin` 도메인으로 이동하고 `users-permissions` subtab을 선택한다.
- `data-r7-profile-settings-route="settings-admin/users-permissions"` 마커를 둔다.

### 로그아웃

- `data-r7-sidebar-logout-button` 별도 버튼/링크를 둔다.
- `_performR7HaLogout()`에서 HA auth/session 관련 localStorage/sessionStorage key를 가능한 범위에서 정리하고 `/auth/logout`으로 이동한다.
- 링크 기본 href도 `/auth/logout`로 유지해서 JS 실패 시에도 HA logout route로 간다.

### 토글

- 로고 요소에는 `data-r7-sidebar-logo-static="true"`만 둔다.
- 토글은 `data-r7-sidebar-external-toggle="true"` 별도 버튼이다.
- PC expanded/collapsed 모두 로고 오른쪽에 붙는다.

### 모바일

- `data-r7-mobile-top-nav="two-row"` 별도 nav를 렌더링한다.
- CSS media query:
  - PC: mobile top nav hidden
  - 모바일: PC aside hidden, root grid one-column, mobile top nav visible/sticky
- 두 번째 줄 도메인 버튼 row는 `overflow-x:auto`와 `grid-auto-flow:column`으로 좌우 스크롤 가능하게 한다.

## 검증

- source contract: 새 마커/핸들러 존재, 기존 사용자+로그아웃 결합 마커 제거.
- render contract: PC expanded/collapsed에서 사용자 버튼과 로그아웃 버튼이 분리됨.
- click contract: 사용자 버튼은 settings-admin/users-permissions로 이동.
- click contract: logout 버튼은 `_performR7HaLogout` 호출 경로와 `/auth/logout` fallback을 가진다.
- mobile contract: top nav 2줄, settings/account, scrollable domain row, PC aside mobile hide CSS 존재.
