# R7-112 Zone list edit/delete modal flow

Version: v1.15.43
Status: prod verified

## Scope

The Settings → `구역 목록` CDA popup now matches the greenhouse info popup action grammar.

## Changes

### Zone detail footer actions

The selected zone detail footer now shows actions before the close button:

1. `수정`
2. `삭제`
3. `닫기`

Markers:

- `data-r7-settings-zone-edit-button="{zone_id}"`
- `data-r7-settings-zone-delete-button="{zone_id}"`

### Hard delete

`삭제` calls:

```text
DELETE green_smart/rebuild/settings/zones/{zone_id}
```

Backend route:

```text
/api/green_smart/rebuild/settings/zones/{zone_id}
```

The selected DB row is physically deleted from `green_smart_settings_zones`.

### Edit modal

`수정` closes the zone-list CDA popup and opens the same visual shell as `구역 생성` with edit values prefilled:

- title: `구역 수정`
- selected row values copied into form fields
- submit button: `구역 수정`
- submit method: `PATCH green_smart/rebuild/settings/zones/{zone_id}`

The backend item route accepts HA route kwargs:

```python
async def patch(self, request, zone_id=None)
async def delete(self, request, zone_id=None)
```

## Verification

- Regression contract: `tests/test_r7_112_zone_edit_delete_modal_contract.py`
- Focused zone/edit contracts: pass
- Full suite: `1504 passed`
- HA config check: pass
- Served prod panel marker smoke: pass
- Prod route-kwarg smoke:
  - zone PATCH: HTTP 200
  - zone DELETE: HTTP 200
  - temp zone row removed from DB
- Final prod zones after smoke:
  - `1-1구역`
  - `1-2구역`
- Stable log window: no `zone_id` route kwarg error, no `zone-edit-failed`, no traceback/error
