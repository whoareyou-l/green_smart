# R7-115 Device/Sensor mapping cards

Version: v1.15.07
Status: prod verification pending

## User correction in v1.15.07

The Settings → `장치·센서 매핑` subtab was corrected again after the v1.14.48 common-card update.

Required changes:

1. `장치 추가` button opens a creation popup modal that reuses the same common creation modal grammar as `온실 생성`.
2. `그룹 추가` button opens a creation popup modal that reuses the same common creation modal grammar as `온실 생성`.
3. Both modals keep the Settings create/write modal grammar:
   - record common modal shell,
   - operator summary,
   - left sectioned form,
   - right `저장 전 검증` checklist,
   - cancel/save action row.

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

## Card markers

```text
data-r7-settings-device-sensor-mapping
data-r7-settings-device-mapping-layout="error-device-group-device-list"
data-r7-settings-device-summary-grid
data-r7-settings-device-card="device-basic"
data-r7-settings-device-card="group-basic"
data-r7-settings-device-card="error-basic"
data-r7-settings-device-error-common-card="approval-needed"
data-r7-settings-device-action-row
data-r7-settings-device-list-panel
data-r7-settings-device-list-row="{mapping_id}"
```

## Creation modal markers

Device creation:

```text
data-r7-settings-device-create-button
data-r7-settings-device-create-modal="true"
data-r7-settings-device-create-form
data-r7-settings-create-growth-like-modal="true"
data-r7-settings-create-left-form
data-r7-settings-create-section="basic-info"
data-r7-settings-create-section="device-target"
data-r7-settings-create-section="memo"
data-r7-settings-create-pre-save-checklist
data-r7-record-pre-save-checklist
```

Group creation:

```text
data-r7-settings-device-group-create-button
data-r7-settings-device-group-create-modal="true"
data-r7-settings-device-group-create-form
data-r7-settings-device-group-zone-fk-select
data-r7-settings-create-growth-like-modal="true"
data-r7-settings-create-left-form
data-r7-settings-create-section="basic-info"
data-r7-settings-create-section="zone-fk"
data-r7-settings-create-section="memo"
data-r7-settings-create-pre-save-checklist
data-r7-record-pre-save-checklist
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

## CDB card grammar hotfix in v1.15.07

The device/sensor mapping subtab was corrected to use only the four CDB card wrappers.

Visible row grammar:

```text
summary row: 3 summary cards
  - 장치 기본 정보
  - 그룹 기본 정보
  - 오류 기본 정보

action row: 3 two-button cards
  - 장치 추가
  - 연결
  - 그룹 추가

list row: 1 list card
  - 장치 목록
```

Important correction:

- `오류 기본 정보` must be rendered with `renderR7CdbSummaryCard()`, not a raw/common card shell.
- The second row must contain 3 `renderR7CdbButtonTwoCard()` cards.
- The previous/current device-add action position is now the `연결` card, with a new `장치 추가` card inserted on its left.

## Device/group DB-backed save in v1.15.07

The v1.15.07 slice converted `장치 추가` and `그룹 추가` from UI-only saved states to real DB/API writes.

Added backend storage:

```text
green_smart_settings_devices
green_smart_settings_device_groups
```

Added APIs:

```text
POST/GET /api/green_smart/rebuild/settings/devices
POST/GET /api/green_smart/rebuild/settings/device-groups
```

Frontend submit handlers now call the real APIs:

```text
REBUILD_SETTINGS_DEVICE_CREATE_API_PATH
REBUILD_SETTINGS_DEVICE_GROUP_CREATE_API_PATH
```

The settings snapshot now includes:

```text
devices
deviceGroups
```

## Verification

- Focused contracts: `17 passed`
- Full suite: `1541 passed`
- Prod smoke: pending
