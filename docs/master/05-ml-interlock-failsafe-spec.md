# 5. 로직 알고리즘 및 예외처리 명세서 — Logic Algorithm & Exception Handling Spec

> 기준일: `2026-06-27`
> 기준 버전: `v1.14.61`
> 문서 목적: Green Smart의 **시스템의 두뇌와 생존 장치**를 정의한다. VPD 계산 수식, PID/제어 알고리즘, AI 판단 규칙, SafetyGuard/Interlock, 인터넷 단절·센서 고장·장비 오류 같은 온실 현장 예외상황의 Fail-Safe 조치를 명문화한다.

## 1. 핵심 원칙

```text
AI output은 실행 명령이 아니다.
AI output → candidate → final target → SafetyGuard/Interlock/Approval → HA service call
```

로직/예외처리 문서는 아래 4가지를 항상 함께 다룬다.

| 구분 | 포함 내용 |
|---|---|
| 연산 규칙 | VPD 계산, PID/비례 제어, 작물 생육 지표, 임계값 판정 |
| 제어 판단 | 전략 후보, final target 산출, 실행 가능/차단 판단 |
| 예외 감지 | 인터넷 단절, MQTT LWT offline, 센서 missing/stale/fixed/out_of_range, 장비 unavailable/timeout |
| 생존 조치 | 로컬 모드 전환, 안전 위치, 자동 실행 hold, 알림, 복구 checklist |

| 예외 | 기본 Fail-Safe 조치 |
|---|---|
| 인터넷 단절 | 현장 NUC/HA 로컬 모드 유지, 외부 AI/Cloud 의존 실행 중단, 마지막 안전 전략 또는 보수 baseline 사용 |
| Edge/MQTT LWT offline | 자동 실행 차단, 해당 zone 장치/센서 stale 후보 처리, SafetyGuard event 생성 |
| 센서 고장/고정값 | VPD soft fallback, `SENSOR_FALLBACK_WARNING`, 제어 강도 제한 |
| 천창 feedback timeout | command timeout 처리, 추가 실행 hold, 현장 점검 안내 |
| 강풍/강우 | 천창 폐쇄 우선. 단, 네트워크 단절 시에도 로컬 rule이 안전 위치를 선택해야 함 |
| 저온/고온/VPD 이상 | 인터록 우선순위에 따라 개폐/환기/관수 실행 후보를 제한 |

예시 기준: 인터넷 단절과 센서 불확실성이 동시에 발생하면 천창을 무조건 새 명령으로 움직이지 않는다. 로컬 SafetyGuard가 현장 센서/장비 상태를 확인할 수 있고 안전 조건이 명확한 경우에만 제한된 safe position(예: 천창 30% 개방 또는 안전 폐쇄)을 선택하며, 불확실하면 자동 실행을 hold하고 현장 확인을 요구한다.


각 domain 내부 순서:

```text
Safety → Interlock → Model(AI)
```

모델 참조 순서:

```text
Crop → Environment → Irrigation → Device
```

---

## 2. VPD 계산 공식

### 2.1 공식

온도 `T(°C)`와 상대습도 `RH(%)`가 있을 때:

```text
SVP = 0.6108 * exp((17.27 * T) / (T + 237.3))
AVP = SVP * RH / 100
VPD = SVP - AVP
```

단위: `kPa`

### 2.2 Python 기준 구현 — Soft Fallback 및 실시간 알림 연동

센서 노이즈나 단선 직후 값 튐으로 물리 범위를 벗어난 입력이 들어와도 제어 루프 전체가 `ValueError`로 crash 나면 안 된다. VPD 계산기는 예외를 던지지 않고 `quality='out_of_range'`로 마킹할 수 있는 결과 객체를 반환하며, **동시에 백엔드 비상 알림 라우터를 강제 트리거**한다.

> HA 런타임 주의: 아래 `requests.post()` 예시는 문서상 최소 동작 예시다. 실제 Home Assistant event loop 내부 구현에서는 blocking I/O를 직접 호출하지 말고 `hass.async_add_executor_job()` 또는 내부 service/event helper로 감싸야 한다. 알림 실패는 제어 루프를 중단시키면 안 된다.

```python
import math
import requests  # 백엔드 내부 라우터 트리거용. HA async runtime에서는 executor/internal helper로 감싼다.
from dataclasses import dataclass
from typing import Literal

SensorQuality = Literal["ok", "stale", "fixed", "out_of_range", "missing", "estimated"]

@dataclass(frozen=True)
class VpdCalculationResult:
    vpd_kpa: float
    quality: SensorQuality
    reason_code: str | None
    used_fallback: bool
    source: Literal["calculated", "last_safe", "conservative_baseline"]


def trigger_failsafe_notification(greenhouse_id: int, zone_id: int, reason_code: str):
    """Soft Fallback 발생 즉시 백엔드 safetyRouter를 깨워 UI 비상 배너를 트리거한다.

    This helper is best-effort only. Notification failures must not break the
    control loop, VPD calculation, DB ingestion, or SafetyGuard evaluation.
    """
    try:
        payload = {
            "greenhouse_id": greenhouse_id,
            "zone_id": zone_id,
            "event_type": "SENSOR_FALLBACK_WARNING",
            "reason_code": reason_code,
            "message": f"구역 {zone_id} 센서 이상 유입: 보수적 대체값으로 VPD 대행 제어 중. 현장 확인 필요.",
        }
        requests.post(
            "http://localhost:8123/api/green_smart/zones/safety-guard-events/trigger",
            json=payload,
            timeout=1.0,
        )
    except Exception:
        pass  # 알림 실패가 제어 루프 자체에 영향을 주지 않도록 격리


def calculate_vpd_kpa_soft(
    greenhouse_id: int,
    zone_id: int,
    temperature_c: float | None,
    relative_humidity_pct: float | None,
    *,
    last_safe_vpd_kpa: float | None = None,
    conservative_baseline_vpd_kpa: float = 0.9,
) -> VpdCalculationResult:
    """Calculate VPD and handle sensor faults gracefully without breaking execution code."""

    def fallback(reason_code: str, quality: SensorQuality) -> VpdCalculationResult:
        trigger_failsafe_notification(greenhouse_id, zone_id, reason_code)

        if last_safe_vpd_kpa is not None:
            return VpdCalculationResult(
                vpd_kpa=round(last_safe_vpd_kpa, 3),
                quality=quality,
                reason_code=reason_code,
                used_fallback=True,
                source="last_safe",
            )
        return VpdCalculationResult(
            vpd_kpa=round(conservative_baseline_vpd_kpa, 3),
            quality=quality,
            reason_code=reason_code,
            used_fallback=True,
            source="conservative_baseline",
        )

    if temperature_c is None or relative_humidity_pct is None:
        return fallback("sensor_missing", "missing")

    if not (-20.0 <= temperature_c <= 60.0):
        return fallback("temperature_out_of_range", "out_of_range")

    if not (0.0 <= relative_humidity_pct <= 100.0):
        return fallback("relative_humidity_out_of_range", "out_of_range")

    svp = 0.6108 * math.exp((17.27 * temperature_c) / (temperature_c + 237.3))
    avp = svp * relative_humidity_pct / 100.0
    return VpdCalculationResult(
        vpd_kpa=round(svp - avp, 3),
        quality="ok",
        reason_code=None,
        used_fallback=False,
        source="calculated",
    )
```

### 2.2.1 SafetyRouter / MOD-EmergencyBanner 연동 계약

Soft Fallback이 발생하면 `used_fallback=True` 결과만 반환하고 조용히 넘어가면 안 된다. backend는 아래 이벤트를 safety event stream에 등록하고, Panel은 `MOD-EmergencyBanner`에 즉시 노출해야 한다.

| 항목 | 계약 |
|---|---|
| Endpoint | `POST /api/green_smart/zones/safety-guard-events/trigger` |
| event_type | `SENSOR_FALLBACK_WARNING` |
| reason_code | `sensor_missing`, `temperature_out_of_range`, `relative_humidity_out_of_range` 등 |
| severity | `warning` 기본, 연속 발생 시 `critical` 승격 |
| UI 대상 | `MOD-EmergencyBanner`, safety event list, control disabled reason |
| 제어 영향 | 자동 실행 제한, Interlock reason에 fallback warning 추가 |
| 실패 격리 | 알림 trigger 실패는 VPD 계산/제어 루프를 crash시키지 않음 |

표준 safety event payload:

```json
{
  "greenhouse_id": 1,
  "zone_id": 1,
  "event_type": "SENSOR_FALLBACK_WARNING",
  "reason_code": "temperature_out_of_range",
  "severity": "warning",
  "message": "구역 1 센서 이상 유입: 보수적 대체값으로 VPD 대행 제어 중. 현장 확인 필요.",
  "source": "calculate_vpd_kpa_soft",
  "used_fallback": true
}
```

Panel 표시 규칙:

```text
1. MOD-EmergencyBanner는 SENSOR_FALLBACK_WARNING 수신 즉시 화면 상단에 표시한다.
2. Crop/Environment/Device control summary는 fallback reason을 helper text로 표시한다.
3. 사용자가 ack 하더라도 센서 품질이 ok로 회복되기 전까지 자동 실행 제한은 유지한다.
4. 같은 greenhouse_id/zone_id/reason_code가 반복되면 debounce/dedupe하되, 마지막 발생 시각은 갱신한다.
```

DB 적재 규칙:

```text
원본 온도/습도 row가 물리 범위 밖이면 sensor_logs.quality='out_of_range'로 저장한다.
VPD fallback 값은 raw sensor row를 정상값처럼 덮어쓰지 않는다.
제어 판단은 fallback VPD를 conservative input으로만 사용하고, 자동 실행은 Interlock에서 제한한다.
Soft Fallback 발생 시 safety event/audit log에는 used_fallback=true와 reason_code를 함께 저장한다.
```

### 2.3 예시

| 온도 | 습도 | VPD | 해석 |
|---:|---:|---:|---|
| 24°C | 70% | 약 0.895 kPa | 일반적인 생육 가능 범위 |
| 28°C | 55% | 약 1.70 kPa | 증산 부담 증가, 관수/습도 검토 |
| 18°C | 90% | 약 0.24 kPa | 과습/결로 위험 |

---

## 3. ML/AI 모델 구조

### 3.1 작물 AI 5단계

| 단계 | 모델 | 입력 | 출력 | 실행 권한 |
|---:|---|---|---|---|
| 1 | 생육단계 예측 | crop_cycle, survey, G/L Index | `stagePrediction7d` | 없음 |
| 2 | 생육상태 예측 | 생육/환경/관수/병해/작업 | `balanceScore`, `directionCode` | 없음 |
| 3 | 위험요소 예측 | 센서, EC/pH, VPD, 병해충, 방제 freshness | factorized risk items | 없음 |
| 4 | 통합 작물 진단 | 1~3단계 출력 | source-sink, transition, review signals | 없음 |
| 5 | 조치 추천 요청 | diagnosis review signals | work/model review requests | 없음 |

### 3.2 환경 전략 모델

입력:

- 작물 stage/state/risk
- 현재 온도/습도/VPD/CO2/광량
- 날씨/강풍/강우
- 운영자 setValue
- Safety/Interlock state

출력:

```json
{
  "domain": "environment",
  "candidate_targets": {
    "temperature_c": 24.5,
    "relative_humidity_pct": 72,
    "vpd_kpa": 0.9,
    "co2_ppm": 700,
    "roof_window_open_pct": 30
  },
  "confidence_score": 0.74,
  "reason_codes": ["vpd_high", "lettuce_stage_vegetative"],
  "authority": "candidate_only"
}
```

### 3.3 관수 전략 모델

입력:

- crop state/risk
- VPD, 일사/DLI
- VWC, EC, pH
- dry-back, drain rate
- 최근 관수/배액 feedback

출력:

```json
{
  "domain": "irrigation",
  "candidate_targets": {
    "first_irrigation_time": "08:20",
    "shot_ml_per_plant": 85,
    "min_interval_min": 35,
    "target_ec_ms_cm": 1.8,
    "target_ph": 5.8
  },
  "risk_codes": ["vpd_high", "dryback_increasing"],
  "authority": "candidate_only"
}
```

### 3.4 장치 운영 모델

장치 운영 모델은 final target을 실제 HA service call plan으로 바꾸지만, 실행 전 SafetyGuard와 Interlock이 다시 평가된다.

```json
{
  "device_type": "roof_window",
  "entity_id": "cover.greenhouse_1_roof_window",
  "service": "cover.set_cover_position",
  "service_data": {"position": 30},
  "expected_state": {"current_position_pct": 30, "tolerance_pct": 5},
  "safe_state": {"roof_window_open_pct": 30},
  "dry_run_required": true
}
```

---

## 4. 센서 데이터 기반 예측/제어 알고리즘 규칙

### 4.1 실시간 센서 품질 판단

| 조건 | reasonCode | 처리 |
|---|---|---|
| 값 없음 | `sensor_missing` | 모델 입력 제외, confidence 하락 |
| HA unavailable/unknown | `sensor_unavailable` | 자동 실행 차단 후보 |
| N분 이상 동일 값 | `sensor_fixed_value` | quality=fixed, SafetyGuard event |
| 물리 범위 밖 | `sensor_out_of_range` | 모델 입력 제외 |
| 수신 지연 | `sensor_stale` | stale 표시, 자동 실행 제한 |

### 4.2 온습도/VPD 제어 규칙 초안

| 조건 | 환경 모델 후보 | 인터록 |
|---|---|---|
| VPD 높음 | 습도 증가/환기 완화/관수 검토 | 강풍/강우 시 창 제어 제한 |
| VPD 낮음 | 환기/난방/제습 검토 | 저온 시 과환기 차단 |
| 고온 | 환기/스크린/팬 후보 | 강풍/강우/장치상태 확인 |
| 저온 | 난방/보온/환기 제한 | 창 열림 차단 가능 |
| CO2 낮음 + 환기 낮음 | CO2 공급 후보 | 작업자 안전/환기 상태 확인 |

### 4.3 상추 작기 예시 규칙

상추는 토마토보다 고온/고VPD 스트레스에 민감하게 둔다.

| 항목 | 상추 baseline |
|---|---:|
| 적정 온도 | 18~24°C |
| 주의 온도 | 26°C 이상 |
| 위험 온도 | 30°C 이상 |
| 적정 VPD | 0.6~1.0 kPa |
| 고VPD 주의 | 1.2 kPa 이상 |
| 고VPD 위험 | 1.6 kPa 이상 |
| pH 목표 | 5.6~6.2 |
| EC 목표 | 1.2~2.0 mS/cm |

---

## 5. Interlock 규칙

### 5.1 Interlock decision schema

```json
{
  "status": "clear|blocked|failsafe|approval_required",
  "blocked": false,
  "reasonCodes": [],
  "resolvedByApproval": [],
  "unresolvedReasons": [],
  "requiredApproval": "none|operator|farm_owner|admin",
  "fallbackAction": "none|conservative_baseline|safe_state|stop"
}
```

### 5.2 기본 Interlock Matrix

| Domain | 상황 | 조치 | 승인으로 해소 가능 |
|---|---|---|---|
| crop | 생육조사 오래됨 | 자동 target promotion 차단 | operator 확인 가능 |
| crop | PLS 부적합 | 방제/작물 관련 실행 차단 | admin 필요 |
| environment | 강풍 | 천창/측창/스크린 위험 동작 차단 | 불가 |
| environment | 강우 | 천창 열림 차단, 닫힘 우선 | 불가 |
| irrigation | 펌프 fault | 관수 실행 차단 | 불가 |
| irrigation | EC/pH 센서 out-of-range | 양액 자동 보정 차단 | farm_owner/admin |
| device | entity unavailable | 실행 차단 또는 safe_state | 불가 |
| device | mapping invalid | 실행 차단 | admin mapping 수정 필요 |

### 5.3 Interlock Priority Level — 경합 해결 절대 순위

모델 출력과 SafetyGuard 명령이 충돌할 때는 점수/신뢰도/사용자 편의보다 **안전 우선순위**가 항상 먼저 적용된다. 동일 장치에 서로 반대 명령이 들어오면 가장 낮은 번호의 Level이 승리한다.

| Priority | 이름 | 예시 상황 | 승리 action | 승인 우회 |
|---:|---|---|---|---|
| Level 1 | 강풍/강우 폐쇄 — 안전 무조건 우선 | 고온으로 모델은 천창 개방을 권장하지만 강풍/강우 감지 | 천창/측창 위험 개방 금지, 닫힘 또는 현상 유지/safe_state | 불가 |
| Level 2 | 저온 확산 방지 | VPD/CO₂ 때문에 환기 권장이나 온도 하한 미만 | 과환기 차단, 보온/닫힘 우선 | 원칙적으로 불가. admin도 audit override만 가능 |
| Level 3 | 고온/고VPD 개방 제어 | 강풍/강우/저온 없음 + 고온/고VPD | 제한 범위 내 천창/팬/스크린 후보 허용 | farm_owner/operator 확인 가능 |
| Level 4 | 운영 최적화/에너지 절감 | 안전 위험 없음 + 효율 개선 | 후보 target 유지 또는 보수 조정 | 가능 |

#### 5.3.1 경합 예시

```text
입력 A: environment model → roof_window_open_pct=60, reason=vpd_high/high_temperature
입력 B: SafetyGuard → close_or_hold, reason=wind_speed_above
결정: Level 1 wins. final target은 open 60%가 아니라 safe_state/hold_current이며 reason_code='wind_speed_above'.
```

#### 5.3.2 결정 알고리즘

```python
PRIORITY = {
    "rain_detected_roof_window_block": 1,
    "wind_speed_above": 1,
    "temperature_below_window_block": 2,
    "vpd_high": 3,
    "high_temperature": 3,
    "energy_optimization": 4,
}

def choose_interlock_action(candidates: list[dict]) -> dict:
    # candidates: [{"reason_code": str, "action": str, "payload": dict}]
    return min(candidates, key=lambda item: PRIORITY.get(item["reason_code"], 99))
```

모든 `blocked`, `failsafe`, `approval_required`, `candidate_adjusted` 결정은 `interlock_decision_json.priority_level`에 기록한다.

---

## 6. Fail-Safe 규칙

### 6.1 인터넷/Center 단절

```text
조건: Center API 또는 인터넷 연결 실패
조치: 로컬 HA/Green Smart Edge 판단 유지. Center 정책은 stale_usable → stale_restricted → fallback_safe로 전환.
금지: Center 실패를 이유로 로컬 SafetyGuard를 비활성화하지 않는다.
```

### 6.2 HA entity 단절

```text
조건: 제어 대상 entity unavailable/unknown
조치: 자동 실행 차단. safe_state가 있고 HA service가 가능한 경우 safe_state만 허용.
로그: control_logs(action_type='failsafe', reason_code='device_unavailable')
```

### 6.3 센서 값 고정

```text
조건: 온도/습도/VPD 핵심 센서가 설정 시간 동안 동일 값 또는 timestamp stale
조치:
- sensor_logs.quality = 'fixed' 또는 'stale'
- 해당 센서 기반 ML confidence 하락
- 환기/관수 자동 실행 제한
- panel + HA persistent notification
```

### 6.4 예시: 인터넷 끊김 시 천창 30% 개방

이 규칙은 무조건 실행 규칙이 아니라 **현장별 safe_state가 30%로 설정된 경우에만** 적용한다.

```json
{
  "condition": "internet_disconnected AND center_policy_unavailable",
  "localAuthority": true,
  "targetDevice": "roof_window",
  "safeState": {"position": 30},
  "preconditions": [
    "rain_detected == false",
    "wind_speed < threshold",
    "temperature_c > low_temp_threshold",
    "entity_available == true"
  ],
  "action": "apply_safe_state_or_hold_current",
  "log": "failsafe_local_safe_mode"
}
```

즉, 강풍/강우/저온이면 30% 개방보다 닫힘/현상 유지가 더 안전할 수 있다. safe_state는 장치/온실 정책에 따라 admin이 설정한다.

---

## 7. ML 모델 평가 및 학습 데이터

| 모델 | 평가 기준 | 학습/검증 데이터 |
|---|---|---|
| 생육단계 예측 | exact 7-day validation accuracy | growth_surveys + prediction rows |
| 생육상태 예측 | balanceScore 변화와 실제 생육조사 추세 일치 | feature snapshots |
| 위험요소 예측 | risk item precision/recall, event lead time | sensor_logs, pest/control records |
| 환경 전략 | targetDiff 개선, VPD/온습도 안정성 | sensor/control logs |
| 관수 전략 | VWC/dry-back/drain 안정성 | irrigation feedback |
| 장치 운영 | dry-run pass rate, post-state verification success | control_logs/device status |

자동 학습/자동 배포는 금지한다. 모델 후보는 read-only로 검토하고, production 적용은 별도 승인과 릴리스 절차를 따른다.

---

## 8. Logic 변경 전 체크리스트

- [ ] 계산식과 단위가 명시되었는가?
- [ ] sensor quality/freshness를 확인하는가?
- [ ] AI output과 실행 권한을 분리했는가?
- [ ] Interlock이 승인으로 해소 가능한 사유와 불가능한 사유를 구분하는가?
- [ ] Fail-Safe가 현장 safe_state를 참조하는가?
- [ ] 모든 blocked/failsafe/approval/execute가 control_logs에 남는가?
- [ ] 상추/토마토 등 작물별 threshold 차이를 문서화했는가?
- [ ] 실제 장비 전 virtual rehearsal 시나리오가 있는가?


## RS-023 Virtual rehearsal safety boundary

Safety/Interlock/Fail Safe preflight remains source. The virtual rehearsal does not release interlock. No device command in RS-023.


## RS-024 Rehearsal result review safety boundary

The result review does not release interlock. approvalReleaseEnabled remains false. No device command in RS-024.


## RS-025 Virtual runner input safety boundary

The runner input contract does not release interlock. runnerExecutionEnabled remains false. No device command in RS-025.


## RS-026 Virtual runner dry-run result safety boundary

The dry-run result adapter does not release interlock. runnerExecutionEnabled remains false. No device command in RS-026.


## RS-027 Virtual rehearsal pass/fail review safety boundary

The pass/fail review projection does not release interlock. approvalReleaseEnabled remains false. No device command in RS-027.


## VS-N003 Real-time monitoring read-only scaffold safety boundary

```text
VS-N003 Real-time monitoring read-only scaffold
read-only monitoring evidence only
No MQTT/device command in VS-N003
executionEnabled = false
```

Monitoring evidence may become input to Interlock/Safety later, but VS-N003 grants no execution authority.


## VS-N004 Interlock/Safety core scaffold safety boundary

```text
VS-N004 Interlock/Safety core scaffold
read-only safety evidence only
No execution decision change in VS-N004
executionDecisionEnabled = false
```

Safety/interlock evidence may become a future runtime adapter input, but VS-N004 grants no execution decision, approval override, or device command authority.
