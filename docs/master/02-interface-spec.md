# 2. 통신 명세서 — Interface Spec

> 기준일: `2026-06-27`
> 기준 버전: `v1.12.4`
> 문서 목적: Green Smart의 모든 데이터 흐름을 **Frontend Service / Backend Router(View) / MQTT·HA Service** 모듈 단위로 분리하여 수직 슬라이드 개발의 연결 계약으로 사용한다.

## 1. 통신 아키텍처 원칙

현재 Green Smart는 별도 FastAPI 서버가 아니라 **Home Assistant custom integration + HomeAssistantView API** 구조다. 다만 신규 설계에서는 API 모듈명을 명확히 하여 향후 FastAPI/Center API로 분리해도 깨지지 않게 한다.

```text
Frontend Web Component
  └─ services/*.js 개념 계층
      └─ HomeAssistant callApi / WebSocket
          └─ /api/green_smart/* HomeAssistantView
              └─ DB / HA entity / MQTT entity / SafetyGuard
```

## 2. Data Key 표준 — API/MQTT/DB 공통 네이밍

API 요청/응답, MQTT payload, DB JSON field는 **하드웨어 도메인 표준 snake_case**를 사용한다. Frontend 내부 변수도 신규 코드에서는 동일 snake_case를 유지한다. camelCase는 기존 JS 호환 wrapper 안에서만 허용하고, network boundary 밖으로 내보내지 않는다.

### 2.1 표준 키 매핑

| 의미 | 금지/legacy 예 | 표준 key | 단위/값 |
|---|---|---|---|
| 온도 | `temp`, `temperatureC` | `temperature_c` | °C |
| 상대습도 | `rh`, `RH`, `humidityPct` | `relative_humidity_pct` | 0~100 % |
| VPD | `vpdKpa` | `vpd_kpa` | kPa |
| CO₂ | `co2Ppm` | `co2_ppm` | ppm |
| 광량 | `light`, `DLI` | `light_umol`, `dli_mol_m2_d` | μmol, mol/m²/day |
| EC | `targetEc`, `feedEc` | `target_ec_ms_cm`, `feed_ec_ms_cm` | mS/cm |
| pH | `targetPh`, `feedPh` | `target_ph`, `feed_ph` | pH |
| 천창 목표 개도율 | `targetPercent`, `roofWindowPercent` | `roof_window_open_pct` | 0~100 % |
| 현재 위치 피드백 | `currentPosition`, `position` | `current_position_pct` | 0~100 % |
| 명령 ID | `commandId` | `command_id` | UUID/string |
| 작기 ID | `cropCycleId`, `seasonId` | `crop_cycle_id` | bigint |
| 구역 ID | `zoneId` | `zone_id` | bigint |
| 온실 ID | `greenhouseId` | `greenhouse_id` | bigint |
| 측정 시각 | `ts`, `measuredAt` | `measured_at` | ISO-8601 |
| 수신 시각 | `receivedAt` | `received_at` | ISO-8601 |
| 데이터 품질 | `qualityStatus` | `quality` | `ok|stale|fixed|out_of_range|missing|estimated` |

### 2.2 Parsing layer 규칙

```text
1. MQTT ingress는 payload를 snake_case로 normalize한 뒤 DB/API로 넘긴다.
2. Backend API response는 snake_case만 반환한다.
3. Frontend service는 snake_case를 그대로 소비한다.
4. 기존 panel camelCase state가 필요한 경우 service adapter에서만 변환한다.
5. DB JSON에는 snake_case만 저장한다.
```

### 2.3 표준 센서 payload

```json
{
  "greenhouse_id": 1,
  "zone_id": 1,
  "device_id": 10,
  "sensor_type": "temperature",
  "temperature_c": 24.6,
  "relative_humidity_pct": 71.2,
  "measured_at": "2026-06-27T10:00:00+09:00",
  "quality": "ok"
}
```

### 2.4 표준 천창 명령 payload

```json
{
  "greenhouse_id": 1,
  "zone_id": 1,
  "crop_cycle_id": 3,
  "device_type": "roof_window",
  "roof_window_open_pct": 30,
  "command_id": "cmd-20260627-0001",
  "dry_run": true
}
```

### 2.5 표준 천창 피드백 payload

```json
{
  "greenhouse_id": 1,
  "zone_id": 1,
  "device_type": "roof_window",
  "command_id": "cmd-20260627-0001",
  "current_position_pct": 28,
  "status": "moving|stopped|error",
  "measured_at": "2026-06-27T10:00:03+09:00"
}
```

## 3. Frontend API — 서비스 모듈화

| Service | 책임 | 주요 메서드 | Backend 연결 |
|---|---|---|---|
| `authService` | 현재 사용자/권한 | `getMe()` | `GET /api/green_smart/auth/me` |
| `configService` | wizard/settings 저장 | `getConfig()`, `saveConfig()` | WS `green_smart/get_config`, `green_smart/save_config` |
| `sensorService` | 센서/KPI/VPD 조회 | `getCurrentSensors(zoneId)`, `getSensorTrend()` | `entity-state-summary`, future `sensorRouter` |
| `cropService` | 작기/생육/병해충/방제 | `listCropCycles()`, `createGrowthSurvey()` | `/crop/seasons/*` |
| `cropAiService` | 작물 AI report | `getGrowthReport(cropCycleId)` | `/crop/seasons/{id}/growth-report` |
| `environmentService` | 환경 전략/목표 | `getStrategyPreview()`, `saveSetValues()` | `/environment/strategy-preview`, `/environment/control-settings` |
| `irrigationService` | 관수 전략/설정 | `getTodayPlan()`, `saveIrrigationSettings()` | `/irrigation/strategy-preview`, `/irrigation/control-settings` |
| `deviceService` | 장치 상태/매핑/실행 | `validateMapping()`, `dryRunCommand()` | `/zones/device-entity-mappings`, `/zones/execute-final-targets` |
| `controlService` | final target / mode / logs | `applyAiOutput()`, `executeFinalTarget()`, `getLogs()` | `/zones/*` |
| `safetyService` | SafetyGuard/Interlock | `getEvents()`, `ackEvent()`, `clearEvent()` | `/zones/safety-guard-events/*` |
| `weatherService` | 날씨/KMA/WeatherFlow | `getCurrent()`, `saveWeatherConfig()` | `/weather/*` |

### 2.1 Frontend service 코드 템플릿

```js
export const sensorService = {
  async getCurrentSensors(hass, { greenhouseId, zoneId }) {
    return hass.callApi(
      "GET",
      `green_smart/zones/entity-state-summary?greenhouse_id=${greenhouseId}&zone_id=${zoneId}`
    );
  },
};

export const controlService = {
  async dryRunWindowCommand(hass, payload) {
    return hass.callApi("POST", "green_smart/zones/execute-final-targets", {
      ...payload,
      domain: "device",
      dry_run: true,
    });
  },
};
```

---

## 3. Backend API — 라우팅 모듈화

신규 문서상 모듈명은 `*Router`로 표기하되, 현재 구현은 `HomeAssistantView` class로 대응한다.

| Router | Path Prefix | 현재 파일 | 책임 |
|---|---|---|---|
| `authRouter` | `/api/green_smart/auth/*` | `rbac.py` / views | HA user → Green Smart role/permissions |
| `configRouter` | WebSocket `green_smart/*` | `frontend_panel.py`, `config_flow.py` | wizard/settings config |
| `sensorRouter` | `/api/v1/sensors/*` future, 현재 `/zones/entity-state-summary` | `zone_control_views.py` | 센서/HA entity 상태 요약 |
| `cropRouter` | `/api/green_smart/crop/*` | `crop_views.py` | 작기/생육/예찰/방제/작물 AI report |
| `environmentRouter` | `/api/green_smart/environment/*` | `zone_control_views.py` | 환경 전략/설정/AI output |
| `irrigationRouter` | `/api/green_smart/irrigation/*` | `zone_control_views.py` | 관수 전략/설정/AI output |
| `deviceRouter` | `/api/green_smart/devices/*` and `/zones/device-entity-mappings` | `zone_control_views.py` | 장치 매핑/실행/검증 |
| `controlRouter` | `/api/green_smart/zones/*` | `zone_control_views.py` | control mode, interlock, final target, execute, logs |
| `weatherRouter` | `/api/green_smart/weather/*` | `weather_views.py` | KMA/WeatherFlow/weather config |
| `pesticideRouter` | `/api/green_smart/pesticide/*` | `weather_views.py` | PSIS 검색/혼용/키 config |
| `centralRouter` | `/api/green_smart/central/*` | `central_views.py` | Center adapter/analytics/policy |

## 4. 핵심 Endpoint 초안

### 4.1 Sensor

| Method | Path | 용도 | 응답 핵심 |
|---|---|---|---|
| GET | `/api/v1/sensors/current?greenhouse_id=&zone_id=` | VS-001 normalized current sensor endpoint | `temperature_c`, `relative_humidity_pct`, `co2_ppm`, `light_umol`, `vpd_kpa`, `quality`, `source_status` |
| GET | `/api/green_smart/zones/entity-state-summary` | 현재 entity 상태 요약 | entity availability, stale, mapped roles |

### 4.2 Crop Cycle / Crop AI

| Method | Path | 용도 |
|---|---|---|
| GET | `/api/green_smart/crop/seasons` | 작기 목록. 신규 설계명 `crop_cycles`와 호환 |
| POST | `/api/green_smart/crop/seasons` | 상추/토마토 작기 생성. VS-003 상추 작기 등록은 `crop_cycle` 호환 응답과 `lettuce` crop type을 사용한다 |
| GET/POST | `/api/green_smart/crop/seasons/{crop_cycle_id}/growth` | 생육조사 조회/생성. VS-003 상추 생육조사 입력은 `lettuce` 작기의 `metrics_json`에 `L-Index` 입력값 `leafLength`, `leafWidth`, `leafCount`, `freshWeight`, `plantHeight`를 저장한다 |
| GET/POST | `/api/green_smart/crop/seasons/{crop_cycle_id}/pest` | 병해충 예찰 |
| GET/POST | `/api/green_smart/crop/seasons/{crop_cycle_id}/control` | 방제 기록 |
| GET | `/api/green_smart/crop/seasons/{crop_cycle_id}/growth-report` | 작물 AI 5모델 + 인터록/요약 |

### 4.3 Control / Device

| Method | Path | 용도 |
|---|---|---|
| GET/POST | `/api/green_smart/zones/control-mode` | manual/assist/auto/disabled |
| GET/POST | `/api/green_smart/zones/interlock-settings` | 도메인별 인터록 rule |
| GET/POST | `/api/green_smart/zones/ai-control-outputs` | AI 후보 출력 저장/조회 |
| POST | `/api/green_smart/zones/ai-control-outputs/{id}/apply` | AI 후보를 final target으로 승격 |
| GET/POST | `/api/green_smart/zones/final-targets` | 실행 후보 final target |
| POST | `/api/green_smart/zones/execute-final-targets` | dry_run 또는 실제 실행. VS-002 천창 개폐 Dry Run 제어는 `roof_window_open_pct`, `dry_run=true`, `command_id`, `tolerance_pct`, `timeout_ms`, `actualServiceCallSuppressed`를 사용한다 |
| GET | `/api/green_smart/zones/control-logs` | 실행/차단/검증 로그 |
| GET | `/api/green_smart/zones/safety-guard-events` | 안전 이벤트 |
| POST | `/api/green_smart/zones/safety-guard-events/ack` | 이벤트 확인 |
| POST | `/api/green_smart/zones/safety-guard-events/clear` | 조치 완료/해제 |

---

## 5. MQTT 토픽 설계 — 3개 구역 모듈화

현재 구현은 MQTT 직접 발행보다 HA entity/service를 우선한다. 그러나 하드웨어 연결 단계에서는 MQTT topic을 아래 3구역으로 제한한다.

### 5.1 공통 Topic 규칙

```text
green_smart/{site_id}/{greenhouse_id}/{zone_id}/{module}/{resource}/{action}
```

- `site_id`: 고객/농장 site
- `greenhouse_id`: 온실
- `zone_id`: 제어 구역
- `module`: `sensor`, `actuator`, `backend`
- `resource`: `temp`, `humidity`, `roof_window`, `safety_event` 등
- `action`: `state`, `telemetry`, `set`, `ack`, `event`

### 5.2 센서 모듈 구역 — Publish 주체: Edge

| Topic | Publisher | Subscriber | Payload |
|---|---|---|---|
| `green_smart/site1/gh1/zone1/sensor/temperature/telemetry` | Edge sensor | Backend/HA MQTT entity | `{"temperature_c":24.6,"unit":"C","measured_at":"...","quality":"ok"}` |
| `green_smart/site1/gh1/zone1/sensor/humidity/telemetry` | Edge sensor | Backend | `{"relative_humidity_pct":71.2,"measured_at":"...","quality":"ok"}` |
| `green_smart/site1/gh1/zone1/sensor/co2/telemetry` | Edge sensor | Backend | `{"co2_ppm":620,"measured_at":"...","quality":"ok"}` |
| `green_smart/site1/gh1/zone1/sensor/light/telemetry` | Edge sensor | Backend | `{"light_umol":310,"dli_mol_m2_d":12.4,"measured_at":"...","quality":"ok"}` |
| `green_smart/site1/gh1/zone1/sensor/status/event` | Edge sensor/LWT | Backend | `{"status":"online|offline|stale|fault|fixed","reason":"...","measured_at":"..."}` |

### 5.3 구동부 모듈 구역 — Subscribe 주체: Edge Motor

| Topic | Publisher | Subscriber | Payload |
|---|---|---|---|
| `green_smart/site1/gh1/zone1/actuator/roof_window/set` | Backend/HA | Edge motor | `{"roof_window_open_pct":30,"command_id":"...","source":"green_smart"}` |
| `green_smart/site1/gh1/zone1/actuator/roof_window/state` | Edge motor | Backend/HA | `{"current_position_pct":28,"command_id":"...","status":"stopped"}` |
| `green_smart/site1/gh1/zone1/actuator/fan/set` | Backend/HA | Edge motor | on/off/speed |
| `green_smart/site1/gh1/zone1/actuator/irrigation_valve/set` | Backend/HA | Edge motor | open/close/duration |

### 5.3.1 Edge LWT 단선 감지 계약

현장 Edge(라즈베리 파이/PLC gateway)가 정전, 네트워크 단선, 프로세스 crash로 비정상 종료될 때 백엔드는 MQTT LWT(Last Will and Testament)로 1초 수준의 offline 신호를 감지해야 한다.

| 항목 | 의무 계약 |
|---|---|
| LWT topic | `green_smart/{site_id}/{greenhouse_id}/{zone_id}/sensor/status/event` |
| LWT payload | `{"status":"offline","reason":"lwt_disconnect"}` |
| QoS | `1` 이상 권장 |
| retain | `true` 권장. 단, 정상 online publish 시 즉시 최신 상태로 overwrite |
| Backend 처리 | status=`offline` + reason=`lwt_disconnect` 수신 시 해당 zone 핵심 센서/장치 quality를 `stale`/`missing` 후보로 전환하고 SafetyGuard event 생성 |
| 제어 영향 | 자동 실행 차단, 진행 중 command는 timeout/failsafe 평가, Control Mode는 `manual` 또는 `disabled` hold |
| 로그 | `control_logs.action_type='failsafe'`, `reason_code='lwt_disconnect'` 또는 safety event audit |

Edge 접속 시 의무 등록 예시:

```python
client.will_set(
    topic=f"green_smart/{site_id}/{greenhouse_id}/{zone_id}/sensor/status/event",
    payload='{"status":"offline","reason":"lwt_disconnect"}',
    qos=1,
    retain=True,
)
```

정상 접속 직후 Edge는 동일 topic에 online 상태를 publish한다.

```json
{
  "status": "online",
  "reason": "edge_connected",
  "measured_at": "2026-06-27T10:00:00+09:00"
}
```

백엔드는 LWT offline 이벤트를 센서 단일 결측보다 높은 심각도로 취급한다. 같은 zone의 천창/관수/팬/스크린 자동 실행은 재연결 후 최소 1회 최신 telemetry와 entity feedback이 확인될 때까지 금지한다.

### 5.4 백엔드 모듈 구역 — 전체 중계 및 처리 주체: 서버

| Topic | Publisher | Subscriber | Payload |
|---|---|---|---|
| `green_smart/site1/backend/control/command_issued` | Backend | Audit/Edge | final command audit |
| `green_smart/site1/backend/safety/event` | Backend | HA/notification | interlock/failsafe event |
| `green_smart/site1/backend/model/prediction` | Backend | HA/analytics | read-only model output |
| `green_smart/site1/backend/heartbeat` | Backend | Edge/monitor | health/status |

---

## 6. HA Service 연동 및 비동기 수렴 계약

스마트팜 구동기 제어 서비스(예: `cover.set_cover_position`)는 완벽한 **비동기(Async) 프로토콜**로 작동한다. 백엔드 제어 엔드포인트는 명령 발송 성공 직후 프론트엔드에 즉시 동기식(Sync) 응답을 반환하되, 실제 하드웨어 수렴은 MQTT/HA WebSocket 피드백 이벤트 스트림을 따른다.

### 6.1 동기식 명령 제어 API (Sync Command Gate)

- **Endpoint:** `POST /api/green_smart/zones/execute-final-targets`
- **역할:** 권한, SafetyGuard, Interlock, device mapping, HA service call dispatch 가능 여부를 검증하고 명령을 송신한다.
- **중요:** 이 API의 성공은 "명령 송신 성공"이지 "하드웨어 목표 도달 완료"가 아니다.

Backend 처리 비동기 즉시 응답:

```json
{
  "ok": true,
  "command_id": "cmd-20260627-0001",
  "status": "PENDING",
  "message": "하드웨어 구동 명령이 성공적으로 송신되었습니다. 장치 상태 추적을 시작합니다."
}
```

Backend가 HA service에 전달하는 표준 payload:

```json
{
  "entity_id": "cover.greenhouse_1_roof_window",
  "service": "cover.set_cover_position",
  "service_data": {"position": 30},
  "dry_run": false,
  "command_id": "cmd-20260627-0001",
  "expected_state": {"current_position_pct": 30, "tolerance_pct": 5},
  "safe_state": {"roof_window_open_pct": 30}
}
```

### 6.2 Frontend 비동기 수렴 추적 (Async Convergence Tracker)

Frontend는 `status="PENDING"` 응답을 받으면 즉시 UI를 완료로 표시하지 않는다. 대신 `command_id`, `entity_id`, `target_state`를 기준으로 HA WebSocket/entity state stream 또는 MQTT feedback을 구독하여 상태가 목표에 수렴하는지 추적한다.

| 단계 | Frontend 상태 | 조건 | UI 표시 |
|---|---|---|---|
| 1 | `PENDING` | API 즉시 응답 수신 | 버튼 disabled, `구동 중` 표시 |
| 2 | `TRACKING` | HA/MQTT feedback 구독 시작 | 현재 개도율 progress 표시 |
| 3 | `CONVERGED` | `current_position_pct == target ± tolerance_pct` | 완료, 버튼 재활성화 |
| 4 | `TIMEOUT` | 30초 내 목표 미도달 | 경고 모달, 재시도/점검 안내 |
| 5 | `FAILED` | HA service error, entity unavailable, LWT offline | blocked/failsafe 표시 |

Frontend tracker 의사코드:

```js
async function executeAndTrackRoofWindow(hass, payload) {
  const response = await hass.callApi("POST", "green_smart/zones/execute-final-targets", payload);
  if (!response.ok || response.status !== "PENDING") {
    throw new Error(response.error_code || "command_rejected");
  }

  setDeviceCommandState({
    command_id: response.command_id,
    status: "TRACKING",
    disabled: true,
  });

  return trackEntityConvergence({
    hass,
    command_id: response.command_id,
    entity_id: payload.entity_id,
    target: payload.roof_window_open_pct,
    tolerance_pct: 5,
    timeout_ms: 30000,
  });
}
```

### 6.3 Backend command lifecycle 저장

Backend는 명령 송신 시점에 `control_logs` 또는 command tracking table에 `PENDING` row를 남기고, feedback 수렴/timeout/failure 결과를 후속 update 또는 추가 log row로 남긴다.

```json
{
  "command_id": "cmd-20260627-0001",
  "action_type": "execute",
  "result_status": "pending",
  "command_json": {"device_type":"roof_window","roof_window_open_pct":30},
  "expected_state_json": {"current_position_pct":30,"tolerance_pct":5},
  "created_at": "2026-06-27T10:00:00+09:00"
}
```

수렴 완료 예시:

```json
{
  "command_id": "cmd-20260627-0001",
  "result_status": "success",
  "result_json": {"current_position_pct":29,"converged":true},
  "completed_at": "2026-06-27T10:00:12+09:00"
}
```

Timeout/failure 예시:

```json
{
  "command_id": "cmd-20260627-0001",
  "result_status": "failed",
  "reason_code": "device_convergence_timeout",
  "result_json": {"last_position_pct":18,"timeout_ms":30000},
  "completed_at": "2026-06-27T10:00:30+09:00"
}
```

### 6.4 수렴 실패 시 안전 조치

- 30초 내 목표 수렴 실패 시 Frontend는 완료로 표시하지 않는다.
- Backend는 해당 command를 `device_convergence_timeout`으로 기록한다.
- SafetyGuard는 동일 장치/구역의 자동 실행을 일시 차단하고 Control Mode를 `manual` 또는 `disabled`로 hold한다.
- UI는 `data-control-execute-disabled-reason="device_convergence_timeout"`을 표시한다.
- 재시도 전 최소 1회 dry run과 최신 entity feedback 확인이 필요하다.

## 7. 공통 오류 응답

```json
{
  "ok": false,
  "errorCode": "SAFETY_GUARD_BLOCKED",
  "message": "강풍 상태에서는 천창 개방을 실행할 수 없습니다.",
  "details": {
    "reasonCode": "wind_speed_above",
    "actualValue": 14.2,
    "threshold": 10.0
  }
}
```
