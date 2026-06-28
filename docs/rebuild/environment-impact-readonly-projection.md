# RS-019 Environment Impact Read-only Projection

> 기준 버전: `v1.12.23`
> Status: environment impact read-only projection
> 목적: `currentCropAssignment + equipmentProfile + dataAvailability`를 기반으로 `영향지도` 화면에 구역별 환경·관수·장치 영향 상태를 읽기 전용 projection으로 표시한다.

## 0. Boundary decision

```text
environmentImpactProjection
currentCropAssignment + equipmentProfile + dataAvailability → environmentImpactProjection
영향지도
impactState
impactFocus
impactFactors
freshnessLabel
No production route removal in RS-019
No DB migration in RS-019
No write/mutation in RS-019
No real-device hookup in RS-019
```

RS-019는 영향 표시용 read-only projection slice다. 환경값 수정, 저장, 실행, DB migration, 실제 장치 연결을 포함하지 않는다.

---

## 1. DTO shape

```json
{
  "environmentImpactProjection": {
    "impactState": "ready",
    "impactFocus": "구역 장비와 데이터 신선도 기준 영향 확인",
    "impactFactors": ["천창", "차광막"],
    "freshnessLabel": "3분 전 갱신",
    "sourceAssignment": { "assignmentState": "assigned" },
    "dataAvailability": { "state": "ok" },
    "readOnly": true,
    "executionEnabled": false
  }
}
```

---

## 2. UI markers

```text
data-environment-impact-projection-card
data-environment-impact-state
data-environment-impact-focus
data-environment-impact-factors
data-environment-impact-freshness
data-environment-impact-readonly
data-environment-impact-execution-enabled
```

`environmentImpactProjection`은 `영향지도` stage에서만 렌더링한다.

---

## 3. Non-goals

```text
No production route removal in RS-019
No DB migration in RS-019
No write/mutation in RS-019
No real-device hookup in RS-019
No environment impact edit/save/delete controls in RS-019
```

---

## 4. Completion criteria

- [x] Service mapper emits `environmentImpactProjection` from assignment/equipment/data availability.
- [x] Frontend adapter normalizes `environmentImpactProjection` from API or fallback context.
- [x] Rebuild panel renders the projection only in `영향지도`.
- [x] No mutation/execution affordances are introduced.
