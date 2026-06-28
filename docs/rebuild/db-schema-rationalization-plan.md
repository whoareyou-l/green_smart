# Green Smart DB/Schema Rationalization Plan

> 기준 버전: `v1.11.10`
> 리빌딩 단계: `R4 — DB/schema rationalization plan`
> 목적: 실제 DB migration 없이 현재 물리 schema를 보존하면서, 리빌딩 문서/API에서 사용할 naming alias, scope key, future migration gate를 고정한다.

---

## 1. R4 Non-goals

R4는 DB 변경 단계가 아니다.

| 항목 | R4 결정 |
|---|---|
| 실제 DB migration | 금지 |
| `crop_seasons` table rename | 금지 |
| `crop_season_id` column rename | 금지 |
| `season_id` record column rename | 금지 |
| foreign key/index 변경 | 금지 |
| seed/data backfill | 금지 |
| prod DB 접속/변경 | 금지 |
| 목표 산출물 | 문서 + 계약 테스트 + 버전 릴리즈 |

---

## 2. Current physical schema baseline

현재 `custom_components/green_smart/db.py` bootstrap 기준 물리 schema는 아래 이름을 사용한다.

| Physical name | 위치 | R4 판단 |
|---|---|---|
| `crop_seasons` | 작기 물리 테이블 | 유지. 리빌딩 문서/API에서는 `crop_cycle` alias 제공 |
| `crop_seasons.id` | 작기 primary key | 유지. 외부 의미상 `crop_cycle_id` alias |
| `crop_seasons.greenhouse_id` | farm/site 식별의 기존 컬럼 | 유지. R4 문서에서는 `farm_id` alias와 compatibility 관계 명시 |
| `growth_surveys.season_id` | 생육조사 작기 참조 | 유지. 의미상 `crop_cycle_id` |
| `pest_surveys.season_id` | 병해충 예찰 작기 참조 | 유지. 의미상 `crop_cycle_id` |
| `control_records.season_id` | 방제 기록 작기 참조 | 유지. 의미상 `crop_cycle_id` |
| `zone_control_settings.crop_season_id` | 제어 설정 scope | 유지. 문서/API alias는 `crop_cycle_id` |
| `zone_interlock_settings.crop_season_id` | 인터록 설정 scope | 유지. 문서/API alias는 `crop_cycle_id` |
| `zone_control_modes.crop_season_id` | 제어 모드 scope | 유지. 문서/API alias는 `crop_cycle_id` |
| `zone_final_control_targets.crop_season_id` | final target scope | 유지. 문서/API alias는 `crop_cycle_id` |
| `ai_zone_control_outputs.crop_season_id` | AI output scope | 유지. 문서/API alias는 `crop_cycle_id` |

---

## 3. Canonical vocabulary

R4 이후 문서/신규 API DTO는 아래 용어를 사용한다.

| Concept | Canonical product term | Physical compatibility term | 설명 |
|---|---|---|---|
| 재배 주기/작기 | `crop_cycle` | `crop_season` | 사용자/제품 문서에서는 crop cycle, 기존 DB/API path는 crop season 유지 |
| 재배 주기 ID | `crop_cycle_id` | `crop_season_id`, `season_id` | DTO에서는 alias 제공 가능. 물리 컬럼은 유지 |
| 농장/온실 scope | `farm_id` | `greenhouse_id` | 현재 단일/기본 farm은 greenhouse_id=1과 호환 |
| 구역 | `zone_id` | `zone_id` | 유지 |
| 제어 domain | `domain` | `domain` | `environment`, `irrigation`, `device`, `safety` |

문서 작성 규칙:

```text
사용자 설명/리빌딩 설계: crop_cycle_id
기존 route path/DB physical name 설명: crop_season_id 또는 season_id
둘이 연결되는 곳: crop_cycle_id alias of crop_season_id
```

---

## 4. Scope key rationalization

현재 물리 scope:

```text
farm_id + crop_season_id + zone_id + domain
```

R4 canonical alias scope:

```text
farm_id + crop_cycle_id + zone_id + domain
```

Compatibility mapping:

| Canonical | Current physical | Notes |
|---|---|---|
| `farm_id` | `farm_id` on control tables, `greenhouse_id` on `crop_seasons` | `greenhouse_id` is legacy farm/site column |
| `crop_cycle_id` | `crop_season_id` on control tables, `season_id` on crop record tables, `crop_seasons.id` on crop table | no rename until explicit migration approval |
| `zone_id` | `zone_id` | stable |
| `domain` | `domain` | stable |

---

## 5. API compatibility policy

기존 route path는 유지한다.

```text
/api/green_smart/crop/seasons
/api/green_smart/crop/seasons/{season_id}/growth
/api/green_smart/crop/seasons/{season_id}/pest
/api/green_smart/crop/seasons/{season_id}/control
/api/green_smart/zones/control-settings?crop_season_id=...
/api/green_smart/zones/final-targets?crop_season_id=...
```

신규 DTO/문서 alias policy:

1. 기존 request는 `crop_season_id`를 계속 받는다.
2. 신규 service/repository DTO는 `crop_cycle_id`를 표준 필드로 사용해도 된다.
3. adapter layer는 `crop_cycle_id`와 `crop_season_id`를 normalize할 수 있다.
4. 둘이 동시에 주어지고 값이 다르면 `400 alias_conflict`를 반환해야 한다.
5. response는 migration 전까지 기존 field를 유지하고, 신규 alias는 additive field로만 추가한다.
6. path segment `{season_id}`는 실제 route compatibility 때문에 유지한다.

Alias normalization 의사코드:

```python
def normalize_crop_cycle_id(payload):
    crop_cycle_id = payload.get("crop_cycle_id")
    crop_season_id = payload.get("crop_season_id") or payload.get("season_id")
    if crop_cycle_id and crop_season_id and int(crop_cycle_id) != int(crop_season_id):
        raise AliasConflict("crop_cycle_id and crop_season_id differ")
    return int(crop_cycle_id or crop_season_id)
```

---

## 6. Migration gate

실제 migration은 별도 승인 전까지 금지한다. migration을 논의할 수 있는 최소 조건은 아래 전부다.

- [ ] R0~R4 baseline release 완료
- [ ] RB-006A crop read-only service/repo boundary 완료
- [ ] RB-006B/RB-006C crop read/write service boundary 완료
- [ ] route contract가 `crop_cycle_id` additive alias를 충분히 검증
- [ ] prod DB backup/restore rehearsal 완료
- [ ] migration SQL + rollback SQL 작성
- [ ] dev stack에서 migration rehearsal 완료
- [ ] virtual HA/device smoke 완료
- [ ] 사용자 명시 승인

R4 migration 금지 문구:

```text
No physical rename from crop_seasons/crop_season_id/season_id to crop_cycles/crop_cycle_id before explicit migration approval.
```

---

## 7. Future migration phases

실제 migration이 승인되면 아래 순서로만 진행한다.

| Phase | 내용 | Prod 위험 |
|---|---|---|
| M0 | alias DTO/service normalization only | 낮음 |
| M1 | additive columns/views if needed | 중간 |
| M2 | dual-write compatibility | 중간~높음 |
| M3 | backfill + verification | 높음 |
| M4 | read switch | 높음 |
| M5 | old column/table deprecation | 매우 높음, 별도 승인 |

R4에서는 M0도 구현하지 않는다. 단지 future policy로 문서화한다.

---

## 8. Master DB document correction policy

`docs/master/03-database-schema.md`는 제품 목표 모델을 설명하므로 `crop_cycles` 용어를 사용할 수 있다. 단, R4 이후 반드시 아래 compatibility note를 포함해야 한다.

```text
Implementation compatibility: current physical DB keeps crop_seasons/crop_season_id/season_id.
crop_cycle/crop_cycle_id is the canonical product/API alias and future migration target.
```

문서별 사용 규칙:

| 문서 | 용어 규칙 |
|---|---|
| `docs/master/03-database-schema.md` | 목표 모델은 `crop_cycles`, compatibility note는 `crop_seasons` |
| `docs/rebuild/current-state-inventory.md` | physical schema 중심, `crop_seasons` 명시 |
| `docs/rebuild/db-schema-rationalization-plan.md` | alias/migration gate 기준 |
| API/backend contract 문서 | route compatibility와 additive alias 둘 다 명시 |
| UI 문서 | 사용자에게는 “작기/재배 주기” 중심, DB 컬럼명 노출 금지 |

---

## 9. Repository/service naming policy after R4

R3 이후 service/repository는 아래 이름을 권장한다.

| Layer | 권장 이름 | 내부 physical access |
|---|---|---|
| service DTO | `crop_cycle_id` | normalized from `crop_season_id`/`season_id` |
| repository function | `fetch_crop_cycle_by_id` 또는 `fetch_crop_season_by_id` 둘 다 가능하되 docstring에 alias 명시 | `crop_seasons` table |
| route adapter | existing `{season_id}` and `crop_season_id` accepted | normalized to service DTO |
| UI state | `activeSeasonId`는 당분간 유지 가능 | future `activeCropCycleId`는 별도 UI slice에서만 |

---

## 10. Abort rules

즉시 중단하고 사용자 승인/재계획이 필요한 경우:

1. `CREATE TABLE crop_cycles`가 필요해지는 경우.
2. `ALTER TABLE ... RENAME`이 필요해지는 경우.
3. `crop_seasons` 또는 `crop_season_id` 제거가 필요해지는 경우.
4. prod DB 접속/수정이 필요한 경우.
5. response에서 기존 `crop_season_id`/`season_id` field 제거가 필요한 경우.
6. route path의 `{season_id}`를 `{crop_cycle_id}`로 바꾸려는 경우.
7. migration/backfill/dual-write가 필요한 경우.

---

## 11. R4 완료 기준

- [x] current physical schema naming 문서화
- [x] canonical vocabulary 문서화
- [x] `crop_cycle_id` ↔ `crop_season_id`/`season_id` alias policy 문서화
- [x] scope key rationalization 문서화
- [x] API compatibility policy 문서화
- [x] migration gate 문서화
- [x] master DB document compatibility note 연결
- [x] R4 contract test로 회귀 방어
