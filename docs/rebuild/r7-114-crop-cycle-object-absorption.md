# R7-114 Crop-cycle object card absorption

Version: v1.15.35
Status: prod verified

## User request

Move the content card from Settings → `작기·작물 객체` into Crop Operations → `작기·현재작물`, then remove the Settings `작기·작물 객체` subtab.

## Changes

### Crop Operations

`작물 운영 > 작기·현재작물` now includes the crop object rule content card:

- `작기마다 4개의 작물 객체`
- `작기 번호-객체 번호`
- object badges such as `4-1`, `4-2`, `4-3`, `4-4`
- `생육조사/추세/이상치 비교 기준`

Markers:

```text
data-r7-crop-cycle-object-rule-card
data-r7-crop-object-rule="four-per-cycle"
```

### Settings

Settings now exposes 6 visible subtabs:

1. 온실·구역
2. 장치·센서 매핑
3. 사용자·권한
4. 시스템·연동

Removed from Settings UI:

```text
작기·작물 객체
crop-cycle-objects
data-r7-settings-crop-cycle-objects
data-r7-settings-object-rule="four-per-cycle"
```

If stale UI state tries to activate `crop-cycle-objects`, Settings falls back to `greenhouse-zones`.

## Verification

- Focused contracts: pass
- Full suite: `1511 passed`
- HA config check: pass
- Prod served JS smoke:
  - `REBUILD_VERSION = "1.15.35"`
  - crop-cycle object markers present under Crop Operations code path
  - settings crop-cycle-object markers absent
- Stable HA log window: no errors
