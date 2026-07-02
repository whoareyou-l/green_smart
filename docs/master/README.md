# Green Smart 5대 마스터 문서

> 기준일: `2026-06-27`
> 기준 버전: `v1.14.46`
> 목적: 뒤엉킨 Green Smart 코드와 문서를 **설계 기반(Design-Driven)** 으로 재정렬하고, 이후 모든 구현을 **문서 우선 + 수직 슬라이드(Vertical Slide)** 방식으로 진행하기 위한 최상위 마스터 문서 묶음.

## 0. 절대 원칙

1. **Docs First**: 기능 구현/수정 전 반드시 관련 마스터 문서를 먼저 갱신한다.
2. **Vertical Slide**: UI만, DB만, MQTT만 따로 만들지 않는다. 작은 기능 하나를 `UI → Frontend Service → Backend Router/View → MQTT/HA Entity → DB/Log → Logic/Interlock → Test`까지 관통시킨다.
3. **Safety First**: AI output은 직접 실행 명령이 아니다. 모든 실행은 `Control Mode → Limited Auto → Operator Confirmation → SafetyGuard → Interlock → Entity Mapping → State Verification → Log`를 통과한다.
4. **현장 장비 Gate**: 실제 장비/MQTT 직접 연결은 normal/strong-wind/rain/low-temp/sensor-fault/blocked/Fail Safe/recovery virtual rehearsal 전까지 금지한다.
5. **역할 기반 UI**: `admin`, `farm_owner`, `farm_staff`가 보는 정보와 할 수 있는 동작을 분리한다.
6. **State Propagation**: 작기/구역 변경은 `@crop-cycle-changed` 이벤트로 모든 모듈에 전파하고 각 모듈은 즉시 re-fetch한다.
7. **Data Key 단일화**: API/MQTT/DB JSON은 `relative_humidity_pct`, `roof_window_open_pct`, `current_position_pct` 등 snake_case 표준키만 사용한다.
8. **Edge 단선 감지**: 현장 Edge는 MQTT LWT로 `{"status":"offline","reason":"lwt_disconnect"}`를 등록하고 backend는 자동 실행을 차단한다.
9. **RBAC는 Backend에서 강제**: UI 버튼 숨김은 보조일 뿐 모든 write/execute route는 permission middleware로 차단한다.
10. **대용량 센서 데이터 관리**: `sensor_logs`는 `measured_at` 월별 partition과 1년 초과 cold storage/purge 정책을 따른다.
11. **Interlock Priority**: Level 1 강풍/강우 폐쇄 > Level 2 저온 확산 방지 > Level 3 고온/고VPD 개방 제어 순서를 절대 우선한다.
12. **Mobile WebView Keyboard Safety**: 입력 모달은 `visualViewport` 기반 높이 재계산, sticky primary action, body-scroll-lock으로 가상 키보드에 의해 등록/승인 버튼이 가려지지 않게 한다.
13. **Soft Fallback Alerting**: 센서 이상으로 VPD soft fallback이 발생하면 `SENSOR_FALLBACK_WARNING`을 safetyRouter에 등록해 `MOD-EmergencyBanner`에 즉시 노출한다.

## 1. 문서 목록

| 번호 | 문서 | 역할 | 구현 전 반드시 확인하는 경우 |
|---:|---|---|---|
| 1 | [CBA 화면 기획서](./01-cba-ui-ux-spec.md) | Shared Components / Feature Modules / Pages 기준 UI·DOM 설계도 | 화면, 카드, 모달, 탭, RBAC 표시, 모바일 UX 변경 |
| 2 | [통신 명세서](./02-interface-spec.md) | Frontend service, Backend API, MQTT/HA service 통신 계약 | API, MQTT, HA service, frontend fetch/callApi 변경 |
| 3 | [DB 구상도](./03-database-schema.md) | RBAC, greenhouse/device, crop_cycle, sensor/control log 물리 스키마 | 테이블, migration, 인덱스, audit/log 변경 |
| 4 | [통합 시나리오 흐름도](./04-workflow-diagrams.md) | UI/API/DB/MQTT/하드웨어 신호 흐름 | 센서 수집, 수동 제어, 비상 상황, recovery 작업 |
| 5 | [로직 알고리즘 및 예외처리 명세서](./05-ml-interlock-failsafe-spec.md) | VPD 계산, PID/제어 알고리즘, SafetyGuard, Interlock, 인터넷 단절·센서 고장·장비 오류 Fail-Safe | 시스템 연산 규칙, 비상 상황, 예외처리, AI/제어/안전 로직 변경 |

## 2. 수직 슬라이드 개발 템플릿

```text
VS-XXX: 기능명
예: VS-001 실시간 온도/습도/VPD 모니터링
예: VS-002 천창 개폐 제어 Dry Run
예: VS-003 상추 작기 생육조사 입력
```

### 2.1 Vertical Slide Definition of Done

- [ ] CBA 문서에 UI Component / Module / Page 반영
- [ ] 통신 명세서에 frontend service + backend route + MQTT/HA service 반영
- [ ] DB 구상도에 table/index/log/audit 영향 반영
- [ ] Workflow 문서에 sequence 반영
- [ ] ML/Interlock 문서에 safety rule/fail-safe 영향 반영
- [ ] UI 구현
- [ ] Frontend service 구현
- [ ] Backend API/View 구현
- [ ] DB migration/bootstrap 구현
- [ ] MQTT 또는 HA entity/service mapping 구현
- [ ] Interlock/SafetyGuard 적용
- [ ] contract/unit/rendered smoke 테스트
- [ ] Prod HA config check
- [ ] Git commit/tag/release

## 3. 첫 수직 슬라이드 후보

| 우선순위 | Vertical Slide | 이유 |
|---:|---|---|
| 1 | VS-001 실시간 온도/습도/VPD 모니터링 | 센서 → DB → UI → 알림의 가장 얇은 관통 슬라이스 |
| 2 | VS-002 천창 개폐 Dry Run 제어 | actuator 제어의 핵심. 실제 실행 전 Dry Run/Safety/Log 검증 가능 |
| 3 | VS-003 상추 작기 등록 및 생육조사 입력 | crop_cycle 기반 데이터 격리와 농장직원 기록 흐름 검증 |
| 4 | VS-004 센서 고정값 감지 Fail-Safe | 운영 안전성과 ML 입력 신뢰도 확보 |
| 5 | VS-005 farm_owner 승인 gate | RBAC + 승인 + audit log의 핵심 슬라이스 |

## 4. From-scratch rebuild 기준선

현재 active work는 기존 VS/RB를 계속 진행하는 것이 아니라 `from-scratch rebuild 기준선`을 확정하는 것이다.

| 기준 문서 | 역할 |
|---|---|
| `docs/rebuild/target-architecture.md` | 기존 RB 산출물을 reference/evidence로만 사용하고 새 target architecture를 정의 |
| `docs/rebuild/master-docs-gap-inventory.md` | 5대 master docs의 gap과 질문 gate를 정리 |
| `docs/plans/2026-06-28-from-scratch-rebuild-execution-plan.md` | 단계별 실행 계획과 질문 기준 |

첫 vertical rebuild slice는 Stage 3에서 사용자 질문 후 선택한다.

## 5. Historical reference — VS-003 상추 작기 등록 및 생육조사 입력

VS-003은 과거 기준에서 `farm_staff`가 패널에서 상추 작기를 등록하고 같은 `crop_cycle` 기준으로 생육조사를 입력하는 최소 운영 흐름이었다. 현재는 active 진행 항목이 아니라 새 리빌딩 설계 시 참고할 historical/reference evidence다.

| Layer | historical/reference 계약 |
|---|---|
| UI | `data-vs003-lettuce-crop-cycle-card`, `data-vs003-lettuce-growth-survey-card`, `data-vs003-lettuce-l-index-fields` |
| API | POST `/api/green_smart/crop/seasons`, GET/POST `/api/green_smart/crop/seasons/{crop_cycle_id}/growth` |
| DB | 현재 물리 테이블 `crop_seasons`를 설계명 `crop_cycle`/`crop_cycles` 호환 row로 사용하고, `growth_surveys.metrics_json`에 상추 L-Index 입력값을 저장 |
| 작물 | `lettuce` |
| 생육 지표 | `L-Index`: `leafLength`, `leafWidth`, `leafCount`, `freshWeight`, `plantHeight` |
| 권한 | `farm_staff`는 `crop.write`, `growth_survey.write` 범위의 기록 입력 담당 |


## R5 Foundation Completion Baseline

`v1.14.46`에서 R5 foundation closure를 완료했다.

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

`v1.14.46`에서 R6-001 Crop cycle read-only adapter를 완료했다.

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

`v1.14.46`에서 R6-002 Monitoring read-only adapter를 완료했다.

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

`v1.14.46`에서 R6-003 Safety/Interlock read-only adapter를 완료했다.

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

`v1.14.46`에서 R7-000 IA blueprint를 완료했다.

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

`v1.14.46`에서 R7-001 main dashboard redesign을 완료했다.

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

`v1.14.46`에서 R7-002 sidebar navigation + page shell을 완료했다.

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

`v1.14.46`에서 R7-003 detail/configuration subpages baseline을 완료했다.

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

`v1.14.46`에서 R7-004 settings/admin read-only detail을 완료했다.

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
