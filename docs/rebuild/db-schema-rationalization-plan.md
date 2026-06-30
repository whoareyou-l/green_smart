# Green Smart DB/Schema Rationalization Plan

> 기준 버전: `v1.13.1`
> 리빌딩 단계: `RS-008 — RBAC-first target schema rewrite`
> 목적: legacy physical schema를 제품 방향으로 간주하지 않고, 새 Green Smart rebuild의 target schema를 RBAC-first / crop_cycle-first / adapter-boundary 방식으로 재정의한다.

## RS-008 RBAC-first target schema rewrite

User correction:

```text
기존 레거시는 참고용이고 방향성이 아니다.
DB 스키마, 테이블, 필드 등 모든 내용을 RBAC 방식으로 새롭게 작성한다.
```

Decision:

```text
legacy physical schema is adapter-only
canonical target tables use `gs_` prefix
crop_cycle is product/API canonical
crop_seasons is legacy adapter terminology only
No physical migration in RS-008
migration requires explicit user approval
```

What changed:

- `docs/master/03-database-schema.md` is now the RBAC-first target schema, not a physical DB baseline.
- Target tables use `gs_` prefix.
- RBAC is explicit through `gs_users`, `gs_roles`, `gs_permissions`, `gs_user_role_assignments`, `gs_role_permission_grants`, and `gs_audit_events`.
- Crop cycle is canonical through `gs_crop_cycles` and `gs_zone_crop_cycle_assignments`.
- Recommendation, approval, execution, safety, interlock, and failsafe are separate target tables.

## Non-goals for RS-008

| 항목 | 결정 |
|---|---|
| Prod DB migration | 금지 |
| Physical table rename | 금지 |
| Column rename/backfill | 금지 |
| Dual-write | 금지 |
| Route path migration | 금지 |
| 목표 산출물 | 문서 + 계약 테스트 |

## Legacy adapter boundary

| Target term | Adapter-only legacy source |
|---|---|
| `gs_crop_cycles`, `crop_cycle_id`, `currentCrop` | legacy crop season physical source |
| `gs_farms`, `farm_id` | legacy greenhouse/site physical source |
| `gs_user_role_assignments` | legacy role mapping physical source |
| `gs_device_entity_bindings` | legacy entity mapping physical source |

Rules:

1. Product/API/docs use target names.
2. Adapter implementation may read legacy names but must not leak them as product direction.
3. Any physical migration requires explicit user approval.
4. Migration plan must include backup, rollback SQL, rehearsal, verification, and cutover criteria.

## Future migration gate

A future migration slice may be proposed only after:

- [ ] RBAC-first target schema contract is accepted.
- [ ] Read-only adapters prove target DTO shape.
- [ ] Prod backup/restore rehearsal is documented.
- [ ] Migration SQL and rollback SQL are written.
- [ ] Dev rehearsal passes.
- [ ] User explicitly approves production migration.
