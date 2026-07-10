# RS-018 Growth Target Read-only Projection

> 기준 버전: `v1.15.08`
> Status: growth target read-only projection
> 목적: `currentCropAssignment`를 기반으로 `생육목표` 화면에 구역별 목표 상태를 읽기 전용 projection으로 표시한다.

## 0. Boundary decision

```text
growthTargetProjection
currentCropAssignment → growthTargetProjection
생육목표
targetStageLabel
targetFocus
targetBasis
No production route removal in RS-018
No DB migration in RS-018
No write/mutation in RS-018
No real-device hookup in RS-018
```

RS-018은 목표 표시용 read-only projection slice다. 목표 수정, 저장, 실행, DB migration, 실제 장치 연결을 포함하지 않는다.

---

## 1. DTO shape

```json
{
  "growthTargetProjection": {
    "projectionState": "ready",
    "targetStageLabel": "정식",
    "targetFocus": "활착 안정",
    "targetBasis": {
      "crop_cycle_id": 18,
      "crop_type": "lettuce",
      "growth_stage": "정식"
    },
    "sourceAssignment": { "assignmentState": "assigned" },
    "readOnly": true,
    "executionEnabled": false
  }
}
```

---

## 2. UI markers

```text
data-growth-target-projection-card
data-growth-target-projection-state
data-growth-target-stage-label
data-growth-target-focus
data-growth-target-basis-crop-cycle-id
data-growth-target-readonly
data-growth-target-execution-enabled
```

`growthTargetProjection`은 `생육목표` stage에서만 렌더링한다.

---

## 3. Non-goals

```text
No production route removal in RS-018
No DB migration in RS-018
No write/mutation in RS-018
No real-device hookup in RS-018
No growth target edit/save/delete controls in RS-018
```

---

## 4. Completion criteria

- [x] Service mapper emits `growthTargetProjection` from `currentCropAssignment`.
- [x] Frontend adapter normalizes `growthTargetProjection` from API or fallback context.
- [x] Rebuild panel renders the projection only in `생육목표`.
- [x] No mutation/execution affordances are introduced.
