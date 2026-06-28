# RS-002 Home Dashboard Research — Environment-Control Product Patterns

> Purpose: choose the first real from-scratch Green Smart home dashboard direction without copying the legacy Green Smart UI.

## Products / references surveyed

- Priva / Priva One
- Hoogendoorn IIVO / Ready Set Grow
- Ridder Climate / Hortimax Pro descriptions
- Argus Controls
- Climate Control Systems / Climate Manager
- Netafim GrowSphere
- Korean Nongsaro smart-farm facility-horticulture cases

## Common patterns

### 1. Crop-centered control is stronger than function-tab control

Priva positions Priva One as a single crop-focused system for climate, irrigation, and processes. Hoogendoorn IIVO also emphasizes crop-specific insights and determining the crop's needs.

Implication for Green Smart:

```text
Do not start from old function tabs like Crop / Environment / Irrigation / Device.
Start from crop status and crop goals, then show how climate/irrigation/device decisions affect the crop.
```

### 2. The best systems explain decisions, not only show values

IIVO describes a tool/coach/guide model and explains why automated decisions are made. Netafim uses monitoring → recommendation → action.

Implication:

```text
Green Smart home should expose recommendation/decision reasons before execution.
```

### 3. Monitoring and action should be connected but gated

Ridder and Netafim both connect real-time monitoring to actions, while Green Smart must keep operator approval/safety gates before execution.

Implication:

```text
Show recommendation/execution as a safe next step, not direct uncontrolled automation.
```

### 4. Domestic greenhouse cases are facility/crop-type dependent

Nongsaro cases show that control level depends on crop, facility type, grower skill level, and available channels. Basic/optional modules include ventilation, insulation, growth imaging, irrigation, heating, and safety.

Implication:

```text
Home should not assume every farm has every device. It should start with crop status and show missing/unknown data honestly.
```

## Chosen direction

The first real home dashboard direction is:

```text
Crop-centered OS: 작물상태 → 생육목표 → 환경/관수/장치 영향 → 추천/실행
```

Important refinement from user feedback:

```text
The main frame remains crop-centered, but detail must be zone-scoped.
Each greenhouse zone may have a different crop, crop state, equipment set, and data availability.
```

Therefore the home dashboard should read as:

```text
Crop-centered OS with zone-specific crop contexts.
```

## Forbidden direction

The first real home must not look like the old Green Smart legacy layout:

```text
Home / Crop / Environment / Irrigation / Device / Admin as the main conceptual frame is too legacy-like.
```

Those domains may exist later as implementation modules, but the operator-facing home starts from the crop and its operating goal.
