# VS-N001 RBAC/Admin Ownership Scaffold Implementation Plan

> **For Hermes:** Implement this plan task-by-task. This is the first from-scratch rebuild slice. Do not continue old RB-007/RB patch work. Ask the user only if role semantics or backend permission ownership conflicts with this plan.

**Goal:** Green Smart 새 리빌딩의 첫 slice로 RBAC/Admin ownership scaffold를 확정하여 이후 Crop cycle, Monitoring, Interlock 작업의 권한 기준을 안정화한다.

**Architecture:** 기존 runtime RBAC 구현은 reference/evidence로 사용한다. 첫 단계는 새 scaffold 계약과 문서 ownership를 고정하고, runtime code 변경은 하지 않는다. 이후 구현 단계에서 backend permission enforcement를 UI-only hiding보다 먼저 검증한다.

**Tech Stack:** Home Assistant custom integration, Python HomeAssistantView, MariaDB/aiomysql, Vanilla JS Web Component, pytest contract tests, Markdown master docs.

---

## Confirmed decision

Confirmed decision: first rebuild slice order

1. RBAC/Admin ownership scaffold
2. Crop cycle recording scaffold
3. Real-time monitoring read-only slice
4. Interlock/Safety core scaffold

RBAC/Admin comes first because:

```text
권한 ownership가 먼저 있어야 Crop records, monitoring scope, interlock approval이 흔들리지 않는다.
backend permission enforcement before UI-only hiding.
```

---

## Scope

### In scope

- Role ownership matrix: `admin`, `farm_owner`, `farm_staff`.
- Permission bucket mapping: `조회 / 기록 / 전략 / 실행 / 안전 / 고급설정`.
- Admin/System ownership: users/roles, HA mapping, diagnostics, secrets/config metadata, backup/audit.
- Backend enforcement requirement for write/execute/save/delete/ack/clear/apply.
- New scaffold target docs for future implementation.
- Contract tests that prevent UI-only RBAC.

### Out of scope

- No DB migration.
- No role behavior change without question.
- No prod stack change.
- No physical MQTT/device hookup.
- No existing RBAC runtime rewrite in this planning slice.
- No old RB-007 continuation.

---

## Files

- Create: `docs/rebuild/vs-n001-rbac-admin-ownership-scaffold.md`
- Modify: `docs/rebuild/target-architecture.md`
- Modify: `docs/master/01-cba-ui-ux-spec.md` if UI ownership markers are missing.
- Modify: `docs/master/02-interface-spec.md` if auth/permission route ownership markers are missing.
- Modify: `docs/master/03-database-schema.md` if RBAC table ownership/migration gate markers are missing.
- Modify: `docs/master/04-workflow-diagrams.md` if permission flow is missing.
- Modify: `docs/master/05-ml-interlock-failsafe-spec.md` if approval/interlock role boundary is missing.
- Test: `tests/test_vs_n001_rbac_admin_ownership_scaffold_contract.py`

---

## Task 1 — Write RED contract

**Objective:** Make the first slice fail until RBAC/Admin ownership scaffold is documented.

**Steps:**
1. Create `tests/test_vs_n001_rbac_admin_ownership_scaffold_contract.py`.
2. Assert the scaffold doc exists.
3. Assert it contains role matrix, permission bucket matrix, backend enforcement, Admin/System ownership, question gates, and non-goals.
4. Run: `pytest -q tests/test_vs_n001_rbac_admin_ownership_scaffold_contract.py`.
5. Expected: FAIL because scaffold doc does not exist yet.

---

## Task 2 — Create scaffold doc

**Objective:** Document VS-N001 in enough detail for future implementation without guessing.

**Required sections:**
- Direction and non-goals
- Role ownership matrix
- Permission bucket matrix
- Admin/System ownership matrix
- Backend enforcement contract
- UI display state contract
- DB/migration boundary
- Interface/API ownership
- Question gate
- Next implementation tasks

**Verification:**

```bash
pytest -q tests/test_vs_n001_rbac_admin_ownership_scaffold_contract.py
```

Expected: PASS.

---

## Task 3 — Link VS-N001 to target architecture and master docs

**Objective:** Make VS-N001 discoverable from the target architecture and master docs.

**Steps:**
1. Add VS-N001 reference to `docs/rebuild/target-architecture.md`.
2. Add RBAC/Admin scaffold link to relevant master docs if missing.
3. Keep older R1/RBAC docs as reference, not active continuation.

**Verification:**

```bash
pytest -q tests/test_rebuild_slice_order_contract.py tests/test_vs_n001_rbac_admin_ownership_scaffold_contract.py
```

---

## Task 4 — Ask only if needed

Ask the user only if one of these is encountered:

1. Whether `farm_owner` can manage `farm_staff` role assignment.
2. Whether role mapping stays HA-user-ID based or moves to Green Smart-owned users.
3. Whether any write/execute permission should be delegated to `farm_staff` beyond current baseline.
4. Whether DB physical RBAC tables should be migrated.

Default until asked:

```text
admin owns role mapping and system config.
farm_owner owns approvals/strategy/high-impact operations.
farm_staff owns daily records and allowed routine actions.
HA user ID remains the identity source.
No DB migration.
```

---

## Definition of Done

- [ ] VS-N001 scaffold doc exists.
- [ ] Contract test passes.
- [ ] Target architecture links to VS-N001.
- [ ] No runtime code changed unless explicitly required by a later task.
- [ ] Next step is either a single clarify question or RED implementation contract.
