# v1.10.22 Crop summary card labels

## User request

Revise only the Crop Settings > AI Strategy `작물 요약` card display grammar.

## Required fields

1. `작물단계`
   - Main value: text stage label such as 활착기, 성숙기.
   - Subline: crop stage model score and confidence score.

2. `작물상태`
   - Main value: text state label such as 강한 생식생장 or 영양생장.
   - Show a direction emoji next to the text.
   - Subline: growth-state model score and confidence score.

3. `환경요약`
   - Rename from 환경리스크.
   - Main value: text environmental factor such as 고온, 저온, 온도급변.
   - Subline: risk-factor model environment-part score and confidence score.

4. `관수요약`
   - Rename from 관수리스크.
   - Main value: text irrigation/nutrient factor such as 높은 EC, 과관수.
   - Subline: risk-factor model irrigation-part score and confidence score.

5. `병충해요약`
   - Rename from 병충해리스크.
   - Main value: pest/disease part score from the risk-factor model.
   - Subline: confidence score.

## Required markers

- `data-crop-ai-summary-stage-score`
- `data-crop-ai-summary-stage-confidence`
- `data-crop-ai-summary-growth-state-label`
- `data-crop-ai-summary-growth-direction-emoji`
- `data-crop-ai-summary-growth-state-score`
- `data-crop-ai-summary-growth-state-confidence`
- `data-crop-ai-summary-environment-label`
- `data-crop-ai-summary-environment-score`
- `data-crop-ai-summary-environment-confidence`
- `data-crop-ai-summary-irrigation-label`
- `data-crop-ai-summary-irrigation-score`
- `data-crop-ai-summary-irrigation-confidence`
- `data-crop-ai-summary-pest-score`
- `data-crop-ai-summary-pest-confidence`

## Boundaries

- Do not change model contracts.
- Do not add control/execution authority.
- Existing compatibility markers may remain as aliases for tests/automation.
