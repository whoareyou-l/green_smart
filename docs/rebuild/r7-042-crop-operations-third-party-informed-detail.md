# R7-042 Crop Operations Detail — Third-party Informed Design

> 기준 버전: `v1.14.52`
> Status: planned
> Purpose: 타사 온실/환경제어 프로그램의 작물·재배 운영 패턴을 조사하고, Green Smart `작물 운영` 하위탭을 실제 운영자용 상세 페이지로 발전시킨다.

## Sources reviewed

| Vendor / Product | Evidence URL | Observed pattern |
|---|---|---|
| Priva / Priva One | https://www.priva.com/horticulture | “one single crop-focused system” for climate, irrigation and processes; crop/profit/resource view |
| Priva / Connext | https://www.priva.com/horticulture/solutions/climate-and-process-computers/priva-connext | grower remains expert; configurable environmental factors; transpiration, 24h temperature, RTR, irrigation, slab weight, moisture, light |
| Hoogendoorn / IIVO | https://hoogendoorn.com/en/projects/introducing-iivo/ | crop-specific approach, Plant Empowerment, balance of energy/water/assimilates, real-time insights into health and environment |
| Argus LIVE | https://arguscontrols.com/products-and-solutions/control-systems/live-software | smart dashboard: controlled-zone conditions, equipment status, alarms, irrigation/fertigation schedules, weather, graphs/gauges |
| LetsGrow | https://www.letsgrow.com/solutions/ | crop registration app, KPIs, target values vs results, season review, yield prediction, decision support, strategy manager |
| 30MHz | https://30mhz.com/platform/ | crop-level measurements, root-zone/irrigation context, calculations such as VPD, image/map overlays, location comparison, export/share |
| Source.ag / AskSource.ai | https://gpnmag.com/news/source-ag-launches-ai-assistant-for-greenhouse-growers/ | AI assist with crop-specific insights on climate, irrigation, pruning, harvest timing by crop type/growth stage |

## Synthesis for Green Smart

Third-party systems share a repeated structure:

```text
crop goal / current crop context
→ climate / irrigation / root-zone / equipment influence
→ crop registration and observations
→ alarms / risks / actions requiring attention
→ prediction / strategy / expert or AI assist
→ season review / trend evidence
```

Important design lessons:

1. `작물 운영` should be crop-centered, not a generic environment-control dashboard.
2. Each tab should answer an operator question, not merely display markers:
   - 현재 작물이 목표대로 가고 있는가?
   - 어떤 구역/작기의 작물인가?
   - 생육목표 대비 무엇이 벗어났는가?
   - 오늘 기록/작업에서 빠진 것이 있는가?
   - 환경·관수·장치 영향 중 무엇을 봐야 하는가?
   - 모델/AI는 무엇을 참고하라고 하는가?
3. AI/model belongs as assist/evidence only; execution remains outside this slice.
4. Controlled-zone context must stay visible because greenhouse vendors group data by controlled zones/locations.
5. Trend/review content should combine crop registration, environment/irrigation influence, and season review.

## Target Green Smart subtab grammar

### 1. 상태 요약

Operator question:

```text
현재 구역 작물이 정상인가, 무엇을 먼저 봐야 하는가?
```

Required content:

```text
current crop card
crop balance / stage card
attention queue card
climate-irrigation-device influence strip
freshness/source evidence
```

### 2. 작기·현재작물

Operator question:

```text
이 구역의 현재 작기/작물 정보가 무엇이고 운영 경계가 맞는가?
```

Required content:

```text
crop cycle identity
crop profile / cultivar
planting-demolition boundary
zone attachment
season review readiness
```

### 3. 생육목표

Operator question:

```text
작물 목표와 현재 상태의 차이는 무엇인가?
```

Required content:

```text
target stage
target focus
target-vs-current comparison
growth balance guidance
manual review required when stale/missing
```

### 4. 기록·작업

Operator question:

```text
오늘/최근 기록에서 누락되었거나 확인해야 할 작업은 무엇인가?
```

Required content:

```text
growth survey lane
pest scouting lane
control/treatment lane
work queue / next review
no direct save/delete/execute in this R7 detail page
```

### 5. 모델·추천

Operator question:

```text
모델/AI가 무엇을 근거로 어떤 검토를 권하는가?
```

Required content:

```text
stage/state/risk model evidence
crop-specific assist
climate-irrigation-pruning-harvest timing hints
safety boundary: no direct environment/irrigation/device command
fallback when AI/model unavailable
```

### 6. 추세·근거

Operator question:

```text
작기/생육/환경·관수 영향이 시간에 따라 어떻게 변했는가?
```

Required content:

```text
season review
KPI/trend cards
environment/irrigation/root-zone evidence
export/share/read-only evidence wording
```

## Required UI markers

```text
data-r7-crop-third-party-informed="true"
data-r7-crop-operator-question
data-r7-crop-attention-queue
data-r7-crop-influence-strip
data-r7-crop-registration-lane
data-r7-crop-target-gap
data-r7-crop-work-queue
data-r7-crop-model-review-lane
data-r7-crop-season-review
data-r7-crop-vendor-pattern="crop-goal-to-influence-to-action"
```

## Forbidden boundaries

```text
data-r7-crop-direct-execute
data-r7-crop-ha-service-call
data-r7-crop-mqtt-command
data-r7-crop-auto-apply
data-r7-crop-device-command
```

R7-042 is UI/detail/read-only only. It must not add API routes, DB migrations, HA service calls, MQTT/device commands, save/apply/execute controls, SafetyGuard runtime changes, or physical device hookup.
