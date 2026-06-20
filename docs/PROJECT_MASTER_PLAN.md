# Green Smart Project Master Plan

> 기준일: 2026-06-20
> 기준 repo: `/home/smartfarm/green_smart`
> 기준 버전: product code `v1.9.9`, Phase 2E SafetyGuard event lifecycle
> 신규 기준 문서: `.omc/plans/green-smart-master-plan.md`
> 기존 기준 문서: `docs/PROJECT_GUIDE.md`, `docs/design/zone-control-roadmap-and-data-model.md`

## 1. 목적

이 문서는 기존 Green Smart 제품 문서/코드와 새 마스터 플랜을 하나의 실행 기준으로 정렬한다. 앞으로 구현은 이 문서와 Phase 0 산출물 전체를 기준으로 진행한다.

Green Smart의 최우선 목표는 다음이다.

```text
AI가 작동하지 않아도 문제가 생기지 않게 인터록/안전 제어를 먼저 완성하고,
이후 AI 자동화를 단계별로 붙일 수 있는 확장 가능한 Home Assistant 기반 구조를 만든다.
```

## 2. 현재 repo 현황 요약

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
| `custom_components/green_smart/__init__.py` | integration setup, DB bootstrap, view/panel registration |
| `custom_components/green_smart/db.py` | MariaDB pool/query/schema bootstrap |
| `custom_components/green_smart/crop_views.py` | 작기/생육/병해충/방제 API |
| `custom_components/green_smart/weather_api.py`, `weather_views.py`, `kma_grid.py` | KMA/PSIS 연동 |
| `custom_components/green_smart/central_api.py`, `central_store.py`, `central_views.py` | central activation/token/allowlisted adapter baseline |
| `custom_components/green_smart/zone_control_views.py` | zone control, AI output, final target, entity mapping, execution/safety/log API |
| `custom_components/green_smart/frontend_panel.py` | HA sidebar panel registration |
| `custom_components/green_smart/panel/green-smart-panel.js` | 전체 Green Smart panel UI |

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
| Phase 번호/순서 | 기존 문서는 Phase 1~13 완료 후 Phase 14 Dry Run UI를 다음 단계로 제안 | 새 플랜은 Phase 1 기반 모델+대시보드+인터록 설정, Phase 2 안전 실행 완성 등으로 재정렬 | 코드 영향 없음. 문서 로드맵만 재해석 필요 | 기존 Phase 1~13은 “pre-master completed history”로 보존하고, 앞으로는 새 Phase 1~6 로드맵 사용 | 사용자가 새 순서를 명시했으므로 이번 문서에서는 채택. 단 기존 문서의 Phase 14~21 표현은 후속 문서 정리 필요 |
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

### Phase 3. 환경 전략 MVP

목표:

- CORP 기본 G-Index
- TEMHUM ADT/DIF/VPD
- VENT/SCRN 기본 final target 생성

### Phase 4. 관수 전략 MVP

목표:

- IRR 기본 EC/pH/VWC/드라이백/일사 누적 관수
- VWC 하한 긴급 관수
- 관수 final target 생성

### Phase 5. 제한적 자동제어와 알림 강화

목표:

- 장비군별 자동 허용 스위치
- 반자동/제한적 자동 실행 정책
- 알림 확인/조치/재개 흐름

### Phase 6. 생육 리포트와 예측

목표:

- 생육 추세, G-Index 추이, 수확량 예측, 병해 위험도, 주간 리포트

## 6. 작업 원칙

1. 기존 DB/API/test contract는 뒤집지 않는다.
2. 변경이 필요하면 migration task로 분리한다.
3. 새 테이블은 기존 6개 제어 테이블로 표현 불가능할 때만 추가한다.
4. 모든 실행/차단/실패/override는 로그로 재현 가능해야 한다.
5. AI output은 실행 명령이 아니다.
6. Safety Guard는 AI/전략 엔진/외부 API보다 항상 우선한다.
7. 현장 오프라인 상황에서도 로컬 인터록은 동작해야 한다.
8. 제품 repo는 HACS custom integration을 유지하고, Docker/NUC 운영 구성은 deploy repo에 둔다.
