# Crop AI Strategy 하위탭 UI/DOM 표준 패턴

> 기준 버전: `v1.9.94`
> 기준 구현: `custom_components/green_smart/panel/green-smart-panel.js` `_renderGrowthReportCard()`
> 목적: 앞으로 AI 전략 또는 유사한 패널형 하위탭을 수정할 때, 카드 구조와 DOM marker를 같은 방식으로 유지해 UI 통일성을 확보한다.

## 1. 설계 원칙

AI 전략 하위탭은 **기록 목록형 탭이 아니다.** 따라서 생육조사/병해충 예찰/방제 기록처럼 목록 헤더와 record row 중심으로 만들지 않는다.

AI 전략은 다음 2단 구조를 따른다.

```text
1. 메인 판단 영역
   - 농장주/직원이 바로 읽는 요약 카드
   - 작물 상태, 인터록 상태, 모델 상태만 노출

2. 접힘 상세 근거 영역
   - 상위 모델, 하위 모델, 모델 운영/검증 참고, 센터 참고
   - 기술적 근거는 기본적으로 접힌 상태
```

핵심 UX 원칙:

- 첫 화면은 **농장주/직원용 요약 우선**이다.
- 상세 모델/데이터/센터 근거는 `details`로 접는다.
- AI/센터/모델 정보는 **read-only**이다.
- 현장 Edge가 최종 판단한다.
- 자동 실행, 자동 학습, 자동 배포, 환경/관수/장치 PID 적용 권한을 이 탭에서 만들지 않는다.

---

## 2. 최상위 패널 구조

AI 전략 탭은 다음 상위 marker를 사용한다.

```text
data-growth-report-card
data-crop-ai-evidence-panel
data-crop-ai-strategy-header
data-crop-ai-readonly-boundary
```

권장 순서:

```text
data-crop-ai-strategy-header
→ data-crop-ai-readonly-boundary
→ data-crop-ai-decision-summary
→ data-crop-ai-interlock-summary
→ data-crop-ai-model-status-summary
→ data-crop-ai-advanced-details
```

금지:

```text
data-crop-ai-list-header
data-crop-ai-evidence-list
data-crop-subtab-record-list
data-crop-list-count
data-crop-list-actions
```

이 marker들은 기록형 하위탭용이다. AI 전략 탭에 넣지 않는다.

---

## 3. 메인 카드 영역 표준

메인 영역은 항상 3개 카드로 구성한다.

| 순서 | 카드 | 기존/호환 marker | 카드 타입 |
|---:|---|---|---|
| 1 | 작물 상태 요약 | `data-crop-ai-decision-summary`, `data-crop-ai-primary-summary` | `data-crop-ai-main-card="crop-status"` |
| 2 | 인터록 상태 요약 | `data-crop-ai-interlock-summary`, `data-crop-interlock-card` | `data-crop-ai-main-card="interlock-status"` |
| 3 | 모델 상태 요약 | `data-crop-ai-model-status-summary`, `data-crop-ai-expanded-model-summary` | `data-crop-ai-main-card="model-status"` |

### 3.1 공통 outer shell

세 메인 카드는 모두 아래 shell을 가져야 한다.

```text
data-crop-ai-main-card
data-crop-ai-main-card-header
data-crop-ai-main-card-body
data-crop-ai-main-card-chip-group
```

시각 스타일도 같이 맞춘다.

```text
background: #fff
border-radius: 16px
padding: 14px
margin-bottom: 12px
box-shadow: 0 6px 18px rgba(64,117,78,0.08)
```

### 3.2 공통 inner structure

겉 shell만 맞추면 통일감이 부족하다. 반드시 내부도 같은 문법을 사용한다.

```text
data-crop-ai-main-card
├─ data-crop-ai-main-card-header
├─ data-crop-ai-main-card-body
│  ├─ data-crop-ai-main-metric-grid
│  │  └─ data-crop-ai-main-metric
│  │     ├─ data-crop-ai-main-metric-label
│  │     ├─ data-crop-ai-main-metric-value
│  │     └─ data-crop-ai-main-metric-help
│  ├─ data-crop-ai-main-note
│  └─ data-crop-ai-main-action-row
└─ data-crop-ai-main-card-chip-group
```

공통 내부 marker:

```text
data-crop-ai-main-metric-grid
data-crop-ai-main-metric
data-crop-ai-main-metric-label
data-crop-ai-main-metric-value
data-crop-ai-main-metric-help
data-crop-ai-main-note
data-crop-ai-main-action-row
```

### 3.3 카드별 metric 구성

#### 작물 상태 요약

```text
data-crop-ai-main-card="crop-status"
```

metric:

```text
data-crop-ai-primary-gl-index
data-crop-ai-primary-yield-prediction
data-crop-ai-primary-pest-risk
```

note/action:

```text
data-crop-ai-next-action
data-crop-ai-main-action-row
```

역할:

- 가장 먼저 보는 작물 상태 요약
- G/L-Index, 수확량 예측, 병해 위험도만 우선 노출
- “다음 행동”은 note 영역에 둔다.

#### 인터록 상태 요약

```text
data-crop-ai-main-card="interlock-status"
```

metric:

```text
data-crop-ai-interlock-status
data-crop-ai-target-promotion-status
data-crop-ai-auto-execution-status
```

note/action:

```text
data-crop-ai-main-note
data-crop-interlock-approval-gate
data-crop-ai-main-action-row
data-crop-ai-interlock-actions
data-crop-interlock-approve
```

역할:

- AI 판단을 운영에 참고하기 전 확인할 안전 상태
- 승인 버튼은 기능 보존을 위해 유지한다.
- 단, 버튼은 별도 튀는 영역이 아니라 `data-crop-ai-main-action-row` 안에 둔다.

#### 모델 상태 요약

```text
data-crop-ai-main-card="model-status"
```

metric:

```text
data-crop-ai-input-status
data-crop-ai-stage-status
data-crop-ai-risk-status
data-crop-ai-ml-readiness-status
```

note/action:

```text
data-crop-ai-main-note
data-crop-ai-main-action-row
```

역할:

- 입력 완성도와 모델 준비 상태만 요약한다.
- 자동 학습/배포 권한을 만들지 않는다.

---

## 4. AI 판단 흐름 카드는 사용하지 않는다

AI 판단 흐름 카드는 사용자 피드백으로 제거되었다. 다시 추가하지 않는다.

금지 marker:

```text
data-crop-ai-decision-flow
data-crop-ai-decision-flow-steps
data-crop-ai-flow-step
```

판단 흐름을 설명하고 싶다면 별도 카드로 부활시키지 말고, 메인 카드의 `data-crop-ai-main-note` 또는 상세 근거 영역의 evidence card 안에서 짧게 설명한다.

---

## 5. 접힘 상세 근거 영역 표준

상세 근거는 기본적으로 접힌다.

```text
data-crop-ai-advanced-details
data-crop-ai-evidence-details
data-crop-ai-technical-evidence-stack
```

상세 영역은 아래 section 순서를 따른다.

```text
data-crop-ai-evidence-section="top-models"
→ data-crop-ai-evidence-section="submodels"
→ data-crop-ai-evidence-section="model-operations"
→ data-crop-ai-evidence-section="center-reference"
```

## 5.1 상세 evidence card 공통 shell

상세 영역의 모든 evidence card는 아래 구조를 공유한다.

```text
data-crop-ai-evidence-card
data-crop-ai-evidence-card-header
data-crop-ai-evidence-card-body
data-crop-ai-evidence-chip-group
```

---

## 6. 상세 section별 카드 분류

### 6.1 상위 모델 section

```text
data-crop-ai-evidence-section="top-models"
data-crop-ai-top-models
```

상위 모델 카드만 둔다.

```text
data-crop-ai-evidence-card="stage-prediction"
data-crop-ai-evidence-card="reproductive-vegetative"
data-crop-ai-evidence-card="pest-prediction"
```

호환 marker:

```text
data-crop-ai-stage-prediction-model
data-crop-ai-reproductive-vegetative-model
data-crop-ai-pest-prediction-model
```

### 6.2 하위 모델 / 입력 근거 section

```text
data-crop-ai-evidence-section="submodels"
data-crop-ai-submodels
data-crop-ai-submodel-evidence-section
```

실제 하위 모델/입력 근거만 둔다.

```text
data-crop-ai-evidence-card="kma-weather-stress"
data-crop-ai-evidence-card="environment-features"
data-crop-ai-evidence-card="irrigation-nutrient-features"
data-crop-ai-evidence-card="pest-control-features"
data-crop-ai-evidence-card="model-feature-sources"
```

호환 marker:

```text
data-crop-kma-weather-stress-card
data-crop-environment-features-card
data-crop-irrigation-nutrient-features-card
data-crop-pest-control-features-card
data-crop-model-feature-sources-card
```

### 6.3 모델 운영/검증 참고 section

```text
data-crop-ai-evidence-section="model-operations"
data-crop-ai-model-operations
```

상위/하위 모델이 아닌 지원성 카드는 이 section에 둔다.

```text
data-crop-ai-evidence-card="operator-workflow"
data-crop-ai-evidence-card="quality-disorder"
data-crop-ai-evidence-card="prediction-validation"
data-crop-ai-evidence-card="training-dataset-export"
```

호환 marker:

```text
data-crop-operator-workflow-card
data-crop-quality-disorder-summary-card
data-crop-prediction-validation-card
data-crop-training-dataset-export-card
```

분류 기준:

| 카드 | 분류 이유 |
|---|---|
| 이번 주 작물 모델 작업 안내 | 운영/작업 안내이지 상위 모델이 아님 |
| 품질/장해 요약 | 모델 판단 보조 참고이지 하위 모델 자체가 아님 |
| 예측 검증 상태 | 검증/라벨 상태이지 하위 모델 자체가 아님 |
| 학습 데이터셋 export | 학습 준비도이지 운영 모델이 아님 |

### 6.4 센터 분석 참고 section

```text
data-crop-ai-evidence-section="center-reference"
data-crop-ai-center-reference-summary
```

순서:

```text
센터 분석 참고
→ 센터 분석/인터록 분석 카드
→ 센터 작물 정책
```

센터 작물 정책 marker:

```text
data-center-crop-policy-card
```

센터 관련 주의:

- Center는 analytics/reporting 참고이다.
- 실시간 제어 판단은 현장 Edge가 수행한다.
- Center 분석/정책 카드에 실행 권한을 추가하지 않는다.

---

## 7. 금지 / 주의 marker

### 7.1 기록형 탭 marker 금지

AI 전략은 기록형 탭이 아니므로 아래 marker를 추가하지 않는다.

```text
data-crop-ai-list-header
data-crop-ai-evidence-list
data-crop-subtab-record-list
data-crop-list-count
data-crop-list-actions
```

### 7.2 판단 흐름 카드 금지

```text
data-crop-ai-decision-flow
data-crop-ai-decision-flow-steps
data-crop-ai-flow-step
```

### 7.3 실행 권한 marker 금지

AI 전략/센터 정책/센터 분석은 read-only이다. 아래 계열의 실행 권한 marker를 만들지 않는다.

```text
data-center-crop-policy-execute
centerCropPolicyAllowExecution
data-center-analytics-execute
centerAnalyticsAllowExecution
```

### 7.4 자동 학습/배포 금지

모델 상태/학습 데이터셋 카드는 준비도와 내보내기만 다룬다.

금지 방향:

```text
automatic ML deployment
자동 학습 실행
자동 모델 교체
운영 모델 자동 배포
```

---

## 8. 작업 절차 체크리스트

AI 전략 UI를 수정할 때는 아래 순서를 따른다.

1. **카드 분류부터 결정한다.**
   - 메인 요약인가?
   - 상위 모델인가?
   - 하위 모델/입력 근거인가?
   - 모델 운영/검증 참고인가?
   - 센터 참고인가?

2. **메인 카드는 3개를 넘기지 않는다.**
   - 작물 상태 요약
   - 인터록 상태 요약
   - 모델 상태 요약

3. **새 정보를 메인에 넣을지 상세에 넣을지 판단한다.**
   - 농장주/직원이 즉시 봐야 하면 메인 card의 metric/note/action에 편입
   - 기술 근거면 접힘 상세 evidence card

4. **겉 shell과 내부 structure를 동시에 맞춘다.**
   - outer shell만 맞추면 UI 통일성이 부족하다.
   - 반드시 metric grid, metric label/value/help, note, action row를 같이 맞춘다.

5. **기존 기능 marker는 호환 유지한다.**
   - 기존 테스트/자동화가 쓰는 marker는 제거하지 말고 공통 shell marker를 추가한다.

6. **금지 marker를 검사한다.**
   - decision-flow 재도입 금지
   - record-list marker 금지
   - execution authority marker 금지

7. **렌더 QA를 한다.**
   - 정적 문자열 계약만으로는 시각적 통일성을 놓칠 수 있다.
   - 최소한 DOM 렌더에서 shell/inner marker와 카드 순서를 확인한다.

---

## 9. 계약 테스트 권장 항목

AI 전략 UI 수정 시 다음 항목을 테스트한다.

### 9.1 메인 카드 계약

```text
- data-crop-ai-main-card 3개 존재
- crop-status → interlock-status → model-status 순서
- 각 카드가 header/body/chip-group 보유
- 각 카드가 metric-grid/metric/label/value/help/note/action-row 보유
- decision-flow marker 부재
```

### 9.2 상세 근거 계약

```text
- top-models → submodels → model-operations → center-reference 순서
- 모든 evidence card가 header/body/chip-group 보유
- operator workflow는 top-models에 없음
- quality/prediction/training support card는 submodels에 없음
- center-reference에서 센터 분석이 센터 정책보다 먼저 옴
```

### 9.3 금지 marker 계약

```text
- data-crop-ai-decision-flow 없음
- data-crop-ai-decision-flow-steps 없음
- data-crop-ai-flow-step 없음
- data-crop-ai-list-header 없음
- data-crop-ai-evidence-list 없음
- data-crop-subtab-record-list 없음
- execution authority marker 없음
```

---

## 10. 현재 v1.9.94 기준 최종 구조 요약

```text
AI 전략
├─ data-crop-ai-strategy-header
├─ data-crop-ai-readonly-boundary
├─ data-crop-ai-main-card="crop-status"
│  ├─ G/L-Index
│  ├─ 수확량 예측
│  └─ 병해 위험도
├─ data-crop-ai-main-card="interlock-status"
│  ├─ 인터록 상태
│  ├─ 목표 승격
│  ├─ 자동 실행
│  └─ 승인 action row
├─ data-crop-ai-main-card="model-status"
│  ├─ 입력 상태
│  ├─ 생육단계/예측
│  ├─ 리스크
│  └─ ML 준비도
└─ data-crop-ai-advanced-details
   ├─ data-crop-ai-evidence-section="top-models"
   ├─ data-crop-ai-evidence-section="submodels"
   ├─ data-crop-ai-evidence-section="model-operations"
   └─ data-crop-ai-evidence-section="center-reference"
```

이 구조를 AI 전략 하위탭의 source-of-truth UI/DOM 패턴으로 사용한다.
