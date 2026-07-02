# R7-115 Device/Sensor mapping cards

Version: v1.14.48
Status: prod verification pending

## User correction in v1.14.48

The Settings → `장치·센서 매핑` subtab was corrected again after the v1.14.47 process-card update.

Required changes:

1. Remove the guidance/process box from the visible content cards; the process belongs in documentation only.
2. Keep `장치 추가` and `그룹 추가` as action cards, but render them in a 3-column row so each action card occupies the same width as the summary cards above.
3. Render `오류 기본 정보` with the same common-card component family used by Settings → 사용자·권한 → `승인 필요 작업`.

## Current visible UI structure

```text
3 summary cards:
  장치 기본 정보 / 그룹 기본 정보 / 오류 기본 정보

3-column action row:
  장치 추가 / 그룹 추가 / empty third column

full-width list:
  장치 목록
```

No visible process guidance box is rendered in this subtab.

## Documented process only

The intended management process is kept here as documentation, not as a visible guidance box:

1. Add devices first.
2. Create one or more groups.
3. Group creation stores the zone as a foreign-key reference.
4. Connect added devices to groups.
5. A device can be connected to multiple groups.

## Markers

```text
data-r7-settings-device-sensor-mapping
data-r7-settings-device-mapping-layout="device-group-error-device-list"
data-r7-settings-device-summary-grid
data-r7-settings-device-card="device-basic"
data-r7-settings-device-card="group-basic"
data-r7-settings-device-card="error-basic"
data-r7-settings-device-error-common-card="approval-needed"
data-r7-settings-device-action-row
data-r7-settings-device-list-panel
data-r7-settings-device-list-row="{mapping_id}"
```

Process markers remain as non-copy markers on the relevant cards/buttons:

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
data-r7-settings-device-process-summary
data-r7-settings-device-action-card="mapping"
data-r7-settings-device-mapping-list-panel
```

## Verification

- Focused contracts: `16 passed`
- Full suite / prod smoke: run after this document update
