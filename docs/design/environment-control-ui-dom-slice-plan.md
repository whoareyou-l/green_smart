# Environment Control UI/DOM Vertical Slice Plan

> 기준 버전: v1.10.1
> 대상: `custom_components/green_smart/panel/green-smart-panel.js` 환경 제어 페이지 `_renderEnvSettingsPage()` / `_renderEnvStrategyTabContent()`
> 목표: 작물 설정 페이지에서 확정한 UI/DOM 통일 원칙을 환경 제어 페이지에 맞게 적용하되, 환경 제어 특성상 설정값을 직접 변경하는 하위탭은 별도 `setValue` UI/DOM 표준으로 통일한다.

## 0. 수직 슬라이스 원칙

환경 제어 페이지는 기능/저장/안전 영향이 큰 페이지이므로 한 번에 전부 교체하지 않는다.

### Slice 1 — 조사 + IA + setValue 표준 계약

- 현재 하위탭/카드/저장 동작 조사
- 하위탭 추가/삭제/병합안 확정
- `setValue` UI/DOM 표준 문서화
- 계약 테스트 작성

### Slice 2 — 환경 제어 메인 shell + 하위탭 재구성

Status: implemented in `v1.9.96`.

- 환경 제어 page shell을 작물 설정 공통 UI/DOM 원칙과 맞춤
- 하위탭을 `overview / setpoints / rules / ai / operations / devices / logs` 7개로 정리
- 기존 `mode / temperature / humidity / co2 / aiOps / safety / safetyOps / deviceMap` key는 hidden compatibility marker로 보존
- 설정형 하위탭에는 `data-env-setvalue-*` marker와 기존 `data-control-field/group/key` 저장 marker를 함께 적용
- inline `data-env-setvalue-save` 버튼은 기존 `_saveControlStrategy()` 저장 flow에 연결

### Slice 3 — setValue 하위탭 세부 polish

Status: implemented in `v1.9.96`.

- 온도/습도·VPD/CO₂/안전 한계/제어 모드/AI 보정 등 설정형 하위탭의 시각적 밀도와 모바일 레이아웃을 세부 보정
- `setpoints / rules / ai` 탭에 `data-env-setvalue-polish` grammar를 적용한다.
- 각 설정형 탭은 operator summary → safety boundary → setValue group cards → footer action row 순서를 따른다.
- row 내부는 `data-env-setvalue-row-main` + `data-env-setvalue-row-meta`로 통일한다.
- `ai` 탭은 입력 보정값과 `data-env-setvalue-preview-card` 최종 적용값 preview를 분리한다.
- devices 매핑 입력의 setValue row 승격은 Slice 4에서 operations/devices 정리와 함께 판단한다.

### Slice 4 — 운영/상태 하위탭 적용

Status: implemented in `v1.9.97`.

- `operations / devices / logs`를 상태·기록형 패턴으로 정리
- `operations`는 `data-env-operations-polish` grammar로 AI 운영과 안전·리허설을 분리한다.
- `devices`는 `data-env-devices-polish` grammar로 entity state / entity mapping / mapping validation을 분리한다.
- `logs`는 `data-env-logs-polish` grammar로 summary → list header → record rows/empty state를 적용한다.
- 실행 권한/수동 제어 권한이 있는 버튼은 safety boundary와 RBAC wording을 함께 표시한다.
- 금지 marker: `data-env-operations-direct-execute`, `data-env-devices-manual-execute`, `environmentStatusTabsAllowDirectExecution`, `data-env-control-bypass-safety`.

### Slice 5 — 렌더 QA + Prod release

Status: implemented in `v1.10.1`.

- 환경 제어 전체 하위탭 렌더 순회: `overview / setpoints / rules / ai / operations / devices / logs`.
- 금지 marker 검사: setValue/status 탭 모두 direct execution marker 부재.
- 저장 field marker smoke: setValue inline save/reset binding과 `_saveControlStrategy()` 연결 확인.
- Prod check_config/restart/marker smoke 후 release.

---

## 1. 현재 환경 제어 페이지 조사 결과

### 1.1 현재 진입 구조

렌더 함수:

```text
_renderEnvSettingsPage()
```

상위 shell:

```text
_renderCommonMainPageShell("environment", ...)
```

현재 body 주요 구성:

```text
_renderControlScopeBar("environment")
→ gs-card
  → hidden legacy contract marker span
  → _renderEnvStrategyTabBar()
  → data-env-strategy-content
  → hidden grouped-card-contract span
→ #control-strategy-save 전략 저장 버튼
```

### 1.2 현재 하위탭 목록

현재 `_envStrategyTabs()`는 10개 하위탭을 제공한다.

| key | 현재 이름 | 현재 성격 | 판단 |
|---|---|---|---|
| `mode` | 제어 모드 | 설정값 변경 | setValue 하위탭 |
| `temperature` | 온도 제어 | 설정값 변경 | setValue 하위탭 |
| `humidity` | 습도 / VPD 제어 | 설정값 변경 | setValue 하위탭 |
| `co2` | CO₂ 제어 | 설정값 변경 | setValue 하위탭 |
| `ai` | AI 전략 / 최종 적용값 | 설정값 + 최종값 preview | setValue + preview 하위탭 |
| `aiOps` | AI 운영 | 상태/운영/확인 | 운영형 하위탭 |
| `safety` | 안전 한계 | 설정값 변경 | setValue 하위탭 |
| `safetyOps` | 안전/리허설 | 상태/리허설/드라이런 | 운영형 하위탭 |
| `deviceMap` | 장치 매핑 | 설정/검증 혼합 | setValue + 상태 하위탭 |
| `logs` | 작동 로그 | 기록형 | 기록형 하위탭 |

### 1.3 현재 입력 helper

현재 설정값 입력은 다음 helper를 사용한다.

```text
_strategyInput(group, key, label, val, unit, min, max, step)
_strategyToggle(group, key, label, checked)
_strategySelect(group, key, label, value, options)
```

현재 공통 marker:

```text
data-control-field
data-control-group
data-control-key
```

문제:

- 환경 제어 전용 setValue 문법이 없다.
- input/toggle/select가 모두 같은 `strategy-row` 수준이라 시각적 통일성/저장/감사/안전 경계가 명확하지 않다.
- 설정값 하위탭과 상태/기록형 하위탭이 같은 카드 문법을 공유해 성격 구분이 약하다.

### 1.4 현재 저장 경로

저장 버튼:

```text
#control-strategy-save
```

저장 함수:

```text
_saveControlStrategy()
```

저장 처리:

```text
_calculateFinalAppliedTargets()
_pushControlLog("설정 저장 → 환경 제어 갱신")
_setScopedControlState("environment", this._controlStrategy)
_saveScopedControlStateToApi("environment", this._controlStrategy)
_setControlSaveNotice("environment")
localStorage.setItem("green_smart_control_strategy", ...)
_update()
```

API path:

```text
green_smart/environment/control-settings
```

scope:

```text
crop_season_id + zone_id + domain=environment
```

---

## 2. 하위탭 재구성안

현재 10개 하위탭은 기능상 많고, 설정형/상태형이 섞여 있다. 환경 제어 페이지는 아래 6개 하위탭으로 재구성한다.

| 새 key | 새 이름 | 병합/유지 source | UI/DOM 타입 |
|---|---|---|---|
| `overview` | 운영 요약 | 기존 `mode` 상태 요약 + final target 핵심 | 상태/요약형 |
| `setpoints` | 목표값 설정 | `temperature` + `humidity` + `co2`의 목표/기준값 | `setValue` |
| `rules` | 인터록·안전 설정 | `temperature` 인터록값 + `humidity` 결로/제습 + `co2` 제한 + `safety` | `setValue` |
| `ai` | AI 보정·최종값 | 기존 `ai` + `_renderEnvironmentStrategyPreviewCard` + final targets | setValue + evidence |
| `operations` | 운영·리허설 | `aiOps` + `safetyOps` | 운영형 |
| `devices` | 장치 매핑·상태 | `deviceMap` + entity state summary | setValue + 상태 |
| `logs` | 작동 로그 | 기존 `logs` | 기록형 |

> `overview`는 새 하위탭으로 추가한다. 기존 `mode`는 `overview`와 `rules`/`setpoints`로 역할을 분리한다.

### 삭제/병합 기준

삭제되는 것이 아니라 병합된다.

| 기존 탭 | 처리 |
|---|---|
| `mode` | `overview`의 상태 요약 + `rules`의 제어 모드 setValue로 분리 |
| `temperature` | `setpoints`와 `rules`로 분리 |
| `humidity` | `setpoints`와 `rules`로 분리 |
| `co2` | `setpoints`와 `rules`로 분리 |
| `ai` | `ai`로 유지하되 setValue + final target/evidence 구조로 재정리 |
| `aiOps` | `operations`로 병합 |
| `safety` | `rules`로 병합 |
| `safetyOps` | `operations`로 병합 |
| `deviceMap` | `devices`로 유지/확장 |
| `logs` | `logs` 유지 |

---

## 3. 환경 제어 UI/DOM 표준

환경 제어는 작물 설정의 통일성 원칙을 따라 다음 page shell marker를 사용한다.

```text
data-env-control-page
data-env-control-subtab-shell
data-env-control-summary-card
data-env-control-list-header
data-env-control-record-list
```

단, 환경 제어는 기록형 탭만 있는 것이 아니므로, 모든 하위탭에 record list를 강제하지 않는다.

### 3.1 하위탭 타입별 표준

#### 상태/요약형

대상:

```text
overview
operations 일부
devices 일부
```

DOM:

```text
data-env-subtab-main-format
data-env-subtab-summary-card
data-env-status-card
data-env-status-metric-grid
data-env-status-metric
data-env-status-note
data-env-status-action-row
```

#### 기록형

대상:

```text
logs
```

DOM:

```text
data-env-subtab-main-format
data-env-subtab-summary-card
data-env-subtab-list-header
data-env-subtab-record-list
data-env-subtab-record-row
data-env-subtab-record-actions
```

#### 설정값 변경형 — setValue

대상:

```text
setpoints
rules
ai
devices 일부
```

DOM은 아래 setValue 표준을 사용한다.

---

## 4. setValue UI/DOM 표준

설정값을 변경하는 하위탭은 반드시 다음 shell을 사용한다.

```text
data-env-setvalue-subtab
data-env-setvalue-summary-card
data-env-setvalue-section
data-env-setvalue-card
data-env-setvalue-card-header
data-env-setvalue-card-body
data-env-setvalue-row
data-env-setvalue-label
data-env-setvalue-control
data-env-setvalue-current
data-env-setvalue-recommended
data-env-setvalue-input
data-env-setvalue-unit
data-env-setvalue-help
data-env-setvalue-safety-boundary
data-env-setvalue-action-row
data-env-setvalue-save
data-env-setvalue-reset
data-env-setvalue-audit-note
```

### 4.1 setValue row 구조

```text
data-env-setvalue-row
├─ data-env-setvalue-label
├─ data-env-setvalue-current
├─ data-env-setvalue-recommended
├─ data-env-setvalue-control
│  └─ input/select/toggle data-env-setvalue-input
├─ data-env-setvalue-unit
└─ data-env-setvalue-help
```

기존 저장 호환 marker는 유지한다.

```text
data-control-field
data-control-group
data-control-key
```

즉, 새 input은 다음 marker를 같이 가진다.

```text
data-env-setvalue-input
data-control-field
data-control-group="..."
data-control-key="..."
```

### 4.2 setValue 안전 경계

각 setValue 하위탭은 저장/적용 전 안전 경계를 보여야 한다.

```text
data-env-setvalue-safety-boundary
```

필수 문구:

```text
현장 Edge 인터록과 SafetyGuard가 최종 적용을 제한합니다.
```

### 4.3 setValue 저장/감사

저장 action row:

```text
data-env-setvalue-action-row
```

저장 버튼:

```text
data-env-setvalue-save
#control-strategy-save
```

감사/로그 설명:

```text
data-env-setvalue-audit-note
```

필수 의미:

- 저장은 `crop_season_id + zone_id + environment` scope로 저장된다.
- API 실패 시 localStorage fallback이 있다.
- 실제 장치 실행은 별도 gate와 SafetyGuard를 통과해야 한다.

---

## 5. 하위탭별 setValue 적용안

### 5.1 목표값 설정 (`setpoints`)

병합 source:

```text
temperature 목표값
humidity/VPD 목표값
CO₂ 목표값
```

주요 field:

```text
baseInterlockSettings.dayTargetTemp
baseInterlockSettings.nightTargetTemp
baseInterlockSettings.baseAdt
baseInterlockSettings.baseDif
baseInterlockSettings.targetHumidity
baseInterlockSettings.targetVpd
baseInterlockSettings.targetCo2
```

### 5.2 인터록·안전 설정 (`rules`)

병합 source:

```text
mode 제어 모드
온도 인터록
습도/VPD 인터록
CO₂ 제한
safetyLimits
```

주요 field:

```text
root.controlMode
aiStrategySettings.enabled
aiStrategySettings.autoFallback
systemStatus.aiStatus
temperatureControl.heatingStartTemp
temperatureControl.heatingStopTemp
temperatureControl.ventStartTemp
temperatureControl.ventMaxTemp
temperatureControl.highAlarmTemp
temperatureControl.lowAlarmTemp
humidityVpdControl.maxHumidity
humidityVpdControl.minVpd
humidityVpdControl.maxVpd
humidityVpdControl.dewpointGap
humidityVpdControl.dehumidVentOpen
humidityVpdControl.dehumidHeating
co2Control.co2Start
co2Control.co2Stop
co2Control.limitDuringVent
safetyLimits.absoluteMaxTemp
safetyLimits.absoluteMinTemp
safetyLimits.maxVentOpen
safetyLimits.minVentOpen
safetyLimits.strongWindCloseSpeed
safetyLimits.sensorErrorMode
safetyLimits.aiErrorMode
```

### 5.3 AI 보정·최종값 (`ai`)

병합 source:

```text
기존 ai tab
Environment strategy preview
finalAppliedTargets
lowLightStrategySettings
```

주요 field:

```text
aiStrategySettings.targetAdtDelta
aiStrategySettings.targetDifDelta
aiStrategySettings.targetVpdDelta
aiStrategySettings.dayTempDelta
aiStrategySettings.nightTempDelta
lowLightStrategySettings.enabled
lowLightStrategySettings.solarThreshold
lowLightStrategySettings.dayTempDelta
lowLightStrategySettings.targetVpdDelta
lowLightStrategySettings.co2Boost
lowLightStrategySettings.screenOpenPercent
```

### 5.4 장치 매핑·상태 (`devices`)

병합 source:

```text
deviceMap
entity state summary
entity mapping validation
```

setValue 적용 대상:

```text
entity mapping 입력/선택 필드
```

상태 카드 적용 대상:

```text
entity state summary
mapping validation
```

---

## 6. 금지 / 주의 기준

### 6.1 환경 제어에서 금지할 UI 혼합

- 설정형 하위탭에 record-list 구조를 강제하지 않는다.
- 상태/기록형 하위탭에 setValue input을 섞지 않는다.
- old tab 이름을 화면에 중복 노출하지 않는다. 단, compatibility marker는 hidden span으로 유지 가능하다.

### 6.2 실행 권한 주의

setValue 저장은 전략/설정 저장이지 즉시 장치 실행이 아니다.

금지 marker:

```text
data-env-setvalue-direct-execute
environmentSetValueAllowDirectExecution
data-env-control-bypass-safety
```

필수 경계 문구:

```text
현장 Edge 인터록과 SafetyGuard가 최종 적용을 제한합니다.
```

---

## 7. 계약 테스트 기준

Slice 1 계약:

```text
- 이 문서가 존재하고 current-ui/master-plan에서 링크된다.
- 현재 환경 제어 하위탭 10개 조사 내용이 문서화된다.
- 새 하위탭 재구성안 overview/setpoints/rules/ai/operations/devices/logs가 문서화된다.
- setValue DOM marker가 문서화된다.
```

Slice 2+ 계약:

```text
- _envStrategyTabs()가 새 하위탭 목록을 반환한다.
- 기존 tab key는 hidden compatibility marker로만 유지한다.
- setValue 하위탭은 data-env-setvalue-* marker를 가진다.
- 기존 data-control-field/data-control-group/data-control-key 저장 marker는 유지된다.
- AI/운영/리허설/장치/로그 탭은 타입별 shell을 가진다.
- 금지 marker가 없다.
```

---

## 8. 수직 슬라이스 완료 정의

각 슬라이스는 다음을 통과해야 완료로 본다.

```text
1. 문서/계약 업데이트
2. targeted test 통과
3. rendered DOM QA
4. node --check
5. 전체 pytest
6. Prod check_config/restart/smoke
7. commit/tag/release
```


### Follow-up — v1.9.99 Environment season-zone card

- 환경 제어 상단의 기존 구역 선택 카드 위치를 `data-env-season-zone-selector`로 교체한다.
- 카드는 작물 설정의 작기 선택 카드와 동일한 시각 문법을 사용하고 `data-env-season-zone-cloned-from="crop-season-selector"`로 traceability를 남긴다.
- 카드 선택 시 작기와 구역을 함께 바꿔 `crop_season_id + zone_id + environment` scope에 연결한다.
- 직접 실행/direct execution 권한은 추가하지 않는다.


### Follow-up — v1.10.0 Environment zone-centric crop-season scope

- 환경 제어 상단 scope selector를 작기 중심에서 구역 중심으로 전환한다.
- 구역 카드가 부모이며, 카드 내부에 해당 구역의 현재 활성 작기를 표시한다.
- 선택 시 `zone_id`를 먼저 고정하고, 해당 구역의 활성 `crop_season_id`를 함께 scope에 연결한다.
- 저장 문구는 `구역 + 현재 작기 + 제어영역 → green_smart_zone_control_settings`로 표시한다.
- 직접 실행/direct execution 권한은 추가하지 않는다.


### Follow-up — v1.10.1 Environment zone card UI/UX alignment

- 상단 selector 이름은 `구역 선택`으로 통일한다.
- 구역 카드 내부 UI는 작기 선택 카드와 동일한 3줄 카드 문법을 사용한다.
- 1줄: `구역 · 현재 작기`, 2줄: `정식일`, 3줄: `재배 중/철거완료/작기 미연결`.
- `구역 중심`, `현재 작기:` 같은 설명형 접두어와 카드 내부 마지막 저장 줄은 제거한다.
- 저장 scope는 `구역 + 현재 작기 + 제어영역`으로 유지한다.
