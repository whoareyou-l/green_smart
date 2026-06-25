# v1.10.21 AI Strategy top summary cards

## User request

Reorganize Crop Settings > AI Strategy top content in this order:

1. 작물 요약
2. 안전/인터록 상태 요약
3. 모델 상태 요약, including a detail button

## Crop summary fields

The crop summary must show exactly the operator-facing crop items first:

- 작물단계
- 작물상태
- 환경리스크
- 관수리스크
- 병충해리스크

## Safety/interlock summary fields

The safety/interlock summary must show:

- 안전상태
- 인터록 상태
- 오류건수

## Model status summary

The model status summary should keep the model pipeline and review request information available, but not as the first visible content before crop/safety summaries. A visible detail button must point operators to the collapsed evidence/details area.

## Boundaries

- No execution controls
- No final environment/irrigation/nutrient setpoints
- No work order creation
- No auto pesticide/control execution
- No automatic ML training/deployment

## Required markers

- `data-crop-ai-crop-summary`
- `data-crop-ai-summary-stage`
- `data-crop-ai-summary-growth-state`
- `data-crop-ai-summary-environment-risk`
- `data-crop-ai-summary-irrigation-risk`
- `data-crop-ai-summary-pest-risk`
- `data-crop-ai-safety-interlock-summary`
- `data-crop-ai-summary-safety-status`
- `data-crop-ai-summary-interlock-status`
- `data-crop-ai-summary-error-count`
- `data-crop-ai-model-status-summary`
- `data-crop-ai-model-detail-toggle`
