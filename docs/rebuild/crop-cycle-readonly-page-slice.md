# RS-016 Crop Cycle Read-only Page Slice

> 기준 버전: `v1.15.45`
> Status: active crop cycle read-only UI slice
> 목적: MariaDB-backed home context에서 들어온 `crop_cycle/currentCrop` 데이터를 작물상태 / 생육목표 화면 안에 읽기 전용으로 명확히 표시한다.

## 0. Boundary decision

```text
currentCrop.crop_cycle_id
crop_cycle/currentCrop
작물상태 / 생육목표
No production route removal in RS-016
No DB migration in RS-016
No write/mutation in RS-016
No real-device hookup in RS-016
```

RS-016은 frontend read-only 표시 slice다. 이미 연결된 protected API와 async context loading을 활용하지만, crop cycle 생성/수정/삭제나 physical schema rename은 하지 않는다.

---

## 1. UI contract

`작물상태`와 `생육목표` 구역 패널은 다음 marker를 가진 읽기 전용 카드를 렌더링한다.

```text
data-crop-cycle-readonly-card
data-crop-cycle-stage
data-crop-cycle-id
data-active-crop-cycle-id
data-current-crop-type
data-current-crop-variety
data-current-crop-plant-date
data-current-crop-growth-stage
data-current-crop-readonly-note
```

---

## 2. Source DTO

The UI consumes normalized target DTO fields:

```text
currentCrop.crop_cycle_id
currentCrop.crop_type
currentCrop.crop_label_ko
currentCrop.growth_stage
currentCrop.variety
currentCrop.plant_date
currentCrop.demolish_date
```

Legacy evidence may stay under `compatibilityAliases`, but the rendered product UI should use `crop_cycle/currentCrop` names.

---

## 3. Non-goals

```text
No production route removal in RS-016
No DB migration in RS-016
No write/mutation in RS-016
No real-device hookup in RS-016
No crop cycle edit/delete buttons in RS-016
```

---

## 4. Completion criteria

- [x] Frontend adapter preserves crop cycle detail fields from API context.
- [x] Rebuild panel renders read-only crop cycle cards on `작물상태` and `생육목표`.
- [x] Cards expose stable `data-*` markers for contract tests and later QA.
- [x] No write/mutation/execute UI is introduced.
