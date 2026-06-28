# Green Smart Frontend Decomposition Plan

> 기준 버전: `v1.11.6`
> 리빌딩 단계: `R2 — Frontend decomposition plan`
> 목적: `green-smart-panel.js` 10,007줄 단일 Web Component를 즉시 쪼개지 않고, Home Assistant panel loading과 기존 custom element 호환을 지키는 module boundary, adapter 전략, 이관 순서를 먼저 고정한다.

---

## 1. R2 Non-goals

R2는 구현 분해 단계가 아니다.

| 항목 | R2 결정 |
|---|---|
| 대규모 JS 파일 분리 | 금지 |
| Home Assistant panel registration 변경 | 금지 |
| custom element 이름 변경 | 금지 |
| 페이지 UX/기능 변경 | 금지 |
| API route 변경 | 금지 |
| prod stack 변경 | 금지 |
| 목표 산출물 | 문서 + 계약 테스트 + 버전 릴리즈 |

---

## 2. 현재 Frontend runtime baseline

| 항목 | 현재 기준 |
|---|---|
| UI runtime | Home Assistant custom sidebar panel |
| 구현 방식 | Vanilla JS Web Component |
| public custom element | `green-smart-panel` |
| shell file | `custom_components/green_smart/panel/green-smart-panel.js` |
| HA static URL | `/green_smart_panel` |
| HA module URL | `/green_smart_panel/green-smart-panel.js?v={manifest.version}` |
| panel registration | `frontend_panel.py::_register_panel()` |
| static path registration | `frontend_panel.py::_register_static_path()` |
| cache busting | `manifest.json` version query string |

R2 이후에도 `green-smart-panel.js`는 public entrypoint이며, HA가 직접 로딩하는 파일이다. 신규 module은 이 파일에서만 import한다.

---

## 3. 목표 파일 구조

최종 목표 구조는 아래와 같다.

```text
custom_components/green_smart/panel/
  green-smart-panel.js                  # public compatibility shell, customElements.define 유지

  core/
    state-store.js                      # localStorage/session state, dirty-state helpers
    api-client.js                       # hass.callApi wrapper, endpoint grouping, error normalization
    render-shell.js                     # sidebar, mobile nav, common page shell, permission hints
    permissions.js                      # role/permission constants and helpers
    formatters.js                       # display formatting, safe HTML, labels

  domains/
    home/home-page.js                   # home dashboard read-only/status/safety summaries
    crop/crop-page.js                   # crop page orchestrator
    crop/crop-read-model.js             # crop read-only selectors/summary helpers
    environment/environment-page.js     # environment page orchestrator
    irrigation/irrigation-page.js       # irrigation page orchestrator
    device/device-page.js               # device page orchestrator
    admin/admin-page.js                 # Admin/System page orchestrator

  components/
    cards/*.js                          # pure card renderers
    modals/*.js                         # modal renderers and bind helpers
    tabs/*.js                           # tab bar and tab content helpers
```

명시적 module path 목록:

```text
core/state-store.js
core/api-client.js
core/render-shell.js
core/permissions.js
core/formatters.js
domains/home/home-page.js
domains/crop/crop-page.js
domains/environment/environment-page.js
domains/irrigation/irrigation-page.js
domains/device/device-page.js
domains/admin/admin-page.js
components/cards/*.js
components/modals/*.js
components/tabs/*.js
```

---

## 4. Compatibility shell contract

`green-smart-panel.js`는 분해 후에도 아래 책임을 유지한다.

1. `customElements.define("green-smart-panel", GreenSmartPanel)` 유지.
2. `class GreenSmartPanel extends HTMLElement` 유지 또는 equivalent default shell 유지.
3. HA lifecycle entrypoint 유지:
   - `set hass(hass)`
   - `connectedCallback()`
   - `_update()`
4. 기존 public state property 이름은 첫 분해 slice에서 유지.
5. 기존 DOM marker/data attribute는 제거하지 않는다.
6. 신규 module import 실패 시 panel 전체가 blank가 되지 않도록 첫 단계에서는 shell fallback을 유지한다.
7. `VERSION`과 manifest version을 함께 올려 cache busting을 유지한다.

---

## 5. Module loading strategy

HA는 현재 `green-smart-panel.js?v={manifest.version}` 하나를 module로 로딩한다. 따라서 분해는 아래 방식으로 진행한다.

```js
// green-smart-panel.js
import { createApiClient } from "./core/api-client.js";
import { renderShell } from "./core/render-shell.js";
```

R2 기준 규칙:

| 규칙 | 설명 |
|---|---|
| relative import only | `/green_smart_panel/...` absolute import를 직접 쓰지 않고 `./core/...` 형태 사용 |
| no build step | bundler/transpiler 없이 브라우저 native ES modules만 사용 |
| browser-compatible syntax | HA WebView 호환을 위해 TS/JSX/Node-only API 금지 |
| side-effect 최소화 | module top-level에서는 custom element 등록/DOM 접근 금지 |
| shell owns lifecycle | lifecycle, error boundary, customElements.define은 shell 책임 |
| cache busting | imported module cache 문제는 manifest version bump + 파일명 안정성으로 관리 |

---

## 6. Domain boundary

| Domain | 책임 | 금지 |
|---|---|---|
| `core` | 공통 상태, API wrapper, shell/nav, permission, formatting | crop/environment 등 domain 업무 로직 직접 보유 금지 |
| `home` | 상태 요약, 알림, 오늘 할 일, read-only safety summary | 실제 실행 버튼 직접 추가 금지 |
| `crop` | 작기/생육/병해충/방제/작물 AI page orchestration | environment/irrigation/device 실행 로직 보유 금지 |
| `environment` | 환경 상태/전략/Dry Run/SafetyGuard | irrigation/device 설정 직접 보유 금지 |
| `irrigation` | 관수 상태/전략/Dry Run/SafetyGuard | environment/device 설정 직접 보유 금지 |
| `device` | 장치 상태/허용 수동 조작/알람/Fail Safe summary | Admin/System secret/config 직접 보유 금지 |
| `admin` | RBAC, HA entity mapping, API/Central/weather/pesticide config, diagnostics | farm_staff 기본 UX에 노출되는 운영 카드 보유 금지 |
| `components` | pure render helpers | hass.callApi 직접 호출 금지 |

---

## 7. API adapter strategy

현재 `green-smart-panel.js`는 여러 위치에서 `this._hass.callApi(...)`를 직접 호출한다. R2 이후 목표는 `core/api-client.js`가 domain client를 제공하는 것이다.

```js
const api = createApiClient(this._hass);
await api.crop.listSeasons();
await api.zone.executeFinalTargets(payload);
await api.admin.getCurrentUser();
```

R2 규칙:

1. route path는 절대 변경하지 않는다.
2. adapter는 `hass.callApi(method, path, payload)`만 감싼다.
3. response shape를 임의 변경하지 않는다.
4. error는 `{ message, status, path, method }` 형태로 normalize하되 기존 UI 문구를 깨지 않는다.
5. 첫 구현 slice는 wrapper 추가만 하고 호출부 전면 교체를 하지 않는다.

---

## 8. First extraction decision

첫 실제 이관 slice는 **Crop이 아니다**.

| 후보 | 결정 | 이유 |
|---|---|---|
| Crop 전체 | 보류 | 현재 가장 크고 기록/write/modal/AI/Center 연동이 섞여 위험 높음 |
| Environment/Irrigation execution | 보류 | Safety/Interlock/실행과 연결되어 위험 중~높음 |
| API client adapter | RB-002 후보 | 비교적 작지만 전역 영향. test-first 필요 |
| Admin/System shell | **RB-001 우선** | system_settings 권한으로 제한되어 있고 운영 기록/write core와 분리하기 쉬움 |
| 작은 read-only card | 보조 후보 | Home/status 요약 등 실제 실행 없는 카드만 가능 |

R2 기준 첫 slice는 다음과 같이 확정한다.

```text
RB-001 Admin/System shell 분리
```

RB-001은 실제 기술 설정을 새로 추가하지 않는다. 현재 Admin/System render boundary를 module로 빼낼 준비와 marker contract를 먼저 만든다.

### RB-001 completion note

`v1.11.6`에서 Admin/System render boundary extracted 상태가 되었다.

```text
custom_components/green_smart/panel/domains/admin/admin-page.js
```

완료 범위:

- `domains/admin/admin-page.js`가 Admin/System tab/page render helper를 export한다.
- `green-smart-panel.js`는 public compatibility shell과 lifecycle/binding/storage 책임을 유지한다.
- 기존 `data-admin-*`, `data-ui-section`, `data-required-permission`, `data-role-visibility`, `data-common-main-page="admin-system"` marker를 유지한다.
- API route/DB/prod 변경 없음.
- Crop/environment/irrigation/device extraction remains deferred.

### RB-002 completion note

`v1.11.6`에서 Panel API client adapter baseline이 추가되었다.

```text
custom_components/green_smart/panel/core/api-client.js
```

완료 범위:

- `core/api-client.js`가 `createApiClient(hass)`를 export한다.
- Adapter-first targeted call sites only: `auth/me`, crop read-only seasons/detail/growth-report, weather modal read-only current/forecast/config/weekly 호출만 우선 감싼다.
- route path 변경 없음.
- response shape 변경 없음.
- full call-site rewrite deferred.
- `green-smart-panel.js` public shell, HA panel registration, custom element 이름은 유지한다.

---

## 9. Execution slices after R2

| Slice | 목적 | 허용 파일 | 금지 |
|---|---|---|---|
| RB-001 | Admin/System shell 분리 | `panel/core/*`, `panel/domains/admin/*`, `green-smart-panel.js`, tests/docs | API route/DB/prod 변경 |
| RB-002 Panel API client adapter | `hass.callApi` 직접 호출을 `core/api-client.js` domain client로 감싸기 | `panel/core/api-client.js`, targeted call sites | response shape 변경 |
| RB-003 | Crop read-only component extraction | crop read-only render helpers | crop write modal/save/delete 변경 |
| RB-004 | Crop write modal extraction | crop modal components | DB/API migration |
| RB-005 | Safety/Execution UI proximity | safety cards around execution buttons | actual execution semantics 변경 |
| RB-006 | Shared card/modal components | `components/cards`, `components/modals` | domain API 호출 |

---

## 10. Testing strategy

R2 계약은 구현 분해 전 아래를 고정한다.

1. HA module URL이 여전히 `green-smart-panel.js?v={manifest.version}`를 사용한다.
2. `green-smart-panel.js`가 `customElements.define("green-smart-panel", ...)`를 유지한다.
3. 목표 module paths가 문서에 명시되어 있다.
4. `components/*`는 pure renderer여야 하며 `hass.callApi` 직접 호출 금지 규칙이 문서화되어 있다.
5. 첫 extraction이 `RB-001 Admin/System shell 분리`로 고정되어 있다.
6. Crop/environment/irrigation/device high-risk extraction은 뒤로 미룬다.

실제 extraction slice부터는 아래 검증을 추가한다.

```bash
node --check custom_components/green_smart/panel/green-smart-panel.js
find custom_components/green_smart/panel -name '*.js' -print0 | xargs -0 -n1 node --check
pytest -q tests/test_frontend_decomposition_contract.py
pytest -q
```

---

## 11. Abort rules

즉시 중단하고 재계획해야 하는 경우:

1. HA WebView에서 native module import가 실패하는 경우.
2. `green-smart-panel` custom element가 등록되지 않는 경우.
3. panel blank screen 또는 sidebar panel 로딩 실패가 발생하는 경우.
4. imported module cache가 version bump 후에도 갱신되지 않는 경우.
5. RBAC/Safety marker가 누락되는 경우.
6. 실제 장비 실행 버튼 semantics가 변경되는 경우.

---

## 12. R2 완료 기준

- [x] HA panel loading baseline 문서화
- [x] target frontend module structure 문서화
- [x] compatibility shell contract 문서화
- [x] module loading strategy 문서화
- [x] domain boundary 문서화
- [x] API adapter strategy 문서화
- [x] first extraction slice를 RB-001 Admin/System shell로 확정
- [x] R2 contract test로 회귀 방어
