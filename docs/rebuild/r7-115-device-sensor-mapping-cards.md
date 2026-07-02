# R7-115 Device/Sensor mapping image-like cards

Version: v1.14.46
Status: prod verified

## User request

Rebuild Settings → `장치·센서 매핑` content cards using the supplied Settings image as a reference. The content should be organized as:

1. 장치
2. 그룹
3. 매핑

## UI structure

The subtab now follows the same grammar as the image-like `온실·구역` screen:

1. Selected-zone strip
   - `현재 선택 구역`
   - zone pill cards
   - mapping freshness chip
2. Three summary cards
   - `장치`
   - `그룹`
   - `매핑`
3. Three action cards
   - `장치 구성`
   - `그룹 구성`
   - `매핑 확인`
4. Full-width mapping list
   - `매핑 목록`
   - rows include group/role, sensor entity, device entity, status, note

## Markers

```text
data-r7-settings-device-sensor-mapping
data-r7-settings-device-mapping-layout="device-group-mapping"
data-r7-settings-device-selected-zone-strip
data-r7-settings-device-summary-grid
data-r7-settings-device-card="device"
data-r7-settings-device-card="group"
data-r7-settings-device-card="mapping"
data-r7-settings-device-action-row
data-r7-settings-device-mapping-list-panel
data-r7-settings-device-mapping-row="{mapping_id}"
```

Existing actions are preserved:

```text
data-r7-settings-device-sensor-mapping-button
data-r7-settings-equipment-info-shortcut-button
```

## Removed old flat cards

The previous flat four-card layout was removed from this subtab:

```text
data-r7-settings-device-sensor-card="zone-sensors"
data-r7-settings-device-sensor-card="zone-devices"
data-r7-settings-device-sensor-card="ha-entity"
data-r7-settings-device-sensor-card="mapping-health"
```

## Verification

- Focused contracts: pass
- Full suite: `1515 passed`
- HA config check: pass
- Prod served JS smoke:
  - `REBUILD_VERSION = "1.14.46"`
  - new device/group/mapping markers present
  - old flat-card markers absent
- Stable HA log window: no errors
