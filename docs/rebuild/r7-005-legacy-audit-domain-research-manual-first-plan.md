# R7-005 Legacy Influence Audit → Environment-Control Domain Research → Manual-first Plan

> Status: planning/contract baseline  
> Runtime scope: none  
> Panel/API/DB/MQTT/device change: none  
> Purpose: 기존 R7 작업을 바로 이어가지 않고, 레거시 영향 감사 → 환경제어 프로그램 도메인 조사 → 수동 설정 우선 도메인 재계획 → AI 보조 레이어 재배치 순서로 재정렬한다.

## 1. User correction being locked

사용자 correction:

```text
AI 모델 완전 사용 전제가 아니라,
수동 설정 + AI 자동화 병행 구조여야 한다.
AI가 고장 나도 수동 설정으로 운영 가능해야 한다.
먼저 레거시 영향 감사를 하고,
그 다음 기존 환경제어 프로그램의 도메인 구조를 조사/취합한 뒤,
계획을 다시 작성하고,
이전 R7 작업물을 다시 분류한 후,
수동 설정 우선 도메인 재정렬과 AI 보조 레이어 재배치를 진행한다.
```

This document freezes that order before more UI implementation.

## 2. Mandatory sequence

```text
1. Legacy Influence Audit
2. Environment-Control Program Domain Research
3. Research Synthesis
4. Green Smart Manual-first Target Domain Plan
5. Reclassification of prior R7 work
6. Manual/Base Settings-first Domain Reset
7. AI Assist Layer Repositioning
8. Later UI/API/contract rework
```

Any future R7 implementation must cite this order and must not skip directly from current R7-004 to recommendation/execution UI.

## 3. Current legacy influence audit

### 3.1 Registration boundary

Current registration boundary is correct but still keeps a legacy reference surface:

| Path | Component | Classification |
|---|---|---|
| `/green_smart` | `green-smart-rebuild-panel` | active rebuild main surface |
| `/green_smart_legacy` | `green-smart-panel` | legacy reference/compatibility surface |

This means the main panel is not the legacy panel, but the legacy panel remains registered as a reference surface.

### 3.2 Static scan evidence

Latest audit scan:

| Scope | Finding |
|---|---|
| `custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js` | no `legacy/Legacy/레거시` literal, but still has old R7 IA keys/labels: `field-status`, `recommendation-review`, `현장 상태`, `추천·실행 검토`, `crop-centered`, `작물 중심 운영` |
| `custom_components/green_smart/panel/green-smart-panel.js` | legacy compatibility monolith remains, with legacy strings and old domain module imports |
| `custom_components/green_smart/frontend_panel.py` | both rebuild and legacy panels registered |
| `tests/*.py` | many tests still assert legacy/reference wording and current R7 five-group structure |
| `docs/rebuild/*.md` | R7 docs and frontend-decomposition docs still preserve old five-group IA and legacy adapter wording |

### 3.3 Legacy influence categories

| Category | Examples | Decision |
|---|---|---|
| Active legacy surface | `/green_smart_legacy`, `green-smart-panel.js` | LEGACY reference only; do not use as product direction |
| Compatibility adapters | `current-crop-adapter.js`, `compatibilityAliases`, crop cycle aliases | ADAPT; acceptable only behind product DTO boundary |
| Old R7 IA labels | `현장 상태`, `추천·실행 검토`, `작물 중심 운영` | REPLAN; too abstract / AI-execution leaning |
| Old R7 keys | `field-status`, `recommendation-review`, `crop-centered` | ADAPT/DEPRECATE after target IA is confirmed |
| Existing settings/admin detail | R7-004 Settings/Admin read-only detail | KEEP/ADAPT; likely still valid under `설정·관리` |
| Tests locking old groups | `test_r7_003_*`, R7 docs/contracts | REWRITE when R7-008 shell rework begins |
| Operator-facing legacy wording | legacy/rebuild/developer phrases in UI | FORBID in active UI |

## 4. Environment-control program domain research

### 4.1 Sources reviewed

| Product/vendor | Evidence from public material | Domain pattern extracted |
|---|---|---|
| Priva | greenhouse climate/process computers; climate, lighting, water/irrigation, energy; crop/labor/process data; alarms/alerts; Priva One crop-focused overview | Climate/process control, water/irrigation, lighting/CO2/photosynthesis, energy, crop/process insights, alarms, remote operation |
| Hoogendoorn IIVO | process computer with smart software/hardware; crop-specific strategies; irrigation planning; water and energy management; intelligent algorithms; UI maps crop sections/installations/technical rooms | Climate, irrigation/water, energy, crop strategy, installations/technical rooms, intelligent algorithms as support/optimization |
| Ridder Hortimax | integrated climate, irrigation and energy control; process automation; sensors; digital/data/AI; drive systems/screens | Climate, water/irrigation, energy, sensors, devices/screens/drive systems, data/AI |
| Argus Controls | climate, irrigation, nutrient/fertigation, lighting, alarms, audit trails, optimization/reporting/API; growers enter setpoints/recipes/schedules | Climate, fertigation/irrigation, lighting/CO2, alarms/audit, data acquisition, optimization/reporting, manual setpoints/recipes/schedules |
| Autogrow/MultiGrow | climate compartments/zones, reservoirs, irrigation schedules, fertigation/hydroponic dosing, environment monitoring, alerts, analytics | Multi-zone climate, reservoirs, irrigation/fertigation, monitoring, alarms, analytics/insights |
| Korean smart greenhouse/complex environment control references | 복합환경제어 ICT 장비, 양액공급제어 ICT 장비, 영상정보장비; 환기/난방 주기 설정, CO₂ 자동 조절, 자동 양액 공급, 실시간 감시, 데이터 분석, 경보, 수동/자동 전환 | 복합환경 제어, 양액/관수 제어, 영상/모니터링, 장치/환기/난방, 경보, 데이터 분석, 수동/자동 전환 |

### 4.2 Common domain decomposition

Most environment-control programs are not organized as AI-first products. They typically separate:

```text
Climate / Environment
Irrigation / Fertigation / Water / Reservoirs
Devices / Actuators / Screens / Lighting / CO2 / Technical rooms
Energy / Resource optimization
Crop strategy / Crop insights / Recipes
Monitoring / Sensors / Data acquisition
Alarms / Audit / Safety / Diagnostics
Data / AI / Optimization / Reporting
Admin / Configuration / User access
```

### 4.3 Important conclusion

Existing greenhouse/environment-control systems usually expose **manual setpoints, recipes, schedules, and equipment control parameters** as the base operating model. AI/intelligent algorithms/data optimization exist, but they are support/optimization layers, not the only control path.

Therefore Green Smart must not present AI recommendation/execution as the main control model.

## 5. Green Smart target domain model

### 5.1 Proposed active sidebar/domain set

Target domain candidates after research synthesis:

```text
운영 홈
작물 운영
환경 제어
관수·양액
장치 제어
추천·자동화
안전·이력
설정·관리
```

### 5.2 Domain responsibilities

| Target domain | Primary purpose | Manual-first baseline | AI role | Safety/history role |
|---|---|---|---|---|
| 운영 홈 | today overview | show current operating mode and fallback status | summarize optional AI assist state | show blocking alarms/fail-safe status |
| 작물 운영 | current crop/crop_cycle/growth target | crop-specific target ranges and records | stage/state/risk/diagnosis/recommendation evidence | no direct execution |
| 환경 제어 | climate/environment setpoints | temperature, humidity, VPD, CO2, light/DLI, ventilation/heating/cooling targets | optional correction/recommendation | clamp by safety/interlock/fail-safe |
| 관수·양액 | irrigation/fertigation/water/rootzone | irrigation schedule, EC/pH, drain/dryback, reservoir/recipe settings | optional irrigation/nutrient correction | irrigation safety limits/fallback |
| 장치 제어 | devices/actuators/technical rooms | manual/auto mode, device mapping, device state | optional strategy hint only | interlock/fail-safe decides allowed command |
| 추천·자동화 | AI/rule automation review | compare against manual/base settings | recommendation, correction, explanation | no direct authority; fallback shown |
| 안전·이력 | alarms/audit/interlock/fail-safe | operator-visible block reasons and logs | AI may add evidence only | authoritative protection layer |
| 설정·관리 | RBAC/config/admin/diagnostics | users, mapping, system config, redaction | none or admin diagnostics only | admin audit/config boundary |

## 6. Four-layer control grammar

Every control domain must follow this grammar:

```text
Manual/Base Settings
→ Rule/Schedule Automation
→ AI Assist / Optimization
→ Safety/Interlock/Fail Safe Finalization
```

Equivalent UI explanation:

```text
수동 설정이 원본이다.
기본 자동제어는 수동 설정을 기반으로 작동한다.
AI는 보정/추천/최적화만 한다.
Safety/Interlock/Fail Safe가 최종 제한을 건다.
```

## 7. AI failure/fallback contract

When AI is disabled, unhealthy, timed out, stale, or rejected:

```text
1. Remove AI corrections from final target computation.
2. Continue operation from manual/base settings and rule/schedule automation if safe.
3. Keep Safety/Interlock/Fail Safe active.
4. Show the operator which non-AI baseline is currently used.
5. Do not stop greenhouse operation solely because AI failed.
6. Do not allow AI to bypass manual settings, permissions, safety, interlock, or fail-safe.
```

## 8. Reclassification of previous R7 work

| Previous R7 item | Classification | Handling |
|---|---|---|
| R7-001 crop-centered main dashboard | ADAPT | keep crop-centered overview idea, but align it under manual-first environment-control domains |
| R7-002 sidebar/page shell | ADAPT | keep shell mechanics, replace old five-group IA after target contract |
| R7-003 five placeholder subpages | DEPRECATE/REWRITE | old placeholders reflect old five-group model |
| R7-004 settings/admin read-only detail | KEEP/ADAPT | remains useful under `설정·관리`; preserve no-mutation/redaction boundary |
| `field-status` / `현장 상태` | DEPRECATE | split into `환경 제어`, `관수·양액`, `장치 제어` |
| `recommendation-review` / `추천·실행 검토` | ADAPT/DEPRECATE | replace with `추천·자동화`; remove execution-first implication |
| legacy panel | LEGACY | reference/compatibility only |
| adapters and aliases | ADAPT | keep behind DTO compatibility boundaries; do not shape product IA from them |

## 9. Revised implementation roadmap

Detailed domain specification now lives in:

```text
docs/rebuild/r7-006-manual-first-target-domain-spec.md
```

Roadmap:

```text
R7-005 Legacy Influence Audit + Domain Research + Manual-first Plan  ← this baseline
R7-006 Manual-first Target Domain Specification + target IA contract
R7-007 Sidebar/Page Shell Rework: old five groups → target domains, no API/DB/execution
R7-008 Environment Control manual/base settings read-only detail
R7-009 Irrigation/Fertigation manual/base settings read-only detail
R7-010 Device Control manual/auto/interlock read-only detail
R7-011 Recommendation/Automation as AI-assist comparison layer
R7-012 Safety/History domain detail
R8 Virtual rehearsal, still no physical MQTT/device hookup
R9 Dry-run result review
R10 Approval gate
R11 physical HA/MQTT device hookup only after virtual scenario pass
```

## 10. Non-goals for this baseline

- No panel DOM rewrite in R7-005.
- No API route change.
- No DB migration.
- No HA service call or MQTT/device command.
- No AI execution authority.
- No role/settings mutation.
- No production cutover change.

## 11. Acceptance checks

- This document contains the required sequence from legacy audit through AI assist repositioning.
- It records external environment-control domain research and synthesis.
- It defines target domains with manual-first responsibilities.
- It reclassifies previous R7 outputs as KEEP/ADAPT/DEPRECATE/LEGACY/REWRITE.
- It explicitly states AI fallback and no-AI operation rules.
- A contract test locks the baseline before implementation proceeds.
