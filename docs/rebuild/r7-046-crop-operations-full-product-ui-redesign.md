# R7-046 Crop Operations full product UI redesign

Status: planned / implementation in progress  
Target version: v1.12.81

## User correction

The existing Crop Operations subtabs must not remain as simple content cards. The previous card contents may be used only as design input. The visible UI should be rebuilt as product-ready operator screens/components.

## Scope

Replace the visible contents of all Crop Operations subtabs:

1. 상태 요약
2. 작기·현재작물
3. 생육목표
4. 기록·작업
5. 모델·추천
6. 추세·근거

## Design principle

The old card labels/content are reference only:

- 현재 작물
- 우선 확인
- 작기 ID
- 작물 프로필
- 목표 단계
- 목표 대비 차이
- 생육조사
- 병해충 예찰
- 방제 기록
- 모델 검토
- 시즌 리뷰

The new visible UI must be product screens with reusable components, not card dumps.

## Product UI grammar

Each subtab must render through product-level components:

```text
ProductScreen
 ├─ ScreenHeader
 │   ├─ title
 │   ├─ operator intent
 │   └─ state/freshness chips
 ├─ PrimaryPanel
 │   └─ the main object/operator decision for that subtab
 ├─ EvidenceRail
 │   └─ data source, freshness, latest record, factor chips
 ├─ ActionBar
 │   └─ navigation-only buttons to subtab/domain/detail
 └─ Empty/Loading/Stale/Error state support
```

## Subtab target screens

### 1. 상태 요약

Purpose: answer “지금 이 구역 작물에 대해 무엇을 먼저 봐야 하는가?”

Visible product screen:

- Current crop summary
- Priority queue
- Record health
- Influence summary
- Recommendation review

### 2. 작기·현재작물

Purpose: answer “현재 구역에 어떤 작기가 붙어 있고 운영 경계가 유효한가?”

Visible product screen:

- Crop cycle identity panel
- Crop profile panel
- Assignment/evidence panel
- Operation boundary panel
- Actions to growth target / records

### 3. 생육목표

Purpose: answer “현재 단계와 목표 단계의 차이는 무엇이고 오늘 어떤 방향으로 봐야 하는가?”

Visible product screen:

- Current vs target stage comparison
- Target focus panel
- Gap/risk explanation
- Evidence from growthTargetProjection / environmentImpactProjection
- Actions to records / model assist

### 4. 기록·작업

Purpose: answer “오늘 기록상 무엇이 누락되었고 어떤 작업 확인이 필요한가?”

Visible product screen:

- Work queue panel
- Growth survey latest panel
- Pest scouting latest panel
- Control/treatment latest panel
- Missing items / stale state support

### 5. 모델·추천

Purpose: answer “모델 또는 추천은 무엇을 근거로 무엇을 검토하라고 하는가?”

Visible product screen:

- Recommendation review panel
- Influence factors panel
- Approval/fallback boundary panel
- No-execution boundary panel
- Actions to status/trend/evidence

### 6. 추세·근거

Purpose: answer “시즌 흐름과 근거 데이터가 어떤 상태인가?”

Visible product screen:

- Season evidence summary
- Growth/record count timeline placeholders
- Environment/irrigation impact trend placeholders
- Source/freshness panel
- Actions to current crop / records / model

## Compatibility boundary

Older R7 contracts may still require marker aliases. Keep compatibility markers as aliases, but do not keep old visible card copy as the primary UI.

Retain aliases when needed:

```text
data-r7-crop-current-card
data-r7-crop-attention-queue
data-r7-crop-influence-strip
data-r7-crop-registration-lane
data-r7-crop-target-gap
data-r7-crop-work-queue
data-r7-crop-model-review-lane
data-r7-crop-season-review
```

## Forbidden in this slice

No execution or mutation authority:

```text
data-r7-crop-direct-execute
data-r7-crop-ha-service-call
data-r7-crop-mqtt-command
data-r7-crop-auto-apply
data-r7-crop-device-command
```

No DB migration, no write/save/delete/demolish behavior change, no HA service call, no MQTT/device command.

## Acceptance criteria

- A new focused contract verifies the plan document.
- All six Crop Operations subtabs render product screens.
- Old visible card labels are not the primary rendered structure.
- Every subtab has `data-r7-product-screen` and a subtab-specific screen kind.
- Every subtab includes header/body/evidence/action product regions.
- Render smoke checks representative context values in every subtab.
- Existing compatibility markers remain present.
- Full test suite and production smoke pass before release.
