# R7-111 Greenhouse item route kwargs hotfix

Version: v1.14.75
Status: prod verified

## Bug

Clicking `온실 수정` from the greenhouse edit modal showed `greenhouse-edit-failed`.

The frontend catch message hid the real backend exception:

```text
TypeError: RebuildSettingsGreenhouseItemView.patch() got an unexpected keyword argument 'greenhouse_id'
```

## Root cause

Home Assistant route dispatch passes path parameters as method keyword arguments for this view route:

```text
/api/green_smart/rebuild/settings/greenhouses/{greenhouse_id}
```

But the item view methods only accepted `(self, request)`, then tried to read `request.match_info` internally. HA raised a Python `TypeError` before the PATCH handler body executed.

Delete used the same signature shape, so it was fixed at the same route boundary.

## Fix

`RebuildSettingsGreenhouseItemView` now accepts the route kwarg and keeps `request.match_info` as fallback:

```python
async def patch(self, request, greenhouse_id=None)
async def delete(self, request, greenhouse_id=None)
```

Both methods resolve:

```python
greenhouse_id = int(greenhouse_id or request.match_info["greenhouse_id"])
```

## Verification

- Regression contract added: `tests/test_r7_111_greenhouse_item_route_kwargs_contract.py`
- Full suite: `1500 passed`
- Prod HA config check: pass
- Served frontend marker: `REBUILD_VERSION = "1.14.75"`
- Prod route-kwarg smoke:
  - `view.patch(..., greenhouse_id="1")` → HTTP 200
  - `view.delete(..., greenhouse_id=temp_id)` → HTTP 200
  - deleted temp row no longer exists
- Stable log window after deploy: no `unexpected keyword argument 'greenhouse_id'`, no traceback/error
