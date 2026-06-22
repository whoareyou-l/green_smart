# Green Smart UI/RBAC Reorganization Implementation Plan

> **For Hermes:** Use `writing-plans`, `test-driven-development`, and `systematic-debugging` skills before implementation. Implement only after ambiguity is below 10% for the current slice.

**Goal:** Reorganize Green Smart UI around farm workflows and RBAC roles so non-technical farm owners and staff can use it intuitively while admin/system features remain separated and safe.

**Architecture:** Keep the current Home Assistant `panel_custom` + Vanilla JS Web Component runtime. First create explicit UI section taxonomy and role capability contracts, then refactor rendering/binding into smaller modules without changing external behavior. Backend RBAC enforcement is added after frontend role visibility contracts and user/role identity contract are confirmed.

**Tech Stack:** Home Assistant custom integration, Vanilla JavaScript Web Component, Python `HomeAssistantView`, MariaDB via `aiomysql`, pytest contract tests, `node --check`.

---

## 0. Must-read 기준 문서

작업자는 구현 전 반드시 아래 문서를 읽는다.

1. `docs/PROJECT_MASTER_PLAN.md`
2. `docs/design/ui-information-architecture-and-rbac.md`
3. `docs/design/current-ui-design-and-navigation.md`
4. `docs/design/current-backend-api-db-ha-contract.md`
5. `docs/design/zone-control-roadmap-and-data-model.md`

---

## 1. Ambiguity Gate — 모호성 10% 이하 원칙

이 작업은 사용자 경험과 권한 체계 기준을 바꾸는 작업이다. 기준이 흔들린 상태에서 코드부터 고치면 다시 뒤죽박죽이 된다. 따라서 각 slice는 아래 질문의 답이 90% 이상 확정됐을 때만 구현한다.

### 1.1 매 slice 공통 질문

```text
1. 이 기능/카드는 누구를 위한 것인가? admin, farm_owner, farm_staff 중 누구인가?
2. 이 요소는 조회/기록/전략/승인/실행/안전/고급설정 중 어디에 속하는가?
3. 농장주나 농장직원이 이 문구를 보고 바로 행동할 수 있는가?
4. 권한이 없거나 안전상 실행 불가할 때 숨길 것인가, 비활성+이유 표시할 것인가?
5. backend에서도 같은 권한을 검증해야 하는가?
6. 이 기능은 현재 페이지에 있어야 하는가, Admin/System 또는 별도 작업/알림 페이지로 이동해야 하는가?
7. 이 변경이 실제 장비 연결 gate에 영향을 주는가?
```

### 1.2 질문이 필요한 모호한 부분

아래는 구현 전에 사용자와 하나씩 확인한 결정 상태다.

| 항목 | 상태 | 확정/남은 질문 |
|---|---:|---|
| 기본 역할 | 확정 | `admin`, `farm_owner`, `farm_staff` 3개 역할로 확정 |
| 농장직원 수동제어 | 확정 | `farm_staff`는 농장주가 허용한 장치별 범위 안에서만 수동 조작 가능 |
| 농장주 SafetyGuard 이벤트 처리 | 확정 | SafetyGuard/인터록 상태 이벤트 확인·조치 처리는 `admin`만 가능 |
| 농장주 SafetyGuard 임계값 | 확정 | `farm_owner`는 기본 임계값을 확인 팝업/위험 안내/변경 이력 조건으로 수정 가능 |
| 농장주 고급 rule builder | 확정 | 고급 rule builder는 `admin`만 수정 가능 |
| 농장주 Fail Safe/safe_state | 확정 | Fail Safe/safe_state 설정은 `admin`만 수정 가능 |
| Admin/System 위치 | 확정 | `admin`에게만 보이는 sidebar 별도 메뉴로 추가 |
| Admin 계정 출처 | 확정 | Home Assistant 사용자와 Green Smart 역할을 매핑한다 |
| 알림/작업 페이지 | 남음 | 별도 sidebar page로 만들지, 홈 첫 카드로 유지할지 후속 slice에서 질문 |
| crop season 삭제 | 남음 | 농장직원이 삭제/철거 요청을 만들 수 있는지 후속 crop slice에서 질문 |
| 실제 실행 승인 | 남음 | 농장주와 admin의 실제 실행 범위를 domain별로 나눌지 후속 execution slice에서 질문 |

**Rule:** 남은 질문 중 현재 slice와 직접 관련된 질문이 있으면 구현하지 않고 사용자에게 한 번에 하나씩 질문한다.

---

## 2. 현재 섞여 있는 요소와 정리 방향

### 2.1 홈에 섞이면 안 되는 요소

| 현재/발생 가능한 요소 | 문제 | 정리 방향 |
|---|---|---|
| entity_id 목록 | 비전공자에게 의미 없음 | Admin/System 또는 Entity Mapping 고급 카드로 이동 |
| DB/API/HA 진단 | 운영자 홈에서 불필요 | Admin/System 진단 페이지로 이동 |
| PID/센서 보정값 | 직원/농장주가 실수하면 위험 | Admin 전용 고급 설정으로 이동 |
| raw JSON/settings | UI 신뢰도 저하 | 숨김/개발자 모드/Admin 전용 |
| 개발/계약 marker | 실제 사용자에게 노이즈 | hidden contract marker 유지, live selector와 분리 |

### 2.2 제어 페이지에 섞인 요소

| 요소 | 현재 문제 | 정리 방향 |
|---|---|---|
| 운영 상태 요약과 고급 rule builder가 같은 흐름에 노출 | 농장직원이 이해하기 어려움 | 상단은 요약/실행, 하단은 고급 접힘 또는 admin 전용 |
| Entity Mapping이 실행 카드 근처에 노출 | 농장주/직원이 entity_id를 건드릴 위험 | Admin/System 또는 고급 설정으로 이동 |
| SafetyGuard 상세 ruleResults가 모든 사용자에게 노출 | 정보 과다 | staff는 요약, owner는 이유와 조치, admin은 상세 |
| Dry Run/실제 실행/운영자 확인이 분산 | 위험 실행 UX가 불명확 | 하나의 “실행 전 확인” 영역으로 묶음 |
| 전략 preview와 최종 적용값 의미가 혼재 | AI 추천/실행 목표 구분 어려움 | “추천”, “실행할 목표”, “실행 전 확인” 3단계로 표시 |

### 2.3 설정 페이지에 섞인 요소

| 요소 | 문제 | 정리 방향 |
|---|---|---|
| PLC/Modbus/virtual mode | admin 외 사용자가 이해 어려움 | Admin/System > 연결 설정 |
| KMA/PSIS API key | secret 성격 | Admin 전용, masking 유지 |
| Central activation/token | 보안/설치 영역 | Admin 전용 |
| Weather location | 농장주도 이해 가능 | 농장주에게 조회/요청 또는 제한 수정 허용 가능 |
| 사용자/권한 | 현재 명시 UI 없음 | Admin/System > 사용자/권한 신설 |

---

## 3. 새 기준으로 업데이트할 기능 묶음

### 3.1 UI taxonomy 추가

목표: 모든 UI 카드/버튼/입력에 의미 태그를 부여한다.

권장 taxonomy:

```text
view       조회/상태
record     기록 입력
strategy   전략/추천/목표 설정
approval   승인/운영자 확인
execute    실행/Dry Run/수동제어
safety     SafetyGuard/Interlock/Fail Safe
admin      시스템/연동/entity/API/DB/권한
diagnostics 진단/로그/개발자 정보
```

예상 구현:

- data attributes 추가
  - `data-ui-section="view|record|strategy|approval|execute|safety|admin|diagnostics"`
  - `data-required-permission="..."`
  - `data-role-visibility="admin,farm_owner"`
- frontend helper 추가
  - `_currentUserRole()`
  - `_hasPermission(permission)`
  - `_roleVisibilityState(permission, context)`
  - `_renderPermissionHint(reason)`

### 3.2 페이지 재배치

#### Home

업데이트:

- 위험/주의 알림 Hero 추가 또는 상단 재배치
- 오늘 할 일 카드 추가
- 환경/관수/장치 요약 카드 단순화
- 기술 진단/고급 값 제거

#### Crop

업데이트:

- 기록 중심으로 유지
- 작기 삭제/철거는 role별 확인/권한 적용
- farm_staff에게는 “기록 추가”를 중심으로 표시

#### Environment

업데이트:

- 상단: 현재 상태/목표 차이/SafetyGuard/Dry Run 가능 여부
- 중단: 추천 전략 → 실행할 목표 → 실행 전 확인
- 하단: 고급 설정 접힘/Admin 전용

#### Irrigation

업데이트:

- 상단: 오늘 관수 상태, VWC/EC/pH, 다음 예상, 긴급 차단 여부
- 중단: 관수 추천/최종 목표/Dry Run/실행 확인
- 하단: 포수/일사/드라이백/양액/PID/entity 등 권한별 정리

#### Device

업데이트:

- 상단: 장치 이상/허용 수동 조작/알람
- 중단: 장치 현황/수동 제어/자동 상태/이력
- 하단: 환기/스크린/그룹/인터록/Fail Safe 고급 설정

#### Admin/System

신설 또는 settings 확장:

- 연결 설정
- 사용자/권한
- HA entity mapping
- API key/Central
- 진단/백업

### 3.3 RBAC 기능 업데이트

1. Frontend-only role simulation baseline
   - 우선 backend auth가 확정되기 전까지 local/mock role로 UI contract를 검증
   - default는 `admin` 또는 HA admin 감지 가능 시 admin
2. Backend `/auth/me` contract
   - HA user와 Green Smart role 매핑 설계
3. Permission helper
   - write/execute API에 backend permission gate 적용
4. Audit log role 연결
   - `actor_role`에 RBAC role 기록
5. Role management page
   - admin only

---

## 4. 모듈화/분리 계획

현재 `green-smart-panel.js`는 매우 크고 여러 domain UI가 한 파일에 섞여 있다. 한 번에 쪼개면 위험하므로 contract test를 먼저 만든 뒤 단계적으로 나눈다.

### 4.1 우선 모듈화 대상

| 모듈 후보 | 현재 내용 | 분리 이유 |
|---|---|---|
| `panel/core` | shell/update/sidebar/common helpers | 페이지와 공통 runtime 분리 |
| `panel/rbac` | role/permission/visibility helper | 모든 페이지에서 공통 사용 |
| `panel/home` | dashboard cards | 첫 화면 단순화 |
| `panel/crop` | crop season/growth/pest/control UI | 기록 업무 독립 |
| `panel/control-common` | scope bar, mode, interlock, entity summary, logs | 환경/관수/장치 중복 감소 |
| `panel/environment` | 환경 전략 상세 | domain 분리 |
| `panel/irrigation` | 관수 전략 상세 | domain 분리 |
| `panel/device` | 장치 상태/수동/설정 | domain 분리 |
| `panel/admin` | settings, integration, entity mapping, users/roles | 고급 설정 격리 |

### 4.2 단계적 모듈화 원칙

1. 먼저 파일을 나누지 않고 함수/section marker/contract를 정리한다.
2. contract test로 렌더 함수/selector/data attribute를 고정한다.
3. 이후 ES module import가 HA panel static path에서 정상 작동하는지 spike한다.
4. module split은 한 domain씩 진행한다.
5. 각 split 후 `node --check`, HA check_config, prod smoke를 수행한다.

### 4.3 모듈 split 전 질문

- HA panel static asset에서 multi-file ES module import를 사용할 것인가?
- HACS 배포에서 여러 JS 파일 cache busting을 어떻게 할 것인가?
- 우선은 단일 JS 내부 구조화만 할 것인가?

이 질문이 확정되기 전에는 물리적 JS 파일 분리는 하지 않는다.

---

## 5. 구현 Phases

## Phase U0 — UX/RBAC contract inventory

**목표:** 현재 UI 요소를 taxonomy와 RBAC 기준으로 태깅하고 어떤 요소가 어디로 이동해야 하는지 확정한다.

**Files:**

- Modify: `docs/design/ui-information-architecture-and-rbac.md`
- Create: `docs/plans/2026-06-22-ui-rbac-element-inventory.md`
- Test: `tests/test_zone_control_api_contract.py` 또는 신규 `tests/test_panel_ui_contract.py`

**Tasks:**

1. 각 page/card/button/input을 inventory 표로 정리한다.
2. 각 요소에 `ui_section`, `required_permission`, `visibility_state`, `target_page`를 부여한다.
3. 불필요/중복/고급 요소를 `remove`, `move`, `collapse`, `admin_only`, `merge`, `split`로 분류한다.
4. 사용자에게 모호한 항목을 질문한다.
5. 모호성이 10% 이하가 되면 Phase U1로 진행한다.

**Acceptance:**

- 모든 주요 카드가 taxonomy로 분류됨
- user confirmation 필요한 항목 목록이 있음
- contract test에 주요 role/permission marker가 추가됨

---

## Phase U1 — UI section and permission helper baseline

**목표:** 실제 UI 변경 전, role/permission을 표현하는 frontend helper와 표시 상태를 만든다.

**Files:**

- Modify: `custom_components/green_smart/panel/green-smart-panel.js`
- Modify: `tests/test_zone_control_api_contract.py` 또는 `tests/test_panel_ui_contract.py`

**Implementation:**

- Add constants:

```js
const GREEN_SMART_ROLES = ["admin", "farm_owner", "farm_staff"];
const GREEN_SMART_PERMISSIONS = { ... };
```

- Add helpers:

```js
_currentUserRole()
_permissionsForRole(role)
_hasPermission(permission)
_visibilityForPermission(permission, { allowSummary = false } = {})
_renderPermissionHint(reason)
```

- Initial role source:
  - Final direction is Home Assistant user → Green Smart role mapping.
  - Phase U1 must call/prepare `/api/green_smart/auth/me` contract rather than relying on a long-lived mock/local role.
  - Temporary dev fallback may exist only when auth API is unavailable in tests, and must default to least-surprising safe behavior documented in tests.

**Acceptance:**

- Role helpers exist
- Permission matrix contract matches docs
- No page behavior changes yet except optional hidden dev preview

**Decision:**

- Runtime role source is Home Assistant user → Green Smart role mapping.
- If `/api/green_smart/auth/me` is not available during a transitional test, the fallback must be explicit and covered by contract tests; it must not become the production RBAC source.

---

## Phase U2 — Home page operator-first redesign

**목표:** 홈을 “오늘 농장을 운영하는 화면”으로 정리한다.

**Files:**

- Modify: `green-smart-panel.js`
- Modify: `docs/design/current-ui-design-and-navigation.md`
- Test: panel UI contract test

**Updates:**

- Add/reorder cards:
  1. 위험/주의 알림 Hero
  2. 오늘 할 일
  3. 환경/관수/장치 요약
  4. 날씨/외부 조건
  5. 최근 실행/차단 로그 요약
  6. AI/자동제어 요약
- Move/hide diagnostics from home.
- farm_staff gets task/action language.

**Remove/move:**

- DB/API/HA diagnostics → Admin/System
- raw entity details → Admin/System

**Acceptance:**

- farm_staff home has no entity_id/PID/raw JSON
- 위험 알림과 오늘 할 일이 첫 화면 상단에 있음
- mobile view remains readable

---

## Phase U3 — Control pages layout cleanup

**목표:** 환경/관수/장치제어의 공통 카드 순서를 “상태 → 추천/목표 → 실행 전 확인 → 로그 → 고급설정” 흐름으로 정리한다.

**Files:**

- Modify: `green-smart-panel.js`
- Modify: docs current UI
- Test: contract tests for render order markers

**Common order:**

```text
1. 현재 상태 요약
2. SafetyGuard 요약
3. 추천/전략 preview
4. 최종 적용값
5. Dry Run
6. 운영자 확인/실행
7. 최근 실행/차단 로그
8. 기록/이벤트
9. 고급 설정 accordion/admin-only
```

**Merge:**

- `AI 전략 출력` + `최종 적용값` + `Dry Run` + `운영자 확인`은 하나의 “실행 전 확인 흐름”으로 묶는다.

**Split:**

- `Entity Mapping`, `Mapping Validation`, raw interlock builder는 고급/admin 영역으로 분리한다.

**Acceptance:**

- farm_staff can understand current state and allowed actions without seeing admin settings
- admin can still access all advanced settings
- existing API functionality unchanged

**Question gate:**

- Should advanced settings be accordion inside each page, or moved to Admin/System page immediately?

---

## Phase U4 — Irrigation page priority cleanup

**목표:** 관수 페이지를 농장주/직원에게 가장 직관적인 “물/양액 운영 화면”으로 만든다.

**Files:**

- Modify: `green-smart-panel.js`
- Modify: `docs/design/current-ui-design-and-navigation.md`
- Test: irrigation UI contract

**Top cards:**

```text
현재 관수 상태
오늘 관수 횟수 / 마지막 / 다음 예상
현재 배지 수분율(VWC) / 양액 농도(EC) / 산도(pH)
긴급 차단 여부
오늘 권장 관수량/간격
```

**Terminology updates:**

| 기존/기술 용어 | UI 표시 |
|---|---|
| VWC | 배지 수분율(VWC) |
| EC | 양액 농도(EC) |
| pH | 산도(pH) |
| dryback | 야간 수분 빠짐(드라이백) |
| final target | 실행할 최종 목표 |
| interlock | 안전 차단 조건 |
| failsafe | 안전 위치 전환 |

**Move/admin-only:**

- 양액기 entity ID
- PID values
- EC/pH calibration
- mapping validation

**Acceptance:**

- farm_staff sees status/log/allowed action, not PID/entity mapping
- farm_owner sees strategy and approval path
- admin sees all advanced controls

---

## Phase U5 — Device page operations vs settings split

**목표:** 장치제어에서 현장 조작과 기술 설정을 분리한다.

**Files:**

- Modify: `green-smart-panel.js`
- Modify: docs current UI
- Test: device UI contract

**Operator area:**

```text
장치 이상 여부
주요 장치 현재 상태
허용된 수동 조작
알람/장애
제어 이력
```

**Admin/advanced area:**

```text
환기 장치 설정
스크린 장치 설정
장치 그룹 관리
인터록 설정
Fail Safe 설정
entity mapping
```

**Acceptance:**

- staff sees clear allowed actions and reasons for disabled actions
- admin can access advanced settings
- manual control still requires confirm and backend safety gate

---

## Phase U6 — Admin/System page baseline

**목표:** 기술/연동/권한 관련 요소를 Admin/System으로 모은다.

**Files:**

- Modify: `green-smart-panel.js`
- Modify: `frontend_panel.py` only if route/sidebar metadata changes are needed
- Backend API optional in later phase
- Docs update

**Sections:**

```text
연결 설정: PLC/virtual/HA
날씨/외부 API: KMA/PSIS/Central
Entity Mapping
사용자/권한
진단/백업
```

**Acceptance:**

- farm_staff cannot access Admin/System
- farm_owner sees only allowed summaries if configured
- admin can manage current settings

**Decision:**

- Add Admin/System as a separate sidebar menu that is visible only to `admin`.
- Do not expose Admin/System to `farm_owner` or `farm_staff`; show only safe operational summaries in their normal pages.

---

## Phase U7 — Backend RBAC contract

**목표:** frontend-only RBAC에서 backend-enforced RBAC로 이동한다.

**Files:**

- Modify/Create: backend auth/role helper module, likely `custom_components/green_smart/auth.py`
- Modify: `zone_control_views.py`, `crop_views.py`, admin views
- Modify: `db.py` if persistent role mapping is approved
- Test: backend permission contract tests

**Approved identity model:**

```text
Home Assistant user ID
→ Green Smart role mapping
→ permissions
```

Recommended persistence options:

```text
HA Store role mapping first
MariaDB role tables later if multi-farm/edge tenancy needs richer queries
```

**Acceptance:**

- write/execute APIs enforce permissions
- actor_role is logged
- frontend no longer solely controls access

**Decision:**

- Use Home Assistant users and map each HA user ID to a Green Smart role.
- Do not create a separate Green Smart username/password system for this phase.

---

## Phase U8 — JS module split/spike

**목표:** 거대한 `green-smart-panel.js`를 안전하게 나눌 수 있는지 검증한다.

**Files:**

- Create spike docs or branch
- Possibly create `panel/modules/*.js`
- No prod behavior change until spike passes

**Spike questions:**

1. HA static panel can load multi-file ES modules reliably?
2. Cache busting for multiple JS files works with manifest version?
3. HACS packaging includes all module files?
4. Browser compatibility in HA WebView is acceptable?

**Acceptance:**

- If spike passes: split one low-risk module first, e.g. RBAC helper or constants.
- If spike fails: keep single JS file but organize with sections and tests.

---

## 6. 불필요 요소 정리 기준

### 6.1 Remove

아래는 실제 사용자 UI에서 제거하거나 hidden marker로만 유지한다.

- live 화면의 contract-only marker text
- 중복 설명 문구
- 사용되지 않는 selector 바인딩과 렌더 DOM 불일치
- 과거 설계에서 남은 obsolete API path 문구

### 6.2 Move

- entity mapping → Admin/System 또는 advanced accordion
- API key/Central/DB/HA diagnostic → Admin/System
- PID/calibration → Admin/System advanced
- raw JSON → Admin developer section

### 6.3 Merge

- AI output + final target + Dry Run + operator confirmation → “실행 전 확인” 흐름
- SafetyGuard Watchdog + Safety event summary → role별 Safety summary card
- alert/resume + event ack/clear → “알림/조치” 흐름

### 6.4 Split

- Home: operator summary vs system diagnostics
- Device: operations vs technical settings
- Irrigation: farm strategy vs fertigation device engineering
- Environment: target strategy vs interlock rule engineering

---

## 7. Implementation rules

1. 문서 → contract test → UI/backend 구현 순서로 진행한다.
2. 한 번에 전체 UI를 바꾸지 않는다. page/domain 단위로 나눈다.
3. role helper부터 추가하고, 실제 숨김/비활성화는 slice별로 적용한다.
4. 위험 실행 기능은 삭제하지 않는다. 안전 상태/권한/확인과 함께 재배치한다.
5. frontend 권한 처리는 UX이고, backend enforcement는 별도 Phase에서 반드시 추가한다.
6. 실제 장비 연결 관련 기능은 여전히 virtual rehearsal 통과 전 금지다.
7. 구현 중 모호성이 10%를 넘으면 멈추고 사용자에게 질문한다.

---

## 8. Verification commands

각 구현 slice 후 최소 검증:

```bash
pytest -q
python3 -m py_compile custom_components/green_smart/*.py
node --check custom_components/green_smart/panel/green-smart-panel.js
git diff --check
```

UI behavior slice 후 운영 smoke:

```bash
docker exec greenity-prod-homeassistant python -m homeassistant --script check_config --config /config
docker restart greenity-prod-homeassistant
# HTTP ready 확인
# 최근 로그에서 Traceback|ERROR|Non-thread-safe operation 확인
```

문서 slice만 변경한 경우:

```bash
python3 - <<'PY'
from pathlib import Path
# markdown link check / required marker check
PY
git diff --check
```

---

## 9. First implementation slice recommendation

가장 먼저 할 작업은 **Phase U0 + U1**이다.

### 이유

- 지금 당장 화면을 옮기기 시작하면 또 기준이 흔들릴 수 있다.
- 먼저 모든 요소에 taxonomy와 role 기준을 붙여야 한다.
- role helper가 있어야 이후 page별 정리가 반복 가능하다.

### 확정된 구현 전제

Phase U0/U1을 시작하기 위한 핵심 질문은 사용자와 하나씩 확인하여 아래처럼 확정했다.

1. 기본 역할은 `admin`, `farm_owner`, `farm_staff` 3개로 확정한다.
2. `farm_staff` 수동 조작은 농장주가 허용한 장치별 범위 안에서만 가능하다.
3. `farm_owner` SafetyGuard/인터록 권한은 기능별로 나눈다.
   - 이벤트 확인·조치 처리: `admin`만 가능
   - 기본 임계값 수정: `farm_owner`도 확인 팝업/위험 안내/변경 이력 조건으로 가능
   - 고급 rule builder: `admin`만 가능
   - Fail Safe/safe_state 설정: `admin`만 가능
4. Admin/System은 `admin`에게만 보이는 sidebar 별도 메뉴로 추가한다.
5. RBAC는 Home Assistant 사용자와 Green Smart 역할을 매핑한다.

### Phase U0/U1 진행 가능 여부

위 5개가 확정되었으므로 Phase U0/U1의 모호성은 10% 이하로 본다. 다만 아래 질문은 해당 slice에 도달할 때 한 번에 하나씩 추가 확인한다.

| 후속 질문 | 질문 시점 |
|---|---|
| 알림/작업을 별도 sidebar page로 만들지, 홈 첫 카드로 유지할지 | Home redesign 또는 alert/task page slice 시작 전 |
| 농장직원이 crop season 삭제/철거 요청을 만들 수 있는지 | Crop page role gate slice 시작 전 |
| 농장주와 admin의 실제 실행 범위를 domain별로 나눌지 | Execution permission backend slice 시작 전 |

---

## 10. Definition of Done for this reorganization program

- [ ] 모든 페이지의 카드/버튼/입력이 taxonomy로 분류됨
- [ ] role별 visibility/permission matrix가 test로 고정됨
- [ ] farm_staff UI에서 entity_id/PID/API key/raw JSON이 노출되지 않음
- [ ] farm_owner UI에서 전략 승인/실행 전 확인 흐름이 명확함
- [ ] admin UI에서 고급 설정/권한/진단이 한 곳에서 관리됨
- [ ] write/execute API가 backend permission helper를 통과함
- [ ] audit log에 actor_role이 남음
- [ ] 모바일 WebView에서 홈/작물기록/알림확인/허용 조작이 가능함
- [ ] 마스터플랜과 상세 기준 문서가 최신 상태로 유지됨

phase baseline complete 조건은 위 항목이 충족되고, virtual rehearsal 및 운영 smoke가 통과하는 것이다.
