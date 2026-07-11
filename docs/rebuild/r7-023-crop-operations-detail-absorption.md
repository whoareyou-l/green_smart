# R7-023 Crop Operations Detail Absorption

> 기준 버전: v1.15.37
> Status: planned via RED contract
> Scope: 작물 운영 도메인을 crop-centered, zone-scoped visual 하위탭으로 전환

## 1. Why this slice exists

The user corrected that the R7 visual-domain track must not skip **작물 운영**. The main IA remains crop-centered, and detailed domain work must still be zone-scoped.

Earlier R7 absorption slices converted 환경 제어, 관수 제어, 장치 제어, and 자동화 제어 into visual sub-tabs first. R7-023 corrects that ordering gap by turning 작물 운영 into the crop-centered visual domain.

## 2. Source inventory

Existing crop-operation evidence is currently split across:

| Source | Existing responsibility | Absorbed visual destination |
|---|---|---|
| `R7_DETAIL_SUBPAGES[crop-operations]` | summary/manualBase/automation/aiAssist/safety/source/zoneScope text | domain hero + hidden inventory evidence |
| `renderCropCycleReadOnlyCard()` | crop_cycle/currentCrop, crop type, variety, plant date, demolish date, growth stage | `작기·현재작물` tab / `data-r7-crop-cycle-card` |
| `renderCurrentCropAssignmentReadModel()` | zone current crop assignment, source row, equipment profile, data availability | `작기·현재작물` and `상태 요약` tabs / `data-r7-crop-assignment-card` |
| `renderGrowthTargetProjection()` | target stage, target focus, crop_cycle basis | `생육목표` tab / `data-r7-crop-growth-target-card` |
| crop record workflow | growth surveys, pest scouting, control/treatment records | `기록·작업` tab / `data-r7-crop-record-card` |
| crop model evidence | growth stage/status/risk/diagnosis/action recommendation evidence | `모델·추천` tab / `data-r7-crop-model-card` |
| freshness/trend evidence | currentCropAssignment + growthTargetProjection + crop model evidence | `추세·근거` tab / `data-r7-crop-trend-evidence` |

## 3. Product UI mapping

작물 운영 must render as:

```text
작물 운영 domain shell
→ zone context / selector
→ visual sub-tabs
→ selected tab content
→ crop-centered cards/evidence
```

Required sub-tabs:

| Tab key | Korean label | Required evidence |
|---|---|---|
| `status-summary` | 상태 요약 | current crop, growth stage, assignment/freshness, safety boundary |
| `crop-cycle` | 작기·현재작물 | crop_cycle/currentCrop, crop type, variety, plant date, demolish date |
| `growth-target` | 생육목표 | growthTargetProjection, target stage/focus, target basis |
| `records-workflow` | 기록·작업 | 생육조사, 병해충 예찰, 방제 기록 read-only workflow summary |
| `model-assist` | 모델·추천 | crop model evidence, diagnosis/risk/action recommendation evidence |
| `trend-evidence` | 추세·근거 | growth trend, record trend, data freshness/evidence |

## 4. Required markers

```text
data-r7-crop-zone-visual="true"
data-r7-crop-detail-absorbed="true"
data-r7-crop-subtab="status-summary"
data-r7-crop-subtab="crop-cycle"
data-r7-crop-subtab="growth-target"
data-r7-crop-subtab="records-workflow"
data-r7-crop-subtab="model-assist"
data-r7-crop-subtab="trend-evidence"
data-r7-crop-current-card
data-r7-crop-cycle-card
data-r7-crop-assignment-card
data-r7-crop-growth-target-card
data-r7-crop-record-card
data-r7-crop-model-card
data-r7-crop-trend-evidence
```

## 5. Product boundary

R7-023 is UI/documentation/contract absorption only:

```text
No API route change
No DB migration
No crop season save/update/delete/demolish logic change
No growth/pest/control record write logic change
No HA service call
No MQTT/device command
No save/apply/execute control
No approval/override release
No SafetyGuard/Interlock runtime behavior change
No physical device hookup
```

## 6. Acceptance criteria

```text
Focused RED contract fails before implementation
작물 운영 active domain renders data-r7-crop-zone-visual="true"
작물 운영 visual uses shared sub-tab markers
작물 운영 includes zone context and default zone selection
currentCrop/crop_cycle/growthTargetProjection/record workflow/model evidence are visible through visual cards
old generic-only placeholder is no longer the only rendered crop operation content
Existing routing and common visual contracts remain compatible
Full pytest and node syntax checks pass
Prod served-source + render smoke passes before release
```
