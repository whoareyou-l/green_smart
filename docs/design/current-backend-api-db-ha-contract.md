# Green Smart Current Backend, API, DB and Home Assistant Integration Contract

> 기준 버전: `v1.12.70`
> 기준 파일: `custom_components/green_smart/*.py`
> 목적: 앞으로 backend/API/DB/HA integration/control execution/SafetyGuard 작업 시 반드시 참조하는 현재 구현 기준서.

---

## 1. 제품 아키텍처 한 줄 정의

Green Smart는 독립 서버가 아니라 **Home Assistant custom integration**이다.

```text
Home Assistant
└─ custom_components/green_smart/
   ├─ HomeAssistantView 기반 HTTP API
   ├─ MariaDB schema bootstrap + aiomysql query helper
   ├─ panel_custom sidebar panel
   ├─ HA entity/service-call 기반 장치 실행
   ├─ SafetyGuard / Interlock / Fail Safe / audit log
   ├─ Central allowlisted adapter client
   ├─ KMA/PSIS weather/pesticide adapter
   └─ virtual rehearsal용 sensor/binary_sensor/switch/cover entities
```

핵심 원칙:

1. AI output은 직접 실행 명령이 아니다.
2. 실행 대상은 `zone_final_control_targets`다.
3. 실제 장비 실행은 항상 Control Mode, Limited Auto, Operator Confirmation, SafetyGuard, Interlock, Entity Mapping, State Verification을 통과해야 한다.
4. RBAC 기준 역할은 `admin`, `farm_owner`, `farm_staff`이며, Home Assistant 사용자 ID를 Green Smart 역할에 매핑한다. frontend 표시 제한은 UX 보조일 뿐 모든 write/execute API는 backend에서 role/permission을 다시 검증해야 한다.
5. 로컬 HA/DB/entity 상태만으로도 안전 차단이 가능해야 한다.
6. Central/SaaS/API는 편의/데이터 공급자이며, 로컬 안전보다 우선하지 않는다.

RBAC/UI 정보구조 기준:

```text
docs/design/ui-information-architecture-and-rbac.md
```

## RS-007 read-only home context API shell

```text
GET /api/green_smart/rebuild/home/context
summary + zones
static-fixture-before-api
readOnly: true
executionEnabled: false
DB 연결 없음
서비스 실행 없음
```

Contract:

- Register `RebuildHomeContextView` as a HomeAssistantView.
- Return fixture-backed context data only.
- Keep the route authenticated.
- Do not import DB helpers or query tables in this slice.
- Do not call HA services or expose execution/apply controls.

R1 backend enforcement 기준: frontend의 `visible_enabled`, `visible_disabled`, `summary_only`, `hidden` 상태는 UX 표현일 뿐이다. 다음 API 유형은 backend에서 HA user → Green Smart role → permission을 다시 검증해야 한다.

| API 유형 | Required permission 예시 |
|---|---|
| crop create/update/delete | `manage_crop_seasons`, `edit_crop_records` |
| growth/pest/control record write | `edit_crop_records`, `growth_survey.write`, `pest_scouting.write`, `control_treatment.write` |
| strategy setting save | `edit_strategy_settings` |
| interlock rule save | `edit_interlock_rules`, `edit_interlock_thresholds` |
| dry run | `run_dry_run`, `control.dry_run` |
| final target execution | `execute_final_targets`, `control.execute.manual` |
| safety event ack/clear | `ack_safety_event`, `clear_safety_event` |
| entity mapping | `edit_entity_mapping`, `device.mapping.manage` |
| user/role/system config | `manage_users_roles`, `system_settings` |

---

## 2. 주요 모듈 역할

| 파일 | 역할 |
|---|---|
| `__init__.py` | integration setup, DB bootstrap, HTTP view registration, panel setup, platform forwarding, SafetyGuard watchdog scheduler |
| `db.py` | MariaDB pool/query/schema bootstrap |
| `crop_views.py` | 작기/생육/병해충/방제 API |
| `weather_api.py` | KMA/PSIS API client, HA Store 기반 key/config 저장 |
| `weather_views.py` | 날씨/농약 HTTP API |
| `central_api.py` | Central activation/token/allowlisted vendor adapter client |
| `central_store.py` | Central token material HA Store 저장 |
| `central_views.py` | Central weather/pesticide adapter HTTP views |
| `zone_control_views.py` | zone control, strategy, SafetyGuard, execution, rehearsal, logs 대부분 |
| `frontend_panel.py` | sidebar panel static path/websocket command registration |
| `config_flow.py` | sidebar wizard와 연결되는 hidden config flow |
| `sensor.py` | virtual sensor entities |
| `binary_sensor.py` | virtual binary_sensor entities |
| `switch.py` | virtual switch entities |
| `cover.py` | virtual cover entities |

---

## 3. Integration lifecycle

### 3.1 Manifest

`manifest.json` 기준:

```json
{
  "domain": "green_smart",
  "name": "Green Smart",
  "after_dependencies": ["http"],
  "config_flow": true,
  "iot_class": "local_push",
  "requirements": ["aiomysql==0.2.0"],
  "version": "1.9.56"
}
```

### 3.2 `async_setup(hass, config)`

현재 실제 구현에서 `async_setup()`은 다음을 수행한다.

1. `ensure_schema(hass)`로 DB schema 보장
2. `_views_registered` 플래그로 HTTP views 중복 등록 방지
3. crop/weather/central/zone-control views 등록
4. SafetyGuard watchdog scheduler 시작

주의: 일부 기존 설계 문서는 view/schema registration을 `async_setup_entry()` 기준으로 설명하지만, 현재 구현 기준은 `async_setup()`이다.

### 3.3 `async_setup_entry(hass, entry)`

1. `async_setup_panel(hass)` 호출
2. entry가 virtual mode이면:
   - `hass.data[DOMAIN][entry.entry_id] = {"entry": entry, "virtual": True}`
   - `sensor`, `binary_sensor`, `switch`, `cover` platforms forwarding
3. virtual이 아니면서 필수 config 부족 시 panel-only mode로 return
4. 실제 device config가 있으면 platforms forwarding

### 3.4 `async_unload_entry`

- platforms unload
- SafetyGuard watchdog scheduler 해제
- `hass.data[DOMAIN][entry.entry_id]` 제거
- DB pool close

---

## 4. Panel / WebSocket integration

파일: `frontend_panel.py`

### 4.1 Sidebar panel

| 항목 | 값 |
|---|---|
| frontend url path | `green_smart` |
| component name | `green-smart-panel` |
| title | `Green Smart` |
| icon | `mdi:greenhouse` |
| require_admin | `False` |
| static path | `custom_components/green_smart/panel` |
| static URL | `/green_smart_panel` |
| module URL | `/green_smart_panel/green-smart-panel.js?v=1.9.56` |

### 4.2 WebSocket commands

| command | 역할 |
|---|---|
| `green_smart/is_configured` | config entry 존재/로드 여부 확인 |
| `green_smart/get_config` | wizard/config entry data 반환 |
| `green_smart/save_config` | wizard 설정 저장 |

### 4.3 RBAC/Auth API baseline

v1.9.23에서 Phase U0/U1 baseline으로 Home Assistant 사용자 ID → Green Smart 역할 매핑 계약이 추가되었다.

| Method/Path | 역할 |
|---|---|
| `GET /api/green_smart/auth/me` | 현재 HA 사용자를 `admin`/`farm_owner`/`farm_staff` 역할과 permissions로 반환 |

역할 매핑 source:

```text
Home Assistant user ID
→ Green Smart role mapping
→ permissions
```

1차 persistence는 HA Store key `green_smart_ha_user_roles`를 사용한다. 별도 Green Smart username/password 체계는 사용하지 않는다.

### 4.4 저장 가능한 wizard/config fields

```text
host
port
unit_id
greenhouse_zones
nutrient_zones
stevenson_screens
weatherflow_prefix
virtual
greenhouse_address
location_name
nx
ny
land_regid
ta_regid
central_base_url
central_installation_id
weather_mid_land_reg_id
weather_mid_ta_reg_id
```

activation code는 저장하지 않는다.

---

## 5. DB layer

파일: `db.py`

### 5.1 DB environment

| env | default |
|---|---|
| `DB_HOST` | `127.0.0.1` |
| `DB_PORT` | `3306` |
| `DB_USER` | `gs_user` |
| `DB_PASSWORD` | empty |
| `DB_NAME` | `green_smart` |

### 5.2 Pool

```python
aiomysql.create_pool(
    charset="utf8mb4",
    autocommit=True,
    minsize=2,
    maxsize=10,
)
```

### 5.3 Query helpers

| helper | 역할 |
|---|---|
| `fetchall(hass, sql, args=())` | DictCursor row list 반환, date/datetime ISO 변환 |
| `fetchone(hass, sql, args=())` | 단일 row 반환 |
| `execute(hass, sql, args=())` | insert면 lastrowid, 그 외 rowcount |
| `ensure_schema(hass)` | idempotent schema bootstrap |
| `close_pool()` | pool close |

---

## 6. 현재 DB schema 역할

### 6.1 Crop/basic tables

| table | 역할 |
|---|---|
| `zones` | zone master/reference |
| `crop_seasons` | 작기/재배 시즌 master |
| `growth_surveys` | 생육조사 record, crop_type/metrics_json 포함 |
| `pest_surveys` | 병해충 예찰 record |
| `control_records` | 방제 기록 header |
| `control_pesticides` | 방제 약제 detail/list |

### 6.2 Control core tables

| table | 역할 | scope |
|---|---|---|
| `zone_control_settings` | domain별 운영/전략 설정 JSON | farm_id + crop_season_id + zone_id + domain |
| `zone_interlock_settings` | 인터록/SafetyGuard settings JSON | farm_id + crop_season_id + zone_id + domain |
| `zone_control_modes` | manual/auto/assist/disabled 및 자동실행 허용 | farm_id + crop_season_id + zone_id + domain |
| `ai_zone_control_outputs` | AI/model strategy 후보 | farm_id + crop_season_id + zone_id + domain |
| `zone_final_control_targets` | 최종 실행 target insert-only latest model | farm_id + crop_season_id + zone_id + domain |
| `zone_device_entity_mappings` | device/control role ↔ HA entity 매핑 | farm_id + crop_season_id + zone_id + domain |
| `zone_control_logs` | 설정/실행/차단/SafetyGuard audit trail | farm_id + crop_season_id + zone_id + domain |
| `zone_control_copy_jobs` | zone 설정 복사 이력 | farm_id + crop_season_id + domain |

### 6.3 Device/Irrigation/Admin bootstrap closure tables

v1.9.56 기준 `ensure_schema()`는 과거 설계 문서에 SQL로만 남아 있던 장치/관수/Admin-System 테이블도 모두 생성한다.

장치제어:

| table | 역할 |
|---|---|
| `devices` | HA entity와 대응되는 장치 master |
| `device_groups` | 장치 그룹 master |
| `device_group_items` | 그룹-장치 membership |
| `device_status` | 장치 현재 상태/통신 상태 snapshot |
| `device_control_logs` | 장치 수동/자동 제어 로그 |
| `device_interlocks` | 장치 인터록 rule JSON |
| `device_failsafe_rules` | 장치 Fail Safe rule JSON |
| `device_alarms` | 장치 알람/장애 이력 |
| `ventilation_device_settings` | 환기 장치 설정 |
| `screen_device_settings` | 스크린 장치 설정 |

관수제어:

| table | 역할 |
|---|---|
| `irrigation_settings` | 관수 설정 JSON |
| `sensor_readings` | 센서 측정값 적재 baseline |
| `irrigation_drain_feedback` | 배액 피드백 입력 |
| `ai_irrigation_outputs` | CORP/IRR 관수 AI 출력 |
| `final_irrigation_targets` | 관수 최종 적용값 |
| `irrigation_control_logs` | 관수 실행 로그 |
| `audit_logs` | 공통 audit log |

Admin/System:

| table | 역할 |
|---|---|
| `green_smart_admin_role_mappings` | HA 사용자 ID → Green Smart role 매핑 |
| `green_smart_admin_system_config` | Admin/System 설정 JSON |
| `green_smart_admin_diagnostics` | 진단 결과 JSON |
| `green_smart_admin_backups` | Admin/System 백업 JSON |

정적 contract:

- `tests/test_db_contract.py::test_db_bootstrap_creates_doc_planned_device_irrigation_and_admin_system_tables`
- 문서 `CREATE TABLE` 목록과 `db.py` bootstrap 목록 비교 시 missing count 0

### 6.4 Candidate/future tables

기존 설계 문서에는 있으나 현재 `db.py`에는 아직 생성되지 않는 candidate/future table:

```text
zone_strategy_snapshots
zone_control_safety_events
crop_growth_scores
```

현재 SafetyGuard event lifecycle은 별도 table이 아니라 `zone_control_logs`의 action/before/after JSON으로 표현한다.

---

## 7. Crop API

파일: `crop_views.py`

| View | Method/Path | 역할 |
|---|---|---|
| `CropSeasonsView` | `GET /api/green_smart/crop/seasons` | 작기 목록 |
| `CropSeasonsView` | `POST /api/green_smart/crop/seasons` | 작기 생성 |
| `CropSeasonDemolishView` | `PATCH /api/green_smart/crop/seasons/{season_id}/demolish` | 철거일 설정 |
| `CropSeasonDeleteView` | `PATCH /api/green_smart/crop/seasons/{season_id}` | 작기 수정 |
| `CropSeasonDeleteView` | `DELETE /api/green_smart/crop/seasons/{season_id}` | 작기 hard delete 및 관련 row 삭제 |
| `CropGrowthListView` | `GET/POST /api/green_smart/crop/seasons/{season_id}/growth` | 생육조사 목록/추가 |
| `CropGrowthDeleteView` | `DELETE /api/green_smart/crop/growth/{record_id}` | 생육조사 soft delete |
| `CropPestListView` | `GET/POST /api/green_smart/crop/seasons/{season_id}/pest` | 병해충 예찰 목록/추가 |
| `CropPestDeleteView` | `DELETE /api/green_smart/crop/pest/{record_id}` | 병해충 soft delete |
| `CropControlListView` | `GET/POST /api/green_smart/crop/seasons/{season_id}/control` | 방제 기록 목록/추가 |
| `CropControlDeleteView` | `DELETE /api/green_smart/crop/control/{record_id}` | 방제 기록 soft delete |

---

## 8. Weather / pesticide API

파일:

- `weather_api.py`
- `weather_views.py`

### 8.1 Storage

HA Store key:

```text
green_smart_weather
```

저장 항목:

- short API key
- mid API key
- PSIS API key
- nx/ny
- location_name
- ta_regid/land_regid

보안:

- 원본 key는 response에 노출하지 않는다.
- masked key만 반환한다.

### 8.2 Routes

| Method/Path | 역할 |
|---|---|
| `GET /api/green_smart/weather/current` | KMA current, key 없으면 virtual/dummy fallback |
| `GET /api/green_smart/weather/forecast` | KMA short forecast |
| `GET /api/green_smart/weather/weekly` | 단기+중기 7일 예보 |
| `GET/POST/DELETE /api/green_smart/weather/config` | weather config/key 저장/조회/삭제 |
| `POST /api/green_smart/weather/validate-key` | 단기 key 검증 |
| `POST /api/green_smart/weather/validate-mid-key` | 중기 key 검증 |
| `POST /api/green_smart/weather/search-location` | 주소/읍면동 기반 KMA grid 위치 검색 |
| `GET /api/green_smart/pesticide/search?q=...` | PSIS 농약 검색 |
| `GET/POST /api/green_smart/pesticide/config` | PSIS key 조회/저장 |
| `POST /api/green_smart/pesticide/mix-check` | 약제 혼용 가능 여부 조회 |

---

## 9. Central adapter API

파일:

- `central_api.py`
- `central_store.py`
- `central_views.py`

### 9.1 Central design

Central 연동은 generic proxy가 아니라 allowlisted adapter만 노출한다.

기본 base URL:

```text
http://127.0.0.1:18000
```

activation/token flow:

```text
activation_code
→ /activation/exchange
→ access_token/refresh_token
→ CentralTokenStore
→ adapter call 시 Bearer token
→ 필요 시 /tokens/refresh
```

### 9.2 HA Store

HA Store key:

```text
green_smart_central
```

저장:

- base_url
- installation_id
- access_token
- refresh_token
- token_type
- expires_at

### 9.3 Routes

| Method/Path | Central endpoint | 역할 |
|---|---|---|
| `POST /api/green_smart/central/weather/current` | `/vendor/adapters/weather/current` | current weather |
| `POST /api/green_smart/central/weather/forecast` | `/vendor/adapters/weather/forecast` | forecast |
| `POST /api/green_smart/central/weather/mid` | `/vendor/adapters/weather/mid` | mid forecast |
| `POST /api/green_smart/central/pesticide/search` | `/vendor/adapters/pesticide/search` | pesticide search |
| `POST /api/green_smart/central/crop/interlock-snapshot/sync` | `/edge/snapshots/crop-interlock` | edge-computed crop interlock snapshot sync |
| `GET /api/green_smart/central/crop/interlock-analytics/summary` | `/analytics/crop-interlock/summary` | 센터 분석 참고용 읽기 전용 카드 데이터. 실시간 제어 판단은 현장 Edge가 수행합니다 |
| n/a | `GET /analytics/crop-interlock/summary` | Center-side analytics/reporting only: `reason_counts`, `approval_gate_counts`, `approval_type_counts`, `harvest_safety_unknown_count`. 실시간 safety/interlock 최종 판단자가 아니다 |
| n/a | `POST /edge/telemetry/environment` | Edge 1분 환경 telemetry/rate-limit snapshot 수신 |
| n/a | `GET /analytics/environment/telemetry/summary` | Center model 입력용; Edge remains real-time authority |

### 9.4 Snapshot sync policy

```text
Edge 실시간 판단/감시 기준: 1분
Center snapshot/analytics sync 기준: 5분
이벤트 발생 시 즉시 sync
```

Code constants:

```python
EDGE_REALTIME_EVALUATION_INTERVAL_SECONDS = 60
CENTER_CROP_INTERLOCK_SNAPSHOT_SYNC_INTERVAL_SECONDS = 300
```

전송 구조:

```text
Center는 push 수신
Edge가 주기/이벤트 기반 전송
```

Triggers:

| Trigger | 기준 |
|---|---|
| `scheduled_5m` | active crop season snapshot을 5분마다 중앙 sync |
| `growth_report_refresh` | AI 전략/생육 리포트 새로고침 직후 즉시 sync |
| `approval_saved` | crop interlock approval 저장 직후 즉시 sync |
| `manual_panel` | 운영자가 Center 분석 카드에서 수동 sync |

실패 정책: Center sync 실패는 로컬 제어 판단을 차단하지 않고 다음 tick/event에서 재시도한다.

### 9.5 Environment telemetry / rate-limit model input policy

```text
Edge environment telemetry sync 기준: 1분
Center model 입력용; Edge remains real-time authority
```

Center DB tables:

```text
environment_telemetry_snapshots
rate_limit_events
```

Center endpoints:

```http
POST /edge/telemetry/environment
GET /analytics/environment/telemetry/summary
```

Edge payload fields:

```json
{
  "metrics": {
    "temperature": 25.4,
    "humidity": 72.1,
    "co2": 680,
    "ec": 2.1,
    "ph": 5.9
  },
  "deltas": {
    "temperatureDelta1m": 0.4,
    "humidityDelta1m": -1.8
  },
  "rateLimitFlags": []
}
```

`temperatureDelta1m`, `humidityDelta1m`, `co2Delta1m`, `ecDelta1m`, `phDelta1m`는 1분 변화율 판단의 MVP 입력이다. v1.9.56 기준 threshold는 경고 이벤트만 생성하고, 실행 allow/block 최종 판단은 Edge SafetyGuard/Interlock가 담당한다.

### 9.6 Crop policy bundle / Edge cache-fallback policy

현재 범위는 Crop이며 환경/관수/장치 PID 적용은 제외한다. v1.9.56의 목적은 Center가 작물 정책 후보를 계산하고, Edge가 이를 검증·캐시한 뒤 작물 모델/작물 인터록 변수로만 사용하는 것이다.

```text
Crop policy bundle
Center calculates crop policy candidates; Edge validates/caches/applies
fresh → stale_usable → stale_restricted → fallback_safe
apply_mode = recommend_only
```

Center persistence/API:

```text
crop_policy_bundles
POST /analytics/crop/policy/recalculate
GET /edge/policies/crop/latest
```

Bundle fields:

```text
crop_model_variables
crop_interlock_variables
recommendation_hints
confidence
apply_mode = recommend_only
valid_until
stale_after_seconds
fallback_after_seconds
```

Edge cache:

```text
edge_crop_policy_cache
```

Edge 상태 정책:

| 상태 | 의미 |
|---|---|
| `fresh` | Center 최신 작물 정책 후보를 검증해 캐시 |
| `stale_usable` | Center 지연 시 기존 작물 정책 후보 유지 |
| `stale_restricted` | 더 오래 지연되면 작물 추천/승인 요구를 보수적으로 강화 |
| `fallback_safe` | 너무 오래 지연되면 기본 작물 인터록/승인 정책 사용 |
| `rejected` | Center 후보가 형식/범위/권한 조건에 맞지 않아 폐기 |

원칙:

```text
Center는 crop_model_variables, crop_interlock_variables, recommendation_hints 후보를 계산한다.
Edge는 수신 bundle을 검증하고 edge_crop_policy_cache에 저장한다.
Edge는 작물 모델/작물 인터록 변수로만 사용하며, 실제 실행 권한은 기존 Edge Safety/Interlock 경로에 남긴다.
```

### 9.7 Crop policy model/interlock integration

v1.9.56는 직전 단계의 `edge_crop_policy_cache`를 실제 작물 리포트 응답에 연결한다. Center policy may not unblock crop interlock. Center 후보는 `recommend_only` 입력이며, Edge crop safety/interlock이 최종 권한을 가진다.

응답 필드:

```text
centerCropPolicy
cropPolicyAppliedToModel
cropPolicyAppliedToInterlock
cropModelVariables
cropInterlockVariables
recommendationHints
policyStatus
applyMode = recommend_only
```

상태별 처리:

| 상태 | 작물 모델 반영 | 작물 인터록 반영 |
|---|---:|---:|
| `fresh` | 예 | read-only reason/hint |
| `stale_usable` | 예 | read-only reason/hint |
| `stale_restricted` | 제한 | `center_policy_stale_restricted`로 보수적 확인 요구 |
| `fallback_safe` | 아니오 | `center_policy_fallback_safe`로 보수적 fallback |
| `rejected` | 아니오 | `center_policy_rejected`로 폐기 사유 표시 |

현재 범위는 Crop이며 환경/관수/장치 PID 적용은 제외한다.

### 9.8 Crop policy alert/audit baseline

v1.9.56는 Center crop policy 상태 중 `fallback_safe / stale_restricted / rejected`를 운영자가 놓치지 않도록 panel 경고와 audit 기록을 추가한다.

```text
crop_policy_status_change
audit_logs
CENTER_CROP_POLICY_ALERT_STATUSES = fallback_safe / stale_restricted / rejected
```

동작 원칙:

- `fallback_safe`, `stale_restricted`, `rejected` 상태만 audit 대상으로 삼는다.
- `crop_policy_alert_audit_deduped` cache로 같은 season/zone/status/policyVersion에 대한 중복 audit 방지.
- `audit_logs.after_json`에는 `policyStatus`, `policyVersion`, `reasonCodes`, `recommendationHints`, `alertSeverity`, `auditLogged`를 저장한다.
- persistent notification은 아직 기본 생성하지 않는다. v1.9.56는 panel alert + audit baseline까지만 수행한다.
- 실행 버튼/Center 실행권은 추가하지 않는다.

### 9.9 Crop policy notification opt-in

v1.9.56은 직전 단계의 panel alert + audit baseline 위에 Home Assistant persistent notification opt-in/dismiss UX를 추가한다.

```text
persistent_notification.create
persistent_notification.dismiss
CROP_POLICY_NOTIFICATION_SETTINGS_KEY
CROP_POLICY_NOTIFICATION_STATE_KEY
```

동작 원칙:

- `fallback_safe / rejected`는 알림 기본 대상이다.
- stale_restricted는 설정에 따라 알림한다.
- 작기/구역/상태/policyVersion 기준으로 중복 notification을 방지한다.
- 상태가 fresh/stale_usable로 회복되면 dismiss를 호출한다.
- panel의 알림 ON/OFF와 알림 해제 버튼은 read-only 운영 알림 제어이며 실행 권한이 아니다.
- Crop 범위를 유지하며 환경/관수/장치 PID 적용은 제외한다.

---

## 9A. 통합 모델 contract

v1.9.56 이후 제품 설계 기준은 `Safety → Interlock → Model(AI)`를 각 domain 내부 순서로 삼고, domain 참조 순서는 `Crop → Environment → Irrigation → Device`를 따른다. M2~M8 모델 확장은 안전/인터록 contract가 명시될 때까지 보류한다.

```text
Crop Safety Rules
→ Crop Interlock/Fallback Rules
→ Crop Season Model
→ Environment Safety Rules
→ Environment Interlock
→ Environment Strategy Model
→ Irrigation Safety Rules
→ Irrigation Interlock
→ Irrigation Strategy Model
→ Device Safety Rules / Fail Safe
→ Device Interlock
→ Device Operation Model
→ Control Mode / Limited Auto / Operator Confirmation
→ HA service call / post-state verification / logs
→ feedback back to Crop/Environment/Irrigation models
```

단순히 `SafetyGuard 우선` marker를 응답에 넣는 것만으로는 충분하지 않다. 각 domain은 deterministic rule, threshold, reasonCode, fallback/interlock action, log field를 가져야 한다.

### 9A.1 작기 모델

작기 모델은 `crop_season_id + zone_id`를 기준으로 한다.

입력:

- `crop_seasons.crop_type`, `variety`, `plant_date`, `plant_density`, `zone_id`
- `growth_surveys.metrics_json`
- `pest_surveys`
- `control_records` / `control_pesticides`
- weather/cache and recent environment/control history

출력:

- `cropModelVersion`
- `cropProfile`
- `growthStage`
- `gIndex`
- `yieldPrediction`
- `pestRisk`
- `confidenceReasons`
- crop profile label/version
- growth stage baseline
- G-Index and trend
- yield prediction and confidence
- pest risk and recommended actions
- model drivers usable by environment/irrigation strategy models

No new DB table is required for M1. The reusable helper is `_crop_model_snapshot(hass, season_id)` and it reads the existing `crop_seasons`, `growth_surveys`, `pest_surveys`, and `control_records` tables. The growth-report API includes this snapshot as `cropModel` while preserving the existing top-level `yieldPrediction` and `pestRisk` keys for compatibility.

### 9A.1.1 작물 안전 룰 — next required layer

작물 안전 룰은 작기/작물 모델보다 먼저 정의되는 deterministic layer다.

필수 marker:

```text
CROP_SAFETY_RULE_VERSION
CROP_SAFETY_RULE_DEFAULTS
_crop_safety_rule_snapshot(...)
cropSafetyStatus
cropSafetyBlocked
cropSafetyReasons
cropSafetyRules
cropSafetyRuleResults
pesticide_pls_noncompliant
pesticide_mix_forbidden
pesticide_mix_unknown
crop_metric_anomaly
minGIndex
maxMetricDeltaByKey
```

최소 rule category:

| Category | Block/fallback reasonCode |
|---|---|
| active crop season missing | `crop_season_missing` |
| unknown/unsupported crop type | `crop_type_unknown` |
| stale growth survey | `growth_survey_stale` |
| high/rising pest risk | `crop_pest_risk_high` |
| impossible G-Index/growth velocity | `crop_growth_anomaly` |
| out-of-range or fast-changing growth survey metric | `crop_metric_anomaly` |
| PLS non-compliant or warning pesticide use | `pesticide_pls_noncompliant` |
| forbidden pesticide mix | `pesticide_mix_forbidden` |
| unknown pesticide mix status for multi-pesticide spray | `pesticide_mix_unknown` |
| stale control/pesticide record with medium/high pest risk | `crop_control_record_stale` |
| low crop model confidence | `crop_confidence_low` |

기본 임계값(`CROP_SAFETY_RULE_DEFAULTS`):

| Key | Default | Meaning |
|---|---:|---|
| `growthSurveyStaleDays` | 14 | 최신 생육조사가 14일 초과면 stale |
| `controlRecordStaleDays` | 21 | 병해 medium/high에서 최근 방제/관리 기록이 21일 초과면 stale |
| `minGIndex` | 0.0 | 이 값 미만 G-Index는 이상치 |
| `maxGIndex` | 120.0 | 이 값을 초과하는 G-Index는 이상치 |
| `maxWeeklyGrowthCm` | 80.0 | 주간 생장속도 80cm 초과는 이상치 |
| `metricBoundsByKey` | height/leafCount/stemDia/truss/node | 생육조사 지표별 허용 범위 |
| `maxMetricDeltaByKey` | height 80, leafCount 30, stemDia 20, truss 10, node 30 | 직전 조사 대비 급변 이상치 기준 |
| `supportedCropTypes` | `tomato`, `lettuce` | crop-specific 안전 기준을 적용하는 작물 |

### 9A.1.2 작물 인터록 — C-S2 baseline

작물 인터록은 crop safety 결과가 blocked/uncertain일 때 downstream environment/irrigation/device model target promotion을 막거나 보수 baseline으로 돌리는 fallback layer다. v1.9.56 기준 C-S2는 `_crop_interlock_decision(cropSafety)`로 `crop_interlock_policy_v1` 결정을 만든다.

필수 marker:

```text
CROP_INTERLOCK_VERSION
_crop_interlock_decision(...)
cropInterlockStatus
cropInterlockBlocked
cropInterlockActions
fallbackToConservativeBaseline
operatorConfirmationRequired
managerApprovalRequired
adminApprovalRequired
blockTargetPromotion
blockAutoExecution
useGenericSafeRangesOnly
blockAggressiveClimateAndIrrigationChanges
crop_interlock_policy_v1
```

기본 결정:

| Safety reason | Interlock action |
|---|---|
| `crop_season_missing` | downstream model target block |
| `crop_type_unknown` | generic safe range only + operator confirmation |
| `growth_survey_stale` | read-only preview + block auto execution + require fresh survey |
| `crop_pest_risk_high` | block aggressive climate/irrigation changes + manager approval |
| `pesticide_pls_noncompliant` | block pesticide noncompliant targets + admin approval |
| `pesticide_mix_forbidden` | block pesticide mix targets + admin approval |
| `pesticide_mix_unknown` | require pesticide mix confirmation |
| `crop_confidence_low` / stale control / growth anomaly | conservative crop baseline fallback |

| Output flag | Meaning |
|---|---|
| `blockTargetPromotion` | model target cannot be promoted downstream |
| `blockAutoExecution` | no automatic execution from crop-derived model output |
| `fallbackToConservativeBaseline` | use conservative/default crop baseline until operator resolves risk |
| `operatorConfirmationRequired` | operator must explicitly confirm before continuing |

M2 환경 전략 모델로 진행하려면 먼저 9A.1.1과 9A.1.2가 contract/test/code로 통과해야 한다.

### 9A.2 환경 전략 모델

환경 전략 모델은 `crop_season_id + zone_id + domain=environment`를 기준으로 한다.

입력:

- 작기 모델 output: crop type/profile, growth stage, G-Index, pest/yield risk hints
- HA entity state summary
- weather source
- operator manual override
- `zone_control_settings.settings_json`
- SafetyGuard policy hints

출력:

- CORP G-Index interpretation
- TEMHUM ADT/DIF/VPD
- CO₂ target
- VENT/SCRN/난방 final target candidate
- `targetDiff`, `diffCount`, confidence/reason list

현재 API 호환:

- route: `GET/POST /api/green_smart/environment/strategy-preview`
- legacy save marker: `calculated_by = environment_strategy_mvp`
- UI label: `환경 전략 모델`

### 9A.3 관수 전략 모델

관수 전략 모델은 `crop_season_id + zone_id + domain=irrigation`를 기준으로 한다.

입력:

- 작기 모델 output: crop profile/growth stage/G-Index
- 환경 전략 모델 output: VPD, temperature, humidity, radiation, stress/risk hints
- VWC/EC/pH/dryback/drain feedback
- operator manual override
- `zone_control_settings.settings_json`

출력:

- shotAmountL
- minIntervalMin
- targetEc / targetPh
- targetDryback / targetDrainRate
- emergencyIrrigation marker
- `targetDiff`, `diffCount`, confidence/reason list

현재 API 호환:

- route: `GET/POST /api/green_smart/irrigation/strategy-preview`
- legacy save marker: `calculated_by = irrigation_strategy_mvp`
- UI label: `관수 전략 모델`

### 9A.4 장치 운영 모델

장치 운영 모델은 final target을 실제 HA service call plan으로 바꾸는 실행 전 모델이다.

입력:

- environment/irrigation/device final targets
- `zone_device_entity_mappings`
- `devices`, `device_status`, `device_interlocks`, `device_failsafe_rules`, `device_alarms`
- HA entity current state and supported service domain
- safe_state / device capability / operator confirmation

출력:

- dry-run service call plan
- executable service call plan
- blocked/failsafe/clear decision
- post-state verification expectation
- device risk/alarm summary

장치 운영 모델은 직접 실행 권한을 갖지 않는다. 실행은 반드시 `execute-final-targets`의 Control Mode, Limited Auto, Operator Confirmation, SafetyGuard, Interlock gate를 통과해야 한다.

---

## 10. Zone control common contract

파일: `zone_control_views.py`

### 10.1 Domain and scope

Valid domains:

```text
environment
irrigation
device
```

Scope:

```text
farm_id + crop_season_id + zone_id + domain
```

| API | Purpose | Contract markers |
|---|---|---|
| `GET/PATCH /api/green_smart/crop/stage-calibrations` | C-S1/C-S2 실사용 심화용 crop stage + G-Index/L-Index calibration 조회/수정 | `crop_stage_calibrations`, `CROP_STAGE_CALIBRATION_DEFAULTS`, `stageConfidence`, `entryEvidence`, `missingEvidence`, `nextRequiredSurvey` |
| `GET /api/green_smart/crop/seasons/{season_id}/growth-report` | Phase 6 생육 리포트/G-Index/작물별 수확량 예측/병해 위험도/주간 리포트 | `cropModel`, `cropSafety`, `cropInterlock` |
| `POST /api/green_smart/crop/seasons/{season_id}/growth-report/notify` | 주간 생육 리포트를 Home Assistant persistent notification으로 전송 | `weeklyReport`, notification settings |

`yieldPrediction`은 tomato/lettuce/generic 작물별 baseline 모델을 사용하며 다음 필드를 포함한다.

```text
estimatedKg
estimatedKgPerPlant
estimatedKgPerArea
modelVersion
cropModelLabel
yieldDrivers.gIndexFactor
yieldDrivers.velocityFactor
yieldDrivers.densityFactor
yieldDrivers.growthVelocityCmPerWeek
confidenceReasons
```

`pestRisk`는 최근 병해충 예찰, weather store cache, 최근 방제 이력을 결합하는 `weather_environment_control_model_v1` baseline이며 다음 필드를 포함한다.

```text
modelVersion
environmentDrivers.humidityRisk
environmentDrivers.temperatureRisk
environmentDrivers.combinedHumidityTemperatureRisk
weatherDrivers.avgHumidity
weatherDrivers.avgTemperature
weatherDrivers.rainSignalCount
weatherDrivers.rainRisk
controlHistoryDrivers.lastControlDate
controlHistoryDrivers.daysSinceLastControl
controlHistoryDrivers.controlHistoryScore
riskFactors
recommendedActions
pestHistoryScore
```

`weeklyReport`는 UI export/notification 용도로 다음 필드를 포함한다.

```text
summary
actions
lastControlDate
yieldEstimatedKg
pestRiskLevel
exportText
exportCsv
exportFilename
notificationDraft
```

`POST /growth-report/notify`는 `persistent_notification.create`를 호출하며 `notification_id`는 `green_smart_weekly_report_{season_id}`다.

### 10.2 Generic zone APIs

| Method/Path | DB/기능 |
|---|---|
| `GET/POST /api/green_smart/zones/control-settings` | `zone_control_settings` 조회/upsert |
| `GET/POST /api/green_smart/zones/interlock-settings` | `zone_interlock_settings` 조회/upsert |
| `GET/POST /api/green_smart/zones/control-mode` | `zone_control_modes` 조회/upsert |
| `POST /api/green_smart/zones/copy-control-settings` | 현재 설정을 다른 zone으로 복사 |
| `GET/POST /api/green_smart/zones/final-targets` | latest final target 조회 / 새 target 저장 |
| `GET/POST /api/green_smart/zones/ai-control-outputs` | AI output 후보 조회/저장 |
| `POST /api/green_smart/zones/ai-control-outputs/{output_id}/apply` | AI output을 final target으로 승격 |
| `GET/POST/DELETE /api/green_smart/zones/device-entity-mappings` | HA entity mapping CRUD |
| `GET /api/green_smart/zones/entity-state-summary` | mapping별 HA state summary |
| `GET /api/green_smart/zones/entity-mapping-validation` | entity/mapping/service/safe_state 검증 |
| `GET /api/green_smart/zones/control-logs` | audit log 조회 |
| `POST /api/green_smart/zones/execute-final-targets` | dry-run/실제 final target 실행 |
| `GET /api/green_smart/zones/safety-guard-watchdog` | SafetyGuard watchdog 검사 |
| `GET /api/green_smart/zones/safety-guard-events` | SafetyGuard event lifecycle 조회 |
| `POST /api/green_smart/zones/safety-guard-events/ack` | 이벤트 운영자 확인 |
| `POST /api/green_smart/zones/safety-guard-events/clear` | 이벤트 조치 완료/해제 |
| `GET/POST /api/green_smart/zones/limited-auto-policy` | 제한적 자동제어 policy |
| `POST /api/green_smart/zones/alert-resume` | 알림 확인 후 재개 요청 |
| `GET /api/green_smart/zones/rehearsal-readiness` | 현장 리허설 readiness |
| `POST /api/green_smart/zones/virtual-rehearsal` | 가상 장치 리허설 |

Home 첫 카드 상태 팝업은 위 generic zone API를 재사용한다.

```text
확인/조치 완료:
- safety-guard-events/ack
- safety-guard-events/clear
- zone_control_logs 기반 event lifecycle/audit log 기록

장치 정지/제한 실행:
- zones/execute-final-targets
- dry_run=true
- post_state_delay=0
- 실제 HA service call 실행 없음
```

Home baseline은 operator-first UX를 위한 빠른 진입점이며, 실제 장비 실행은 각 제어 페이지에서 운영자 확인 문구, role/permission, Control Mode, Limited Auto, SafetyGuard, Interlock/fail-safe를 다시 통과해야 한다.

### 10.3 Domain wrapper APIs

Environment wrappers / 환경 전략 모델:

```text
GET/POST /api/green_smart/environment/control-settings
GET/POST /api/green_smart/environment/ai-control-outputs
GET/POST/DELETE /api/green_smart/environment/device-entity-mappings
POST /api/green_smart/environment/execute-final-targets
GET/POST /api/green_smart/environment/strategy-preview
```

Irrigation wrappers / 관수 전략 모델:

```text
GET/POST /api/green_smart/irrigation/control-settings
GET/POST /api/green_smart/irrigation/ai-control-outputs
GET/POST/DELETE /api/green_smart/irrigation/device-entity-mappings
POST /api/green_smart/irrigation/execute-final-targets
GET/POST /api/green_smart/irrigation/strategy-preview
```

Device wrappers / 장치 운영 모델:

```text
GET/POST /api/green_smart/devices/control-settings
GET/POST /api/green_smart/devices/ai-control-outputs
GET/POST/DELETE /api/green_smart/devices/device-entity-mappings
POST /api/green_smart/devices/execute-final-targets
```

---

## 11. Strategy model preview APIs

### 11.1 Environment strategy model

Route:

```text
GET/POST /api/green_smart/environment/strategy-preview
```

Components:

```text
CORP
TEMHUM
VENT
SCRN
```

입력 source:

- HA entity state summary
- weather source
- manual/operator override

출력:

- corpGIndex
- ADT/DIF/VPD
- ventTarget
- screenTarget
- targetDiff
- final target save 가능

저장 시:

```text
calculated_by = environment_strategy_mvp  # legacy identifier, UI label은 환경 전략 모델
```

### 11.2 Irrigation strategy model

Route:

```text
GET/POST /api/green_smart/irrigation/strategy-preview
```

Components:

```text
IRR
EC_PH
VWC
DRYBACK
```

입력:

- accumulatedRadiation
- currentVwc
- currentEc
- currentPh
- dryback
- baseShotAmountL
- baseIntervalMin
- baseEc
- basePh
- targetDrainRate

출력 targets:

- shotAmountL
- minIntervalMin
- targetEc
- targetPh
- targetDryback
- targetDrainRate
- emergencyIrrigation
- safetyPolicy = SafetyGuard 우선

저장 시:

```text
calculated_by = irrigation_strategy_mvp  # legacy identifier, UI label은 관수 전략 모델
```

---

## 12. Final target execution flow

Route:

```text
POST /api/green_smart/zones/execute-final-targets
```

### 12.1 입력

```json
{
  "farmId": 1,
  "cropSeasonId": 1,
  "zoneId": 1,
  "domain": "environment",
  "dryRun": false,
  "postStateDelay": 0.4,
  "operatorConfirmed": true,
  "operatorConfirmationText": "실제 장비 실행 확인",
  "operatorRole": "operator",
  "operatorOverrideReason": "panel operator confirmation"
}
```

### 12.2 실행 순서

```text
request body parse
→ latest final target 조회
→ control mode 조회
→ control mode decision
→ limited auto policy 조회
→ limited auto decision
→ operator confirmation 검사
→ enabled entity mappings 조회
→ interlock settings 조회
→ mapping별 target value resolve
→ HA service call 생성
→ pre-state snapshot
→ SafetyGuard decision
→ blocked이면 safe_state/failsafe call 생성
→ dry_run이면 실행하지 않고 계획만 반환
→ 실제 실행이면 hass.services.async_call
→ homeassistant.update_entity
→ post-state snapshot
→ state verification
→ zone_control_logs 기록
→ JSON response
```

### 12.3 Operator confirmation

필수 문구:

```text
실제 장비 실행 확인
```

허용 role:

```text
operator
admin
owner
technician
```

manual/assist mode에서는 override reason이 필요하다.

### 12.4 HA service mapping

| entity domain | service 변환 |
|---|---|
| `switch`, `input_boolean`, `fan` | `turn_on` / `turn_off` |
| `cover` | `set_cover_position` / `open_cover` / `close_cover` / `stop_cover` |
| `light` | `turn_on` / `turn_off` |
| `climate` | `set_temperature` |
| `number`, `input_number` | `set_value` |
| unknown | turn_on/turn_off fallback |

### 12.5 Target value resolution

target value는 아래 우선순위로 찾는다.

```text
mapping.controlRole
mapping.deviceType
mapping.entityId
mapping.entityId with "." replaced by "_"
```

---

## 13. SafetyGuard / Interlock / Fail Safe

### 13.1 우선순위

```text
SafetyGuard
> Manual emergency/override policy
> final target
> AI/strategy recommendation
> optimization
```

### 13.2 Policy merge

SafetyGuard policy source:

1. `zone_interlock_settings.settings_json`
2. `zone_final_control_targets.targets_json._safety` 또는 `targets_json.safety`

기본 policy:

```json
{
  "emergency_stop": false,
  "block_on_unavailable": true,
  "apply_safe_state_on_block": true,
  "rules": []
}
```

### 13.3 지원 conditions

```text
unavailable
unknown
equals
above
below
wind_speed_above
temperature_below
temperature_above
vwc_below
vwc_above
ec_below
ec_above
sensor_integrity
```

### 13.4 Sensor rule fields

```text
sensor_entity_id
sensor_attribute
sensor_operator
sensor_threshold
reasonCode
action
message
```

operators:

```text
above, below, equals, not_equals, is_on, is_off, truthy, falsy
```

### 13.5 Decision output 핵심

```json
{
  "blockedByInterlock": true,
  "failSafeApplied": true,
  "safetyStatus": "failsafe",
  "safeStateCall": {},
  "safetyGuard": {
    "status": "failsafe",
    "blocked": true,
    "failSafeRequired": true,
    "reasons": [],
    "ruleResults": []
  }
}
```

status:

```text
clear
blocked
failsafe
```

### 13.6 Safe state

source:

```text
zone_device_entity_mappings.safe_state
```

없으면 default:

```text
off
```

blocked 시 `apply_safe_state_on_block`가 true이면 original call 대신 safe_state call이 생성/실행된다.

---

## 14. SafetyGuard watchdog / event lifecycle

### 14.1 Scheduler

`__init__.py`에서 60초마다 실행:

```text
async_track_time_interval(..., 60초)
→ _run_safety_guard_watchdog_tick()
→ zone_control_views._safety_guard_watchdog_response(...)
```

### 14.2 Watchdog route

```text
GET /api/green_smart/zones/safety-guard-watchdog
```

query:

- farm_id
- crop_season_id
- zone_id
- domain
- notify
- stale_threshold_seconds

기본 stale threshold:

```text
120 seconds
```

### 14.3 Persistent notification

critical event + `notify=true`이면 HA persistent notification 생성.

notification id:

```text
green_smart_safety_guard_{crop_season_id}_{zone_id}_{domain}
```

### 14.4 Event lifecycle

Routes:

```text
GET /api/green_smart/zones/safety-guard-events
POST /api/green_smart/zones/safety-guard-events/ack
POST /api/green_smart/zones/safety-guard-events/clear
```

lifecycle:

```text
active → acknowledged → cleared
```

현재 저장소는 별도 event table이 아니라 `zone_control_logs`다.

---

## 15. Entity mapping / validation / state summary

### 15.1 Mapping fields

```text
device_type
entity_id
control_role
safe_state
enabled
note
```

unique:

```text
farm_id + crop_season_id + zone_id + domain + entity_id + control_role
```

### 15.2 State summary

Route:

```text
GET /api/green_smart/zones/entity-state-summary
```

summary:

- total
- available
- unavailable
- unknown
- stale
- hasBlockingState

### 15.3 Validation

Route:

```text
GET /api/green_smart/zones/entity-mapping-validation
```

검사:

- entity_id 존재
- domain/service 호환성
- safe_state 유효성
- 위험 장비 mapping 누락

---

## 16. Rehearsal / Virtual entities

### 16.1 Rehearsal readiness

Route:

```text
GET /api/green_smart/zones/rehearsal-readiness
```

시나리오:

```text
normal_operation
strong_wind_block
rain_block
low_temperature_block
sensor_fault_block
failsafe_recovery
operator_recovery
```

검사:

- dryRun
- entityMapping
- operatorConfirmation
- sensorSafety
- safetyGuard
- failsafe
- entityState
- executionLog
- resume

### 16.2 Virtual rehearsal

Route:

```text
POST /api/green_smart/zones/virtual-rehearsal
```

핵심 gate:

```json
{
  "virtualDeviceOnly": true,
  "physicalDeviceConnectionAllowed": false,
  "scenarioPassCount": 7,
  "scenarioFailCount": 0,
  "scenarioPassRate": 1.0,
  "c20GateStatus": "virtual_passed_review_required",
  "c20ReadyAfterVirtualPass": true,
  "virtualRehearsalEvidence": {
    "coverage": "normal/strong-wind/rain/low-temp/sensor-fault/blocked/Fail Safe/recovery",
    "message": "C20 제한적 실제 현장 리허설 전 가상 시나리오 증거: 실제 장비 연결 금지"
  }
}
```

로그 action:

```text
virtual_rehearsal_executed
virtual_rehearsal_evidence_generated
```

### 16.3 Virtual entity platforms

Virtual mode에서 forward되는 platform:

```text
sensor
binary_sensor
switch
cover
```

### 16.4 Virtual entities

Domains:

```text
environment
irrigation
device
```

각 domain별 entities:

| platform | entities |
|---|---|
| sensor | `wind_speed`, `temperature` |
| binary_sensor | `rain`, `sensor_fault` |
| switch | `irrigation_pump`, `alarm_beacon` |
| cover | `ventilation`, `screen` |

예시:

```text
sensor.green_smart_virtual_environment_wind_speed
binary_sensor.green_smart_virtual_irrigation_rain
switch.green_smart_virtual_device_alarm_beacon
cover.green_smart_virtual_environment_ventilation
```

총 24개 entity가 생성된다.

---

## 17. Config flow

파일: `config_flow.py`

특징:

- sidebar wizard가 config entry 저장을 담당
- 이미 entry가 있으면 `already_configured`
- activation code가 있으면 central activation exchange 수행
- activation code 자체는 저장하지 않음
- token pair는 `CentralTokenStore`에 저장

Wizard keys:

```text
host
port
unit_id
greenhouse_zones
nutrient_zones
stevenson_screens
weatherflow_prefix
virtual
greenhouse_address
location_name
nx
ny
land_regid
ta_regid
central_base_url
central_installation_id
weather_mid_land_reg_id
weather_mid_ta_reg_id
```

---

## 18. Logging / audit 기준

모든 중요한 제어 관련 행위는 `zone_control_logs`에 남겨야 한다.

대표 action:

```text
save_control_settings
interlock_settings_saved
control_mode_saved
final_targets_saved
ai_output_applied
device_entity_mapping_saved
device_entity_mapping_deleted
entity_mapping_validation_checked
blocked_by_control_mode
limited_auto_execution_blocked
operator_confirmation_required
operator_execution_confirmed
limited_auto_execution_allowed
final_target_execution_failed
failsafe_applied
safety_guard_blocked
sensor_safety_rule_blocked
execution_safety_blocked
state_verification_failed
state_verification_passed
final_targets_executed
safety_guard_watchdog_checked
safety_guard_event_acknowledged
safety_guard_event_cleared
```

---

## 19. 현재 구현과 기존 설계 문서의 차이

| 항목 | 현재 구현 | 기존/미래 설계 문서 |
|---|---|---|
| setup 위치 | schema/view registration은 `async_setup()` | 일부 문서는 `async_setup_entry()` 중심 |
| safety event 저장 | `zone_control_logs` action lifecycle | `zone_control_safety_events` candidate table |
| strategy snapshot | 아직 table 없음 | `zone_strategy_snapshots` candidate |
| raw sensor 장기 저장 | HA recorder/InfluxDB 위임 | MariaDB에는 전략/final/log 중심 |
| 장치 직접 통신 | HA entity/service call | MQTT/Modbus/PLC는 HA 뒤쪽 |
| Central adapter | allowlisted routes only | generic proxy 금지 |

---

## 20. Backend/API/DB 변경 시 필수 검증

최소 검증:

```bash
pytest -q
python3 -m py_compile custom_components/green_smart/*.py
node --check custom_components/green_smart/panel/green-smart-panel.js
git diff --check
```

운영 반영 전/후:

```bash
docker exec greenity-prod-homeassistant python -m homeassistant --script check_config --config /config
docker restart greenity-prod-homeassistant
# HTTP ready 확인
# 최근 로그에서 Traceback/ERROR 확인
```

DB/API 변경 시 추가 확인:

1. `ensure_schema()` idempotent 여부
2. 기존 table data migration 안전성
3. JSON key backward compatibility
4. contract test 추가
5. UI data attribute/API path 동시 갱신
6. secrets/API key가 response/log/commit에 노출되지 않는지 확인

---

## 21. 앞으로의 문서 분리 기준

이 문서가 더 커질 경우 다음으로 분리한다.

| 분리 후보 | 기준 |
|---|---|
| `current-api-reference.md` | route별 request/response/log action이 더 상세해질 때 |
| `current-db-schema.md` | column/index/migration 상세가 늘어날 때 |
| `current-safetyguard-contract.md` | rule DSL/watchdog/event lifecycle이 확장될 때 |
| `current-control-execution-flow.md` | service adapter/state verification이 복잡해질 때 |
| `current-virtual-rehearsal.md` | 가상 시나리오/fixture가 늘어날 때 |
