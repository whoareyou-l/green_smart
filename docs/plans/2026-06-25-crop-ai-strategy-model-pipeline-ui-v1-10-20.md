# v1.10.20 Crop AI Strategy model pipeline UI

## Problem

The crop model stack is now complete through the first crop-model layer:

1. Crop stage prediction
2. Growth state / vegetative-generative balance prediction
3. Risk factor prediction
4. Integrated crop diagnosis
5. Crop action recommendation

The Crop Settings > AI Strategy tab still presents the old top-level structure (`작물 상태 요약`, `인터록 상태 요약`, `모델 상태 요약`) and only embeds the finished models as mixed metrics/evidence. This no longer matches the product state: the operator should first see the completed crop-model pipeline and its request-only outputs.

## Scope

Rework only the AI Strategy subtab presentation.

### Visible structure

1. Header + read-only boundary
2. `작물 모델 파이프라인` first visible main card
   - 5 ordered model steps
   - numeric summary values
   - request-only outcome for action recommendation
3. `검토 요청 요약` second visible main card
   - work review requests
   - model review requests
   - operator review queue/readiness
4. `인터록/모델 운영 상태` as support card, not the primary AI strategy content
5. Collapsed evidence details for technical model/input evidence

### Preserve

- Existing stable historical markers where possible
- Interlock approval buttons and bindings
- Read-only/no-execution/no-auto-ML/no-PID boundary
- Detailed evidence sections for stage/state/risk/diagnosis/action and input features

### Forbid

- Final environment/irrigation/nutrient setpoint calculation
- Work order creation
- Device execution controls
- Automatic control, pesticide/control execution, auto training/deployment

## Required UI markers

- `data-crop-ai-model-pipeline-summary`
- `data-crop-ai-model-pipeline-step="stage-prediction"`
- `data-crop-ai-model-pipeline-step="growth-state-prediction"`
- `data-crop-ai-model-pipeline-step="risk-factor-prediction"`
- `data-crop-ai-model-pipeline-step="integrated-diagnosis"`
- `data-crop-ai-model-pipeline-step="action-recommendation"`
- `data-crop-ai-review-request-summary`
- `data-crop-ai-support-status-summary`

## Verification

- Add RED DOM contract for the new first-screen order.
- Run targeted AI Strategy UI tests.
- Run JS syntax, Python compile, full pytest, version sync, git diff check.
- Sync to prod and run HA config check before release.
