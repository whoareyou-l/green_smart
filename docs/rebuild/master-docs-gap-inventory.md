# Green Smart Master Docs Gap Inventory

> 기준 버전: `v1.15.36`
> 목적: 5대 master docs를 `from-scratch rebuild 기준`으로 다시 정렬하기 전에 현재 문서의 충분한 점/부족한 점/질문 gate를 고정한다.

---

## 1. Direction baseline

현재 리빌딩 기준은 아래 순서다.

```text
기존 RB 산출물은 reference/evidence로만 사용
새 master docs → 새 target architecture → 새 vertical slice scaffold
기존 코드 수정은 hotfix와 호환 adapter로만 제한
```

따라서 기존 RB-001~RB-006은 다음 작업 목록이 아니라 evidence inventory다. RB-007 이후는 새 target architecture 승인 전 진행하지 않는다.

---

## 2. Master docs status

| 문서 | 현재 상태 | from-scratch rebuild gap | 다음 조치 |
|---|---|---|---|
| `01-cba-ui-ux-spec.md` | CBA 화면 기획서 존재. 공통 부품/복합 모듈/페이지 기준이 있다. | 기존 구현 화면과 새 scaffold 화면을 구분하는 문구가 부족하다. | 기존 UI는 reference, 새 UI grammar는 target으로 분리한다. |
| `02-interface-spec.md` | 통신 명세서 존재. Frontend service/backend/MQTT/HA 경계를 다룬다. | 기존 `/api/green_smart/*` route compatibility와 새 adapter layer의 관계를 더 명확히 해야 한다. | route compatibility adapter policy를 target architecture와 연결한다. |
| `03-database-schema.md` | DB 구상도 존재. RBAC/장비/작기/센서/로그 축이 있다. | physical table 유지와 logical alias/crop_cycle target의 migration gate를 더 선명하게 해야 한다. | migration 없이 logical target을 먼저 정의한다. |
| `04-workflow-diagrams.md` | 통합 시나리오 흐름도 존재. 센서/수동제어/비상 흐름을 다룬다. | 기존 구현 workflow와 새 vertical rebuild workflow의 시작점을 구분해야 한다. | first slice 선택 전 workflow 후보를 reference로 둔다. |
| `05-ml-interlock-failsafe-spec.md` | 로직 알고리즘 및 예외처리 명세서 존재. VPD/PID/Safety/Fail-Safe가 있다. | AI/model보다 Safety/Interlock/Fail Safe 우선순위를 새 architecture gate와 연결해야 한다. | Safety core scaffold 후보와 연결한다. |

---

## 3. Existing RB evidence map

| 기존 산출물 | reference/evidence | gap |
|---|---|---|
| RB-001 Admin/System shell | Admin/System ownership가 필요하다는 증거 | 새 Admin/System target page grammar는 아직 확정 전 |
| RB-002 Panel API client adapter | `hass.callApi` 직접 호출을 줄여야 한다는 증거 | 새 frontend service tree는 아직 확정 전 |
| RB-003/RB-004 Crop render/modal extraction | Crop UI가 monolith hotspot이라는 증거 | 새 UI scaffold가 아니라 기존 panel helper 분리에 머물렀음 |
| RB-005 Safety/Execution UI proximity | 실행 UI 근처 안전 요약이 필요하다는 증거 | Safety core architecture 자체는 아직 새로 정의해야 함 |
| RB-006 Crop service/repo split | backend service/repo boundary가 필요하다는 증거 | route adapter와 새 api/service/repo tree가 아직 target으로 확정 전 |

---

## 4. README correction

`docs/master/README.md`의 `현재 진행 수직 슬라이드 — VS-003` 표현은 active work로 오해될 수 있다.

Required correction:

```text
active VS-003 진행 중 표현은 historical/reference로 격하
Historical reference — VS-003
첫 vertical rebuild slice는 Stage 3에서 사용자 질문 후 선택
```

---

## 5. Question gate

Stage 1에서는 질문하지 않는다. 문서 방향 정렬은 사용자의 방금 지시로 충분히 결정됐다.

다음 항목은 반드시 질문한다.

| 단계 | 질문 필요 여부 | 이유 |
|---|---|---|
| 첫 vertical rebuild slice 선택 | 필요 | 제품 방향과 구현 순서를 바꿈 — 첫 vertical rebuild slice 선택은 사용자 질문 필요 |
| DB physical migration | 필요 | 데이터 손실/호환성 영향 |
| 실제 장비/MQTT 연결 | 필요 | 안전/현장 장비 영향 |
| prod stack cutover | 필요 | 운영 장애 가능성 |
| RBAC 역할 정책 충돌 | 필요 | 농장주/직원 UX와 backend 권한 영향 |

---

## 6. Target architecture linkage

이 inventory는 `docs/rebuild/target-architecture.md`와 연결된다.

```text
Master Docs Gap Inventory
→ target architecture
→ first vertical rebuild slice selection
→ RED contract
→ new scaffold implementation
```

새 master docs → 새 target architecture → 새 vertical slice scaffold 순서를 유지한다.

---

## 7. Confirmed first slice order

Confirmed decision: first rebuild slice order

1. RBAC/Admin ownership scaffold
2. Crop cycle recording scaffold
3. Real-time monitoring read-only slice
4. Interlock/Safety core scaffold

Reason: RBAC/Admin ownership comes first so role ownership and backend permission enforcement exist before Crop records, monitoring scope, and interlock approval.

## 8. Immediate next actions

1. README active VS-003 표현을 historical reference로 격하한다.
2. `tests/test_rebuild_master_docs_gap_contract.py`를 통과시킨다.
3. Stage 2에서 `target-architecture.md`를 실제 구현 가능한 수준으로 확장한다.
4. Stage 3 decision을 기준으로 `VS-N001 RBAC/Admin ownership scaffold`를 계획한다.
