# Green Smart Product-First Rebuild Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task only after the architecture baseline is accepted.

**Goal:** Green Smart를 누적식 패치 구조에서 벗어나, 농장 운영 흐름 중심의 제품 구조로 먼저 재설계한 뒤 운영/배포 스택을 재정리한다.

**Priority Order:** 제품 구조 리빌딩 → 운영 스택 리빌딩

**Architecture:** 1차 리빌드는 제품 구조 리빌딩이다. Home Assistant custom integration/HACS 형태는 유지하되 UI·API·DB·모델 경계를 `Crop / Environment / Irrigation / Device / Safety / Admin` 도메인으로 분리한다. 2차 리빌드는 `green_smart-deploy`에서 prod/dev/sandbox 운영 스택을 재정리하며, prod cutover는 별도 승인 Gate 뒤에만 수행한다.

**Direction correction:** 사용자가 말한 리빌딩은 기존 파일에 RB-007, RB-008처럼 계속 기능/분리 패치를 누적하는 뜻이 아니다. **기존 RB 산출물은 reference/evidence로만 사용**하고, 새 구현은 **새 master docs → 새 target architecture → 새 vertical slice scaffold** 순서에서 다시 시작한다. 이것을 `from-scratch rebuild 기준선`으로 부른다.

**Hard Stop:** 기존 구조를 계속 쪼개는 방식으로 다음 RB를 진행하지 않는다. 기존 코드 수정은 hotfix와 호환 adapter로만 제한한다. 새 기능/대규모 분리는 master docs와 target architecture가 승인된 뒤 새 vertical rebuild slice에서만 진행한다.

**Tech Stack:** Home Assistant custom integration, Python HomeAssistantView, MariaDB/aiomysql, Vanilla JS Web Component, Docker Compose prod/dev stack, pytest contract tests, GitHub releases.

---

## 0. 왜 리빌딩이 필요한가

현재 `v1.15.59` 기준 진단 수치:

| 항목 | 현재 상태 | 리빌딩 판단 |
|---|---:|---|
| `panel/green-smart-panel.js` | 10,007 lines | UI 상태·렌더·API 호출·모달·도메인 로직이 한 파일에 과밀 |
| `crop_views.py` | 4,946 lines | 작기/생육/AI/리포트/인터록/품질/예측이 한 API 파일에 과밀 |
| `zone_control_views.py` | 2,737 lines | 환경/관수/장치/인터록/실행 경로가 한 파일에 과밀 |
| `docs/design/ui-information-architecture-and-rbac.md` | 기준 버전 `v1.9.56` | 현재 구현 `v1.15.59`와 문서 기준 괴리 |
| 전체 contract tests | 536 passed | 회귀 방어는 좋지만, 구조 정리는 테스트가 아니라 아키텍처 경계가 필요 |

결론: 기능은 돌아가지만, 계속 vertical slice를 누적하면 UI·API·문서가 더 무거워진다. 다음 단계는 신규 기능이 아니라 **제품 구조 리빌딩 baseline**이다.

---

## 1. 리빌딩 원칙

1. **Prod 안정성 우선:** 현재 `v1.15.59` 운영 반영 상태는 유지한다. 리빌딩 중 prod에 즉시 큰 변경을 넣지 않는다.
2. **제품 구조 먼저:** 화면/도메인/API/DB/model 경계를 먼저 정리한다. Docker/Compose 운영 리빌드는 제품 구조 기준이 확정된 뒤 진행한다.
3. **기능 추가 중단:** VS-004 같은 신규 기능은 리빌딩 baseline이 생길 때까지 보류한다.
4. **큰 rewrite 금지:** 한 번에 전체 교체하지 않는다. Compatibility adapter와 contract test로 점진 이관한다.
5. **농장 사용자 중심:** UI는 개발자 구현 순서가 아니라 `조회 / 기록 / 전략 / 실행 / 안전 / 고급설정` 흐름으로 재구성한다.
6. **RBAC backend enforcement:** 버튼 숨김은 UX일 뿐이다. write/execute API는 backend permission으로 강제한다.
7. **Safety → Interlock → Model:** AI/모델보다 안전과 인터록 경계를 먼저 고정한다.

---

## 2. 목표 제품 구조

### 2.1 도메인 경계

| Domain | 책임 | UI 위치 | Backend/API | DB 기준 |
|---|---|---|---|---|
| Home | 오늘 상태, 위험 알림, 할 일, 요약 | 홈 | summary/dashboard views | read models / recent logs |
| Crop | 작기, 생육조사, 병해충, 방제, 작물 모델 입력 | 작물/기록 | `crop/*` | crop_seasons, growth_surveys, pest_surveys, control_records |
| Environment | 온도/습도/VPD/CO₂ 상태, 설정값, 전략, 안전 | 환경 | `environment/*`, zone control adapter | zone_control_settings, final targets, logs |
| Irrigation | VWC/EC/pH/관수 상태, 전략, 실행 | 관수 | `irrigation/*`, zone control adapter | zone_control_settings, final targets, logs |
| Device | 장치 상태, 수동 조작, 매핑 요약, 실행 이력 | 장치 | `devices/*`, mapping/execute adapter | devices, mappings, status, logs |
| Safety | SafetyGuard, Interlock, Fail Safe, 알림 | 각 실행 근처 + 안전 요약 | safety/interlock views | safety events, interlock settings, logs |
| Admin/System | HA entity, DB/API, Central, 날씨/농약 key, 사용자/RBAC | Admin 전용 | admin/config/rbac views | users, roles, config, diagnostics |

### 2.2 UI bucket

모든 UI 요소는 아래 중 하나로 분류한 뒤 배치한다.

```text
조회 / 기록 / 전략 / 실행 / 안전 / 고급설정
```

- `farm_staff`: 오늘 할 일, 기록 입력, 알림 확인, 허용된 수동 조작
- `farm_owner`: 요약, 전략 승인, 중요 실행, 리포트/감사 요약
- `admin`: 설치/연동/권한/진단/키/매핑/고급 설정

---

## 3. 리빌딩 산출물

### 3.0 리빌딩 5대 핵심 문서

이번 리빌딩은 아래 5개 문서를 최상위 산출물로 삼는다. 구현은 이 5대 문서가 서로 맞물린 뒤에만 진행한다.

| 번호 | 문서 | 내용 | 리빌딩 기준 |
|---:|---|---|---|
| 1 | CBA 화면 기획서 (UI/UX 설계도) | 전체 페이지 목록과 화면 구조 | 공통 부품 → 복합 모듈 → 전체 페이지 3단계로 화면을 쪼개고, 배치 중심으로 기획 |
| 2 | 통신 명세서 (인터페이스 규칙서) | 프론트엔드, 백엔드, 엣지/라즈베리 파이 장비 간 데이터 통로 | REST API 주소와 MQTT topic을 기능 모듈별 표로 정의 |
| 3 | DB 구상도 (데이터 저장소 스키마) | 센서 데이터와 제어 기록을 저장할 테이블 구조 | 사용자/RBAC, 구역/장비, 작기, 센서 데이터/로그 4대 기둥과 외래키 정립 |
| 4 | 통합 시나리오 흐름도 (워크플로우 순서도) | 화면, API, MQTT, DB, 하드웨어, AI 모델의 시간순 신호 흐름 | 센서 수집 → 백엔드 적재 → AI/VPD 판단 → MQTT/HA 제어 → 하드웨어 구동 → UI 반영 |
| 5 | 로직 알고리즘 및 예외처리 명세서 (시스템의 두뇌 & 생존 장치) | 연산 규칙과 현장 비상 상황 대책 | VPD/PID/제어 알고리즘, 인터넷 단절, 센서 고장, 천창 safe position, 로컬 모드, Fail-Safe |

현재 대응 파일:

| 문서 | 파일 |
|---|---|
| CBA 화면 기획서 | `docs/master/01-cba-ui-ux-spec.md` |
| 통신 명세서 | `docs/master/02-interface-spec.md` |
| DB 구상도 | `docs/master/03-database-schema.md` |
| 통합 시나리오 흐름도 | `docs/master/04-workflow-diagrams.md` |
| 로직 알고리즘 및 예외처리 명세서 | `docs/master/05-ml-interlock-failsafe-spec.md` |

### Phase R0 — 현재 구조 freeze 및 inventory

**Objective:** 현재 `v1.15.59`를 안전 기준선으로 고정하고 리빌딩 대상/보존 대상을 분리한다.

**Files:**
- Create: `docs/rebuild/current-state-inventory.md`
- Create: `docs/rebuild/rebuild-risk-register.md`
- Modify: `docs/PROJECT_MASTER_PLAN.md`

**Steps:**
1. 현재 파일 크기, API route, DB table, panel render method inventory 생성.
2. “보존할 계약”과 “리빌딩 대상” 분리.
3. prod 변경 금지 Gate 기록.
4. Run: `node --check ... && python3 -m py_compile ... && pytest -q`
5. Expected: `536 passed` 이상 또는 변경된 테스트 수 전체 통과.

### Phase R1 — 제품 IA/RBAC baseline 재작성

**Objective:** 오래된 `v1.9.56` 기준 IA/RBAC 문서를 `v1.15.59+` 기준으로 재정렬한다.

**Files:**
- Rewrite/Update: `docs/design/ui-information-architecture-and-rbac.md`
- Update: `docs/design/current-ui-design-and-navigation.md`
- Update: `docs/design/current-backend-api-db-ha-contract.md`
- Test: `tests/test_rebuild_ia_rbac_contract.py`

**Acceptance:**
- 각 페이지 요소가 `조회/기록/전략/실행/안전/고급설정` 중 하나로 분류됨.
- `admin/farm_owner/farm_staff`별 visible/disabled/summary/hidden 상태 정의.
- Admin/System 영역으로 이동해야 할 technical fields 목록 명시.

### Phase R2 — Frontend decomposition plan

**Status:** `v1.15.59`에서 기준선 완료. 상세 산출물은 `docs/rebuild/frontend-decomposition-plan.md`.

**Objective:** 10,007줄 단일 panel JS를 바로 쪼개지 않고, 먼저 모듈 경계와 adapter 전략을 문서/계약으로 고정한다.

**Target structure:**

```text
panel/
  green-smart-panel.js              # compatibility shell only
  core/state-store.js
  core/api-client.js
  core/render-shell.js
  domains/crop/crop-page.js
  domains/environment/environment-page.js
  domains/irrigation/irrigation-page.js
  domains/device/device-page.js
  domains/admin/admin-page.js
  components/cards/*.js
  components/modals/*.js
```

**Acceptance:**
- 기존 `green-smart-panel.js` public custom element 유지.
- 신규 module은 HA panel resource loading 방식에서 동작 가능한 형태로만 설계.
- 첫 이관 대상은 Crop이 아니라 **Admin/System 분리 shell** 또는 가장 작고 위험 낮은 read-only component로 선택.

### Phase R3 — Backend/API decomposition plan

**Status:** `v1.15.59`에서 기준선 완료. 상세 산출물은 `docs/rebuild/backend-api-decomposition-plan.md`.

**Objective:** `crop_views.py`, `zone_control_views.py`를 도메인별 view/helper/service로 분리하는 adapter-first 계획 수립.

**Target structure:**

```text
green_smart/
  api_views/
    crop.py
    environment.py
    irrigation.py
    device.py
    safety.py
    admin.py
  services/
    crop_service.py
    strategy_service.py
    safety_service.py
    rbac_service.py
  repositories/
    crop_repo.py
    zone_control_repo.py
    device_repo.py
```

**Acceptance:**
- 기존 route path 유지.
- route handler는 service/repo를 호출하는 thin adapter로 축소.
- DB query 문자열은 repository로 이동.
- test는 route contract와 service unit contract로 분리.

### Phase R4 — DB/schema rationalization plan

**Status:** `v1.15.59`에서 기준선 완료. 상세 산출물은 `docs/rebuild/db-schema-rationalization-plan.md`.

**Objective:** legacy physical schema를 제품 방향으로 삼지 않고, RBAC-first target schema와 migration gate를 정한다.

**Rules:**
- `docs/master/03-database-schema.md`가 target schema 기준이다.
- legacy physical schema는 adapter-only다.
- 실제 migration은 별도 승인 전까지 금지.
- 신규 제품/API/docs는 `crop_cycle`, `currentCrop`, `gs_` target schema를 기준으로 한다.

### Phase R4.5 — Legacy direction inventory

**Status:** `v1.15.59`에서 legacy direction inventory 완료. 상세 산출물은 `docs/rebuild/legacy-direction-inventory.md`.

**Boundary:**
```text
historical reference, not product direction
legacy physical schema is adapter-only
Green Smart Legacy panel = compatibility surface
rebuild panel only for new product slices
```

### Phase R4.6 — Crop Cycle API naming boundary

**Status:** `v1.15.59`에서 crop_cycle/currentCrop API naming boundary 완료. 상세 산출물은 `docs/rebuild/crop-cycle-api-boundary.md`.

**Boundary:**
```text
No production route removal in RS-010
No DB migration in RS-010
crop/seasons = compatibility adapter
crop_cycle/currentCrop = product-facing target
```

### Phase R4.7 — RBAC permission naming boundary

**Status:** `v1.15.59`에서 target gs_permissions permission naming boundary 완료. 상세 산출물은 `docs/rebuild/rbac-permission-boundary.md`.

**Boundary:**
```text
No role table migration in RS-011
No production permission removal in RS-011
legacy permission strings = compatibility aliases
gs_permissions target codes = product-facing permission names
```

### Phase R4.8 — Rebuild currentCrop/crop_cycle adapter

**Status:** `v1.15.59`에서 rebuild currentCrop/crop_cycle service adapter 완료. 상세 산출물은 `docs/rebuild/rebuild-current-crop-adapter.md`.

**Boundary:**
```text
legacy fixture shape may contain cropSeasonId
product-facing rebuild DTO uses crop_cycle/currentCrop
No production route removal in RS-012
No DB migration in RS-012
```

### Phase R4.9 — Read-only DB adapter

**Status:** `v1.15.59`에서 legacy physical DB → crop_cycle/currentCrop DTO read-only adapter 완료. 상세 산출물은 `docs/rebuild/read-only-db-adapter.md`.

**Boundary:**
```text
legacy physical schema is adapter-only
Product-facing DTO names are crop_cycle/currentCrop
No production route removal in RS-013
No DB migration in RS-013
read-only adapter must not INSERT/UPDATE/DELETE
```

### Phase R4.10 — Rebuild home context API source adapter

**Status:** `v1.15.59`에서 rebuild home context API가 RS-013 read-only DB adapter service를 source로 사용하도록 연결 완료. 상세 산출물은 `docs/rebuild/rebuild-home-context-api-source-adapter.md`.

**Boundary:**
```text
GET /api/green_smart/rebuild/home/context
source = legacy-physical-readonly-adapter service
No production route removal in RS-014
No DB migration in RS-014
No write/mutation in RS-014
```

### Phase R4.11 — Rebuild panel async context loading

**Status:** `v1.15.59`에서 rebuild panel이 protected home context API를 비동기로 호출하도록 연결 완료. 상세 산출물은 `docs/rebuild/rebuild-panel-async-context-loading.md`.

**Boundary:**
```text
GET /api/green_smart/rebuild/home/context
panel fetches protected API through hass.callApi
No production route removal in RS-015
No DB migration in RS-015
No write/mutation in RS-015
fallback remains static read-only context
```

### Phase R4.12 — Crop cycle read-only page slice

**Status:** `v1.15.59`에서 작물상태/생육목표의 crop_cycle/currentCrop read-only UI 표시 완료. 상세 산출물은 `docs/rebuild/crop-cycle-readonly-page-slice.md`.

**Boundary:**
```text
currentCrop.crop_cycle_id
crop_cycle/currentCrop
작물상태 / 생육목표
No production route removal in RS-016
No DB migration in RS-016
No write/mutation in RS-016
```

### Phase R4.13 — Zone current crop assignment read model

**Status:** `v1.15.59`에서 구역별 currentCrop 배정 read model 완료. 상세 산출물은 `docs/rebuild/zone-current-crop-assignment-read-model.md`.

**Boundary:**
```text
currentCropAssignment
zone → currentCrop/crop_cycle
zone → equipmentProfile
zone → dataAvailability
No production route removal in RS-017
No DB migration in RS-017
No write/mutation in RS-017
```

### Phase R4.14 — Growth target read-only projection

**Status:** `v1.15.59`에서 생육목표 read-only projection 완료. 상세 산출물은 `docs/rebuild/growth-target-readonly-projection.md`.

**Boundary:**
```text
growthTargetProjection
currentCropAssignment → growthTargetProjection
생육목표
No production route removal in RS-018
No DB migration in RS-018
No write/mutation in RS-018
```

### Phase R4.15 — Environment impact read-only projection

**Status:** `v1.15.59`에서 영향지도 read-only projection 완료. 상세 산출물은 `docs/rebuild/environment-impact-readonly-projection.md`.

**Boundary:**
```text
environmentImpactProjection
currentCropAssignment + equipmentProfile + dataAvailability → environmentImpactProjection
영향지도
No production route removal in RS-019
No DB migration in RS-019
No write/mutation in RS-019
```

### Phase R4.16 — Recommendation review read-only projection

**Status:** `v1.15.59`에서 추천·실행 read-only projection 완료. 상세 산출물은 `docs/rebuild/recommendation-review-readonly-projection.md`.

**Boundary:**
```text
recommendationReviewProjection
currentCropAssignment + growthTargetProjection + environmentImpactProjection → recommendationReviewProjection
추천·실행
No production route removal in RS-020
No DB migration in RS-020
No write/mutation in RS-020
```

### Phase R4.17 — Operator approval scaffold

**Status:** `v1.15.59`에서 작업자 승인 scaffold 완료. 상세 산출물은 `docs/rebuild/operator-approval-scaffold.md`.

**Boundary:**
```text
operatorApprovalScaffold
recommendationReviewProjection → operatorApprovalScaffold
작업자 승인 필요
No production route removal in RS-021
No DB migration in RS-021
No write/mutation in RS-021
```

### Phase R4.18 — Safety/Interlock preflight projection

**Status:** `v1.15.59`에서 Safety/Interlock preflight projection 완료. 상세 산출물은 `docs/rebuild/safety-interlock-preflight-projection.md`.

**Boundary:**
```text
safetyInterlockPreflightProjection
operatorApprovalScaffold → safetyInterlockPreflightProjection
Safety / Interlock / Fail Safe 사전검증
No production route removal in RS-022
No DB migration in RS-022
No write/mutation in RS-022
```

### Phase R4.19 — Virtual execution rehearsal scaffold

**Status:** `v1.15.59`에서 Virtual execution rehearsal scaffold 완료. 상세 산출물은 `docs/rebuild/virtual-execution-rehearsal-scaffold.md`.

**Boundary:**
```text
virtualExecutionRehearsalScaffold
safetyInterlockPreflightProjection → virtualExecutionRehearsalScaffold
가상 실행 리허설
No production route removal in RS-023
No DB migration in RS-023
No write/mutation in RS-023
No MQTT/device command in RS-023
```

### Phase R4.20 — Rehearsal result review projection

**Status:** `v1.15.59`에서 Rehearsal result review projection 완료. 상세 산출물은 `docs/rebuild/rehearsal-result-review-projection.md`.

**Boundary:**
```text
rehearsalResultReviewProjection
virtualExecutionRehearsalScaffold → rehearsalResultReviewProjection
리허설 결과 검토
No production route removal in RS-024
No DB migration in RS-024
No write/mutation in RS-024
No approval/execution release in RS-024
```

### Phase R4.21 — Virtual runner input contract

**Status:** `v1.15.59`에서 Virtual runner input contract 완료. 상세 산출물은 `docs/rebuild/virtual-runner-input-contract.md`.

**Boundary:**
```text
virtualRunnerInputContract
rehearsalResultReviewProjection → virtualRunnerInputContract
가상 러너 입력 계약
No production route removal in RS-025
No DB migration in RS-025
No write/mutation in RS-025
No virtual runner execution in RS-025
```

### Phase R4.22 — Virtual runner dry-run result adapter

**Status:** `v1.15.59`에서 Virtual runner dry-run result adapter 완료. 상세 산출물은 `docs/rebuild/virtual-runner-dry-run-result-adapter.md`.

**Boundary:**
```text
virtualRunnerDryRunResultAdapter
virtualRunnerInputContract → virtualRunnerDryRunResultAdapter
가상 dry-run 결과 어댑터
No production route removal in RS-026
No DB migration in RS-026
No write/mutation in RS-026
No virtual runner execution in RS-026
```

### Phase R4.23 — Virtual rehearsal pass/fail review projection

**Status:** `v1.15.59`에서 Virtual rehearsal pass/fail review projection 완료. 상세 산출물은 `docs/rebuild/virtual-rehearsal-pass-fail-review-projection.md`.

**Boundary:**
```text
virtualRehearsalPassFailReviewProjection
virtualRunnerDryRunResultAdapter → virtualRehearsalPassFailReviewProjection
가상 리허설 pass/fail 검토 projection
No production route removal in RS-027
No DB migration in RS-027
No write/mutation in RS-027
No virtual runner execution in RS-027
RS sequence complete before R5 scaffold
```

### Phase R5 — Product rebuild execution scaffold

**Objective:** 실제 코드는 작은 vertical rebuild slice로만 이동하되, 기존 RB-001~RB-006 흐름을 그대로 이어가지 않는다. 이 단계는 **from-scratch rebuild 기준선** 이후 새 target architecture에서 다시 정의한다.

**Direction:**

```text
기존 RB 산출물은 reference/evidence로만 사용
기존 구조를 계속 쪼개는 방식으로 다음 RB를 진행하지 않는다
새 master docs → 새 target architecture → 새 vertical slice scaffold
기존 코드 수정은 hotfix와 호환 adapter로만 제한
```

**이전 RB 산출물의 역할:** 아래 항목은 다음 구현 지시가 아니라, 새 설계 시 참고할 evidence/compatibility inventory다.

Historical evidence compatibility markers retained for existing contracts:

```text
RB-003 Crop read-only component extraction
v1.15.59
domains/crop/crop-readonly.js
read-only render helpers only
crop write modal/save/delete 변경 없음
DB/API 변경 없음

RB-004 Crop write modal extraction
v1.15.59
domains/crop/crop-write-modal.js
작기 write modal render helpers only
save/delete bindings remain in panel shell
API/DB 변경 없음
route path 변경 없음
response shape 변경 없음

RB-004B Growth survey modal render extraction
v1.15.59
domains/crop/crop-growth-modal.js
생육조사 modal render helpers only
save/API bindings remain in panel shell
API/DB 변경 없음
route path 변경 없음
response shape 변경 없음

RB-004C Pest scouting modal render extraction
v1.15.59
domains/crop/crop-pest-modal.js
병해충 예찰 modal render helpers only
autocomplete/API/save bindings remain in panel shell
API/DB 변경 없음
route path 변경 없음
response shape 변경 없음

RB-004D Control/treatment modal render extraction
v1.15.59
domains/crop/crop-control-modal.js
방제 기록 modal render helpers only
PLS/혼용 warning render markers preserved
pesticide/API/save bindings remain in panel shell
API/DB 변경 없음
route path 변경 없음
response shape 변경 없음

RB-006A Crop read-only service/repo boundary
v1.15.59
services/crop_service.py
repositories/crop_repo.py
GET /api/green_smart/crop/seasons
RB-006C Crop season write service/repo boundary
route path 변경 없음
response shape 변경 없음
DB migration 없음

RB-006B Crop record read-only repositories
v1.15.59
growth/pest/control read GET helpers
list_growth_records
list_pest_records
list_control_records
RB-006C Crop season write service/repo boundary
route path 변경 없음
response shape 변경 없음
DB migration 없음

RB-006C Crop season write service/repo boundary
v1.15.59
create/update/delete/demolish write helpers
create_crop_season
update_crop_season
demolish_crop_season
hard_delete_crop_season
growth/pest/control write 경로 변경 없음
route path 변경 없음
response shape 변경 없음
DB migration 없음

RB-006D Crop model/report service boundary
v1.15.59
growth-report GET service boundary
growth_report_response
Center sync scheduler 변경 없음
route path 변경 없음
response shape 변경 없음
DB migration 없음
```

| 이전 산출물 | reference/evidence로 쓸 것 | 새 리빌딩에서 금지할 오해 |
|---|---|---|
| RB-001 Admin/System shell | 기술 필드가 Admin/System에 모여야 한다는 UX evidence | 기존 `admin-page.js`를 계속 키우기 |
| RB-002 Panel API client adapter | `hass.callApi`를 직접 흩뿌리지 말아야 한다는 interface evidence | 기존 endpoint wrapper만 계속 추가하기 |
| RB-003/RB-004 Crop render/modal extraction | Crop read/write UI가 분리 대상이라는 hotspot evidence | 기존 `green-smart-panel.js`를 helper 파일로만 계속 찢기 |
| RB-005 Safety/Execution UI proximity | 실행 버튼 근처 SafetyGuard/Interlock/Fail Safe가 필요하다는 safety evidence | UI summary만 추가하고 실행 architecture를 방치하기 |
| RB-006 Crop service/repo boundary | route compatibility와 repository/service 분리가 필요하다는 backend evidence | `crop_views.py` 내부를 계속 부분 위임만 하기 |
| RB-007 이후 | 새 target architecture 승인 전 진행하지 않음 | 기존 구조에서 다음 RB 계속 진행 |

**새 R5 시작 조건:**

1. `docs/master/` 5대 문서가 현재 구현 reference와 새 목표 구조를 모두 설명한다.
2. `docs/rebuild/current-state-inventory.md`가 기존 RB 산출물을 evidence로 분류한다.
3. `docs/rebuild/target-architecture.md` 또는 동등 문서가 새 파일/도메인/API/DB 구조를 정의한다.
4. 첫 vertical rebuild slice가 기존 파일 patch가 아니라 새 scaffold 기준으로 정의된다.
5. Prod runtime 변경은 hotfix/compat adapter 외 금지한다.

### Phase R6 — 운영/배포 스택 리빌드 준비

**Objective:** 제품 구조 baseline 이후 `green_smart-deploy`에서 운영 스택 리빌드를 별도 진행한다.

**Non-destructive sequence:**
1. 현재 Docker/Compose/systemd state inventory.
2. prod/dev/sandbox target domain 문서화.
3. dev stack disposable rebuild.
4. mock device + virtual HA rehearsal smoke.
5. prod migration runbook/rollback 작성.
6. 사용자 승인 후 cutover.

---

## 4. 즉시 중단할 것 / 계속할 것

### 중단

- VS-004 신규 기능 구현
- Panel에 새 카드/모달 계속 누적
- `crop_views.py`/`zone_control_views.py`에 새 대형 helper 추가
- prod stack 구조 변경

### 계속

- bugfix/hotfix는 가능하되 최소 변경 + release
- 문서/계약 기반 리빌딩 계획
- 현재 prod health 유지
- static/contract test 유지

---

## 5. 첫 실행 작업

다음 작업은 **Phase R0 현재 구조 freeze 및 inventory**다.

1. `docs/rebuild/current-state-inventory.md` 생성
2. `docs/rebuild/rebuild-risk-register.md` 생성
3. `tests/test_rebuild_baseline_contract.py` 생성
4. 전체 검증
5. commit/tag/release는 R0 문서 baseline 완료 후 `v1.10.30`으로 진행

---

## 6. 완료 기준

제품 구조 리빌딩 baseline은 아래가 모두 만족될 때 완료로 본다.

- [ ] 현재 구조 inventory가 있다.
- [ ] UI IA/RBAC 문서가 현재 버전 기준으로 갱신되어 있다.
- [ ] Frontend split target이 명확하다.
- [ ] Backend/API split target이 명확하다.
- [ ] DB naming/compatibility policy가 명확하다.
- [ ] 운영 스택 리빌드는 제품 baseline 이후 별도 Gate로 분리되어 있다.
- [ ] 신규 기능 구현보다 리빌딩 slice가 우선순위로 고정되어 있다.


### Phase R5.1 — VS-N002 Crop cycle recording scaffold

**Status:** `v1.15.59`에서 VS-N002 Crop cycle recording scaffold 완료. 상세 산출물은 `docs/rebuild/vs-n002-crop-cycle-recording-scaffold.md`.

**Confirmed order:**
```text
RBAC/Admin ownership scaffold → Crop cycle recording scaffold → Real-time monitoring read-only slice
```

**Boundary:**
```text
VS-N002 Crop cycle recording scaffold
cropCycleRecordingScaffold
crop_cycle/currentCrop DTO boundary
recordingMode = scaffold_only
No write/mutation in VS-N002
No DB migration in VS-N002
No existing crop season save behavior change in VS-N002
```


### Phase R5.2 — VS-N003 Real-time monitoring read-only scaffold

**Status:** `v1.15.59`에서 VS-N003 Real-time monitoring read-only scaffold 완료. 상세 산출물은 `docs/rebuild/vs-n003-realtime-monitoring-readonly-scaffold.md`.

**Confirmed order:**
```text
RBAC/Admin ownership scaffold → Crop cycle recording scaffold → Real-time monitoring read-only slice → Interlock/Safety core scaffold
```

**Boundary:**
```text
VS-N003 Real-time monitoring read-only scaffold
realtimeMonitoringReadOnlyScaffold
monitoring/read-only DTO boundary
sensor state freshness boundary
monitoringMode = scaffold_only
No DB migration in VS-N003
No sensor collection/scheduler in VS-N003
No sensor_readings query adapter in VS-N003
No HA entity read API in VS-N003
```


### Phase R5.3 — VS-N004 Interlock/Safety core scaffold

**Status:** `v1.15.59`에서 VS-N004 Interlock/Safety core scaffold 완료. 상세 산출물은 `docs/rebuild/vs-n004-interlock-safety-core-scaffold.md`.

**Confirmed order:**
```text
RBAC/Admin ownership scaffold → Crop cycle recording scaffold → Real-time monitoring read-only slice → Interlock/Safety core scaffold
```

**Boundary:**
```text
VS-N004 Interlock/Safety core scaffold
interlockSafetyCoreScaffold
safety/interlock read-only DTO boundary
safety state gate boundary
safetyMode = scaffold_only
No existing SafetyGuard runtime behavior change in VS-N004
No existing Interlock runtime behavior change in VS-N004
No execution decision change in VS-N004
No approval/override release in VS-N004
```


## R5 Foundation Completion Baseline

`v1.15.59`에서 R5 foundation closure를 완료했다.

Reference:

```text
docs/rebuild/r5-foundation-completion-baseline.md
```

Boundary:

```text
R5 foundation complete before runtime adapters
No DB migration in R5 foundation closure
No write/mutation in R5 foundation closure
No runtime adapter in R5 foundation closure
No panel read-only card in R5 foundation closure
No SafetyGuard runtime behavior change in R5 foundation closure
No Interlock runtime behavior change in R5 foundation closure
No execution decision change in R5 foundation closure
No approval/override release in R5 foundation closure
No MQTT/device command in R5 foundation closure
question gates must use clarify tool
```


## R6-001 Crop Cycle Read-only Adapter

`v1.15.59`에서 R6-001 Crop cycle read-only adapter를 완료했다.

Reference:

```text
docs/rebuild/r6-001-crop-cycle-readonly-adapter.md
```

Boundary:

```text
R6-001 Crop Cycle Read-only Adapter
R5 foundation complete before runtime adapters
legacy physical crop_seasons rows → product-facing crop_cycle/currentCrop DTO
zone parent + currentCrop attached
No write/mutation in R6-001
No DB migration in R6-001
No execution decision change in R6-001
No SafetyGuard runtime behavior change in R6-001
No Interlock runtime behavior change in R6-001
No approval/override release in R6-001
No MQTT/device command in R6-001
question gates must use clarify tool
```


## R6-002 Monitoring Read-only Adapter

`v1.15.59`에서 R6-002 Monitoring read-only adapter를 완료했다.

Reference:

```text
docs/rebuild/r6-002-monitoring-readonly-adapter.md
```

Boundary:

```text
R6-002 Monitoring Read-only Adapter
R6-001 Crop Cycle Read-only Adapter → R6-002 Monitoring Read-only Adapter
dataAvailability + equipmentProfile → monitoringReadOnlyAdapter
runtimeReadAdapterEnabled = true
sensorCollectionEnabled = false
No write/mutation in R6-002
No DB migration in R6-002
No sensor collection/scheduler in R6-002
No HA entity read API in R6-002
No execution decision change in R6-002
No SafetyGuard runtime behavior change in R6-002
No Interlock runtime behavior change in R6-002
No approval/override release in R6-002
No MQTT/device command in R6-002
No panel redesign in R6-002
question gates must use clarify tool
```


## R6-003 Safety/Interlock Read-only Adapter

`v1.15.59`에서 R6-003 Safety/Interlock read-only adapter를 완료했다.

Reference:

```text
docs/rebuild/r6-003-safety-interlock-readonly-adapter.md
```

Boundary:

```text
R6-003 Safety/Interlock Read-only Adapter
R6-002 Monitoring Read-only Adapter → R6-003 Safety/Interlock Read-only Adapter
monitoringReadOnlyAdapter + safetyInterlockPreflightProjection → safetyInterlockReadOnlyAdapter
runtimeSafetyAdapterEnabled = true
executionDecisionEnabled = false
approvalOverrideEnabled = false
No write/mutation in R6-003
No DB migration in R6-003
No existing SafetyGuard runtime behavior change in R6-003
No existing Interlock runtime behavior change in R6-003
No execution decision change in R6-003
No approval/override release in R6-003
No MQTT/device command in R6-003
No panel redesign in R6-003
question gates must use clarify tool
```


## R7-000 Main Dashboard / Sidebar / Detail Page IA Blueprint

`v1.15.59`에서 R7-000 IA blueprint를 완료했다.

Reference:

```text
docs/rebuild/r7-000-main-dashboard-sidebar-detail-ia-blueprint.md
```

Boundary:

```text
R7-000 Main Dashboard / Sidebar / Detail Page IA Blueprint
작물상태 → 생육목표 → 환경/관수/장치 영향 → 추천/실행
R7-000 is an IA blueprint only
No panel DOM implementation change in R7-000
No API route change in R7-000
No DB migration in R7-000
No execution authority in R7-000
No SafetyGuard/Interlock runtime behavior change in R7-000
question gates must use clarify tool
```


## R7-001 Main Dashboard Redesign

`v1.15.59`에서 R7-001 main dashboard redesign을 완료했다.

Reference:

```text
docs/rebuild/r7-001-main-dashboard-redesign.md
```

Boundary:

```text
R7-001 Main Dashboard Redesign
implements the first operator-visible crop-centered dashboard
render from existing GET /api/green_smart/rebuild/home/context shape
No fixture-only cards in R7-001
No API route change in R7-001
No DB migration in R7-001
No execution authority in R7-001
No approval/override release in R7-001
No SafetyGuard/Interlock runtime behavior change in R7-001
```


## R7-002 Sidebar Navigation + Page Shell

`v1.15.59`에서 R7-002 sidebar navigation + page shell을 완료했다.

Reference:

```text
docs/rebuild/r7-002-sidebar-navigation-page-shell.md
```

Boundary:

```text
R7-002 Sidebar Navigation + Page Shell
implements the R7 sidebar primary groups and page shell
운영 홈 / 작물 중심 운영 / 현장 상태 / 추천·실행 검토 / 설정
No API route change in R7-002
No DB migration in R7-002
No execution authority in R7-002
No approval/override release in R7-002
No SafetyGuard/Interlock runtime behavior change in R7-002
```


## R7-003 Detail/Configuration Subpages Baseline

`v1.15.59`에서 R7-003 detail/configuration subpages baseline을 완료했다.

Reference:

```text
docs/rebuild/r7-003-detail-configuration-subpages-baseline.md
```

Boundary:

```text
R7-003 Detail/Configuration Subpages Baseline
selected scope: all five sidebar groups receive read-only detail/config placeholder baselines
운영 홈 / 작물 중심 운영 / 현장 상태 / 추천·실행 검토 / 설정
No API route change in R7-003
No DB migration in R7-003
No execution authority in R7-003
No approval/override release in R7-003
No SafetyGuard/Interlock runtime behavior change in R7-003
No MQTT/device command in R7-003
```


## R7-004 Settings/Admin Read-only Detail

`v1.15.59`에서 R7-004 settings/admin read-only detail을 완료했다.

Reference:

```text
docs/rebuild/r7-004-settings-admin-readonly-detail.md
```

Boundary:

```text
R7-004 Settings/Admin Read-only Detail
user-selected scope: 설정 — RBAC/config/admin read-only detail
No API route change in R7-004
No DB migration in R7-004
No execution authority in R7-004
No role assignment mutation in R7-004
No raw secrets in R7-004
No MQTT/device command in R7-004
```
