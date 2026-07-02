# R7-115 Device/Sensor mapping cards

Version: v1.14.47
Status: prod verification pending

## User correction in v1.14.47

The Settings → `장치·센서 매핑` subtab was corrected after the first v1.14.46 card rebuild.

Required changes:

1. Remove the `현재 선택 구역` strip from inside the content-card area.
2. Rename the three summary cards:
   - `장치` → `장치 기본 정보`
   - `그룹` → `그룹 기본 정보`
   - `매핑` → `오류 기본 정보`
3. Rename action/list labels:
   - `장치 구성` → `장치 추가`
   - `그룹 구성` → `그룹 추가`
   - remove `매핑 확인`
   - `매핑 목록` → `장치 목록`
4. Encode the intended process:
   - first add devices,
   - then create one or more groups,
   - group creation stores the zone as a foreign-key reference,
   - then connect added devices to groups,
   - a device can be connected to multiple groups.

## Current UI structure

```text
3 summary cards:
  장치 기본 정보 / 그룹 기본 정보 / 오류 기본 정보

2 action cards:
  장치 추가 / 그룹 추가

process summary:
  1. 장치 추가 → 2. 그룹 추가 → 3. 그룹에 장치 연결

full-width list:
  장치 목록
```

## Markers

```text
data-r7-settings-device-sensor-mapping
data-r7-settings-device-mapping-layout="device-group-error-device-list"
data-r7-settings-device-summary-grid
data-r7-settings-device-card="device-basic"
data-r7-settings-device-card="group-basic"
data-r7-settings-device-card="error-basic"
data-r7-settings-device-action-row
data-r7-settings-device-list-panel
data-r7-settings-device-list-row="{mapping_id}"
```

Process markers:

```text
data-r7-settings-device-process="device-add-first"
data-r7-settings-device-process="group-create-zone-fk"
data-r7-settings-device-process="group-device-link"
data-r7-settings-device-group-zone-fk="required"
data-r7-settings-device-group-link-stage="device-to-group"
```

Removed from the active device/sensor mapping content card:

```text
data-r7-settings-device-selected-zone-strip
data-r7-settings-device-action-card="mapping"
data-r7-settings-device-mapping-list-panel
```

## Verification

- Focused contracts: `19 passed`
- Full suite / prod smoke: run after this document update
