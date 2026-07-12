# v1.15.42 HA 기기 페이지 모달 미반영 — HACS 릴리스 기준 분석 계획

## 사용자 재확인

사용자는 HACS에서 해당 버전이 릴리즈되지 않았고, 우선 v1.15.38로 되어 있다고 지적했다.

## 확인 결과

### GitHub/HACS 기준

- GitHub Release `v1.15.38`: 존재
- GitHub Release `v1.15.42`: 없음, API 404
- GitHub remote tag `v1.15.42`: 없음
- `origin/main`: `bd3b15168` / `v1.15.38`

### 로컬 repo 기준

- 로컬 `main`: `104f828a7 Add HA devices page modal for device creation`
- 로컬 tag: `v1.15.42`
- 로컬 repo JS에는 `data-r7-settings-ha-devices-page-button` 존재
- 로컬 repo JS에는 새 HA devices iframe modal 코드 존재

### 운영/served 기준

- deploy host manifest: v1.15.38
- deploy host rebuild JS: v1.15.38
- container `/config` rebuild JS: v1.15.38
- actual served JS `/green_smart_panel/rebuild/green-smart-rebuild-panel.js?v=1.15.38`: v1.15.38
- served JS에는 `data-r7-settings-ha-devices-page-button` 없음
- served JS에는 기존 `data-r7-settings-device-create-button` 있음

## 결론

현재 사용자 화면에서 `장치 추가` 클릭 시 `장치 생성` 팝업이 뜨는 1차 원인은 **v1.15.42가 HACS/GitHub/운영 served 경로에 릴리스되지 않았기 때문**이다.

즉 현상은 다음 순서로 설명된다.

1. v1.15.42 구현은 로컬에만 존재한다.
2. GitHub push/release 생성이 인증 실패로 완료되지 않았다.
3. HACS는 GitHub Release/Tag 기준이므로 v1.15.38까지만 표시한다.
4. 운영 HA도 v1.15.38 JS를 서빙한다.
5. v1.15.38에는 `장치 추가` 카드가 기존 `data-r7-settings-device-create-button`을 사용한다.
6. 따라서 클릭 시 기존 `_openSettingsDeviceCreateModal()` 경로가 실행되어 `장치 생성` 모달이 뜬다.

## 남은 가능성

v1.15.42를 정상 릴리스한 뒤에도 다음 문제가 있을 수 있으므로 추가 검증이 필요하다.

### A. HA/WebView module cache

- HACS가 새 release를 받아도 앱/WebView가 이전 custom element를 유지할 수 있다.
- 대응: 새 버전 bump, `REBUILD_VERSIONED_ELEMENT_NAME` 변경, module URL query 변경 확인.

### B. Settings persistent DOM cache stale panel

- 새 JS가 로드돼도 브라우저 메모리에 이전 settings panel DOM이 남으면 old button marker가 남을 수 있다.
- 대응: `device-sensor-mapping` cached panel에서 old `data-r7-settings-device-create-button`가 발견되면 강제 real-card rehydrate.

### C. 이벤트 바인딩 중복

- 같은 카드에 old/new marker가 동시에 있으면 기존 handler가 실행될 수 있다.
- 대응: 장치 추가 카드 snippet에서 old marker가 없어야 하고, click 후 `data-r7-settings-ha-devices-page-open="true"`와 iframe modal만 존재해야 한다.

## 작업 계획

### 1. 릴리스 전략 결정

선택지는 2개다.

#### 권장: 새 버전 `v1.15.42` 릴리스

- 이미 v1.15.42는 로컬에서만 실패한 시도라 HACS 사용자 기준으로 혼란이 생겼다.
- v1.15.42으로 bump하면 WebView/HACS cache bust도 확실하다.
- GitHub push/release가 필요하다.

#### 비권장: v1.15.38 재사용/수정

- 기존 GitHub Release/Tag를 덮어쓰면 HACS cache 및 semver 신뢰성이 깨질 수 있다.
- 사용자는 여전히 같은 v1.15.38로 보게 되어 반영 여부를 구분하기 어렵다.

### 2. 인증 문제 해결

현재 서버 `GITHUB_TOKEN`은 GitHub API `/user`에서 401 Bad credentials.

따라서 원격 릴리스를 만들려면 다음 중 하나가 필요하다.

- 유효한 GitHub token 제공/환경 갱신
- 사용자가 직접 push/release 생성
- 서버의 git credential 수정

### 3. 코드 보강

- v1.15.42으로 version bump
- `device-sensor-mapping` 장치 추가 카드가 HA devices modal button만 사용하도록 유지
- settings cached panel stale old marker 감지 시 강제 rehydrate guard 추가

### 4. 검증

- focused pytest
- full pytest
- actual served JS marker 확인
- browser smoke:
  - `data-r7-settings-ha-devices-page-button` true
  - `data-r7-settings-device-create-button` false in device-create action card
  - click 후 `data-r7-settings-ha-devices-page-modal="true"`
  - iframe `src="/config/devices/dashboard"`
  - `장치 생성` modal false

### 5. 운영/HACS 반영

- GitHub tag/release publish
- HACS에서 새 버전 확인
- HA 업데이트 후 served JS가 새 버전인지 확인
