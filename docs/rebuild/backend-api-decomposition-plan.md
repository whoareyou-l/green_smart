# Green Smart Backend/API Decomposition Plan

> 기준 버전: `v1.15.56`
> 리빌딩 단계: `R3 — Backend/API decomposition plan`
> 목적: `crop_views.py`와 `zone_control_views.py`를 즉시 분리하지 않고, 기존 HTTP route compatibility를 유지하는 adapter-first backend 구조, service/repository 경계, 첫 extraction slice를 문서/계약으로 고정한다.

---

## 1. R3 Non-goals

R3는 backend 구현 분해 단계가 아니다.

| 항목 | R3 결정 |
|---|---|
| `crop_views.py` 대규모 split | 금지 |
| `zone_control_views.py` 대규모 split | 금지 |
| HTTP route path 변경 | 금지 |
| DB migration | 금지 |
| scheduler 실행 방식 변경 | 금지 |
| prod stack 변경 | 금지 |
| 신규 기능 구현 | 금지 |
| 목표 산출물 | 문서 + 계약 테스트 + 버전 릴리즈 |

---

## 2. 현재 Backend baseline

| 파일 | 현재 라인 수 | route/view class 수 | R3 판단 |
|---|---:|---:|---|
| `custom_components/green_smart/crop_views.py` | 4,946 | 24 | 작기/생육/병해충/방제/작물 모델/Center 정책이 혼재. RB-006 전까지 monolith 유지 |
| `custom_components/green_smart/zone_control_views.py` | 2,737 | 36 | sensor/environment/irrigation/device/safety/execution/rehearsal/log가 혼재. RB-007 전까지 monolith 유지 |
| `custom_components/green_smart/weather_views.py` | 392 | 10 | weather/pesticide adapter. R3에서 target boundary만 문서화 |
| `custom_components/green_smart/central_views.py` | 408 | 7 | Central proxy/adapter. scheduler와 crop/env sync helper 포함 |
| `custom_components/green_smart/rbac.py` | 157 | 1 | auth/me baseline. R3 이후 `services/rbac_service.py` 후보 |
| `custom_components/green_smart/db.py` | 779 | 0 | schema bootstrap + query helper. R4 전까지 schema migration 금지 |
| `custom_components/green_smart/__init__.py` | 463 | 0 | integration setup, view registration, schedulers 혼재. R3 이후 registration grouping 후보 |

---

## 3. 목표 backend 구조

최종 목표 구조는 아래와 같다.

```text
custom_components/green_smart/
  api_views/
    __init__.py
    crop.py
    environment.py
    irrigation.py
    device.py
    safety.py
    admin.py
    weather.py
    central.py

  services/
    crop_service.py
    growth_report_service.py
    crop_policy_service.py
    strategy_service.py
    environment_service.py
    irrigation_service.py
    device_service.py
    safety_service.py
    rbac_service.py
    notification_service.py

  repositories/
    crop_repo.py
    growth_repo.py
    pest_repo.py
    control_treatment_repo.py
    zone_control_repo.py
    device_repo.py
    safety_repo.py
    admin_repo.py
    sensor_repo.py

  schedulers/
    safety_guard_scheduler.py
    growth_report_scheduler.py
    crop_policy_scheduler.py
    central_sync_scheduler.py
```

명시적 target path 목록:

```text
api_views/crop.py
api_views/environment.py
api_views/irrigation.py
api_views/device.py
api_views/safety.py
api_views/admin.py
services/crop_service.py
services/strategy_service.py
services/safety_service.py
services/rbac_service.py
repositories/crop_repo.py
repositories/zone_control_repo.py
repositories/device_repo.py
repositories/safety_repo.py
schedulers/safety_guard_scheduler.py
```

---

## 4. Route compatibility contract

기존 route path는 외부 계약이다. 분해 후에도 아래 원칙을 지킨다.

1. `/api/green_smart/*` path는 변경하지 않는다.
2. `/api/v1/sensors/current` compatibility route를 유지한다.
3. `HomeAssistantView.url` 값은 기존과 동일하게 유지한다.
4. response JSON shape는 임의 변경하지 않는다.
5. 기존 HTTP method semantics를 유지한다.
6. 새 파일로 옮길 때도 기존 view class name 또는 compatibility alias를 유지한다.
7. `__init__.py` registration은 한 번에 바꾸지 않고 domain별 `register_*_views(hass)` helper로 점진 이동한다.

R3에서 route path를 바꾸면 안 되는 대표 route:

```text
/api/green_smart/crop/seasons
/api/green_smart/crop/seasons/{season_id}/growth
/api/green_smart/crop/seasons/{season_id}/growth-report
/api/green_smart/crop/seasons/{season_id}/stage-diagnosis
/api/green_smart/zones/control-settings
/api/green_smart/zones/final-targets
/api/green_smart/zones/execute-final-targets
/api/green_smart/zones/safety-guard-watchdog
/api/green_smart/zones/device-entity-mappings
/api/green_smart/environment/strategy-preview
/api/green_smart/irrigation/strategy-preview
/api/green_smart/auth/me
```

---

## 5. Layer responsibility

| Layer | 책임 | 금지 |
|---|---|---|
| `api_views/*` | `HomeAssistantView`, request parsing, permission check call, service call, `web.json_response` | SQL 문자열 직접 보유 금지, business decision 직접 보유 금지 |
| `services/*` | domain validation, orchestration, permission decision, response DTO assembly | raw SQL 직접 작성 금지, HA request object 직접 의존 금지 |
| `repositories/*` | DB query/fetch/insert/update/delete, transaction boundary | UI wording/business policy 직접 보유 금지 |
| `schedulers/*` | HA time interval wiring, scheduler tick orchestration | SQL inline 직접 보유 금지, route response shape 직접 보유 금지 |
| `db.py` | pool/query/schema bootstrap helper | domain-specific repository logic 신규 추가 금지 |
| `rbac.py` | compatibility auth/me view | permission matrix는 service로 점진 이동 |

---

## 6. Adapter-first extraction pattern

실제 분해 slice는 아래 순서로만 진행한다.

### Step A — No-op wrapper 추가

```python
# services/crop_service.py
async def list_crop_seasons(hass, *, farm_id: int = 1) -> list[dict]:
    from ..crop_views import _list_crop_seasons_current_impl
    return await _list_crop_seasons_current_impl(hass, farm_id=farm_id)
```

### Step B — View에서 service 호출로 교체

```python
class CropSeasonsView(HomeAssistantView):
    url = "/api/green_smart/crop/seasons"

    async def get(self, request):
        hass = request.app["hass"]
        data = await list_crop_seasons(hass, farm_id=1)
        return web.json_response(data)
```

### Step C — DB query를 repository로 이동

```python
# repositories/crop_repo.py
async def fetch_active_crop_seasons(hass, *, farm_id: int = 1) -> list[dict]:
    return await fetchall(hass, "SELECT ...", (farm_id,))
```

### Step D — Old helper compatibility 유지

기존 테스트/스케줄러/다른 helper가 참조하는 internal function은 바로 삭제하지 않고 alias로 유지한다.

---

## 7. First backend extraction decision

첫 backend extraction은 실행/장비/인터록이 아니라 **read-only crop service/repo boundary**부터 진행한다.

| 후보 | 결정 | 이유 |
|---|---|---|
| `zones/execute-final-targets` | 보류 | 실제 장비 실행·SafetyGuard·state verification이 연결되어 위험 높음 |
| `environment/strategy-preview` | 보류 | AI/final target 저장과 연결되어 중간 위험 |
| `irrigation/strategy-preview` | 보류 | 관수 실행과 연결되어 중간 위험 |
| `device-entity-mappings` | 보류 | 실제 entity mapping 변경은 장비 제어 영향 |
| `crop/seasons` read-only | **RB-006A 우선** | route path 유지가 쉽고 read-only부터 service/repo 경계를 검증 가능 |
| `auth/me` | 보조 후보 | 작지만 RBAC enforcement 전면화 전 기준 확인 필요 |

R3 기준 첫 backend slice는 다음과 같이 확정한다.

```text
RB-006A Crop read-only service/repo boundary
```

RB-006A는 `GET /api/green_smart/crop/seasons` 또는 작물 요약 read-only route만 대상으로 하며, create/update/delete/modal 저장 경로는 건드리지 않는다.

### RB-006A completion note

`v1.12.0`에서 Crop read-only service/repo boundary baseline이 추가되었다.

```text
custom_components/green_smart/services/crop_service.py
custom_components/green_smart/repositories/crop_repo.py
```

완료 범위:

- `GET /api/green_smart/crop/seasons` route path 변경 없음.
- response shape 변경 없음: legacy keys `cropType`, `plantDate`, `demolishDate`, `zoneName`, `zoneId` 등을 유지한다.
- `repositories/crop_repo.py`가 crop seasons SELECT SQL을 소유한다.
- `services/crop_service.py`가 read actor DTO와 `view_crop_records` permission smoke를 소유한다.
- crop create/update/delete 변경 없음.
- DB migration 없음.

---

## 8. Planned backend slices

| Slice | 목적 | 허용 파일 | 금지 |
|---|---|---|---|
| RB-006A | Crop read-only service/repo boundary | `services/crop_service.py`, `repositories/crop_repo.py`, targeted crop GET view, tests/docs | crop create/update/delete 변경 |
| RB-006B | Crop record read-only repositories | growth/pest/control read GET helpers | write/delete modal 경로 변경 |
| RB-006C | Crop write service boundary | crop write paths | DB schema migration |
| RB-006D | Crop model/report service boundary | growth report/model read helpers | Center sync scheduler 변경 |
| RB-007A | Zone control read-only repo/service | control settings/final targets GET | execute-final-targets 변경 |
| RB-007B | SafetyGuard service boundary | watchdog/events read paths | actual execution semantics 변경 |
| RB-007C | Execution service boundary | execute-final-targets | virtual rehearsal+HA config check 전 prod 변경 |
| RB-007D | Environment/Irrigation/Device service split | domain-specific settings/strategy | route path/response shape 변경 |

### RB-006B Crop record read-only repositories completion note

`v1.12.0`에서 Crop record read-only repositories baseline이 추가되었다.

완료 범위:

- `growth/pest/control read GET helpers`를 `services/crop_service.py`와 `repositories/crop_repo.py`로 확장한다.
- `list_growth_records`, `list_pest_records`, `list_control_records`가 legacy response shape를 유지한다.
- `GET /api/green_smart/crop/seasons/{season_id}/growth` route path 변경 없음.
- `GET /api/green_smart/crop/seasons/{season_id}/pest` route path 변경 없음.
- `GET /api/green_smart/crop/seasons/{season_id}/control` route path 변경 없음.
- `write/delete modal 경로 변경 없음`.
- `response shape 변경 없음`.
- `DB migration 없음`.

### RB-006C Crop season write service/repo boundary completion note

`v1.12.0`에서 Crop season write service/repo boundary baseline이 추가되었다.

완료 범위:

- `create/update/delete/demolish write helpers`를 `services/crop_service.py`와 `repositories/crop_repo.py`로 확장한다.
- `create_crop_season`, `update_crop_season`, `demolish_crop_season`, `hard_delete_crop_season`가 legacy response shape를 유지한다.
- `POST /api/green_smart/crop/seasons` route path 변경 없음.
- `PATCH /api/green_smart/crop/seasons/{season_id}` route path 변경 없음.
- `DELETE /api/green_smart/crop/seasons/{season_id}` route path 변경 없음.
- `PATCH /api/green_smart/crop/seasons/{season_id}/demolish` route path 변경 없음.
- `growth/pest/control write 경로 변경 없음`.
- `response shape 변경 없음`.
- `DB migration 없음`.

### RB-006D Crop model/report service boundary completion note

`v1.12.0`에서 Crop model/report service boundary baseline이 추가되었다.

완료 범위:

- `growth-report GET service boundary`를 `services/crop_service.py`에 추가한다.
- `growth_report_response`가 `CropReadActor`와 `view_crop_records` permission smoke를 통과한 뒤 기존 `_growth_report_response` builder를 호출한다.
- `GET /api/green_smart/crop/seasons/{season_id}/growth-report` route path 변경 없음.
- `growth-report` response shape 변경 없음.
- `Center sync scheduler 변경 없음`.
- `DB migration 없음`.

---

## 9. Permission/RBAC enforcement strategy

R1에서 정한 원칙을 backend 분해에 적용한다.

1. Frontend hidden/disabled는 보안 경계가 아니다.
2. 모든 write/execute/delete/save/apply/ack/clear route는 service layer에서 permission을 검증한다.
3. `request` object는 api view에서만 다루고, service에는 `actor`, `role`, `permissions` DTO를 넘긴다.
4. read-only route도 sensitive admin/system data는 `system_settings` 또는 `view_audit_logs` 권한을 확인한다.
5. RB-006A read-only crop route는 `view_crop_records` 기준을 첫 permission smoke로 삼는다.

---

## 10. Scheduler decomposition strategy

`__init__.py`의 scheduler helper는 현재 runtime baseline으로 유지한다. 분해는 아래 순서로만 진행한다.

1. scheduler tick의 DB lookup을 repository로 이동.
2. tick orchestration을 `schedulers/*`로 이동.
3. `__init__.py`는 `_setup_*_scheduler` import/register shell만 보유.
4. scheduler output key는 `hass.data[DOMAIN]` 기존 key를 유지.
5. runtime warning/notification message shape를 변경하지 않는다.

R3에서는 scheduler code를 옮기지 않는다.

---

## 11. Testing strategy

R3 계약은 구현 분해 전 아래를 고정한다.

1. route path compatibility 유지.
2. target backend structure 문서화.
3. layer responsibility 문서화.
4. first extraction이 `RB-006A Crop read-only service/repo boundary`임을 고정.
5. execute/safety/device mapping은 후순위임을 고정.
6. DB migration 금지와 response shape 유지 원칙 고정.

실제 extraction slice부터는 아래 검증을 추가한다.

```bash
python3 -m py_compile custom_components/green_smart/*.py custom_components/green_smart/services/*.py custom_components/green_smart/repositories/*.py
pytest -q tests/test_backend_api_decomposition_contract.py
pytest -q tests/test_crop_*contract.py
pytest -q
```

---

## 12. Abort rules

즉시 중단하고 재계획해야 하는 경우:

1. route path 변경이 필요해지는 경우.
2. response JSON shape 변경이 필요한 경우.
3. DB migration이 필요한 경우.
4. execute-final-targets, HA service call, device mapping semantics가 바뀌는 경우.
5. scheduler warning/output key가 바뀌는 경우.
6. permission/RBAC enforcement를 우회해야 하는 경우.
7. 전체 테스트에서 기능 회귀가 발생하고 원인이 문서/버전 정합화가 아닌 경우.

---

## 13. R3 완료 기준

- [x] 현재 backend monolith hotspot 문서화
- [x] target `api_views/services/repositories/schedulers` 구조 문서화
- [x] route compatibility contract 문서화
- [x] layer responsibility 문서화
- [x] adapter-first extraction pattern 문서화
- [x] first backend extraction을 RB-006A로 확정
- [x] DB migration/route path/response shape 변경 금지 고정
- [x] R3 contract test로 회귀 방어
