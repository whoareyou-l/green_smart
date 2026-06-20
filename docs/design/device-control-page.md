# Green Smart Crop OS - 장치제어 페이지 설계

## AI Agent → DB → Home Assistant → 장치 제어 흐름

Green Smart는 AI 전략 플랫폼이며, 장치제어 페이지는 전략 생성 화면이 아니라 실제 설비 운영·장치 설정·안전 관리 화면이다.

```text
AI Agent
→ 전략 생성
→ DB 저장
→ Home Assistant
→ 장치 제어
→ 장치 상태 수집
→ DB 저장
```

제어 명령은 항상 인터록과 Fail Safe 규칙을 통과해야 하며, 실행 결과는 `device_control_logs`에 저장한다.

작기+구역별 저장, DB/API, 구역 복사, AI output 연동의 공통 설계는 [`zone-scoped-control-settings.md`](./zone-scoped-control-settings.md)를 따른다.

## 메뉴별 화면 구성

### 장치 현황

실제 온실 장치 상태를 카드+테이블로 표시한다.

표시 항목:

- 장치명
- 장치유형
- 현재상태
- 동작모드
- 제어주체
- 통신상태
- 마지막 업데이트

대상 예시: 천창, 측창, 보온스크린, 차광스크린, 순환팬, 배기팬, 난방기, 냉방기, 양액기, 관수밸브, 조명.

### 수동 제어

관리자가 직접 `ON`, `OFF`, `OPEN`, `CLOSE`, `0~100%` 비율 제어를 수행한다. 실행 전 확인 팝업을 표시하고, 실행 후 `device_control_logs`에 사용자 실행 로그를 저장한다.

### 자동 제어 상태

- Home Assistant 연결상태
- 자동제어 활성 여부
- AI 전략 적용 여부
- 현재 적용중인 전략
- 마지막 실행 시간

### 환기 장치 설정

기존 환기설정 메뉴 기능을 통합한다. 대상은 천창, 측창, 배기팬, 순환팬이다.

설정 항목: 장치 활성, 자동제어, 수동제어, 최소/최대/기본 개도율, 제어 단위, 동작 지연시간, 최대 연속 동작시간, 개폐 방향, 위치 피드백, 풍속 제한, 강우 제한, 저온 제한, 고온 강제 환기.

### 스크린 장치 설정

기존 스크린설정 메뉴 기능을 통합한다. 대상은 보온스크린, 차광스크린, 1중 스크린, 2중 스크린, 측면커튼이다.

설정 항목: 장치 활성, 자동제어, 수동제어, 최소/최대/기본 전개율, 제어 단위, 동작 지연시간, 최대 연속 동작시간, 방향, 위치 피드백, 일사 기준, 온도 기준, 야간 보온, 결로 방지 틈새 개방률, 강풍 보호.

### 장치 그룹 관리

환기 그룹, 난방 그룹, 관수 그룹, 스크린 그룹을 생성/수정/삭제하고 장치를 추가/제거한다.

### 인터록 설정

장치 간 충돌 방지 규칙을 관리한다.

예시:

- 배기팬 ON → 난방기 OFF
- 냉방 ON → 난방 OFF
- 풍속 > 12m/s → 천창 CLOSE
- 강우 감지 → 천창 CLOSE
- 양액기 OFF → 관수밸브 OPEN 금지
- 보온스크린 이동 중 → 차광스크린 이동 금지
- 차광스크린 100% → 보온스크린 100% 제한

### Fail Safe 설정

센서 통신 끊김, HA 연결 끊김, MQTT 장애, Modbus 장애, 정전, 장치 응답 없음 등에 대한 안전 동작을 정의한다.

예: 천창 CLOSE, 측창 CLOSE, 스크린 50%, 관수 정지, 난방 정지, 경보 발생.

### 알람 및 장애

발생시간, 장치명, 장애유형, 장애내용, 처리상태를 조회한다.

### 제어 이력

시간, 장치, 이전상태, 변경상태, 제어유형, 실행주체를 조회한다. 실행주체는 사용자, Home Assistant, AI Agent, 인터록, Fail Safe 중 하나다.

## API 설계

- `GET /api/devices`: 장치 목록 조회
- `GET /api/devices/status`: 장치 상태 조회
- `POST /api/devices/manual-control`: 확인 팝업 후 수동 제어 실행
- `GET /api/devices/auto-control-status`: HA/AI/자동제어 상태 조회
- `GET /api/devices/groups`: 장치 그룹 조회
- `POST /api/devices/groups`: 장치 그룹 생성
- `PUT /api/devices/groups/{id}`: 장치 그룹 수정
- `DELETE /api/devices/groups/{id}`: 장치 그룹 삭제
- `GET /api/devices/interlocks`: 인터록 조회
- `POST /api/devices/interlocks`: 인터록 생성
- `PUT /api/devices/interlocks/{id}`: 인터록 수정
- `GET /api/devices/failsafe-rules`: Fail Safe 규칙 조회
- `POST /api/devices/failsafe-rules`: Fail Safe 규칙 생성
- `PUT /api/devices/failsafe-rules/{id}`: Fail Safe 규칙 수정
- `GET /api/devices/alarms`: 알람 및 장애 조회
- `GET /api/devices/control-logs`: 제어 이력 조회
- `GET /api/devices/ventilation-settings`: 환기 장치 설정 조회
- `POST /api/devices/ventilation-settings`: 환기 장치 설정 저장
- `GET /api/devices/screen-settings`: 스크린 장치 설정 조회
- `POST /api/devices/screen-settings`: 스크린 장치 설정 저장

## DB 설계

```sql
CREATE TABLE devices (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  farm_id BIGINT NOT NULL,
  name VARCHAR(100) NOT NULL,
  device_type VARCHAR(64) NOT NULL,
  entity_id VARCHAR(128),
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE device_groups (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  farm_id BIGINT NOT NULL,
  name VARCHAR(100) NOT NULL,
  group_type VARCHAR(64) NOT NULL,
  description TEXT
);

CREATE TABLE device_group_items (
  group_id BIGINT NOT NULL,
  device_id BIGINT NOT NULL,
  sort_order INT DEFAULT 0,
  PRIMARY KEY (group_id, device_id)
);

CREATE TABLE device_status (
  device_id BIGINT PRIMARY KEY,
  current_state VARCHAR(64),
  operation_mode VARCHAR(64),
  controller VARCHAR(64),
  communication_status VARCHAR(64),
  last_updated TIMESTAMP
);

CREATE TABLE device_control_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  device_id BIGINT,
  previous_state VARCHAR(64),
  next_state VARCHAR(64),
  control_type VARCHAR(64),
  actor VARCHAR(64),
  result VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE device_interlocks (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  farm_id BIGINT NOT NULL,
  name VARCHAR(100) NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  priority INT DEFAULT 100,
  description TEXT,
  condition_json JSON NOT NULL,
  action_json JSON NOT NULL
);

CREATE TABLE device_failsafe_rules (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  farm_id BIGINT NOT NULL,
  trigger_type VARCHAR(64) NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  priority INT DEFAULT 100,
  action_json JSON NOT NULL
);

CREATE TABLE device_alarms (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  device_id BIGINT,
  alarm_type VARCHAR(64),
  message TEXT,
  status VARCHAR(64),
  occurred_at TIMESTAMP
);

CREATE TABLE ventilation_device_settings (
  device_id BIGINT PRIMARY KEY,
  enabled BOOLEAN,
  auto_control BOOLEAN,
  manual_allowed BOOLEAN,
  min_open_percent INT,
  max_open_percent INT,
  default_open_percent INT,
  control_unit VARCHAR(32),
  delay_sec INT,
  max_continuous_min INT,
  direction VARCHAR(32),
  position_feedback BOOLEAN,
  wind_limit DOUBLE,
  rain_restricted BOOLEAN,
  low_temp_restricted BOOLEAN,
  high_temp_force_vent BOOLEAN
);

CREATE TABLE screen_device_settings (
  device_id BIGINT PRIMARY KEY,
  enabled BOOLEAN,
  auto_control BOOLEAN,
  manual_allowed BOOLEAN,
  min_deploy_percent INT,
  max_deploy_percent INT,
  default_deploy_percent INT,
  control_unit VARCHAR(32),
  delay_sec INT,
  max_continuous_min INT,
  direction VARCHAR(32),
  position_feedback BOOLEAN,
  solar_deploy_threshold DOUBLE,
  temp_deploy_threshold DOUBLE,
  night_insulation BOOLEAN,
  dew_gap_percent INT,
  strong_wind_protection BOOLEAN
);
```

## Vue 컴포넌트 구조

현재 제품 런타임은 Home Assistant Web Component이지만, Vue 전환 시 구조는 다음과 같다.

```text
DeviceControlPage.vue
├─ DeviceControlTabs.vue
├─ DeviceStatusTab.vue
├─ ManualControlTab.vue
├─ AutoControlStatusTab.vue
├─ VentilationDeviceSettingsTab.vue
├─ ScreenDeviceSettingsTab.vue
├─ DeviceGroupManagementTab.vue
├─ InterlockRulesTab.vue
├─ FailSafeRulesTab.vue
├─ DeviceAlarmTab.vue
└─ DeviceControlLogsTab.vue
```

공용 컴포넌트:

```text
DeviceStatusBadge.vue
DeviceCommandConfirmDialog.vue
DeviceSettingCard.vue
DeviceDataTable.vue
InterlockFlowCard.vue
FailSafeRuleCard.vue
```

## RBAC 및 실행 확인 팝업

- Admin: 전체 장치 제어, 인터록/Fail Safe/환기/스크린 설정 변경 가능
- Farm Owner: 일반 장치 설정과 그룹 관리 가능, Fail Safe 핵심 규칙은 제한
- Farm Worker: 장치 현황/알람/이력 조회, 허용된 수동 제어만 가능

수동 제어는 반드시 확인 팝업을 거친다. 백엔드는 `POST /api/devices/manual-control`에서 권한, 인터록, Fail Safe 상태를 다시 검증한다. 프론트엔드 비활성화는 UX 보조이며 보안 경계가 아니다.
