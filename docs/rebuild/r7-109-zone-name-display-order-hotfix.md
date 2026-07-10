# R7-109 Zone name display-order hotfix

Version: v1.15.01
Status: prod verified

## Problem

Zone auto naming used `greenhouse.id` as the visible greenhouse number. In prod the representative greenhouse row had DB id `4`, so the first zone was generated as `4-1구역`.

That was wrong for operators. DB ids are internal persistence keys and must not leak into operator-facing zone names.

## Fix

Zone auto naming now uses greenhouse display order:

- first visible greenhouse → `1-*구역`
- second visible greenhouse → `2-*구역`

The DB id is still used only to relate zones to the selected greenhouse.

## Prod correction

Existing prod row was corrected:

```text
4-1구역 → 1-1구역
```

## Verification

- Focused zone auto-name contract: pass
- Full suite: 1493 passed
- JS syntax checks: pass
- Python compile checks: pass
- HA config check: pass
- Served prod panel marker smoke: pass
- Prod helper smoke:
  - id=4 representative greenhouse, displayNumber=1, no zones → `1-1구역`
  - existing `1-1구역` → next `1-2구역`
- Stable post-deploy error log window: empty
