# R7-006 Manual-first Target Domain Specification

> Status: target-domain specification baseline  
> Depends on: `r7-005-legacy-audit-domain-research-manual-first-plan.md`  
> Runtime scope: none  
> Panel/API/DB/MQTT/device change: none  
> Purpose: Green Smart를 AI-first dashboard가 아니라 **수동 운영 가능한 환경제어 OS + AI 보조 자동화 레이어**로 재정의한다.

## 1. Product thesis

Green Smart의 제품 정체성은 다음과 같다.

```text
Green Smart is a manual-operable environment-control OS.
AI is an assist/optimization layer.
Safety/Interlock/Fail Safe is the final authority.
```

한국어 제품 원칙:

```text
AI 없이도 온실은 운영되어야 한다.
수동 설정값은 항상 존재해야 한다.
기본 자동제어는 수동 설정값을 기준으로 작동해야 한다.
AI는 추천/보정/설명/최적화만 담당한다.
최종 허용/차단은 Safety / Interlock / Fail Safe가 담당한다.
```

## 2. Target top-level domains

The active product domains are:

```text
운영 홈
작물 운영
환경 제어
관수 제어
장치 제어
자동화 제어
안전 제어
설정
```

These replace the previous R7 five-group IA as the target direction:

```text
OLD: 운영 홈 / 작물 중심 운영 / 현장 상태 / 추천·실행 검토 / 설정
NEW: 운영 홈 / 작물 운영 / 환경 제어 / 관수 제어 / 장치 제어 / 자동화 제어 / 안전 제어 / 설정
```

The old IA remains historical/compatibility evidence only until the panel shell is reworked.

## 3. Domain map at a glance

| Domain | Core question | Owns | Must not own |
|---|---|---|---|
| 운영 홈 | 오늘 무엇을 봐야 하나? | daily overview, operating mode, fallback status, priority issues | deep settings, direct execution |
| 작물 운영 | 무엇을 키우고 현재 작물은 어떤 상태인가? | crop_cycle/currentCrop, growth target, crop records, crop model evidence | climate/device command execution |
| 환경 제어 | 공기/기후를 어떤 기준으로 유지할 것인가? | temperature, humidity, VPD, CO₂, light/DLI, ventilation/heating/cooling setpoints | irrigation recipe ownership, AI authority |
| 관수 제어 | 물/양분/근권을 어떤 기준으로 관리할 것인가? | irrigation schedule, EC/pH, drain, dryback, reservoir, recipe | climate actuator strategy ownership |
| 장치 제어 | 어떤 장치를 어떤 모드로 움직일 수 있는가? | devices, actuator state, manual/auto mode, entity mapping, device interlock | AI direct device command authority |
| 자동화 제어 | 수동 기준 대비 AI/자동화가 무엇을 제안하는가? | AI status, recommendations, corrections, difference explanation, fallback | final command authority |
| 안전 제어 | 무엇이 허용/차단/기록됐는가? | alarms, block reasons, safety/interlock/fail-safe, audit/history | normal setpoint ownership |
| 설정 | 누가/무엇이/어떻게 연결되어 있는가? | RBAC, config, HA mapping, diagnostics, backups, redaction | daily grower workflow |

## 4. Shared four-layer control grammar

Every control domain must be expressed through the same four-layer grammar.

```text
Manual/Base Settings
→ Rule/Schedule Automation
→ AI Assist / Optimization
→ Safety/Interlock/Fail Safe Finalization
```

### 4.1 Manual/Base Settings

Operator- or admin-defined baseline values. These must exist even when AI is disabled.

Examples:

```text
온도 목표
습도 목표
VPD 범위
CO₂ 목표
EC/pH 목표
관수 횟수
급액량
장치 수동/자동 모드
작물별 기준 범위
구역별 설정
```

### 4.2 Rule/Schedule Automation

Deterministic automation based on manual/base settings.

Examples:

```text
시간표 기반 관수
일사 누적 관수
주야간 온도 전환
환기 단계 자동 조정
CO₂ 시간대 제어
난방 최소온도 유지
```

### 4.3 AI Assist / Optimization

AI may recommend, explain, or propose corrections. It must not replace the baseline control model.

Examples:

```text
오늘 일사량 기준 관수 1회 추가 추천
VPD가 높으니 습도 목표 조정 추천
생식생장 쪽으로 기울어져 온도 전략 조정 추천
배액률 저하로 EC 조정 검토 추천
```

### 4.4 Safety/Interlock/Fail Safe Finalization

Final allow/block layer. AI cannot bypass it.

Examples:

```text
강풍이면 천창 개방 차단
비 감지 시 측창/천창 제한
센서 stale이면 자동 관수 보정 제한
저온 위험이면 환기 제한
장치 통신 장애면 실행 차단
권한 없으면 조작 차단
```

## 5. Domain specifications

## 5.1 운영 홈

### Purpose

```text
오늘 온실이 정상 운영 가능한지 한눈에 보는 화면
```

### Primary content

```text
현재 운영 모드
AI 사용 상태
AI fallback 상태
환경 이상 여부
관수 이상 여부
장치 이상 여부
Safety / Interlock / Fail Safe 상태
오늘 주의할 구역
현재 작물 상태 요약
```

### UI grammar

```text
TodaySummary
→ OperatingModeSummary
→ DomainHealthSummary(environment/irrigation/device/crop)
→ AIAssistStatus
→ SafetyInterlockStatus
→ PriorityZoneList
```

### Must answer

```text
지금 수동/자동 기준으로 운영 가능한가?
문제가 있으면 어느 도메인으로 들어가야 하나?
AI가 꺼져도 운영 기준이 남아 있는가?
```

## 5.2 작물 운영

### Purpose

```text
무엇을 키우고 있고, 작물이 어떤 상태이며, 목표가 무엇인지 관리한다.
```

### Owns

```text
currentCrop
crop_cycle
작물 종류/품종/재배 방식
구역별 작물 배치
생육단계
생육목표
생육조사 기록
병해충 예찰
방제 기록
작물별 기준 환경 범위
작물별 기준 관수 제어 범위
crop model evidence
```

### AI role

```text
생육단계 예측
생육상태 예측
위험요소 예측
통합 작물 진단
조치 추천 evidence
```

### Boundary

```text
작물 운영은 환경/관수/장치 명령을 직접 실행하지 않는다.
작물 운영의 AI 결과는 target-candidate authority를 갖지 않는다.
```

## 5.3 환경 제어

### Purpose

```text
온도, 습도, VPD, CO₂, 광, 환기, 난방, 냉방 기준을 관리한다.
```

### Owns

```text
온도 목표
주간/야간 온도
습도 목표
VPD 목표
CO₂ 목표
광량 / DLI 기준
환기 기준
난방 기준
냉방 기준
차광/보온 조건
구역별 환경 상태
수동 환경 설정값
기본 환경 자동제어 규칙
AI 환경 보정값
최종 환경 적용 후보값
환경 제어 이력
```

### Control formula

```text
manualEnvironmentSettings
+ ruleScheduleEnvironmentAutomation
+ aiEnvironmentCorrection if enabled and healthy
→ calculatedEnvironmentTargets
→ environmentSafetyLimits / deviceInterlock clamp
= finalEnvironmentTargets
```

### Boundary

```text
환경 제어는 관수 레시피를 소유하지 않는다.
환경 제어는 장치 명령을 최종 실행하지 않는다.
환경 AI 보정은 Safety/Interlock/Fail Safe를 우회할 수 없다.
```

## 5.4 관수 제어

### Purpose

```text
관수, 양액, EC, pH, 배액, 드라이백, 저수조/배액 재활용을 관리한다.
```

### Owns

```text
관수 스케줄
일사 누적 관수
시간 기반 관수
근권 수분 기준 관수
EC 목표
pH 목표
급액량
배액률
드라이백 목표
양액 레시피
저수조 상태
배액 재활용 상태
관수 안전 한계
관수 제어 이력
```

### Control formula

```text
baseIrrigationSettings
+ ruleScheduleIrrigationAutomation
+ aiIrrigationCorrection if enabled and healthy
→ calculatedIrrigationTargets
→ irrigationSafetyLimits clamp
= finalIrrigationTargets
```

### Boundary

```text
AI 관수 보정은 센서 stale, 배액 오류, 장치 장애, 권한 제한을 넘을 수 없다.
관수 제어 도메인은 환경 actuator strategy를 직접 소유하지 않는다.
```

## 5.5 장치 제어

### Purpose

```text
실제 장치의 상태와 수동/자동 모드를 관리한다.
```

### Owns

```text
천창/측창
보온커튼/차광스크린
순환팬/환기팬
난방기/냉방기
CO₂ 장치
관수밸브/양액기/펌프
센서/카메라
장치 현재 상태
수동/자동/잠금/점검 모드
장치 그룹
구역별 장치 매핑
HA entity mapping
MQTT topic mapping, later only
장치 통신 상태
장치 인터록
Fail Safe 동작
장치 이력
```

### Control formula

```text
deviceMode: manual / auto / locked / maintenance
+ operatorRequestedAction or automationCandidate
+ optional aiStrategyHint
→ permission check
→ Safety check
→ Interlock check
→ Fail Safe check
= allowed command or blocked reason
```

### Boundary

```text
AI는 장치 명령을 직접 내리지 않는다.
장치 실행은 권한, 모드, Safety, Interlock, Fail Safe, HA/MQTT 상태를 통과해야 한다.
Physical MQTT/device hookup remains blocked until virtual scenario verification passes.
```

## 5.6 자동화 제어

### Purpose

```text
AI와 자동화가 수동 기준에 비해 무엇을 제안하는지 비교한다.
```

### Owns

```text
AI 상태
AI 모델 건강 상태
AI timeout/stale 여부
AI 추천값
AI 보정값
수동 기준값과의 차이
기본 자동화 적용 여부
AI fallback 상태
추천 근거
추천 미적용 이유
```

### UI comparison grammar

```text
Manual baseline
→ Rule/schedule candidate
→ AI recommendation/correction
→ Safety-final candidate
→ Fallback value when AI is off
```

### Boundary

```text
자동화 제어는 실행 버튼 중심 화면이 아니다.
자동화 제어는 final command authority를 갖지 않는다.
자동화 제어는 manual/base settings와의 차이를 설명해야 한다.
```

## 5.7 안전 제어

### Purpose

```text
왜 허용됐고, 왜 차단됐고, 누가 무엇을 했는지 추적한다.
```

### Owns

```text
Safety 상태
Interlock 상태
Fail Safe 상태
알람
차단 이유
수동 조작 이력
기본 자동제어 이력
AI 추천 이력
AI 적용/미적용 이력
장치 명령 후보 이력
실제 실행 이력, later only
오류/Traceback/통신 장애
센서 stale 이력
작업자 승인 이력
```

### Boundary

```text
안전 제어은 일반 setpoint owner가 아니다.
하지만 모든 도메인의 최종 allow/block evidence를 모아야 한다.
```

## 5.8 설정

### Purpose

```text
운영 도메인이 아니라 시스템/권한/매핑을 관리한다.
```

### Owns

```text
RBAC
사용자 역할
farm_owner / farm_staff / admin
권한 정책
HA entity mapping
구역/장치 매핑
시스템 설정
진단
백업
secret redaction
감사 설정
```

### Boundary

```text
설정는 daily grower workflow가 아니다.
Secret values render as [REDACTED] only.
Role/settings mutation remains separately approved work.
```

## 6. Cross-domain data flow

```text
작물 운영
  → crop-specific target ranges and crop state

환경 제어 / 관수 제어 / 장치 제어
  → manual settings + rule automation + current state

자동화 제어
  → optional AI corrections and explanations based on above baselines

안전 제어
  → final allow/block and audit evidence

운영 홈
  → summarized operating state across all domains

설정
  → permissions, mappings, configuration boundaries used by all domains
```

## 7. Role exposure model

| Domain | farm_staff | farm_owner | admin |
|---|---|---|---|
| 운영 홈 | visible | visible | visible |
| 작물 운영 | view/record where permitted | view/strategy/review | config/admin evidence |
| 환경 제어 | status/limited adjustment, later | review/approve baseline, later | mapping/config |
| 관수 제어 | status/record, later | review/approve baseline, later | recipe/device config |
| 장치 제어 | status/limited manual action, later | mode/review, later | HA/MQTT mapping |
| 자동화 제어 | view recommendations | review/approval, later | model/policy diagnostics |
| 안전 제어 | block reason visibility | audit/approval visibility | full audit/config |
| 설정 | hidden or summary-only | partial settings | full admin |

## 8. Fallback states

AI state must be explicit:

```text
enabled_healthy
manual_only
ai_disabled
ai_unhealthy
ai_timeout
ai_stale
ai_rejected
fallback_safe
```

When AI is not healthy:

```text
AI corrections are removed from final target computation.
Manual/base settings remain available.
Rule/schedule automation may continue when safe.
Safety/Interlock/Fail Safe remains active.
Operator sees which non-AI baseline is being used.
Greenhouse operation does not stop solely because AI failed.
```

## 9. Old IA deprecation map

| Old key/label | Target handling |
|---|---|
| `crop-centered` / `작물 중심 운영` | adapt to `crop-operations` / `작물 운영` |
| `field-status` / `현장 상태` | split into `environment-control`, `irrigation-fertigation`, `device-control` |
| `recommendation-review` / `추천·실행 검토` | adapt to `recommendation-automation` / `자동화 제어` |
| old `recommend-act` execution implication | keep only as historical stage key until shell rework; remove execution-first wording in target IA |
| R7-003 five placeholders | rewrite after R7-006/R7-007 target shell contracts |
| R7-004 settings/admin | keep/adapt under `settings-admin` / `설정` |

## 10. Implementation guardrails

Until an explicit runtime slice is approved:

```text
No API route change
No DB migration
No HA service call
No MQTT/device command
No execution authority
No approval override
No role/settings mutation
No production cutover change
```

## 11. Next implementation order

```text
R7-006 Target IA Contract: target domain keys/labels and old-key deprecation map
R7-007 Sidebar/Page Shell Rework: old five groups → target domains
R7-008 Environment Control manual/base settings read-only detail
R7-009 Irrigation/Fertigation manual/base settings read-only detail
R7-010 Device Control manual/auto/interlock read-only detail
R7-011 Recommendation/Automation as AI-assist comparison layer
R7-012 Safety/History domain detail
R8 Virtual rehearsal
R9 Dry-run result review
R10 Approval gate
R11 Physical HA/MQTT device hookup only after virtual scenario pass
```
