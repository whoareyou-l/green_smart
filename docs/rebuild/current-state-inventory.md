# Green Smart R0 Current-State Inventory

> 기준일: `2026-06-28`
> 기준 버전: `v1.12.75`
> 기준 커밋: R0 시작 시 `f886301`
> 목적: 제품 구조 리빌딩 전에 현재 `v1.12.0` 운영 기준선을 freeze하고, 보존할 계약과 리빌딩 대상을 분리한다.

---

## 1. R0 Freeze 원칙

R0는 기능 구현 단계가 아니다. 현재 구조를 정확히 목록화하고, 이후 리빌딩이 무엇을 보존해야 하는지 고정하는 단계다.

| 항목 | R0 결정 |
|---|---|
| prod 런타임 변경 | 금지 |
| DB migration | 금지 |
| 신규 기능 VS-004 | 보류 |
| R0 산출물 | inventory, risk register, baseline contract |
| 릴리즈 목표 | `v1.12.0` 문서/계약 baseline release |

---

## 2. 5대 마스터 문서 기준

| 번호 | 문서 | 파일 | R0 상태 |
|---:|---|---|---|
| 1 | CBA 화면 기획서 | `docs/master/01-cba-ui-ux-spec.md` | 유지, R1에서 현 UI 기준 재정렬 |
| 2 | 통신 명세서 | `docs/master/02-interface-spec.md` | 유지, R2/R3에서 API/MQTT 모듈 경계 보강 |
| 3 | DB 구상도 | `docs/master/03-database-schema.md` | 유지, R4에서 naming/alias/migration policy 보강 |
| 4 | 통합 시나리오 흐름도 | `docs/master/04-workflow-diagrams.md` | 유지, R5 slice별 workflow 보강 |
| 5 | 로직 알고리즘 및 예외처리 명세서 | `docs/master/05-ml-interlock-failsafe-spec.md` | 유지, Safety/Interlock/Fail-Safe 중심으로 확장 |

---

## 3. 현재 코드 규모

| 파일 | 현재 라인 수 | R0 판단 |
|---|---:|---|
| `custom_components/green_smart/panel/green-smart-panel.js` | 10,007 | Frontend monolith. R2에서 shell/core/domain/component 분해 계획 필요 |
| `custom_components/green_smart/crop_views.py` | 4,946 | Crop API/model/report monolith. R3에서 service/repository 분리 필요 |
| `custom_components/green_smart/zone_control_views.py` | 2,737 | Environment/Irrigation/Device/Safety 혼재. R3에서 domain adapter 분리 필요 |
| `custom_components/green_smart/db.py` | 779 | schema bootstrap 집중. R4에서 schema ownership/naming policy 필요 |
| `custom_components/green_smart/__init__.py` | 463 | view registration 과밀. R3에서 route registration grouping 필요 |
| `custom_components/green_smart/central_views.py` | 408 | Central adapter baseline 유지 |
| `custom_components/green_smart/weather_views.py` | 392 | Weather/Pesticide API 유지, admin/central key boundary 점검 필요 |

현재 테스트 파일 수: `99`개.

---

## 4. Static marker count inventory

| 파일 | marker count | 의미 |
|---|---:|---|
| `green-smart-panel.js` | 357 | render method/callApi/DOM marker가 한 파일에 집중 |
| `__init__.py` | 77 | registration/import wiring 집중 |
| `db.py` | 40 | bootstrap table 생성문 집중 |
| `zone_control_views.py` | 36 | zone/domain/control/safety API 집중 |
| `crop_views.py` | 24 | crop route class 수는 적지만 내부 함수/모델 로직이 매우 큼 |
| `weather_views.py` | 10 | weather/pesticide API |
| `central_views.py` | 7 | central proxy/adapter API |
| `frontend_panel.py` | 6 | HA panel/websocket registration |
| `rbac.py` | 1 | auth/me baseline |

---

## 5. API route inventory summary

현재 `/api/green_smart/*` 및 `/api/v1/*` route marker는 총 `89`개가 검색된다.

### 5.1 Sensor / state

- `/api/v1/sensors/current`
- `/api/green_smart/sensors/current`
- `/api/green_smart/zones/entity-state-summary`

### 5.2 Crop

- `/api/green_smart/crop/seasons`
- `/api/green_smart/crop/seasons/{season_id}`
- `/api/green_smart/crop/seasons/{season_id}/demolish`
- `/api/green_smart/crop/seasons/{season_id}/growth`
- `/api/green_smart/crop/growth/{record_id}`
- `/api/green_smart/crop/seasons/{season_id}/pest`
- `/api/green_smart/crop/pest/{record_id}`
- `/api/green_smart/crop/seasons/{season_id}/control`
- `/api/green_smart/crop/control/{record_id}`
- `/api/green_smart/crop/seasons/{season_id}/growth-report`
- `/api/green_smart/crop/seasons/{season_id}/operator-workflow`
- `/api/green_smart/crop/seasons/{season_id}/model-feature-sources`
- `/api/green_smart/crop/seasons/{season_id}/model-training-snapshots`
- `/api/green_smart/crop/seasons/{season_id}/training-dataset`
- `/api/green_smart/crop/seasons/{season_id}/model-training-readiness`
- `/api/green_smart/crop/seasons/{season_id}/prediction-validations`
- `/api/green_smart/crop/seasons/{season_id}/prediction-validations/run`
- `/api/green_smart/crop/seasons/{season_id}/stage-diagnosis`
- `/api/green_smart/crop/seasons/{season_id}/interlock-approval`
- `/api/green_smart/crop/stage-calibrations`

### 5.3 Zone control / Environment / Irrigation / Device

- `/api/green_smart/zones/interlock-settings`
- `/api/green_smart/zones/control-mode`
- `/api/green_smart/zones/control-settings`
- `/api/green_smart/zones/copy-control-settings`
- `/api/green_smart/zones/final-targets`
- `/api/green_smart/environment/strategy-preview`
- `/api/green_smart/irrigation/strategy-preview`
- `/api/green_smart/zones/execute-final-targets`
- `/api/green_smart/zones/ai-control-outputs`
- `/api/green_smart/zones/ai-control-outputs/{output_id}/apply`
- `/api/green_smart/zones/entity-mapping-validation`
- `/api/green_smart/zones/device-entity-mappings`
- `/api/green_smart/environment/control-settings`
- `/api/green_smart/irrigation/control-settings`
- `/api/green_smart/devices/control-settings`
- `/api/green_smart/environment/ai-control-outputs`
- `/api/green_smart/irrigation/ai-control-outputs`
- `/api/green_smart/devices/ai-control-outputs`
- `/api/green_smart/environment/device-entity-mappings`
- `/api/green_smart/irrigation/device-entity-mappings`
- `/api/green_smart/devices/device-entity-mappings`
- `/api/green_smart/environment/execute-final-targets`
- `/api/green_smart/irrigation/execute-final-targets`
- `/api/green_smart/devices/execute-final-targets`

### 5.4 Safety / rehearsal / logs

- `/api/green_smart/zones/safety-guard-watchdog`
- `/api/green_smart/zones/limited-auto-policy`
- `/api/green_smart/zones/alert-resume`
- `/api/green_smart/zones/rehearsal-readiness`
- `/api/green_smart/zones/virtual-rehearsal`
- `/api/green_smart/zones/safety-guard-events`
- `/api/green_smart/zones/safety-guard-events/ack`
- `/api/green_smart/zones/safety-guard-events/clear`
- `/api/green_smart/zones/control-logs`

### 5.5 Weather / Pesticide / Central / Auth

- `/api/green_smart/weather/current`
- `/api/green_smart/weather/forecast`
- `/api/green_smart/weather/weekly`
- `/api/green_smart/weather/config`
- `/api/green_smart/weather/validate-key`
- `/api/green_smart/weather/validate-mid-key`
- `/api/green_smart/weather/search-location`
- `/api/green_smart/pesticide/search`
- `/api/green_smart/pesticide/config`
- `/api/green_smart/pesticide/mix-check`
- `/api/green_smart/central/weather/current`
- `/api/green_smart/central/weather/forecast`
- `/api/green_smart/central/weather/mid`
- `/api/green_smart/central/crop/interlock-snapshot/sync`
- `/api/green_smart/central/crop/interlock-analytics/summary`
- `/api/green_smart/central/pesticide/search`
- `/api/green_smart/auth/me`

---

## 6. DB table inventory

현재 bootstrap 기준 `CREATE TABLE IF NOT EXISTS` 테이블은 `40`개다.

| Bucket | Tables |
|---|---|
| Core zone/crop | `zones`, `crop_seasons`, `growth_surveys`, `pest_surveys`, `control_records`, `control_pesticides` |
| Zone control | `zone_control_settings`, `zone_interlock_settings`, `zone_control_modes`, `zone_final_control_targets`, `zone_control_logs`, `zone_control_copy_jobs`, `ai_zone_control_outputs`, `zone_device_entity_mappings` |
| Device | `devices`, `device_groups`, `device_group_items`, `device_status`, `device_control_logs`, `device_interlocks`, `device_failsafe_rules`, `device_alarms`, `ventilation_device_settings`, `screen_device_settings` |
| Irrigation | `irrigation_settings`, `irrigation_drain_feedback`, `ai_irrigation_outputs`, `final_irrigation_targets`, `irrigation_control_logs` |
| Sensor | `sensor_readings` |
| Crop model | `crop_interlock_approvals`, `crop_stage_calibrations`, `crop_model_feature_snapshots`, `crop_model_training_snapshots`, `edge_crop_policy_cache` |
| Admin/audit | `audit_logs`, `green_smart_admin_role_mappings`, `green_smart_admin_system_config`, `green_smart_admin_diagnostics`, `green_smart_admin_backups` |

---

## 7. 보존할 계약

R0 이후 모든 리빌딩 slice는 아래 계약을 깨면 안 된다.

1. Home Assistant custom integration/HACS 구조 유지.
2. `green-smart-panel` custom element 유지.
3. 기존 `/api/green_smart/*` route path 유지 또는 compatibility adapter 제공.
4. `crop_seasons` 물리 테이블은 당장 유지. `crop_cycle`은 alias/문서/API compatibility로만 우선 제공.
5. `farm_id + crop_season_id/crop_cycle_id + zone_id + domain` scope 유지.
6. SafetyGuard/Interlock/Operator confirmation 없이 AI output을 실행하지 않음.
7. 실제 장비/MQTT 직접 연결은 virtual rehearsal 전까지 금지.
8. `admin`, `farm_owner`, `farm_staff` RBAC 기준 유지.
9. 현재 prod 런타임 stack은 R0에서 변경하지 않음.
10. 전체 pytest/static contract를 R0 baseline으로 유지.

---

## 8. 리빌딩 대상

| 대상 | 리빌딩 방향 | 첫 작업 |
|---|---|---|
| Panel monolith | shell/core/domain/components로 분리 | Admin/System 또는 read-only component부터 |
| API monolith | route adapter/service/repository로 분리 | crop read-only service부터 |
| Zone control 혼재 | environment/irrigation/device/safety adapter 분리 | route compatibility 유지 |
| DB naming | `crop_seasons` 유지 + `crop_cycle` alias 문서화 | migration 금지, policy 문서화 |
| 문서 기준 | 5대 마스터 문서로 재정렬 | R1에서 IA/RBAC 현행화 |
| 운영 스택 | 제품 baseline 이후 dev/prod/sandbox 리빌딩 | R6에서 green_smart-deploy inventory |

---

## 9. R0 완료 기준

- [x] 현재 코드/문서/API/DB inventory 문서화
- [x] 리빌딩 대상/보존 계약 분리
- [x] prod 변경 금지 Gate 명시
- [x] risk register 작성
- [x] baseline contract test 추가
- [x] `v1.12.0` 릴리즈 대상으로 버전 정합화
