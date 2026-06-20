# Zone-scoped Control Settings 설계

## 목표

Green Smart의 `환경 제어`, `관수 제어`, `장치제어` 설정을 전체 농장 단위가 아니라 **작기 + 구역 + 제어영역(domain)** 단위로 저장하고, 이후 backend DB/API 및 AI Agent 출력값과 같은 키 구조로 연결한다.

현재 live UI는 Home Assistant Web Component 패널이며, Phase 1~4에서 먼저 localStorage 기반 scoped 구조를 적용했다. Phase 5는 DB/API/AI 연동을 위한 설계 문서 단계이다.

핵심 키:

```text
farm_id
crop_season_id
zone_id
domain
```

`domain` 값:

```text
environment
irrigation
device
```

전체 제어 흐름:

```text
AI Agent → 전략 생성 → DB 저장 → Home Assistant → 장치 제어 → 장치 상태 수집 → DB 저장
```

---

## 현재 UI 저장 구조

현재 UI는 backend API 연결 전까지 아래 localStorage 키에 작기/구역별 설정을 저장한다.

```text
green_smart_zone_control_settings
```

구조:

```js
{
  environment: {
    [seasonId]: {
      [zoneId]: environmentControlState
    }
  },
  irrigation: {
    [seasonId]: {
      [zoneId]: irrigationControlState
    }
  },
  device: {
    [seasonId]: {
      [zoneId]: deviceControlState
    }
  }
}
```

legacy 호환 키:

```text
green_smart_control_strategy
green_smart_irrigation_control
green_smart_device_control
```

1회 마이그레이션 marker:

```text
green_smart_zone_control_migrated_v1
```

---

## DB 설계

### zone_control_settings

사용자가 설정한 원본 제어 설정을 저장한다. UI의 `green_smart_zone_control_settings`를 DB로 영속화하는 1차 대상이다.

```sql
CREATE TABLE zone_control_settings (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  farm_id BIGINT NOT NULL,
  crop_season_id BIGINT NOT NULL,
  zone_id INT NOT NULL,
  domain VARCHAR(32) NOT NULL,
  settings_json JSON NOT NULL,
  version INT NOT NULL DEFAULT 1,
  created_by VARCHAR(128) NULL,
  updated_by VARCHAR(128) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_zone_control_settings (
    farm_id,
    crop_season_id,
    zone_id,
    domain
  )
);
```

`domain` 허용값:

```text
environment
irrigation
device
```

### zone_final_control_targets

AI 보정과 안전 한계를 통과한 최종 적용값을 저장한다.

```sql
CREATE TABLE zone_final_control_targets (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  farm_id BIGINT NOT NULL,
  crop_season_id BIGINT NOT NULL,
  zone_id INT NOT NULL,
  domain VARCHAR(32) NOT NULL,
  targets_json JSON NOT NULL,
  source_ai_output_id BIGINT NULL,
  source_settings_id BIGINT NULL,
  calculated_by VARCHAR(64) NOT NULL DEFAULT 'system',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_zone_final_targets (
    farm_id,
    crop_season_id,
    zone_id,
    domain,
    created_at
  )
);
```

### zone_control_logs

사용자 저장, 구역 복사, AI 적용, HA 실행, 인터록 차단, Fail Safe 실행 등 제어 이벤트를 저장한다.

```sql
CREATE TABLE zone_control_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  farm_id BIGINT NOT NULL,
  crop_season_id BIGINT NOT NULL,
  zone_id INT NOT NULL,
  domain VARCHAR(32) NOT NULL,
  actor VARCHAR(128) NULL,
  actor_role VARCHAR(64) NULL,
  action VARCHAR(128) NOT NULL,
  before_json JSON NULL,
  after_json JSON NULL,
  result VARCHAR(64) NOT NULL,
  message TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_zone_control_logs (
    farm_id,
    crop_season_id,
    zone_id,
    domain,
    created_at
  )
);
```

### zone_control_copy_jobs

현재 구역 설정을 다른 구역 또는 전체 구역에 복사한 작업 이력을 저장한다.

```sql
CREATE TABLE zone_control_copy_jobs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  farm_id BIGINT NOT NULL,
  crop_season_id BIGINT NOT NULL,
  domain VARCHAR(32) NOT NULL,
  from_zone_id INT NOT NULL,
  to_zone_ids JSON NOT NULL,
  copied_settings_json JSON NOT NULL,
  actor VARCHAR(128) NULL,
  result VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### ai_zone_control_outputs

AI Agent가 작기/구역/제어영역 단위로 생성한 전략 또는 보정값을 저장한다.

```sql
CREATE TABLE ai_zone_control_outputs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  farm_id BIGINT NOT NULL,
  crop_season_id BIGINT NOT NULL,
  zone_id INT NOT NULL,
  domain VARCHAR(32) NOT NULL,
  model_name VARCHAR(128) NULL,
  strategy_json JSON NOT NULL,
  explanation TEXT NULL,
  safety_status VARCHAR(64) NOT NULL DEFAULT 'pending',
  applied BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ai_zone_control_outputs (
    farm_id,
    crop_season_id,
    zone_id,
    domain,
    created_at
  )
);
```

---

## API 설계

### 공통 API

#### GET /api/zones/control-settings

작기/구역/domain 기준 설정 조회.

Query:

```text
farm_id
crop_season_id
zone_id
domain
```

Response:

```json
{
  "farm_id": 1,
  "crop_season_id": 12,
  "zone_id": 1,
  "domain": "environment",
  "settings": {},
  "updated_at": "2026-06-20T00:00:00Z"
}
```

#### POST /api/zones/control-settings

작기/구역/domain 기준 설정 저장 또는 upsert.

Payload:

```json
{
  "farm_id": 1,
  "crop_season_id": 12,
  "zone_id": 1,
  "domain": "environment",
  "settings": {}
}
```

Backend 동작:

```text
1. 권한 확인
2. domain 허용값 검증
3. settings_json schema 검증
4. zone_control_settings upsert
5. zone_control_logs에 저장 이벤트 기록
```

#### POST /api/zones/copy-control-settings

현재 구역 설정을 하나 이상의 대상 구역에 복사한다.

Payload:

```json
{
  "farm_id": 1,
  "crop_season_id": 12,
  "domain": "irrigation",
  "from_zone_id": 1,
  "to_zone_ids": [2, 3, 4]
}
```

Backend 동작:

```text
1. from_zone_id 설정 조회
2. 대상 zone_id 유효성 검증
3. 각 대상 zone_control_settings upsert
4. zone_control_copy_jobs 저장
5. zone_control_logs에 대상 구역별 복사 이벤트 기록
```

#### GET /api/zones/final-targets

최종 적용값 조회.

Query:

```text
farm_id
crop_season_id
zone_id
domain
```

#### GET /api/zones/control-logs

작기/구역/domain 기준 로그 조회.

Query:

```text
farm_id
crop_season_id
zone_id
domain
from
to
limit
```

---

## 환경 제어 API wrapper

공통 API를 감싸는 읽기 쉬운 endpoint다. 내부적으로는 `domain=environment`를 사용한다.

```text
GET /api/environment/control-settings
POST /api/environment/control-settings
GET /api/environment/final-targets
GET /api/environment/control-logs
POST /api/environment/copy-control-settings
```

예시 매핑:

```text
GET /api/environment/control-settings?crop_season_id=12&zone_id=1
→ GET /api/zones/control-settings?crop_season_id=12&zone_id=1&domain=environment
```

---

## 관수 제어 API wrapper

내부적으로는 `domain=irrigation`을 사용한다.

```text
GET /api/irrigation/control-settings
POST /api/irrigation/control-settings
GET /api/irrigation/final-targets
GET /api/irrigation/control-logs
POST /api/irrigation/copy-control-settings
```

관수 제어는 `nutrient_zones` 기준을 우선 사용하며, 없으면 `greenhouse_zones`로 fallback한다.

---

## 장치제어 API wrapper

내부적으로는 `domain=device`를 사용한다.

```text
GET /api/devices/control-settings
POST /api/devices/control-settings
GET /api/devices/final-targets
GET /api/devices/control-logs
POST /api/devices/copy-control-settings
```

장치제어는 장치 자체와 제어 설정을 구분한다.

```text
물리 장치: devices / device_status
작기·구역별 설정: zone_control_settings(domain=device)
실행 로그: zone_control_logs(domain=device)
```

---

## 마이그레이션 정책

### UI localStorage 마이그레이션

이미 구현된 transitional 구조:

```text
green_smart_control_strategy
→ green_smart_zone_control_settings.environment[currentSeason][currentZone]

green_smart_irrigation_control
→ green_smart_zone_control_settings.irrigation[currentSeason][currentZone]

green_smart_device_control
→ green_smart_zone_control_settings.device[currentSeason][currentZone]
```

marker:

```text
green_smart_zone_control_migrated_v1
```

### DB 마이그레이션

backend 도입 시 정책:

```text
1. legacy global settings가 있으면 현재 활성 작기/current zone 1에 seed
2. 기존 localStorage scoped 설정이 있으면 API sync 후보로 사용
3. DB 저장 성공 후에도 일정 기간 localStorage fallback 유지
4. rollback 대비 legacy key mirror 저장은 한 릴리즈 이상 유지
```

---

## 구역 복사 정책

복사는 항상 같은 `farm_id + crop_season_id + domain` 안에서만 수행한다.

단일 복사:

```text
from_zone_id → to_zone_id
```

전체 복사:

```text
from_zone_id → all other zone_id
```

복사 대상에서 제외:

```text
from_zone_id와 같은 zone_id
존재하지 않는 zone_id
권한이 없는 zone_id
```

복사 기록:

```text
zone_control_copy_jobs
zone_control_logs
```

복사 이벤트 예:

```text
actor=Farm Owner
action=copy_control_settings
result=success
message="1구역 irrigation 설정을 2,3,4구역으로 복사"
```

---

## AI Agent output 연동

AI Agent는 반드시 작기/구역/domain 단위로 output을 저장한다.

저장 대상:

```text
ai_zone_control_outputs
```

AI output 예:

```json
{
  "farm_id": 1,
  "crop_season_id": 12,
  "zone_id": 2,
  "domain": "environment",
  "strategy": {
    "target_temp_delta": -1.2,
    "target_vpd_delta": 0.1,
    "co2_strategy": "hold"
  },
  "explanation": "2구역 VPD가 높고 일사량이 강해 목표 온도를 낮춤"
}
```

적용 과정:

```text
1. AI Agent가 domain별 strategy_json 생성
2. ai_zone_control_outputs 저장
3. 기본 zone_control_settings와 병합
4. safety limit / interlock / Fail Safe 검증
5. zone_final_control_targets 저장
6. Home Assistant에 최종 target 전달
7. 장치 상태 수집 후 zone_control_logs 저장
```

---

## Home Assistant 제어 흐름

최종 흐름:

```text
AI Agent → 전략 생성 → DB 저장 → Home Assistant → 장치 제어 → 장치 상태 수집 → DB 저장
```

상세:

```text
1. UI 또는 AI가 zone_control_settings / ai_zone_control_outputs 저장
2. backend가 zone_final_control_targets 계산
3. Home Assistant integration이 farm_id/crop_season_id/zone_id/domain 기준 target 조회
4. HA가 실제 장치 entity 또는 MQTT/Modbus bridge에 명령
5. 장치 상태와 실행 결과를 수집
6. zone_control_logs 및 device_status에 반영
```

---

## 권한 및 감사 로그

권한 원칙:

| 역할 | 조회 | 저장 | 복사 | 수동 실행 | Fail Safe 변경 |
|---|---:|---:|---:|---:|---:|
| Admin | 가능 | 가능 | 가능 | 가능 | 가능 |
| Farm Owner | 가능 | 가능 | 가능 | 가능 | 제한 가능 |
| Farm Worker | 가능 | 제한 | 제한 | 제한 | 불가 |
| Viewer | 가능 | 불가 | 불가 | 불가 | 불가 |

감사 로그 필수 항목:

```text
actor
actor_role
farm_id
crop_season_id
zone_id
domain
action
before_json
after_json
result
created_at
```

특히 아래 이벤트는 반드시 `zone_control_logs`에 남긴다.

```text
설정 저장
구역 복사
AI output 적용
수동 장치 명령
인터록 차단
Fail Safe 실행
HA 명령 실패
```

---

## 단계별 backend 적용 순서

### Step 1 — Schema 추가

```text
zone_control_settings
zone_final_control_targets
zone_control_logs
zone_control_copy_jobs
ai_zone_control_outputs
```

### Step 2 — 공통 zones API 추가

```text
GET /api/zones/control-settings
POST /api/zones/control-settings
POST /api/zones/copy-control-settings
GET /api/zones/final-targets
GET /api/zones/control-logs
```

### Step 3 — domain wrapper API 추가

```text
/api/environment/*
/api/irrigation/*
/api/devices/*
```

### Step 4 — UI sync 추가

```text
1. 페이지 진입 시 DB 조회
2. 실패 시 localStorage fallback
3. 저장 시 API 우선
4. 성공 시 localStorage cache 갱신
5. 실패 시 사용자에게 오류 표시
```

### Step 5 — AI Agent output 연결

```text
1. AI Agent가 crop_season_id + zone_id + domain 포함
2. ai_zone_control_outputs 저장
3. safety 검증 후 zone_final_control_targets 저장
4. HA 제어 흐름으로 전달
```

### Step 6 — 운영 전환

```text
1. localStorage fallback 유지
2. DB/API 저장 안정화 확인
3. legacy global key mirror 제거 여부 별도 릴리즈에서 판단
```
