# R7-107 Greenhouse detail panel DB-field alignment

Version: v1.15.38
Status: prod verified

## Scope

The greenhouse info CDA split modal detail panel was still structured around legacy/operator fields such as `approvalScope` and generic `note`. After the dedicated `green_smart` schema was introduced, the selected greenhouse detail panel must reflect the actual DB-backed greenhouse fields.

## Detail panel field order

`선택 항목 상세` for `greenhouse-info` now uses the DB-aligned field order:

1. `name` — 온실명
2. `location` — 위치
3. `operatingStatus` — 운영상태
4. `installType` — 설치유형
5. `timezone` — 기본 시간대
6. `status` — 상태
7. `createdAt` — 생성시각
8. `updatedAt` — 수정시각
9. `creationReason` — 생성 사유

`approvalScope` is no longer rendered in greenhouse detail fields.

## List panel alignment

The greenhouse list columns now show:

```text
온실명 / 위치 / 설치유형 / 운영상태 / 상태
```

instead of the stale `승인범위` column.

## Verification

- Focused greenhouse CDA modal contracts: 17 passed
- Full suite: 1489 passed
- JS syntax check: pass
- Python compile check: pass
