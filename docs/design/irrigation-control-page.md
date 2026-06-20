# Green Smart Crop OS - 관수 제어 페이지 설계

## 전체 페이지 구조

`관수 제어`는 Home Assistant 사이드패널 Green Smart 앱의 관수 전용 운영 페이지다. 기본 관수 인터록이 항상 1차 제어값이며, CORP/IRR AI Agent의 출력은 선택적으로 적용되는 보정 레이어다.

계산 흐름:

```text
baseIrrigationSettings
+ aiIrrigationCorrection, when enabled and healthy
= calculatedIrrigationTargets
→ irrigationSafetyLimits clamp
= finalIrrigationTargets
```

AI가 꺼져 있거나 오류면 `irrigationControlMode`는 즉시 인터록 기준으로 복귀하고, 최종 목표값은 기본 관수 설정과 안전 한계만으로 산출한다.

작기+구역별 저장, DB/API, 구역 복사, AI output 연동의 공통 설계는 [`zone-scoped-control-settings.md`](./zone-scoped-control-settings.md)를 따른다.

## 하위 탭 구조

1. 제어 모드
2. 기본 관수 설정
3. 포수 전략
4. 일사 비례 관수
5. 드라이백 전략
6. 배액 피드백
7. 양액 전략
8. AI 관수 보정
9. 안전 한계
10. 양액기 설정
11. 관수 로그

각 탭 상단에는 현재 상태 요약 카드가 배치된다. 설정값은 가능한 경우 `기본값 / AI 보정값 / 최종 적용값` 3단 구조로 표시한다.

## React 컴포넌트 구조

실제 현재 제품은 Web Component 기반이지만, React 전환 시 구조는 다음과 같다.

```tsx
<IrrigationControlPage>
  <IrrigationStatusSummary />
  <IrrigationControlTabs />
  <ControlModeTab />
  <BaseIrrigationSettingsTab />
  <SaturationStrategyTab />
  <SolarIrrigationStrategyTab />
  <DrybackStrategyTab />
  <DrainFeedbackTab />
  <NutrientStrategyTab />
  <AiIrrigationCorrectionTab />
  <IrrigationSafetyLimitsTab />
  <FertigationDeviceSettingsTab />
  <IrrigationLogsTab />
</IrrigationControlPage>
```

## TypeScript Interface

```ts
export type IrrigationMode = 'interlock' | 'ai_assist' | 'manual' | 'emergency_stop';
export type IrrigationStatus = 'standby' | 'running' | 'drain_detecting' | 'dryback' | 'emergency_stop';

export interface IrrigationControlMode {
  mode: IrrigationMode;
  aiEnabled: boolean;
  fallbackToInterlockOnAiError: boolean;
  autoIrrigationEnabled: boolean;
  manualRunAllowed: boolean;
  status: IrrigationStatus;
}

export interface BaseIrrigationSettings {
  startTime: string;
  endTime: string;
  sunriseOffsetMin: number;
  sunsetOffsetMin: number;
  shotCcPerPlant: number;
  shotLiterPerZone: number;
  minIntervalMin: number;
  maxDailyCount: number;
  baseEc: number;
  basePh: number;
  zoneEnabled: boolean[];
  valveOrder: number[];
  zoneTargetAmountL: number[];
}

export interface SaturationStrategy {
  enabled: boolean;
  targetVwc: number;
  startTime: string;
  completeVwc: number;
  firstDrainTargetTime: string;
  firstDrainTargetAmountL: number;
  splitCount: number;
  shotAmountL: number;
  firstDrainInductionAmountL: number;
}

export interface SolarIrrigationStrategy {
  enabled: boolean;
  baseAccumulatedRadiation: number;
  cloudyThreshold: number;
  sunnyThreshold: number;
  minIntervalMin: number;
  maxIntervalMin: number;
  highTempCorrectionEnabled: boolean;
  vpdCorrectionEnabled: boolean;
}

export interface DrybackStrategy {
  enabled: boolean;
  dayDrybackRange: number;
  nightDrybackTarget: number;
  minVwc: number;
  targetVwcUpper: number;
  targetVwcLower: number;
  nightEmergencyIrrigation: boolean;
  nightEmergencyVwc: number;
}

export interface DrainFeedback {
  previousFeedAmountL: number;
  previousDrainAmountL: number;
  drainRate: number;
  drainEc: number;
  drainPh: number;
  measuredAt: string;
  targetDrainRate: number;
  drainShortage: boolean;
  saltAccumulationRisk: boolean;
  phAcidificationRisk: boolean;
}

export interface NutrientStrategy {
  cropGroup: 'fruiting' | 'leafy';
  growthStage: string;
  baseEc: number;
  aiEcDelta: number;
  finalEc: number;
  basePh: number;
  aiPhDelta: number;
  finalPh: number;
  useA: boolean;
  useB: boolean;
  useAcid: boolean;
  useAlkali: boolean;
}

export interface AiIrrigationCorrection {
  gIndex: number;
  cropGroup: string;
  growthStage: string;
  decision: string;
  ecDelta: number;
  phDelta: number;
  shotAmountDelta: number;
  intervalDeltaMin: number;
  drybackDelta: number;
  endTimeDeltaMin: number;
  targetDrainRateDelta: number;
  explanation: string;
  healthy: boolean;
  applied: boolean;
}

export interface IrrigationSafetyLimits {
  minVwc: number;
  maxVwc: number;
  maxEc: number;
  minEc: number;
  maxPh: number;
  minPh: number;
  maxShotAmountL: number;
  maxDailyAmountL: number;
  minIntervalMin: number;
  maxPumpContinuousMin: number;
  flowAnomalyThreshold: number;
  valveErrorDetection: boolean;
  sensorErrorMode: 'interlock' | 'hold' | 'emergency_stop';
  aiErrorMode: 'interlock' | 'standby' | 'emergency_stop';
}

export interface FertigationDeviceSettings {
  rawWaterPumpEntity: string;
  irrigationPumpEntity: string;
  aValveEntity: string;
  bValveEntity: string;
  acidValveEntity: string;
  alkaliValveEntity: string;
  zoneValveEntities: string[];
  flowMeterEntity: string;
  ecSensorEntity: string;
  phSensorEntity: string;
  vwcSensorEntity: string;
  ecPid: { p: number; i: number; d: number };
  phPid: { p: number; i: number; d: number };
  ecCalibration: number;
  phCalibration: number;
  flowCalibration: number;
}

export interface FinalIrrigationTargets {
  shotAmountL: number;
  minIntervalMin: number;
  targetEc: number;
  targetPh: number;
  targetDrainRate: number;
  targetDryback: number;
  endTime: string;
}

export interface IrrigationLog {
  ts: string;
  zone: string;
  amountL: number;
  reason: 'schedule' | 'radiation' | 'vwc_low' | 'ai' | 'manual' | 'emergency';
  feedEc: number;
  feedPh: number;
  drainAmountL: number;
  drainEc: number;
  drainPh: number;
  result: string;
  hasError: boolean;
}
```

## Mock Data

```ts
export const mockIrrigationState = {
  irrigationControlMode: { mode: 'interlock', aiEnabled: false, fallbackToInterlockOnAiError: true, autoIrrigationEnabled: true, manualRunAllowed: true, status: 'standby' },
  baseIrrigationSettings: { startTime: '07:00', endTime: '17:30', sunriseOffsetMin: 30, sunsetOffsetMin: -120, shotCcPerPlant: 120, shotLiterPerZone: 12, minIntervalMin: 30, maxDailyCount: 18, baseEc: 2.5, basePh: 6.0, zoneEnabled: [true, true], valveOrder: [1, 2], zoneTargetAmountL: [12, 12] },
  aiIrrigationCorrection: { gIndex: 3.1, cropGroup: '과채류', growthStage: '착과기', decision: '생식생장 유도', ecDelta: 0.3, phDelta: 0.2, shotAmountDelta: 1.0, intervalDeltaMin: -5, drybackDelta: 2, endTimeDeltaMin: -20, targetDrainRateDelta: 5, explanation: 'G-Index가 +3.1로 영양생장이 강해 EC를 높이고 야간 드라이백 목표를 확대합니다.', healthy: true, applied: true },
};
```

## API 명세

- `GET /api/irrigation/status`: 현재 관수 상태와 요약값 조회
- `GET /api/irrigation/settings`: 사용자 설정값 조회
- `POST /api/irrigation/settings`: 사용자 설정값 저장 및 audit log 기록
- `GET /api/irrigation/final-targets`: 안전 한계를 통과한 최종 적용값 조회
- `GET /api/irrigation/ai-correction`: 최신 CORP/IRR AI 보정값 조회
- `POST /api/irrigation/manual-run`: 권한 확인 후 수동 관수 실행
- `POST /api/irrigation/emergency-stop`: 즉시 관수 중지, 펌프/밸브 안전 상태 전환
- `GET /api/irrigation/logs`: 실행 로그 조회
- `POST /api/irrigation/drain-feedback`: 배액 피드백 입력 및 다음날 보정 계산

## DB 테이블 초안

```sql
CREATE TABLE irrigation_settings (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  farm_id BIGINT NOT NULL,
  settings_json JSON NOT NULL,
  updated_by VARCHAR(128),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sensor_readings (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  farm_id BIGINT NOT NULL,
  zone_id INT,
  reading_type VARCHAR(64) NOT NULL,
  value DOUBLE NOT NULL,
  unit VARCHAR(32),
  captured_at TIMESTAMP NOT NULL
);

CREATE TABLE irrigation_drain_feedback (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  farm_id BIGINT NOT NULL,
  zone_id INT,
  feed_amount_l DOUBLE,
  drain_amount_l DOUBLE,
  drain_rate DOUBLE,
  drain_ec DOUBLE,
  drain_ph DOUBLE,
  measured_at TIMESTAMP,
  created_by VARCHAR(128)
);

CREATE TABLE ai_irrigation_outputs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  farm_id BIGINT NOT NULL,
  agent_name VARCHAR(64) DEFAULT 'CORP/IRR',
  output_json JSON NOT NULL,
  healthy BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE final_irrigation_targets (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  farm_id BIGINT NOT NULL,
  targets_json JSON NOT NULL,
  source_ai_output_id BIGINT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE irrigation_control_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  farm_id BIGINT NOT NULL,
  zone_id INT,
  amount_l DOUBLE,
  reason VARCHAR(64),
  feed_ec DOUBLE,
  feed_ph DOUBLE,
  drain_amount_l DOUBLE,
  drain_ec DOUBLE,
  drain_ph DOUBLE,
  result VARCHAR(64),
  has_error BOOLEAN DEFAULT FALSE,
  executed_at TIMESTAMP NOT NULL
);

CREATE TABLE audit_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  farm_id BIGINT NOT NULL,
  actor VARCHAR(128),
  action VARCHAR(128),
  before_json JSON,
  after_json JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## RBAC 권한 처리 방식

| Role | Permissions |
|---|---|
| Admin | 전체 수정, 안전 한계 변경, 양액기 설정 변경, AI 보정 ON/OFF |
| Farm Owner | 기본 관수/포수/일사비례/드라이백 수정, AI 보정 ON/OFF, 하드웨어 설정 조회 |
| Farm Worker | 조회, 배액 피드백 입력, 관수 로그 확인, 설정 변경 불가 |

백엔드는 모든 write API에서 role을 검증한다. 프론트엔드는 UX 편의상 비활성화만 수행하며, 보안 경계가 아니다.

## 실제 UI 코드

현재 제품은 `custom_components/green_smart/panel/green-smart-panel.js`의 Web Component UI가 실제 런타임이다. 관련 구현 함수:

- `_renderIrrigSettingsPage()`
- `_irrigationControlTabs()`
- `_renderIrrigationControlTabBar()`
- `_renderIrrigationControlTabContent()`
- `_bindIrrigationControlInputs()`
- `_calculateFinalIrrigationTargets()`

## Home Assistant 엔티티 연동 구조

`fertigationDeviceSettings`에 HA entity_id를 저장한다.

- 펌프/밸브: `switch.*`, `valve.*`
- 센서: `sensor.*`
- 수동 실행: HA service call 또는 Green Smart central API command
- 안전 정지: 모든 펌프 OFF, 밸브 안전 위치, `emergency_stop` 로그 기록

HA 런타임에서는 entity state를 읽어 `sensor_readings`에 적재하고, 최종 적용값은 제어 coordinator가 장비 service call로 반영한다.

## AI Agent 출력값을 DB에 저장하고 UI에 반영하는 구조

1. CORP/IRR Agent가 `ai_irrigation_outputs.output_json`에 보정값과 설명을 저장한다.
2. backend가 최신 healthy output을 조회한다.
3. `baseIrrigationSettings + aiIrrigationCorrection`을 계산한다.
4. `irrigationSafetyLimits`로 clamp한다.
5. 결과를 `final_irrigation_targets.targets_json`에 저장한다.
6. UI는 `GET /api/irrigation/ai-correction`과 `GET /api/irrigation/final-targets`로 표시한다.
7. AI 오류/timeout이면 `aiErrorMode='interlock'`에 따라 기본 관수 인터록으로 복귀하고 audit/control log를 남긴다.
