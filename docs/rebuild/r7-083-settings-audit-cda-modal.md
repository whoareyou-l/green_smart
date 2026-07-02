# R7-083 Settings audit CDA modal

Status: current baseline for `v1.14.52`.

## Problem

The previous CDA modal work updated the approval popup and crop record history popup, but missed the Settings card route opened by `전체 감사 로그 보기`. That button still fell through to an older history/loading component, so the screenshot showed the legacy `기록 히스토리` loading modal.

## Fix

`전체 감사 로그 보기` now has a dedicated CDA route:

- `data-r7-settings-audit-log-button`
- `_openSettingsAuditLogModal`
- `_closeSettingsAuditLogModal`
- `_selectSettingsAuditLogRow`
- `renderR7SettingsAuditLogModal()`

The modal uses the same 기록 히스토리 팝업 모달의 완성형 CDA split layout:

- left CDA compact audit list
- right selected audit detail panel
- search/filter bar
- detail sections for audit info, summary, source evidence
- CDA action footer

## Boundary

This fixes a 누락 경로. It does not change DB schema, audit API, approval API, or device execution behavior.
