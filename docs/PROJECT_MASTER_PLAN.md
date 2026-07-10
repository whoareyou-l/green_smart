# Green Smart Project Master Plan

> 기준일: 2026-06-20
> 기준 repo: `/home/smartfarm/green_smart`
> 기준 버전: product code `v1.9.56`, Crop Stage Diagnosis DB/API baseline, Crop Interlock C-S2 baseline, Crop Safety Rules C-S1B PLS/mix/growth anomaly baseline, Model Phase M1 crop model snapshot baseline, UI Polish Phase P4 crop-season-style control zone selector and DB bootstrap closure baseline, Control Phase C19D virtual rehearsal evidence baseline
> 신규 기준 문서: `.omc/plans/green-smart-master-plan.md`
> 기존 기준 문서: `docs/PROJECT_GUIDE.md`, `docs/design/zone-control-roadmap-and-data-model.md`

## 1. 목적

이 문서는 기존 Green Smart 제품 문서/코드와 새 마스터 플랜을 하나의 실행 기준으로 정렬한다. 앞으로 구현은 이 문서와 Phase 0 산출물 전체를 기준으로 진행한다.

> **현재 우선순위 전환:** `v1.15.08` 이후 신규 기능 수직 슬라이스는 일시 중단하고, [`docs/plans/2026-06-28-green-smart-product-first-rebuild-plan.md`](plans/2026-06-28-green-smart-product-first-rebuild-plan.md)에 따라 **제품 구조 리빌딩 → 운영 스택 리빌딩** 순서로 진행한다. **기존 RB 산출물은 reference/evidence로만 사용**하며, 다음 RB 계속 진행 금지: 새 구현은 `새 master docs → 새 target architecture → 새 vertical slice scaffold` 순서의 from-scratch rebuild 기준선에서 시작한다.

Green Smart의 최우선 목표는 다음이다.

```text
AI가 작동하지 않아도 문제가 생기지 않게 인터록/안전 제어를 먼저 완성하고,
이후 AI 자동화를 단계별로 붙일 수 있는 확장 가능한 Home Assistant 기반 구조를 만든다.
```

## 2. 현재 repo 현황 요약

### 2.0 상세 기준 문서 색인

이 마스터플랜은 앞으로 작업의 최상위 기준 문서다. 다만 UI/DB/API/Backend/HA 세부사항을 모두 이 파일에 직접 넣으면 문서가 비대해지므로, 상세 기준은 아래 문서로 분리한다. 앞으로 기능 구현/수정/검증을 시작하기 전에 관련 상세 문서를 먼저 읽고, 구현 결과가 바뀌면 해당 문서와 이 마스터플랜을 함께 갱신한다.

| 상세 기준 문서 | 담당 범위 | 반드시 읽어야 하는 작업 |
|---|---|---|
| [`docs/design/current-ui-design-and-navigation.md`](design/current-ui-design-and-navigation.md) | 사용자 선호 디자인, 사이드바, 모바일 topbar, Home/Crop/환경/관수/장치 페이지, 하위탭, 설정값, data attribute, no-flicker UI 정책 | UI/UX, 페이지 구조, 탭, 카드, 입력값, WebView flicker, 디자인 변경 |
| [`docs/design/ui-information-architecture-and-rbac.md`](design/ui-information-architecture-and-rbac.md) | UI 요소 배치 원칙, 비전공자 농장주/직원 UX, RBAC 역할(admin/farm_owner/farm_staff), 역할별 페이지/기능 권한 | 화면이 뒤죽박죽 섞이는 문제 정리, 역할별 UI, 권한, 쉬운 용어/작업 흐름 설계 |
| [`docs/plans/2026-06-22-ui-rbac-reorganization-implementation-plan.md`](plans/2026-06-22-ui-rbac-reorganization-implementation-plan.md) | 새 UI/RBAC 기준을 실제 개발로 옮기기 위한 단계별 실행 플랜, 불필요 요소 정리, merge/split/module화, 모호성 10% 이하 질문 gate | UI/RBAC 재구성 구현 착수 전, Phase U0~U8 작업 분해/검증/질문 기준 |
| [`docs/plans/2026-06-23-integrated-crop-environment-irrigation-device-models.md`](plans/2026-06-23-integrated-crop-environment-irrigation-device-models.md) | 작기 모델, 환경 전략 모델, 관수 전략 모델, 장치 운영 모델을 관계형으로 구현하기 위한 Model Phase M0~M8 실행 플랜 | 전략/AI/model/예측/장치 운영 모델 작업 착수 전, MVP 용어 정리와 모델 관계 구현 기준 |
| [`docs/design/current-backend-api-db-ha-contract.md`](design/current-backend-api-db-ha-contract.md) | HA integration lifecycle, panel registration, DB schema, API routes, zone control, strategy preview, SafetyGuard, execution flow, virtual entities | Backend/API/DB/schema, SafetyGuard, final target execution, HA service call, virtual device, 운영 smoke |
| [`docs/design/zone-control-roadmap-and-data-model.md`](design/zone-control-roadmap-and-data-model.md) | 제어 기능 로드맵과 데이터 모델 관계 | Control Phase 추가/변경, DB/API 관계 변경 |
| [`docs/design/api-spec.md`](design/api-spec.md) | 초기 API spec baseline | public API 형태를 정리하거나 wrapper API를 변경할 때 |
| [`docs/design/data-model.md`](design/data-model.md) | 초기 data model baseline | schema 확장, migration 설계 |
| [`docs/master/03-database-schema.md`](master/03-database-schema.md) | RBAC-first target DB schema, `gs_` target tables, crop_cycle/currentCrop canonical naming, legacy adapter boundary | DB 스키마/테이블/필드 재설계, RBAC-first schema, migration gate |
| [`docs/rebuild/db-schema-rationalization-plan.md`](rebuild/db-schema-rationalization-plan.md) | legacy physical schema를 adapter-only로 격리하고 target schema/migration gate를 관리 | legacy→target schema 전환 정책, migration 승인 기준 |
| [`docs/rebuild/legacy-direction-inventory.md`](rebuild/legacy-direction-inventory.md) | legacy direction inventory: historical reference / adapter-only / legacy panel / current source-of-truth boundary | legacy 흔적 분류, 제품 방향성 누수 방지, 신규 수직 슬라이스 경계 |
| [`docs/design/control-engine-contracts.md`](design/control-engine-contracts.md) | control engine/SafetyGuard 계약 | 실행/차단/Fail Safe/로그 계약 변경 |
| [`docs/design/home-assistant-integration-contract.md`](design/home-assistant-integration-contract.md) | HA integration contract | HA setup lifecycle, panel registration, entity/platform 변경 |

상세 문서 기준의 현재 핵심 사실:

```text
UI runtime: Home Assistant panel_custom + Vanilla JS Web Component
Sidebar pages: home, crop, environment, irrigation, device
Design preference: Modern SaaS greenhouse dashboard + 카드형 운영 UI + 안전/인터록 우선 UX
UX/RBAC baseline: 비전공자 농장주·농장직원용 직관 UI + admin/farm_owner/farm_staff 역할별 페이지/기능 권한 + HA 사용자 ID 기반 역할 매핑
DB/API scope: farm_id + crop_season_id + zone_id + domain
Execution path: final target → Control Mode → Limited Auto → Operator Confirmation → SafetyGuard → HA service call → state verification → log
Physical device gate: C20 전까지 실제 장비 연결 금지, virtual HA entities/rehearsal 우선
```

### 2.1 제품 형태

Green Smart는 독립 웹서비스가 아니라 Home Assistant 위에서 동작하는 HACS-compatible custom integration이다.

| 계층 | 현재 기준 |
|---|---|
| Runtime | Home Assistant custom integration |
| Backend | Python `HomeAssistantView` 기반 API |
| Frontend | Vanilla JavaScript Web Component |
| HA UI | `panel_custom` sidebar panel |
| DB | MariaDB + `aiomysql==0.2.0` |
| 배포 | HACS-compatible `custom_components/green_smart` |
| 테스트 | pytest static/contract tests + `node --check` |

### 2.2 주요 코드

| 파일 | 역할 |
|---|---|
| `custom_components/green_smart/__init__.py` | integration setup, DB bootstrap, view/panel registration. R3 기준으로 장기적으로 scheduler/view registration shell로 축소 |
| `custom_components/green_smart/db.py` | MariaDB pool/query/schema bootstrap. R3/R4 이후 domain DB query는 repositories로 이동, schema migration은 명시 승인 전 금지. 현재 physical schema는 `crop_seasons`/`crop_season_id` 유지 |
| `custom_components/green_smart/crop_views.py` | 현재 작기/생육/병해충/방제 API monolith이며, R3 이후 route compatibility adapter로 점진 축소. RB-006A/B/C/D 이후 crop seasons GET, growth/pest/control GET, 작기 create/update/delete/demolish, growth-report GET은 service/repo 또는 service boundary로 delegate |
| `custom_components/green_smart/services/crop_service.py` | RB-006A/B/C/D Crop service boundary. `CropReadActor`, `CropWriteActor`, `view_crop_records`/`edit_crop_records`/`delete_crop_records` permission smoke, crop seasons + growth/pest/control read delegation, create/update/delete/demolish write helpers, growth_report_response service boundary |
| `custom_components/green_smart/repositories/crop_repo.py` | RB-006A/B/C Crop repository. `GET /crop/seasons`, growth/pest/control legacy SELECT SQL, crop season create/update/delete/demolish SQL 소유 |
| `custom_components/green_smart/weather_api.py`, `weather_views.py`, `kma_grid.py` | KMA/PSIS 연동 |
| `custom_components/green_smart/central_api.py`, `central_store.py`, `central_views.py` | central activation/token/allowlisted adapter baseline |
| `custom_components/green_smart/zone_control_views.py` | 현재 zone control, AI output, final target, entity mapping, execution/safety/log API monolith이며, R3 이후 domain service/repository로 점진 분리 |
| `custom_components/green_smart/frontend_panel.py` | HA sidebar panel registration. R2 기준으로 public module URL은 `/green_smart_panel/green-smart-panel.js?v={manifest.version}` 유지 |
| `custom_components/green_smart/panel/green-smart-panel.js` | 현재 전체 Green Smart panel UI이며, R2 이후 compatibility shell/public custom element entrypoint로 유지. RB-005 Safety/Execution UI proximity: `data-zone-execution-proximity-safety-summary`로 SafetyGuard/Interlock/Fail Safe summary near execution-capable controls를 Dry Run/운영자 최종 실행 버튼 앞에 배치, 실행 semantics 변경 없음, API/DB 변경 없음, device execution 변경 없음, actual service call authority 변경 없음, virtual rehearsal before physical device hookup |
| `custom_components/green_smart/panel/core/api-client.js` | RB-002 Panel API client adapter. `hass.callApi` route/response shape를 바꾸지 않는 thin wrapper |
| `custom_components/green_smart/panel/domains/admin/admin-page.js` | RB-001 Admin/System render boundary module. lifecycle/binding/storage는 panel shell에 유지 |
| `custom_components/green_smart/panel/domains/crop/crop-readonly.js` | RB-003 Crop read-only render helper module. 작기 설정 summary/list/record-row HTML만 분리하며 write modal/save/delete는 panel shell에 유지 |
| `custom_components/green_smart/panel/domains/crop/crop-write-modal.js` | RB-004 Crop write modal render helper module. 정식 등록/작기 수정 modal HTML과 values helper만 분리하며 save/delete bindings는 panel shell에 유지 |
| `custom_components/green_smart/panel/domains/crop/crop-growth-modal.js` | RB-004B Growth survey modal render helper module. 생육조사 metric/품질·생리장해 modal HTML만 분리하며 save/API bindings는 panel shell에 유지 |
| `custom_components/green_smart/panel/domains/crop/crop-pest-modal.js` | RB-004C Pest scouting modal render helper module. 병해충 예찰 modal/row HTML만 분리하며 autocomplete/API/save bindings는 panel shell에 유지 |
| `custom_components/green_smart/panel/domains/crop/crop-control-modal.js` | RB-004D Control/treatment modal render helper module. 방제 기록 modal/약제 row HTML만 분리하며 PLS/혼용/API/save bindings는 panel shell에 유지 |
| `docs/rebuild/frontend-decomposition-plan.md` | R2 frontend module boundary, HA loading strategy, first extraction slice 기준 |
| `docs/rebuild/backend-api-decomposition-plan.md` | R3 backend route compatibility, service/repository boundary, first extraction slice 기준 |
| `docs/rebuild/db-schema-rationalization-plan.md` | R4 DB/schema naming alias, scope key, migration gate 기준 |

### 2.3 현재 구현된 제어 루프

```text
작기/구역/domain scope
→ zone_control_settings
→ ai_zone_control_outputs
→ zone_final_control_targets
→ zone_device_entity_mappings
→ HA service call
→ interlock/fail safe
→ pre/post state verification
→ zone_control_logs
→ panel 실행/안전 로그 카드
```

### 2.4 현재 핵심 DB 테이블

```text
zones
crop_seasons
growth_surveys
pest_surveys
control_records
control_pesticides
zone_control_settings
ai_zone_control_outputs
zone_final_control_targets
zone_device_entity_mappings
zone_control_logs
zone_control_copy_jobs
```

## 3. 채택된 새 기준

아래 항목은 기존 문서/코드와 방향 충돌이 없거나, 현재 사용자 지시로 새 기준을 우선 적용하기로 정렬한다.

| 항목 | 채택 기준 |
|---|---|
| 제품 형태 | Home Assistant custom integration/HACS 구조 유지 |
| 장비 제어 | Home Assistant entity/service call 중심 |
| 실제 장비 통신 | MQTT/Modbus/PLC/릴레이는 HA entity 뒤쪽으로 숨김 |
| 제어 단위 | Zone = 같은 작물/생육 목표/센서 대표값/장비 묶음을 공유하는 최소 제어 단위 |
| MVP 작물 | 토마토 + 상추 최소 지원 |
| 자동화 우선순위 | AI보다 인터록/안전 제어 먼저 완성 |
| AI output | final target 후보일 뿐이며 Safety Guard/Interlock 통과 후 실행 |
| MVP 알림 | Green Smart panel + Home Assistant persistent notification |
| 현장 부저/경광등 | MVP/기본 로드맵 제외 |
| 데이터 저장 | MariaDB는 전략 판단 스냅샷 + final target + control log 중심 |
| 전략 스냅샷 | 5분마다 저장 + target 변경 시 즉시 저장 |
| raw sensor 장기 시계열 | HA recorder/InfluxDB에 위임 |
| 운영 형태 | 고객 현장은 Linux NUC + Docker 기반 edge appliance |
| 오프라인 안전 | 인터넷 단절 시에도 현장 NUC/HA/Green Smart 로컬 인터록과 로컬 제어 동작 |
| repo 역할 | `green_smart` 제품 코드, `green_smart-deploy` 현장 배포/운영 구성 |

## 4. 충돌/정렬 표

| 항목 | 기존 기준 | 새 마스터 플랜 기준 | 현재 코드 영향 | 추천 선택지 | 사용자 결정 필요 여부 |
|---|---|---|---|---|---|
| Phase 번호/순서 | 기존 제어 roadmap은 Control Phase C1~C13 완료 후 C14 Dry Run UI를 다음 단계로 제안 | 새 플랜은 Phase 1 기반 모델+대시보드+인터록 설정, Phase 2 안전 실행 완성 등으로 재정렬 | 코드 영향 없음. 문서 로드맵만 재해석 필요 | 기존 제어 단계는 Control Phase C1~C21로 분리하고, 제품 기능은 Phase 1~6 로드맵 사용 | 사용자가 새 순서를 명시했으므로 이번 문서에서는 채택. Control Phase C14~C21 표현으로 정리 완료 |
| Safety rule 범위 | 현재 실행 경로의 payload 기반 `_safety`, unavailable 차단, safe_state 중심 | 이벤트 기반 + 실행 직전 + 1분 fallback, 센서 무결성/강풍/저온/고온/VWC/EC 등 독립 Safety Guard | 현재 구현은 기반만 있음. 별도 safety engine/table/notification 필요 | Phase 1~2에서 migration 없이 추가 테이블/API로 확장 | 아니오, gap으로 처리 |
| Panel refresh | 현재 panel에는 simulation 3초, chart 60초, weather/watchdog 10분 등 도메인별 주기가 남아 있음. Phase 1C에서 제어 API 카드 refresh는 5초 요소별 patch로 정렬됨 | panel 기본 5초, 전체 재렌더 금지, 요소별 갱신 | 환경/관수/장치제어의 인터록/Entity 상태/실행 로그 카드는 `_refreshZoneControlElements({ patchOnly: true })`로 `_update()` 없이 갱신. chart/weather/watchdog는 별도 목적 주기로 유지 | Phase 2부터 SafetyGuard 관련 카드도 같은 element refresh 패턴 사용 | 아니오, Phase 1C에서 기반 완료 |
| DB 저장 범위 | 현재는 설정/AI output/final target/control log 중심. strategy snapshot 전용 테이블 없음 | 전략 판단 스냅샷 5분 + target 변경 즉시 저장. raw sensor 장기 저장은 HA recorder/InfluxDB | `zone_strategy_snapshots` 등 신규 테이블/API 필요 | 기존 테이블 유지, 신규 snapshot/event 테이블 추가 migration task | 아니오, gap으로 처리 |
| 알림 | 현재 panel 알림/로그 중심, HA persistent notification 계약 없음 | MVP 알림은 panel + HA persistent notification | backend service call 또는 HA persistent_notification 연동 필요 | Phase 2/5에서 critical safety event부터 추가 | 아니오, gap으로 처리 |
| SaaS/edge 확장 | 기존 docs는 farm_id 중심, deploy repo 분리 언급 | customer/site/edge 확장 가능, Linux NUC + Docker edge appliance, 오프라인 인터록 | 즉시 schema 변경은 위험. 향후 식별자 확장 여지 필요 | 현재 `farm_id` 유지, Phase 0 data model에 확장 슬롯 명시, 실제 migration은 별도 승인 | 예: `customer_id/site_id/edge_id`를 언제 DB에 추가할지 후속 결정 필요 |
| Crop profile | 현재 crop_type/dynamic metrics 중심. 토마토/상추 전용 전략 엔진 없음 | MVP 작물 토마토+상추, CORP/TEMHUM/IRR 전략 구현 | 신규 strategy module/table/API 필요 | Phase 3~4에서 CropProfile contract부터 추가 | 아니오, gap으로 처리 |

## 5. 현재 확정 로드맵

### Phase 0. 기준 문서/계약 정렬

산출물:

- `docs/PROJECT_MASTER_PLAN.md`
- `docs/design/current-ui-design-and-navigation.md`
- `docs/design/ui-information-architecture-and-rbac.md`
- `docs/plans/2026-06-22-ui-rbac-reorganization-implementation-plan.md`
- `docs/design/current-backend-api-db-ha-contract.md`
- `docs/design/system-architecture.md`
- `docs/design/data-model.md`
- `docs/design/control-engine-contracts.md`
- `docs/design/api-spec.md`
- `docs/design/home-assistant-integration-contract.md`

### Phase 1. 기반 모델 + 대시보드 + 인터록 설정 화면

현재 Phase 1A/1B/1C/1D/1E 완료:

```text
zone_interlock_settings DB table
zone_control_modes DB table
GET/POST /api/green_smart/zones/interlock-settings
GET/POST /api/green_smart/zones/control-mode
GET /api/green_smart/zones/entity-state-summary
환경/관수/장치제어 공통 인터록 설정 카드 골격
환경/관수/장치제어 공통 세부 인터록 rule builder UI
환경/관수/장치제어 공통 제어 모드 카드
환경/관수/장치제어 공통 Entity 상태 요약 카드
제어 페이지 5초 요소별 갱신 loop + dirty state 보존
manual/auto/assist/disabled execution pre-gate
```

남은 목표:

- HA persistent notification 계약을 critical safety event와 연결

### Phase 2. 인터록/안전 실행 완성

현재 Phase 2A/2B/2C/2D/2E 완료:

```text
SafetyGuard helper 분리
zone_interlock_settings.settings_json + final_target._safety policy merge
unavailable/unknown/above/below/equals rule matcher baseline
wind_speed_above/temperature_below/temperature_above/VWC/EC/sensor_integrity semantic preset baseline
reasonCode/actualValue/threshold ruleResult detail
blocked/failsafe/clear result schema
execution response/log safetyGuard summary
panel 실행/안전 로그 SafetyGuard 요약 표시
panel rule builder semantic condition option + reasonCode 입력
SafetyGuard watchdog API baseline
1분 fallback 검사 marker + staleThresholdSeconds baseline
criticalEvents response + persistent_notification.create hook
panel SafetyGuard Watchdog 카드
async_track_time_interval 기반 1분 scheduler
stale timestamp age policy
persistent notification dedup baseline
SafetyGuard event history API
acknowledged/cleared lifecycle action
panel SafetyGuard 이벤트 이력 카드
```

남은 목표:

- Safety Guard 독립 계층화
- 이벤트 기반 + 실행 직전 + 1분 fallback 검사
- 강풍/저온/고온/센서 무결성/EC/VWC/unavailable 차단
- panel + HA persistent notification 알림

### Phase 3. 환경 전략 모델 baseline

현재 Phase 3A/3B 완료:

```text
작기 모델 입력 기반 CORP 기본 G-Index
TEMHUM ADT/DIF/VPD 환경 전략 모델
VENT/SCRN 기본 final target 생성
입력 소스 HA 상태/날씨/수동 보정 merge
Preview Diff / latest final target 비교
```

### Phase 4. 관수 전략 모델 baseline

현재 Phase 4 완료:

```text
작기+환경 모델 입력 기반 IRR EC/pH/VWC/드라이백/일사 누적 관수
VWC 하한 긴급 관수 marker
관수 final target 생성/저장
관수 Preview Diff / latest final target 비교
```

### Phase 5. 제한적 자동제어와 알림 강화

현재 Phase 5 완료:

```text
장비군별 자동 허용 스위치
반자동/제한적 자동 실행 정책 gate
알림 확인/조치/재개 요청 lifecycle
기존 zone_control_settings 기반 저장으로 DB migration 회피
```

### Phase 6. 생육 리포트와 예측

현재 Phase 6 baseline 완료:

```text
GET /api/green_smart/crop/seasons/{season_id}/growth-report
기존 crop_seasons/growth_surveys/pest_surveys/control_records 집계
생육 추세 height/leafCount/stemDia
G-Index 추이 baseline
수확량 예측 baseline(작물별 tomato/lettuce/generic 모델, 주당/면적당 예측, confidence 표시)
병해 위험도 baseline(최근 pest severity + weather cache + 환경/날씨 risk + 방제 이력)
주간 리포트 summary/actions/exportCsv/exportText/notificationDraft
주간 리포트 CSV 내보내기 UI
주간 리포트 HA persistent notification 전송 API/UI
병해충 예찰 추가 팝업: 현재 작기 기준 발생 위치 + 전체/부분 드롭다운 + 상세 위치
병해충 예찰 추가 팝업: 농약 API 자동완성 기반 다중 병해충 입력
방제 기록 추가 팝업: 현재 작기 기준 처리 위치 + 전체/부분 드롭다운 + 상세 위치
작물별 수확 모델 상세 UI(모델명/version, 주당 예측, 면적당 예측, 예측 근거)
병해 위험 모델 상세 UI(환경 위험, 날씨 위험, 방제 이력, 위험 요인, 권장 조치)
작기 선택 카드 crop key 한국어 표시
```

남은 목표:

- 작물별 모델 계수 현장 데이터 기반 calibration
- 병해 위험도 모델 현장 데이터 기반 calibration


## 6. Control Stabilization Track

마스터플랜의 `Phase N`은 제품 기능 축을 의미한다. 제어/현장 안정화 작업은 번호 충돌을 피하기 위해 별도 접두어 `Control Phase Cn`을 사용한다.

| Control Phase | 상태 | 목표 | 완료 기준 |
|---:|---|---|---|
| C1 | 완료 | 공통 작기/구역 Scope Bar | 모든 제어 domain이 동일 scope를 사용 |
| C2 | 완료 | 작기+구역별 localStorage 분리 저장 | zone별 local cache 격리 |
| C3 | 완료 | 저장 대상/마지막 저장 UX | 저장 scope와 timestamp 표시 |
| C4 | 완료 | 구역별 설정 복사 | 같은 작기 내 zone 설정 복사 |
| C5 | 완료 | DB/API 설계 문서 및 방향 수립 | zone control data model 확정 |
| C6 | 완료 | backend/API 저장 구조 구현 | core control tables/API 사용 가능 |
| C7 | 완료 | AI output/final target 저장 API | AI 후보와 실행 대상 분리 저장 |
| C8 | 완료 | UI에서 AI output/final target 조회/적용 | 운영자가 후보를 final target으로 승격 |
| C9 | 완료 | HA Entity 매핑 DB/API/UI | domain mapping 관리 가능 |
| C10 | 완료 | final targets → HA service call 실행 | HA service call plan/execute 연결 |
| C11 | 완료 | 실행 전/후 entity state 수집 및 검증 | pre/post state verification 기록 |
| C12 | 완료 | 인터록 / Fail Safe 실행 차단 엔진 | blocked/failsafe/clear 판단 |
| C13 | 완료 | 운영 UI 실행/안전 로그 카드 | 실행/차단/검증 로그 확인 |
| C14 | 완료 | Dry Run UI | 실제 실행 전 예정 service call, 차단, Fail Safe, 현재 상태 확인 |
| C15 | 완료 | Entity Mapping 검증 | entity 존재, domain/service 호환성, safe_state 유효성 검사 |
| C16 | 완료 | 실시간 Safety Rule | 풍속/강우/저온/탱크수위/펌프 fault 등 HA sensor 기반 차단 |
| C17 | 완료 | 운영 모드/권한/확인 UX | Dry Run 후 실행, 위험 제어 이중 확인, 관리자 실행 제한 |
| C18 | 완료 | 현장 리허설/시나리오 테스트 준비 | 정상/강풍/강우/저온/센서 고장/차단/Fail Safe/복구 readiness API/UI |
| C19 | 완료 | 가상 장치 기반 리허설 테스트 하네스 | 실제 장비 연결 전 인터록·운영 알고리즘·UI/운영자 UX 시뮬레이션 |
| C19B | 완료 | 가상 HA 엔티티 생성 | virtual mode에서 sensor/binary_sensor/switch/cover 엔티티 생성 |
| C19C | 완료 | 관수설정 초기 진입 no-flicker hydration | 초기 API hydration은 in-flight/patchOnly로 묶고 전체 재렌더 없이 카드 단위 갱신 |
| C19D | 완료 | 가상 리허설 시나리오 증거 리포트 | 정상/강풍/강우/저온/센서 고장/차단/Fail Safe/복구 가상 시나리오 pass-rate와 C20 gate 증거 표시 |
| C20 | 남음 | 제한적 실제 현장 리허설 | C19 가상 리허설 통과 후 정상/강풍/고장/차단/복구 실제 현장 검증 |
| C21 | 남음 | 실제 장비 연결/운영 Runbook | mapping, safe_state, dry run, 긴급정지, 복구 절차와 physical device 연결 절차 문서화 |

운영 안정성 기준으로는 `C14~C19D` 완료 상태이며, **가상 HA 엔티티 기반 리허설 테스트 하네스, 관수설정 no-flicker hydration, C20 gate 전 가상 시나리오 증거 리포트**까지 도달했다. 실제 장비 연결은 아직 금지이며, 인터록·운영 알고리즘·UI/운영자 UX가 가상 장치/시뮬레이션에서 충분히 검증된 뒤 C20 제한적 실제 현장 리허설로 넘어간다. 제품 기능 기준으로는 `Phase 6 — 생육 리포트와 예측` baseline 완료 상태다.

## 7. 통합 모델 트랙: 작기·환경·관수·장치 모델 관계

v1.9.56 이후 작업은 `MVP`라는 개발 단계명을 사용자-facing UI/문서의 중심 용어로 쓰지 않는다. 내부 DB/API 호환을 위해 `environment_strategy_mvp`, `irrigation_strategy_mvp` 같은 legacy identifier는 유지할 수 있지만, 제품/문서/화면의 기준 용어는 다음 4개 모델로 정렬한다.

```text
작물 안전 룰(Crop Safety Rules)
→ 작물 인터록(Crop Interlock/Fallback Rules)
→ 작기 모델(Crop Season Model)
→ 환경 안전 룰(Environment Safety Rules)
→ 환경 인터록(Environment Interlock)
→ 환경 전략 모델(Environment Strategy Model)
→ 관수 안전 룰(Irrigation Safety Rules)
→ 관수 인터록(Irrigation Interlock)
→ 관수 전략 모델(Irrigation Strategy Model)
→ 장치 안전 룰(Device Safety Rules / Fail Safe)
→ 장치 인터록(Device Interlock)
→ 장치 운영 모델(Device Operation Model)
→ Control Mode / Limited Auto / Operator Confirmation
→ HA service call / log / feedback
→ 다시 작기·환경·관수 모델 보정
```

짧은 원칙은 다음과 같다.

```text
각 domain 내부 순서: Safety → Interlock → Model(AI)
domain 참조 순서: Crop → Environment → Irrigation → Device
```

M2~M8 모델 확장은 안전/인터록 contract가 명시될 때까지 보류한다. 특히 다음 구현 단위는 M2가 아니라 `작물 안전 룰 → 작물 인터록 → 작기/작물 모델 보강`이다. 단순히 `SafetyGuard 우선`이라고 표시하는 것만으로는 완료가 아니며, 각 domain은 정확한 block/fallback rule, threshold, reasonCode, log field를 가져야 한다.

### 7.1 모델별 책임

| 모델 | 기준 scope | 주요 입력 | 주요 출력 | 저장/연결 |
|---|---|---|---|---|
| 작기 모델 | `crop_season_id + zone_id` | 작물 종류, 품종, 정식일, 재식밀도, 생육조사, 병해충/방제 기록, crop profile | 생육단계, G-Index, 수확량 예측, 병해 위험도, 작물별 목표 범위 | `crop_seasons`, `growth_surveys`, `pest_surveys`, `control_records`, growth-report API |
| 환경 전략 모델 | `crop_season_id + zone_id + environment` | 작기 모델, 날씨, HA sensor, 온도/습도/VPD/CO₂ 설정, 운영자 보정 | ADT/DIF/VPD, CO₂, 환기/스크린/난방 target, 환경 risk | `zone_control_settings`, `ai_zone_control_outputs`, `zone_final_control_targets` |
| 관수 전략 모델 | `crop_season_id + zone_id + irrigation` | 작기 모델, 환경 모델 출력, 일사, VWC, EC/pH, 드라이백, 배액 feedback | 급액량, 최소 간격, 목표 EC/pH, 목표 드라이백/배액률, 긴급 관수 여부 | `irrigation_*`, `zone_control_settings`, `zone_final_control_targets` |
| 장치 운영 모델 | `crop_season_id + zone_id + device/domain` | 환경/관수 final target, 장치 capability, HA entity state, mapping, interlock | 실행 가능한 service call plan, safe_state, dry-run, post-state 검증, 장치 이상 판단 | `devices`, `device_*`, `zone_device_entity_mappings`, `zone_control_logs` |

### 7.2 관계성 원칙

1. **작기 모델이 기준이다.** 모든 환경/관수/장치 판단은 현재 활성 작기와 구역을 기준으로 한다. 작물 종류·생육단계·재식밀도·정식일이 바뀌면 환경/관수 target의 해석도 바뀐다.
2. **환경 모델은 관수 모델의 입력이다.** VPD, 온도, 습도, 일사, CO₂ 상태는 관수량·간격·드라이백 판단에 영향을 준다.
3. **관수 모델은 작기 모델에 feedback을 준다.** VWC/EC/pH/배액률/관수 로그는 생육 리포트, 병해 위험도, 수확량 예측의 confidence와 risk driver로 재사용한다.
4. **장치 모델은 실행 계층이다.** 환경/관수 모델이 만든 final target은 곧바로 장치를 움직이는 명령이 아니며, 장치 운영 모델에서 mapping/capability/dry-run/service-call plan으로 변환된다.
5. **SafetyGuard는 모든 모델보다 우선한다.** 모델 출력은 candidate/final target일 뿐이고, 실행 전 `Control Mode → Limited Auto → Operator Confirmation → SafetyGuard → Interlock` gate를 반드시 통과한다.
6. **예측과 실행은 분리한다.** 예측 모델은 `ai_zone_control_outputs` 또는 report response에 기록하고, 실행 대상은 `zone_final_control_targets`로 승격된 값만 사용한다.
7. **feedback loop는 로그 기반이어야 한다.** 실행 전후 HA state, 차단 사유, 운영자 override, 수동 보정값은 나중에 모델 calibration 근거가 되도록 로그/스냅샷으로 남긴다.

### 7.3 구현해야 할 예측/기능 묶음

| 묶음 | 필요한 기능 | 우선 구현 기준 |
|---|---|---|
| 작기 모델 고도화 | crop profile, 생육단계 추정, G-Index, 수확량 예측, 병해 위험도, 주간 리포트 | 토마토/상추 baseline 유지 후 계수 calibration 슬롯 추가 |
| 환경 전략 모델 | 작기 목표 기반 온도/습도/VPD/CO₂ target, 날씨/센서 입력 merge, manual override, diff preview | 기존 strategy-preview를 `환경 전략 모델`로 UI/문서 정리 |
| 관수 전략 모델 | 작기/환경 기반 관수량·간격·EC/pH·드라이백·배액률 target, VWC 긴급 관수, diff preview | 기존 strategy-preview를 `관수 전략 모델`로 UI/문서 정리 |
| 장치 운영 모델 | 장치 capability, entity mapping, dry-run, service plan, safe_state, post-state verification, device alarms | 장치제어에도 `장치 운영 모델` 카드/문서 기준 추가 |
| 모델 관계 API | 작기 모델 snapshot을 환경/관수/장치 모델이 공통으로 읽는 helper/API | 중복 계산 금지, scope key 통일 |
| 모델 스냅샷/감사 | model input/output/version/confidence/safety policy 저장 | 필요 시 `zone_strategy_snapshots` 또는 기존 JSON field 확장으로 migration 분리 |

### 7.4 다음 구현 순서 — Safety/Interlock first

M2~M8 모델 확장은 즉시 진행하지 않는다. 먼저 다음 S/C-S phases를 완료한다.

| Phase | 이름 | 목표 | 완료 기준 |
|---:|---|---|---|
| S0 | Roadmap correction | 모델 우선 문서를 Safety→Interlock→Model 순서로 보정 | 문서/test contract가 M2~M8 보류와 안전 우선 순서를 강제 |
| C-S1 | 작물 안전 룰 | 작물/작기 기준 deterministic safety rule 정의 | `cropSafetyStatus`, `cropSafetyBlocked`, `cropSafetyReasons`, reasonCode contract |
| C-S2 | 작물 인터록 | 작물 safety 결과별 fallback/block/confirmation 정책 정의 — **완료** | `cropInterlockStatus`, `fallbackToConservativeBaseline`, `operatorConfirmationRequired` contract |
| C-S3 | 작기/작물 모델 보강 | M1 cropModel에 cropSafety/cropInterlock summary를 포함 | 모델이 safety/interlock block을 우회하지 못함 |
| E-S1 | 환경 안전 룰 | 온도/습도/VPD/CO₂/날씨 위험 deterministic rule 정의 | 환경 model target 전 안전 contract |
| E-S2 | 환경 인터록 | 환경 안전 결과별 환기/스크린/난방 fallback 정의 | 환경 전략 모델보다 먼저 실행되는 interlock contract |
| I-S1 | 관수 안전 룰 | VWC/EC/pH/drain/양액 위험 deterministic rule 정의 | 관수 model target 전 안전 contract |
| I-S2 | 관수 인터록 | 관수 안전 결과별 급액 차단/감속/fallback 정의 | 관수 전략 모델보다 먼저 실행되는 interlock contract |
| D-S1 | 장치 안전 룰 | 장치 상태, stale/unavailable, safe_state, Fail Safe rule 정의 | 장치 운영 모델 전 safety/failsafe contract |
| D-S2 | 장치 인터록 | 장치 service-call 전 block/fallback/confirmation 정의 | HA service call 전 interlock contract |

### 7.5 보류된 모델 구현 순서 — Model Phase

| Phase | 이름 | 목표 | 완료 기준 |
|---:|---|---|---|
| M0 | 용어 정리 | UI/문서에서 사용자-facing `MVP`를 `모델`로 정리하고 내부 legacy identifier는 호환 설명 추가 | `환경 전략 모델`, `관수 전략 모델`, `장치 운영 모델` 표기 통일 |
| M1 | 작기 모델 contract | 작기 모델 입력/출력/crop profile/schema/API contract 확정 | 작기 모델 snapshot response 정의, 토마토/상추 profile 기준 문서화 |
| M2 | 환경 전략 모델 | 작기 모델을 환경 target 계산 입력으로 연결 | 환경 preview에 crop profile/growth stage/modelVersion/confidence 표시 |
| M3 | 관수 전략 모델 | 작기+환경 모델 출력을 관수 target 계산 입력으로 연결 | 관수 preview에 VPD/일사/작물 생육단계 영향과 confidence 표시 |
| M4 | 장치 운영 모델 | final target을 장치 capability/service plan으로 변환하는 모델 기준 정리 | 장치제어 AI 운영 탭에 dry-run/service plan/device risk 표시 |
| M5 | 통합 모델 관계 UI | 한 구역에서 4개 모델 관계를 한눈에 보는 요약 카드 제공 | 작기→환경→관수→장치→SafetyGuard chain 표시 |
| M6 | Feedback/calibration | 실행 로그·생육 결과·배액 feedback으로 모델 confidence/calibration 근거 생성 | 모델별 confidenceReasons와 calibrationNeeded 표시 |
| M7 | Snapshot/audit | 모델 입력/출력/version/safety decision을 재현 가능하게 저장 | DB/API contract와 migration task 확정 후 구현 |
| M8 | 제한적 자동화 readiness | 모델 관계와 SafetyGuard 통과 결과를 C20 실제 현장 리허설 gate에 연결 | virtual rehearsal에서 모델 chain evidence pass |

### 7.5 작업 원칙 추가

- 새 기능은 어느 모델에 속하는지 먼저 분류한 뒤 구현한다.
- 작기·환경·관수·장치 모델 간 관계가 바뀌면 이 마스터플랜과 `current-backend-api-db-ha-contract.md`, `current-ui-design-and-navigation.md`, `zone-control-roadmap-and-data-model.md`를 함께 갱신한다.
- 사용자-facing 용어는 `모델`, `전략 모델`, `운영 모델`, `예측`, `최종 적용값`을 사용한다. `MVP`는 계획/이력 또는 내부 legacy identifier 설명에만 둔다.
- 실제 장비 제어는 여전히 C20 전까지 금지이며, 모델 출력은 virtual HA entity rehearsal과 dry-run으로 먼저 검증한다.


## 8. 구현 기능 고도화/완성도 강화 마스터플랜

앞으로의 기본 방향은 새 기능을 계속 얹기보다, 이미 구현된 Home/Crop/Product Phase 6/Control Phase 기능을 사용자 흐름 기준으로 더 구체적이고 완성도 있게 다듬는 것이다. 새 구현은 기존 마스터플랜을 대체하지 않고 이 섹션에 이어서 누적한다.

### UI Polish Phase P1. Home/Crop 운영 UX 정리

목표:

```text
비전공자 농장주/직원이 Home → 작기 설정 → 생육조사 → 병해충 예찰 → 방제 기록 흐름을 직관적으로 이해하고, 중복 KPI/불필요 텍스트 버튼/자유 입력성 위치 필드를 줄인다.
```

완료 기준:

- 오늘 농장 확인 카드와 KPI 카드 분리: 오늘 농장 확인 카드는 위험 알림/오늘 할 일/조치 필요만 담당하고, 온도/습도/CO₂/VPD 수치 확인은 기존 `_renderKPIStrip(kpi)` KPI 카드가 담당한다.
- 작물 기본 설정 명칭을 작기 설정으로 변경: 사용자에게 “작기 등록/수정/철거” 기능임을 명확히 표현한다.
- 주간 리포트 알림은 on/off 토글 + 백그라운드 자동 전송: 기본 1주일 1회 자동 알림, 병해 위험도/수확량 예측/G-Index 등 주요 상태가 이전 알림 대비 악화될 때 변화 알림을 보낸다.
- 주간 리포트 내보내기/새로고침은 텍스트 버튼이 아니라 icon-only UI로 제공한다. 수동 “알림 보내기” 버튼은 제거한다.
- 병해충 예찰 모달 compact layout: 현재 작기와 발생 범위를 같은 줄에 배치하고 상세 위치 입력을 제거한다. 병해충 종류와 발생 정도는 한 행 단위로 함께 추가/삭제한다.
- 방제 기록 모달 compact layout: 방제일 아래 현재 작기와 처리 범위를 같은 줄에 배치하고 처리 위치 상세를 제거한다. 그 아래에 약제명/추가 버튼/비고 순서로 배치한다.
- P1 rendered-flow QA v1.9.86: Home → 작물 설정 → 병해충 예찰 → 방제 기록 실제 렌더 흐름에서 Home KPI 분리, pest/control 요약→액션→목록 순서, 병해충/방제 compact 모달, 금지 실행 marker 부재, console error 부재를 확인한다.
- P1 rendered-flow QA v1.9.87: 현재 버전 기준 P1 smoke 계약은 유지하되, AI 전략은 목록 리스트가 아닌 panel-type layout 예외로 검증한다.
- P1 rendered-flow QA v1.10.0: 현재 버전 기준 P1 smoke 계약은 유지하되, AI 전략은 모델 계층 구조로 검증하고 환경 제어 상태·기록형 탭은 별도 polish grammar로 검증하고, v1.9.99에서 7개 환경 제어 탭 전체 렌더 QA와 direct-execution 금지 marker smoke를 완료한다.
- v1.9.84 revert note: 사용자 확인 없이 진행된 v1.9.83 Home real-state tasks 변경은 되돌리고, Home 첫 카드의 고정 안내 구조는 v1.9.82 기준으로 복귀한다. 실제 SafetyGuard/Growth/Pest/Control 기반 산출은 후속 고도화 후보로만 남긴다.
- v1.9.85 five requested Crop Settings UI corrections: 하위탭은 아이콘+하위탭명만 표시하고 중복 이모지를 금지한다. 작기/생육조사/병해충 예찰/방제 기록 목록은 공통 수정+삭제 action group을 사용하되 철거 버튼은 작기 목록에만 둔다. AI 전략은 단일 요약+접힌 기술 근거 구조로 정리한다. 병해충/방제 탭은 요약 카드→액션 줄→기록 목록 순서를 공유한다. 방제 모달은 약제 사용량과 물 사용량을 같은 row의 2열 grid로 배치한다.
- v1.9.86 Crop Settings unified subtab list layout: 기록형 하위탭은 `data-crop-subtab-main-format` 안에서 하위탭 요약 카드(`data-crop-subtab-summary-card`) → 목록 헤더(`data-crop-subtab-list-header`, 제목/설명/총 갯수/버튼) → 목록 리스트(`data-crop-subtab-record-list`, row들) 순서를 공유한다. 병해충/방제의 제목 블록은 요약 카드 위가 아니라 목록 헤더로 이동한다.
- v1.9.87 AI Strategy panel-type layout: AI 전략은 목록 리스트가 아닌 `data-crop-ai-strategy-panel` 타입으로 분리한다. `data-crop-ai-strategy-header`와 `data-crop-ai-evidence-panel`을 사용하고, `data-crop-ai-list-header`/`data-crop-ai-evidence-list`/`data-crop-subtab-record-list`는 AI 탭에서 사용하지 않는다. 첫 화면은 `data-crop-ai-primary-summary`의 `이번 주 작물 판단 요약` 1개와 `data-crop-ai-next-action`만 보이고, 모델/데이터/인터록 카드는 `data-crop-ai-advanced-details` 접힘 영역에 둔다.
- v1.9.99 AI Strategy model hierarchy restructure: 메인 영역은 작물 상태 요약(`data-crop-ai-primary-gl-index`, `data-crop-ai-primary-yield-prediction`, `data-crop-ai-primary-pest-risk`) → 인터록 상태 요약(`data-crop-ai-interlock-summary`) → 모델 상태 요약(`data-crop-ai-model-status-summary`) → 상세 모델 근거(`data-crop-ai-advanced-details`) 순서로 구성한다. 상세 모델 근거는 `data-crop-ai-stage-prediction-model` → `data-crop-ai-reproductive-vegetative-model` → `data-crop-ai-pest-prediction-model` 상위 모델 뒤에 `data-crop-ai-submodel-evidence-section` 이하 하위 모델/입력 근거 순서로 정리한다.
- v1.9.99 AI Strategy decision-oriented DOM: AI 전략은 `data-crop-ai-decision-summary` 작물 상태 요약 → `data-crop-ai-interlock-summary` 안전 상태 → `data-crop-ai-model-status-summary` 모델 상태 → `data-crop-ai-advanced-details` 상세 근거로 읽히도록 재구성한다. 판단 흐름 카드(`data-crop-ai-decision-flow`)는 제거한다. 메인 3카드는 `data-crop-ai-main-card`, `data-crop-ai-main-card-header`, `data-crop-ai-main-card-body`, `data-crop-ai-main-card-chip-group` 공통 shell을 사용한다. v1.9.96부터 세 메인 카드 내부도 `data-crop-ai-main-metric-grid`, `data-crop-ai-main-metric`, `data-crop-ai-main-metric-label`, `data-crop-ai-main-metric-value`, `data-crop-ai-main-metric-help`, `data-crop-ai-main-note`, `data-crop-ai-main-action-row` 구조를 공유한다. 상세 근거는 `data-crop-ai-technical-evidence-stack` 내부에서 `data-crop-ai-top-models` → `data-crop-ai-submodels` → `data-crop-ai-center-reference-summary` 순서로 둔다.
- v1.9.99 AI detail unified evidence UI: 접히는 상세 모델 근거는 `data-crop-ai-evidence-section`과 `data-crop-ai-evidence-card` 공통 shell을 사용한다. 상위 모델/하위 모델 카드는 `data-crop-ai-evidence-card-header`, `data-crop-ai-evidence-card-body`, `data-crop-ai-evidence-chip-group`을 공유해 같은 UI 포맷으로 보이게 한다.
- v1.9.99 AI detail cleanup: `이번 주 작물 모델 작업 안내`, 품질/장해, 예측 검증, 학습 데이터셋 export 준비도는 상위/하위 모델이 아니므로 `data-crop-ai-evidence-section="model-operations"`로 분리한다. 센터 분석 참고는 센터 분석 카드가 먼저, 센터 작물 정책(`data-center-crop-policy-card`)이 그 다음에 오도록 정리한다.

후속 고도화 후보:

- Home 오늘 할 일/조치 필요를 실제 SafetyGuard/Growth/Pest/Control 상태에서 산출한다.
- 생육 리포트 알림 설정을 작기별/농장별 정책으로 확장하고, 알림 이력 UI를 제공한다.
- 병해충 예찰/방제 기록의 약제·병해충 추천을 작물/작기/최근 발생 이력에 맞춰 랭킹한다.

- v1.9.96 AI Strategy UI/DOM source-of-truth pattern: `docs/design/crop-ai-strategy-ui-dom-pattern.md`를 기준 문서로 둔다. 이후 AI 전략 하위탭 작업은 메인 3카드, 접힘 상세 evidence section, 모델 운영/검증 참고 분류, 금지 marker 기준을 이 문서에 맞춰 수행한다.
- Environment Control UI/DOM vertical slice plan: `docs/design/environment-control-ui-dom-slice-plan.md`를 기준 문서로 둔다. 환경 제어는 설정값 변경형 하위탭이 있으므로 `data-env-setvalue-*` 표준을 별도로 도입하고, overview/setpoints/rules/ai/operations/devices/logs 수직 슬라이스로 정리한다.

### UI Polish Phase P2. 생육 AI 전략 분리와 제어 페이지 정보 구조 정리

목표:

```text
생육조사 화면은 조사 기록 입력/조회에 집중시키고, AI 분석/주간 리포트는 별도 AI 전략 탭으로 분리한다. 환경/관수/장치 제어 화면은 최상단 작기 범위 선택을 작물 설정의 작기 카드와 같은 시각 언어로 통일하고, 페이지 상단에 과밀하게 노출되던 운영/안전/장치 매핑 카드를 각 하위탭 안으로 정리한다.
```

완료 기준:

- 작물 관리 하위탭에 `AI 전략`을 추가하고, 생육 리포트 카드는 `생육조사` 탭에서 제거해 `AI 전략` 탭으로 이동한다.
- 생육 리포트 주간 알림은 체크박스 없이 icon-only toggle로 제공한다. 켜짐은 주황색 `mdi:bell-ring-outline`, 꺼짐은 회색 `mdi:bell-off-outline`로 표시한다.
- 리포트 새로고침 버튼은 `_refreshWeeklyGrowthReportFromButton()`을 통해 API refresh를 실행하고, 작업 중 `is-spinning` / `gs-spin` 회전 모션을 표시한다.
- 환경/관수/장치 제어의 최상단 범위 선택은 `data-control-season-card` / `control-season-card` 구조를 포함해 작물 설정의 작기 선택 카드 느낌으로 통일한다.
- 환경 제어는 기존 전략 탭에 `AI 운영`, `안전/리허설`, `장치 매핑` 탭을 추가해 strategy preview, final target, operator confirm, SafetyGuard, 리허설, dry-run, entity mapping 카드를 탭 내부로 정리한다.
- 관수 제어는 `AI 운영`, `안전/리허설`, `장치 매핑` 탭을 추가해 상단 과밀 카드를 관수 하위탭 내부로 정리한다.
- 장치 제어는 `AI 운영`, `안전/리허설`, `장치 매핑` 탭을 추가해 상단 과밀 카드를 장치 하위탭 내부로 정리한다.

후속 고도화 후보:

- 각 제어 페이지의 기본 진입 탭을 사용자 역할/최근 작업에 따라 기억한다.
- `AI 운영`, `안전/리허설`, `장치 매핑` 탭의 카드 순서를 현장 작업 빈도 기반으로 재정렬한다.
- 모바일 WebView 기준으로 탭 overflow와 상단 작기 카드 높이를 추가 최적화한다.

## 9. 작업 원칙

1. 기존 DB/API/test contract는 뒤집지 않는다.
2. 변경이 필요하면 migration task로 분리한다.
3. 새 테이블은 기존 6개 제어 테이블로 표현 불가능할 때만 추가한다.
4. 모든 실행/차단/실패/override는 로그로 재현 가능해야 한다.
5. AI output은 실행 명령이 아니다.
6. Safety Guard는 AI/전략 엔진/외부 API보다 항상 우선한다.
7. 현장 오프라인 상황에서도 로컬 인터록은 동작해야 한다.
8. 제품 repo는 HACS custom integration을 유지하고, Docker/NUC 운영 구성은 deploy repo에 둔다.

- v1.10.0 Environment Control final QA: `overview / setpoints / rules / ai / operations / devices / logs` 전체 렌더 QA, setValue save/reset binding smoke, status/record grammar 확인, Prod marker smoke를 완료한다. 실행 권한 추가 없이 direct-execution forbidden marker를 유지한다.

- v1.9.99 Environment season-zone card: 환경 제어 상단 구역 선택 카드 위치에 작물 설정의 작기 선택 카드와 같은 형식의 작기구역 카드를 적용한다. 선택은 작기+구역 저장 scope만 바꾸며 실행 권한을 추가하지 않는다.

- v1.10.0 Environment zone-centric crop-season scope: 환경 제어 상단 scope를 구역 중심으로 전환했다. 구역이 부모, 작기는 구역에 연결되는 현재 재배 상태이며 선택/저장은 `zone_id + crop_season_id + environment` 조합을 유지한다.

- v1.10.1 Environment zone card UI/UX alignment: 환경 제어 상단 구역 선택 카드 명칭을 `구역 선택 카드`로 통일하고, 작기 선택 카드와 동일한 3줄 카드 문법으로 구역+현재 작기를 표시한다. 구역 중심 모델은 유지한다.

- v1.10.1 Environment Control final QA: 환경 제어 구역 선택 카드 UI/UX 보정 후 전체 렌더/계약 기준을 유지한다.

- P1 rendered-flow QA v1.10.4: 환경 제어 구역 선택 카드 UI/UX 보정 후 P1 렌더 흐름 QA 기준을 유지한다.

- v1.10.2 Environment zone card header cleanup: 환경 제어 구역 선택 카드에서 위쪽 큰 `구역 선택` 텍스트를 숨기고 녹색 소제목만 남겼으며, 프리셋 설정 버튼을 compact pill UI로 조정했다.

- v1.10.2 Environment zone card UI/UX alignment: 구역 선택 카드 UI/UX 정렬 기준은 v1.10.2에서도 유지된다.
- v1.10.2 Environment Control final QA: 환경 제어 구역 선택 카드 header cleanup 후 전체 렌더/계약 기준을 유지한다.

- v1.10.3 AI-first control tab alignment: 작물 설정/환경 제어 모두 AI 전략을 첫 하위탭으로 배치하고, 환경 제어 AI 전략을 작물 설정 AI 전략과 같은 read-only 3-main-card 구조로 맞췄다. 제어 모드 카드는 제거하고 setValue 행 정렬을 고정 컬럼으로 통일했다.

- v1.10.3 Environment zone card header cleanup: current v1.10.3 compatibility marker retained after AI-first control tab alignment.
- v1.10.3 Environment zone card UI/UX alignment: current v1.10.3 compatibility marker retained after AI-first control tab alignment.
- v1.10.3 Environment Control final QA: current v1.10.3 compatibility marker retained after AI-first control tab alignment.

- v1.10.5 Environment interlock/safety tab split: 환경 제어 목표값 설정과 인터록 설정을 `인터록 설정` 탭으로 병합하고, 절대 안전 한계/센서 오류/SafetyGuard는 별도 `안전 설정` 탭으로 분리했다. 운영 요약과 인터록/안전 탭에서 별도 제어 모드 카드를 제거했다.

- v1.10.4 AI-first control tab alignment: current v1.10.4 compatibility marker retained after interlock/safety split.
- v1.10.4 Environment zone card header cleanup: current v1.10.4 compatibility marker retained after interlock/safety split.
- v1.10.4 Environment zone card UI/UX alignment: current v1.10.4 compatibility marker retained after interlock/safety split.
- v1.10.5 Environment Control final QA: current v1.10.4 compatibility marker retained after interlock/safety split.

- v1.10.5 Environment unified scope/tab card: 작물 설정의 작기 선택 + 하위탭 단일 카드 구조와 맞추기 위해 환경 제어의 구역 선택과 하위탭을 `data-env-unified-scope-tab-card` 하나의 `gs-card` 안에 배치했다. 환경 제어 scope bar는 `data-env-scope-inline`으로 카드 껍데기를 만들지 않는다.

- P1 rendered-flow QA v1.10.5: current v1.10.5 compatibility marker retained after unified environment scope/tab card polish.
- v1.10.5 AI-first control tab alignment: current v1.10.5 compatibility marker retained after unified environment scope/tab card polish.
- v1.10.5 Environment zone card header cleanup: current v1.10.5 compatibility marker retained after unified environment scope/tab card polish.
- v1.10.5 Environment zone card UI/UX alignment: current v1.10.5 compatibility marker retained after unified environment scope/tab card polish.

- v1.10.6 Environment storage target moved to docs: 환경 제어 화면의 `저장 대상 · 1구역 / 작물 / 환경 제어 구역 + 현재 작기 + 제어영역 → green_smart_zone_control_settings` 문구는 UI에서 제거한다. 저장 scope는 문서 기준으로 `crop_season_id + zone_id + domain`이며 저장 테이블/키는 `green_smart_zone_control_settings`를 사용한다.
- P1 rendered-flow QA v1.10.6: current v1.10.6 compatibility marker retained after storage target summary removal.
- v1.10.6 AI-first control tab alignment: current v1.10.6 compatibility marker retained after storage target summary removal.
- v1.10.6 Environment zone card header cleanup: current v1.10.6 compatibility marker retained after storage target summary removal.
- v1.10.6 Environment zone card UI/UX alignment: current v1.10.6 compatibility marker retained after storage target summary removal.
- v1.10.6 Environment Control final QA: current v1.10.6 compatibility marker retained after storage target summary removal.
- v1.10.6 Environment interlock/safety tab split: current v1.10.6 compatibility marker retained after storage target summary removal.
- v1.10.6 Environment unified scope/tab card: current v1.10.6 compatibility marker retained after storage target summary removal.

- v1.10.7 Environment zone helper text moved to docs: 환경 제어 화면의 `작기 선택 카드와 동일한 3줄 카드 문법으로 구역과 현재 작기를 함께 표시합니다.` 설명 문구는 UI에서 제거한다. 구역 카드는 작기 선택 카드와 동일하게 3줄 구조(구역+현재 작기 / 정식일 / 재배 상태)를 유지하며, 이 문법 설명은 문서와 hidden marker(`data-env-zone-card-helper-doc-only`)로만 남긴다.
- P1 rendered-flow QA v1.10.7: current v1.10.7 compatibility marker retained after zone helper text removal.
- v1.10.7 AI-first control tab alignment: current v1.10.7 compatibility marker retained after zone helper text removal.
- v1.10.7 Environment zone card header cleanup: current v1.10.7 compatibility marker retained after zone helper text removal.
- v1.10.7 Environment zone card UI/UX alignment: current v1.10.7 compatibility marker retained after zone helper text removal.
- v1.10.7 Environment Control final QA: current v1.10.7 compatibility marker retained after zone helper text removal.
- v1.10.7 Environment interlock/safety tab split: current v1.10.7 compatibility marker retained after zone helper text removal.
- v1.10.7 Environment unified scope/tab card: current v1.10.7 compatibility marker retained after zone helper text removal.
- v1.10.7 Environment storage target moved to docs: current v1.10.7 compatibility marker retained after zone helper text removal.

- v1.10.8 Environment overview tab removed: 환경 제어의 `운영 요약` 하위탭은 UI에서 제거한다. 기본 첫 탭은 `AI 전략`이고 다음 visible 탭은 `인터록 설정`이다. 과거 overview 키는 hidden legacy marker(`data-env-legacy-tab="overview"`)로만 유지한다.
- P1 rendered-flow QA v1.10.8: current v1.10.8 compatibility marker retained after Environment overview tab removal.
- v1.10.8 AI-first control tab alignment: current v1.10.8 compatibility marker retained after Environment overview tab removal.
- v1.10.8 Environment zone card header cleanup: current v1.10.8 compatibility marker retained after Environment overview tab removal.
- v1.10.8 Environment zone card UI/UX alignment: current v1.10.8 compatibility marker retained after Environment overview tab removal.
- v1.10.8 Environment Control final QA: current v1.10.8 compatibility marker retained after Environment overview tab removal.
- v1.10.8 Environment interlock/safety tab split: current v1.10.8 compatibility marker retained after Environment overview tab removal.
- v1.10.8 Environment unified scope/tab card: current v1.10.8 compatibility marker retained after Environment overview tab removal.
- v1.10.8 Environment storage target moved to docs: current v1.10.8 compatibility marker retained after Environment overview tab removal.
- v1.10.8 Environment zone helper text moved to docs: current v1.10.8 compatibility marker retained after Environment overview tab removal.

- v1.10.9 Settings page environment-control style shell: 톱니바퀴 `환경 설정` 화면을 환경 제어 페이지와 같은 단일 `gs-card` + 하위탭 구조로 맞춘다. 하위탭은 `연결 설정`, `구역 설정`, `날씨 설정`, `중앙 연동`이며 기존 설정 저장/날씨 위치 매칭/기상청 API 키/중앙 URL·활성화 코드 입력만 제공한다. 제어 실행, 수동 장치 제어, 신규 기능은 추가하지 않는다.
- v1.10.10 Settings page inside Green Smart shell hotfix: `환경 설정`은 독립 전체화면이 아니라 Green Smart 앱 shell 내부 페이지다. `_update()`는 `settings` 상태에서도 Green Smart sidebar를 렌더하고 `#main-area.has-sidebar`를 유지하며, 설정 톱니바퀴 버튼을 active로 표시한다. 설정 내용 카드는 v1.10.9의 하위탭/기존 기능 제한을 유지하되 기존 `page-head` 우회 헤더는 제거하고 공통 main-page hero를 사용한다.
- v1.10.11 Settings sidebar navigation hotfix: `환경 설정` 상태에서 취소 버튼을 누르지 않고 Green Smart sidebar의 `홈/작물 설정/환경 제어/관수 제어/장치제어/Admin/System`을 눌러도 `_state`가 `dashboard`로 복귀하고 선택한 `_page`가 정상 렌더된다. 설정 입력 저장/취소 기능은 그대로 유지하며, sidebar page click은 저장 실행이나 새 제어 기능을 만들지 않는다.
- v1.10.12 Device mapping moved to Settings: 환경 제어 visible 하위탭에서 `장치 매핑·상태`를 제거하고, 환경 설정 하위탭으로 `장치 매핑·상태`를 이동한다. 기존 entity 상태 요약, entity 매핑 추가/삭제/새로고침, 매핑 검증은 그대로 유지하되 환경 설정 화면의 구역 선택 scope 안에서 관리한다. 환경 제어에는 `data-env-legacy-tab="devices"` hidden marker만 남겨 호환성을 유지한다.
- v1.10.13 Crop Stage Model validation loop hardening: UI/DOM 확장은 중단하고 작물 상위 모델의 1~5단계(생육단계 예측 모델, 작물별 stage rule, feature snapshot, 예측 row 저장, 실제 조사 기반 validation loop)만 보강한다. 7일 예측은 정확히 7일 차 생육조사로만 검증하며, 정확한 7일 차 조사 데이터가 없으면 `validation_needs_review`와 `exact_7_day_survey_missing`로 저장한다. 생육상태 진단, 리스크 예측, 수확량 예측 본체는 사전 계획 전까지 작업하지 않는다.
- v1.10.14 Ordered Crop Stage Model steps: 사용자가 요청한 작업 순서대로 1단계 생육단계 예측 모델 → 2단계 작물별 stage rule → 3단계 feature snapshot → 4단계 prediction row 저장 → 5단계 정확히 7일 차 validation loop를 독립 계약으로 잠근다. `trainableBaseline.pipelineSteps`는 1~5 순서를 그대로 노출하고, 5단계는 nearest survey fallback 금지 및 `exact_7_day_survey_missing` review 정책을 유지한다. 생육상태 진단/리스크 예측/수확량 예측 본체는 이 릴리스 범위가 아니다.
- v1.10.15 Sequential Crop Stage Model implementation: 1~5단계를 묶지 않고 각 단계별로 설계→구현→검증을 완료한다. 1단계는 `stagePrediction7d`에 모델 메타데이터/입력/결정/한계/read-only boundary를 추가한다. 2단계는 tomato=G-Index, lettuce=L-Index stage rule 및 stage sequence metadata를 보강하고 unknown crop의 tomato fallback을 차단한다. 3단계는 feature snapshot의 required source groups, coverage, limitations, no-authority boundary를 명시한다. 4단계는 `predictionPersistence`와 sourceSurveyId 없는 orphan row 저장 차단을 추가한다. 5단계는 success/review validation row에 exact-7-day validation policy metadata를 저장한다.
- v1.10.16 Growth State Prediction Model: 생육상태 모델을 문자열 상태값 없이 numeric-first 계약으로 구현한다. `growthStatePrediction`은 `balanceScore`, `directionCode`, `magnitudeBandCode`, `predictedBalance7d`, `movementScore7d`, `driverContributions`, `confidenceScore`만 core state 값으로 노출하고, 진단/조치/환경·관수 setpoint/실행 권한은 포함하지 않는다. AI 전략 패널은 read-only 숫자 카드와 상세 evidence marker만 표시하며 기존 `reproductive-vegetative`/yield marker 호환성을 유지한다.
- v1.10.17 Risk Factor Prediction Model: 위험요소 모델을 항목별 numeric-first 계약으로 구현한다. `riskFactorPrediction`은 고온/저온/급격한 온도변화/VPD/습도/CO2/광량/EC/pH/dry-back/배액/병해충/방제 신선도/작업·데이터 품질 위험을 `score`, `bandCode`, `trendCode`, `riskCode`, `confidenceScore`, `evidenceScore`로 노출한다. 진단/방제 지시/환경·관수 setpoint/실행 권한은 포함하지 않으며 AI 전략 패널은 read-only 숫자 evidence만 표시한다.
- v1.10.18 Integrated Crop Diagnosis Model: 통합 작물 진단 모델을 read-only numeric signal 계약으로 구현한다. `integratedCropDiagnosis`은 단계/상태/위험요소 예측을 해석해 `fruitLoadScore`, `leafLoadScore`, `sourceSinkGapScore`, `transitionNeedCode`, `environmentModelReviewCode`, `irrigationNutrientModelReviewCode`, `pestScoutingOrControlReviewCode`를 산출한다. 최종 ADT/VPD/EC/pH setpoint, 방제 지시, 작업 지시, 실행 권한은 포함하지 않는다.
- v1.10.19 Crop Action Recommendation Model: 조치 추천 모델을 read-only request 계약으로 구현한다. `cropActionRecommendation`은 `integratedCropDiagnosis.reviewSignals`를 `workReviewRequests`, `modelReviewRequests`, `operatorReviewQueue`로 변환하며, 하엽/과실부하/병해충/작업 검토 및 환경/관수 제어 모델 검토 요청 코드와 우선순위만 제공한다. 최종 target 값, 방제 지시, 자동 work order, 실행 권한은 포함하지 않는다.
- v1.10.20 AI Strategy model pipeline UI: 작물 설정 > AI 전략 하위탭은 완성된 5개 작물 모델을 첫 화면 파이프라인으로 표시한다. `data-crop-ai-model-pipeline-summary`와 순서형 `data-crop-ai-model-pipeline-step`은 생육단계 예측 → 생육상태 예측 → 위험요소 예측 → 통합 작물 진단 → 조치 추천 요청을 보여주고, `data-crop-ai-review-request-summary`는 작업/후속 모델 검토 요청만 노출한다. `data-crop-ai-support-status-summary`는 인터록/입력/ML 준비도를 보조 상태로 유지하며 최종 setpoint, work order, 장치 실행, 자동 학습/배포는 추가하지 않는다.
- v1.10.21 AI Strategy top summary cards: AI 전략 하위탭 상단을 작물 요약 → 안전/인터록 상태 요약 → 모델 상태 요약(상세 버튼 포함) 순서로 재구성한다. 작물 요약은 작물단계/작물상태/환경리스크/관수리스크/병충해리스크를 우선 표시하고, 안전/인터록 요약은 안전상태/인터록 상태/오류건수를 표시한다. 모델 파이프라인과 검토 요청은 모델 상태 요약 안에서 유지하고 상세 evidence는 접힘 영역에 둔다.
- v1.10.22 Crop summary card labels: 작물 요약 카드의 5개 항목을 작업자용 텍스트 중심으로 조정한다. 작물단계는 stage label + 모델 스코어/신뢰점수, 작물상태는 생식/영양 텍스트 + 방향 이모티콘 + 스코어/신뢰점수, 환경요약과 관수요약은 위험요소 모델의 해당 영역 top factor label + 스코어/신뢰점수, 병충해요약은 병충해 영역 스코어 + 신뢰점수를 표시한다.
- v1.10.23 Crop summary operator labels: 작물 요약 카드의 환경요약/관수요약/병충해요약을 작업자가 바로 읽을 수 있는 텍스트 메인값으로 보정한다. 환경/관수는 `안정` 대신 위험요소 모델의 top factor label을 표시하고 하단은 스코어/신뢰도만 남긴다. 병충해는 스코어 숫자 대신 매우심각/심각/보통/낮음 등급 텍스트를 메인값으로 표시하고 하단에 스코어/신뢰도를 표시한다. 작물상태 이모티콘은 영양→생식/생식→영양 방향성을 나타내는 화살표형 이모티콘으로 표시한다.
- v1.10.24 Crop summary visible text cleanup: 작물 요약 카드의 subtitle은 `이번 주 모델을 통해서 출력된 작물 상태의 요약입니다.`로 바꾸고, 내부 개발/운영 boundary 문구(`상세 근거는 모델 상태 카드`, `농장주/직원용 요약 우선`, `read-only`, `자동 실행 없음`)는 작물 요약 카드의 visible UI에서 제거한다. 이 정보는 문서와 테스트 계약에만 남긴다.
- v1.10.25 Interlock detail modal: 안전/인터록 상태 요약 카드의 중복 설명을 상태 요약 문구로 정리하고, 승인 gate/해소/미해소 차단 정보 및 승인 버튼은 기본 카드에서 제거해 `오류건수` 클릭 상세 모달로 이동한다. 승인 기능은 기존 `data-crop-interlock-approve` 바인딩을 유지한다.
- v1.10.26 Interlock detail modal hidden hotfix: 안전/인터록 상세 모달은 초기 렌더에서 `display:none`으로 숨기고, `오류건수` 클릭 시에만 `display:flex`로 열리게 한다. 닫기 버튼은 다시 `display:none`으로 되돌린다.
- P1 rendered-flow QA v1.10.9: current v1.10.9 compatibility marker retained after settings page shell alignment.
- v1.10.9 AI-first control tab alignment: current v1.10.9 compatibility marker retained after settings page shell alignment.
- v1.10.9 Environment zone card header cleanup: current v1.10.9 compatibility marker retained after settings page shell alignment.
- v1.10.9 Environment zone card UI/UX alignment: current v1.10.9 compatibility marker retained after settings page shell alignment.
- v1.10.9 Environment Control final QA: current v1.10.9 compatibility marker retained after settings page shell alignment.
- v1.10.9 Environment interlock/safety tab split: current v1.10.9 compatibility marker retained after settings page shell alignment.
- v1.10.9 Environment unified scope/tab card: current v1.10.9 compatibility marker retained after settings page shell alignment.
- v1.10.9 Environment storage target moved to docs: current v1.10.9 compatibility marker retained after settings page shell alignment.
- v1.10.9 Environment zone helper text moved to docs: current v1.10.9 compatibility marker retained after settings page shell alignment.
- v1.10.9 Environment overview tab removed: current v1.10.9 compatibility marker retained after settings page shell alignment.
