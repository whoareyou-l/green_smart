# Integrated Crop, Environment, Irrigation and Device Models Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Build Green Smart’s next strategy layer around four connected models: 작기 모델, 환경 전략 모델, 관수 전략 모델, 장치 운영 모델.

**Architecture:** Keep existing Home Assistant custom integration, MariaDB, and zone-control APIs. Preserve legacy internal identifiers such as `environment_strategy_mvp` and `irrigation_strategy_mvp` for compatibility, but expose user-facing UI/doc terminology as 모델/전략 모델/운영 모델. All model outputs remain candidate/final targets and must pass Control Mode, Limited Auto, Operator Confirmation, SafetyGuard, and Interlock before HA service execution.

**Tech Stack:** Home Assistant custom integration, Python `HomeAssistantView`, MariaDB/aiomysql, Vanilla JS Web Component, pytest contract tests, `node --check`.

---

## Model relationship baseline

```text
작기 모델(Crop Season Model)
→ 환경 전략 모델(Environment Strategy Model)
→ 관수 전략 모델(Irrigation Strategy Model)
→ 장치 운영 모델(Device Operation Model)
→ SafetyGuard/Interlock/Control Mode
→ HA service call / post-state verification / logs
→ feedback back to crop/environment/irrigation models
```

## Forbidden shortcuts

- Do not rename DB/API legacy identifiers without a migration plan.
- Do not let any model execute HA service calls directly.
- Do not connect physical devices before virtual rehearsal evidence and C20 gate.
- Do not add raw long-term sensor history tables unless HA recorder/InfluxDB cannot satisfy the need.
- Do not expose `MVP` as a primary user-facing UI title.

---

## Task M0: User-facing terminology contract

**Objective:** Replace user-facing `MVP` labels with model labels while keeping internal legacy IDs.

**Files:**
- Modify: `custom_components/green_smart/panel/green-smart-panel.js`
- Modify: `tests/test_frontend_panel_contract.py`
- Modify: `docs/design/current-ui-design-and-navigation.md`

**Steps:**
1. Add/adjust frontend contract tests that require:
   - `환경 전략 모델`
   - `관수 전략 모델`
   - `장치 운영 모델`
   - no primary card title containing `전략 MVP`
2. Update panel card titles:
   - `_renderEnvironmentStrategyPreviewCard()` title: `환경 전략 모델`
   - `_renderIrrigationStrategyPreviewCard()` title: `관수 전략 모델`
   - device AI/operator cards: `장치 운영 모델`
3. Keep muted compatibility text only if needed:
   - `legacy id: environment_strategy_mvp`
   - `legacy id: irrigation_strategy_mvp`
4. Run:
   ```bash
   pytest tests/test_frontend_panel_contract.py -q
   node --check custom_components/green_smart/panel/green-smart-panel.js
   ```

**Expected:** tests pass and JS syntax passes.

---

## Task M1: Crop Season Model contract

**Objective:** Define a reusable 작기 모델 snapshot used by environment/irrigation/device models.

**Files:**
- Modify: `custom_components/green_smart/crop_views.py`
- Modify: `custom_components/green_smart/zone_control_views.py`
- Modify: `tests/test_db_contract.py` or new `tests/test_model_contract.py`
- Modify: `docs/design/current-backend-api-db-ha-contract.md`

**Steps:**
1. Write RED contract for helper/response markers:
   - `_crop_model_snapshot(...)`
   - `cropModelVersion`
   - `cropProfile`
   - `growthStage`
   - `gIndex`
   - `yieldPrediction`
   - `pestRisk`
   - `confidenceReasons`
2. Implement a read-only helper that aggregates existing tables:
   - `crop_seasons`
   - `growth_surveys`
   - `pest_surveys`
   - `control_records`
3. Reuse existing growth-report logic where possible; do not duplicate model math.
4. Verify:
   ```bash
   pytest tests/test_model_contract.py tests/test_db_contract.py -q
   ```

**Expected:** 작기 모델 snapshot can be called without creating new tables. No new DB table is required for M1; the helper reads `crop_seasons`, `growth_surveys`, `pest_surveys`, and `control_records`, then returns `cropModelVersion`, `cropProfile`, `growthStage`, `gIndex`, `yieldPrediction`, `pestRisk`, and `confidenceReasons`.

---

## Task M2: Environment Strategy Model consumes Crop Model

**Objective:** Make environment preview explicitly include 작기 모델 inputs and confidence reasons.

**Files:**
- Modify: `custom_components/green_smart/zone_control_views.py`
- Modify: `custom_components/green_smart/panel/green-smart-panel.js`
- Modify: `tests/test_zone_control_contract.py`
- Modify: `tests/test_frontend_panel_contract.py`

**Steps:**
1. RED test environment preview response includes:
   - `cropModel`
   - `growthStage`
   - `cropTargetRange`
   - `environmentModelVersion`
   - `confidenceReasons`
2. Implement minimal response enrichment using Task M1 helper.
3. Panel shows:
   - current crop/growth stage
   - ADT/DIF/VPD reason
   - model confidence/reason list
4. Verify:
   ```bash
   pytest tests/test_zone_control_contract.py::test_environment_strategy_model_uses_crop_model -q
   pytest tests/test_frontend_panel_contract.py::test_environment_strategy_model_card_contract -q
   ```

**Expected:** Environment model visibly depends on crop model.

---

## Task M3: Irrigation Strategy Model consumes Crop + Environment Models

**Objective:** Make irrigation preview explicitly include crop model and environment stress inputs.

**Files:**
- Modify: `custom_components/green_smart/zone_control_views.py`
- Modify: `custom_components/green_smart/panel/green-smart-panel.js`
- Modify: `tests/test_zone_control_contract.py`
- Modify: `tests/test_frontend_panel_contract.py`

**Steps:**
1. RED test irrigation preview response includes:
   - `cropModel`
   - `environmentInfluence`
   - `vpdInfluence`
   - `radiationInfluence`
   - `irrigationModelVersion`
   - `confidenceReasons`
2. Implement model input merge:
   - crop profile/growth stage
   - VPD/radiation/temp from environment strategy inputs or HA/weather state
   - VWC/EC/pH/drain feedback
3. Panel shows why shot/interval/EC/pH changed.
4. Verify targeted tests.

**Expected:** Irrigation model visibly depends on crop and environment models.

---

## Task M4: Device Operation Model baseline

**Objective:** Treat device control as an operation model, not only a settings page.

**Files:**
- Modify: `custom_components/green_smart/zone_control_views.py`
- Modify: `custom_components/green_smart/panel/green-smart-panel.js`
- Modify: `tests/test_zone_control_contract.py`
- Modify: `tests/test_frontend_panel_contract.py`

**Steps:**
1. RED test dry-run/execute response includes device operation model markers:
   - `deviceOperationModelVersion`
   - `serviceCallPlan`
   - `deviceCapabilitySummary`
   - `safeStatePlan`
   - `postStateExpectation`
2. Implement response enrichment from existing mapping/status data.
3. Add 장치 운영 모델 card in device AI/operator area.
4. Verify dry-run still does not call actual HA services.

**Expected:** Device model explains how final targets become executable service plans.

---

## Task M5: Integrated model relationship card

**Objective:** Add a single zone-level summary showing the chain from crop model to device operation.

**Files:**
- Modify: `custom_components/green_smart/panel/green-smart-panel.js`
- Modify: `tests/test_frontend_panel_contract.py`

**Steps:**
1. RED test markers:
   - `data-integrated-model-chain-card`
   - `작기 모델`
   - `환경 전략 모델`
   - `관수 전략 모델`
   - `장치 운영 모델`
   - `SafetyGuard 우선`
2. Render compact chain card in AI 운영 tab or top model summary area.
3. Keep it read-only; no execution button in this card.
4. Verify frontend tests and `node --check`.

**Expected:** Operators can understand model relationships without reading docs.

---

## Task M6: Feedback and calibration reasons

**Objective:** Add explicit feedback/correction reasons without overbuilding calibration.

**Files:**
- Modify: model helper code from M1-M3
- Modify: panel cards
- Modify: tests

**Steps:**
1. Add fields:
   - `feedbackDrivers`
   - `calibrationNeeded`
   - `calibrationReasons`
2. Use existing logs and surveys only; do not create new tables yet.
3. Show reasons in muted UI chips.
4. Verify tests.

**Expected:** System can say why confidence is low and what data is needed next.

---

## Task M7: Snapshot/audit storage decision gate

**Objective:** Decide whether existing JSON/log tables are enough or `zone_strategy_snapshots` is needed.

**Files:**
- Modify: `docs/design/current-backend-api-db-ha-contract.md`
- Modify: `docs/design/zone-control-roadmap-and-data-model.md`
- Possibly modify: `custom_components/green_smart/db.py`

**Steps:**
1. Audit model output reproducibility with current tables.
2. If current tables are sufficient, document the mapping.
3. If not sufficient, write RED DB contract for `zone_strategy_snapshots` before adding schema.
4. Do not add table without contract and migration notes.

**Expected:** Snapshot persistence is deliberate, not accidental schema growth.

---

## Task M8: Virtual rehearsal evidence for model chain

**Objective:** Connect integrated model chain to pre-C20 virtual rehearsal evidence.

**Files:**
- Modify: rehearsal API/UI tests
- Modify: `custom_components/green_smart/zone_control_views.py`
- Modify: panel virtual rehearsal card

**Steps:**
1. RED test virtual rehearsal response includes:
   - `modelChainEvidence`
   - crop/environment/irrigation/device statuses
   - SafetyGuard gate result
2. Implement evidence using existing virtual HA entity harness.
3. Verify normal/strong-wind/rain/low-temp/sensor-fault/blocked/Fail Safe/recovery scenarios still pass.

**Expected:** C20 physical rehearsal gate can prove model chain behavior before real devices.

---

## Final verification for the whole track

Run:

```bash
pytest -q
node --check custom_components/green_smart/panel/green-smart-panel.js
python3 - <<'PY'
import json, re, pathlib
root=pathlib.Path('.')
manifest=json.loads((root/'custom_components/green_smart/manifest.json').read_text())
js=(root/'custom_components/green_smart/panel/green-smart-panel.js').read_text()
version=re.search(r'const VERSION = "([^"]+)"', js).group(1)
print({'manifest': manifest['version'], 'panel': version, 'match': manifest['version']==version})
PY
```

Before any physical device work, also run Home Assistant config check and virtual rehearsal evidence tests.
