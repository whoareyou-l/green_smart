# R7-110 Greenhouse Korean status, hard delete, and edit modal

Version: v1.14.49
Status: prod verified

## Scope

The greenhouse info modal still stored/rendered `operating_status` and `status` as English tokens such as `active`. Edit also patched immediately from the detail footer, and delete was a soft status update.

## Changes

### Korean DB storage

`green_smart_settings_greenhouses` now stores Korean labels directly:

- `operating_status`: `운영중`, `대기`, `점검중`, `비활성`
- `status`: `정상`, `비활성`, `삭제됨`

No new path converts Korean operator labels back to English before DB storage.

Existing English values are migrated on schema bootstrap:

- `active` → `운영중` for `operating_status`
- `standby` → `대기`
- `maintenance` → `점검중`
- `inactive` → `비활성`
- `active` → `정상` for `status`
- `deleted` → `삭제됨`

### Hard delete

The greenhouse delete API now runs actual deletion:

```sql
DELETE FROM green_smart_settings_greenhouses WHERE farm_id = %s AND id = %s
```

It no longer writes `status='deleted'`.

### Edit modal

Clicking `수정` now:

1. closes the greenhouse CDA detail modal,
2. opens the greenhouse form modal using the same visual shell as greenhouse create,
3. changes the title to `온실 수정`,
4. fills the selected row values into the form,
5. changes the submit button to `온실 수정`,
6. submits with `PATCH /api/green_smart/rebuild/settings/greenhouses/{id}`.

## Verification

- Focused contracts: pass
- Full suite: 1497 passed
- JS syntax checks: pass
- Python compile checks: pass
- HA config check: pass
- Served prod panel marker smoke: pass
- Prod DB migration/update smoke:
  - representative greenhouse raw DB: `operating_status=운영중`, `status=정상`
- Prod hard-delete smoke:
  - temp greenhouse raw DB before delete: `operating_status=점검중`, `status=정상`
  - temp row gone after delete
  - greenhouse `AUTO_INCREMENT` reset to next real value
- Stable post-deploy error log window: empty
