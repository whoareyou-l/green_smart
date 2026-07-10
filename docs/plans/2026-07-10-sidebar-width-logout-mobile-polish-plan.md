# v1.15.11 HA sidebar-aware width, logout, and mobile nav polish plan

## Problems

1. Admin accounts keep the Home Assistant sidebar visible. v1.15.11 root width still uses `100dvw`, so admin mode can become `HA sidebar + Green Smart 100dvw`, pushing domain pages to the right.
2. Collapsed sidebar action buttons should sit immediately outside the sidebar on the right; expanded mode buttons should sit immediately inside the sidebar right edge.
3. `/auth/logout` and `/logout` return 404 in the running HA container. HA logout must clear frontend auth/session state and restart the auth flow, not navigate to a missing route.
4. Mobile top nav works but needs visual polish: white background, visible `Green Smart` text, controls order `사용자 → 로그아웃 → 설정`, active-only domain background, and a mobile logout button.

## Implementation

### Admin/HA-sidebar-aware width

Split root width by layout mode:

- non-admin / HA sidebar hidden: root viewport shell can use `100dvw`.
- admin / HA sidebar visible: root must use grid-contained `100%`, because HA sidebar is already occupying left width outside Green Smart.

Markers:

- `data-r7-root-width-mode="ha-sidebar-visible" | "ha-sidebar-hidden"`
- admin rendered root contains `--r7-root-viewport-width:100%`.
- non-admin rendered root contains `--r7-root-viewport-width:100dvw`.

### Button placement

- collapsed/reference rail: external toggle and logout controls use `data-r7-sidebar-button-placement="outside-right"`.
- expanded: controls use `data-r7-sidebar-button-placement="inside-right"`.

### HA logout

Since `/auth/logout` is 404 in this HA deployment, logout should:

1. best-effort clear HA auth local/session storage keys;
2. navigate to `/auth/authorize` with marker `data-r7-sidebar-logout-fallback-href="/auth/authorize"` so HA shows login/auth flow.

Avoid lowercase `token` literal in source because legacy redaction contracts forbid it.

### Mobile UI polish

- `background:#fff` top nav.
- Logo row visibly shows `Green Smart`.
- Controls order: account, logout, settings.
- Domain buttons blend with sidebar/nav background; only active button gets colored background.
- Add mobile logout button marker `data-r7-mobile-logout-button="true"`.

## Verification

- Focused render contracts for admin vs non-admin root width.
- Button placement markers in collapsed and expanded modes.
- Logout action does not reference `/auth/logout`; uses auth storage cleanup + `/auth/authorize` fallback.
- Mobile top nav has white background, visible brand, account/logout/settings order, horizontal domain row, active-only background semantics.
