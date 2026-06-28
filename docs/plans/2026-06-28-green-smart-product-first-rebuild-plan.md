# Green Smart Product-First Rebuild Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task only after the architecture baseline is accepted.

**Goal:** Green Smart를 누적식 패치 구조에서 벗어나, 농장 운영 흐름 중심의 제품 구조로 먼저 재설계한 뒤 운영/배포 스택을 재정리한다.

**Priority Order:** 제품 구조 리빌딩 → 운영 스택 리빌딩

**Architecture:** 1차 리빌드는 제품 구조 리빌딩이다. Home Assistant custom integration/HACS 형태는 유지하되 UI·API·DB·모델 경계를 `Crop / Environment / Irrigation / Device / Safety / Admin` 도메인으로 분리한다. 2차 리빌드는 `green_smart-deploy`에서 prod/dev/sandbox 운영 스택을 재정리하며, prod cutover는 별도 승인 Gate 뒤에만 수행한다.

**Tech Stack:** Home Assistant custom integration, Python HomeAssistantView, MariaDB/aiomysql, Vanilla JS Web Component, Docker Compose prod/dev stack, pytest contract tests, GitHub releases.

---

## 0. 왜 리빌딩이 필요한가

현재 `v1.11.16` 기준 진단 수치:

| 항목 | 현재 상태 | 리빌딩 판단 |
|---|---:|---|
| `panel/green-smart-panel.js` | 10,007 lines | UI 상태·렌더·API 호출·모달·도메인 로직이 한 파일에 과밀 |
| `crop_views.py` | 4,946 lines | 작기/생육/AI/리포트/인터록/품질/예측이 한 API 파일에 과밀 |
| `zone_control_views.py` | 2,737 lines | 환경/관수/장치/인터록/실행 경로가 한 파일에 과밀 |
| `docs/design/ui-information-architecture-and-rbac.md` | 기준 버전 `v1.9.56` | 현재 구현 `v1.11.16`와 문서 기준 괴리 |
| 전체 contract tests | 536 passed | 회귀 방어는 좋지만, 구조 정리는 테스트가 아니라 아키텍처 경계가 필요 |

결론: 기능은 돌아가지만, 계속 vertical slice를 누적하면 UI·API·문서가 더 무거워진다. 다음 단계는 신규 기능이 아니라 **제품 구조 리빌딩 baseline**이다.

---

## 1. 리빌딩 원칙

1. **Prod 안정성 우선:** 현재 `v1.11.16` 운영 반영 상태는 유지한다. 리빌딩 중 prod에 즉시 큰 변경을 넣지 않는다.
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

**Objective:** 현재 `v1.11.16`를 안전 기준선으로 고정하고 리빌딩 대상/보존 대상을 분리한다.

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

**Objective:** 오래된 `v1.9.56` 기준 IA/RBAC 문서를 `v1.11.16+` 기준으로 재정렬한다.

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

**Status:** `v1.11.16`에서 기준선 완료. 상세 산출물은 `docs/rebuild/frontend-decomposition-plan.md`.

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

**Status:** `v1.11.16`에서 기준선 완료. 상세 산출물은 `docs/rebuild/backend-api-decomposition-plan.md`.

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

**Status:** `v1.11.16`에서 기준선 완료. 상세 산출물은 `docs/rebuild/db-schema-rationalization-plan.md`.

**Objective:** 기존 테이블은 유지하면서 naming alias와 future migration 기준을 정한다.

**Rules:**
- `crop_seasons`는 당분간 유지하되 docs/API에서는 `crop_cycle` 호환 용어를 제공.
- 실제 migration은 별도 승인 전까지 금지.
- `farm_id + crop_season_id + zone_id + domain` 스코프를 `farm_id + crop_cycle_id + zone_id + domain` alias로 문서화.

### Phase R5 — Product rebuild execution slices

**Objective:** 실제 코드는 작은 vertical rebuild slice로만 이동한다.

| Slice | 범위 | Prod 위험 |
|---|---|---|
| RB-001 Admin/System shell 분리 | technical diagnostics/settings를 Admin 영역으로 이동하는 UI contract. `v1.11.16`에서 `panel/domains/admin/admin-page.js` render boundary extraction 완료 | 낮음 |
| RB-002 Panel API client adapter | `callApi` 직접 호출을 domain client로 감싸기. `v1.11.16`에서 `panel/core/api-client.js` baseline + targeted read-only call sites 연결 완료 | 낮음~중간 |
| RB-003 Crop read-only component extraction | 작물 목록/요약 read-only 렌더 분리. `v1.11.16`에서 `domains/crop/crop-readonly.js` baseline 완료 — read-only render helpers only, crop write modal/save/delete 변경 없음, DB/API 변경 없음 | 중간 |
| RB-004 Crop write modal extraction | 작기 write modal render helpers only. `v1.11.16`에서 `domains/crop/crop-write-modal.js` baseline 완료 — 정식 등록/작기 수정 modal HTML과 values helper만 분리, save/delete bindings remain in panel shell, API/DB 변경 없음, route path 변경 없음, response shape 변경 없음. `v1.11.16`에서 RB-004B Growth survey modal render extraction 완료 — `domains/crop/crop-growth-modal.js`, 생육조사 modal render helpers only, save/API bindings remain in panel shell. `v1.11.16`에서 RB-004C Pest scouting modal render extraction 완료 — `domains/crop/crop-pest-modal.js`, 병해충 예찰 modal render helpers only, autocomplete/API/save bindings remain in panel shell. `v1.11.16`에서 RB-004D Control/treatment modal render extraction 완료 — `domains/crop/crop-control-modal.js`, 방제 기록 modal render helpers only, PLS/혼용 warning render markers preserved, pesticide/API/save bindings remain in panel shell | 중간 |
| RB-005 Safety/Execution UI proximity | `v1.11.16`에서 실행성 UI 근접 안전 요약 baseline 완료 — `data-zone-execution-proximity-safety-summary`, SafetyGuard/Interlock/Fail Safe summary near execution-capable controls, Dry Run/운영자 최종 실행 버튼 앞에 SafetyGuard → Interlock → Fail Safe → State verification 요약 배치, virtual rehearsal before physical device hookup 안내, 실행 semantics 변경 없음, API/DB 변경 없음, device execution 변경 없음, actual service call authority 변경 없음 | 중간~높음 |
| RB-006 Backend crop service/repo extraction | route path 유지, 내부만 분리. `v1.11.16`에서 RB-006A Crop read-only service/repo boundary, RB-006B Crop record read-only repositories, RB-006C Crop season write service/repo boundary, RB-006D Crop model/report service boundary 완료 — `services/crop_service.py`, `repositories/crop_repo.py`, `GET /api/green_smart/crop/seasons`, `growth/pest/control read GET helpers`, `list_growth_records`, `list_pest_records`, `list_control_records`, `create/update/delete/demolish write helpers`, `create_crop_season`, `update_crop_season`, `demolish_crop_season`, `hard_delete_crop_season`, `growth-report GET service boundary`, `growth_report_response`, growth/pest/control write 경로 변경 없음, Center sync scheduler 변경 없음, route path 변경 없음, response shape 변경 없음, DB migration 없음 | 중간 |
| RB-007 Environment/Irrigation/Device service split | zone_control adapter 유지, service 분리 | 높음 |

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
