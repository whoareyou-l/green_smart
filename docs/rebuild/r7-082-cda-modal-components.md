# R7-082 CDA modal components

Status: current baseline for `v1.14.81`.

## Goal

Build the `승인 필요 작업` popup modal using CDA: 작은 것부터 큰 순서로 primitive → composition → 완성형 modal을 만든다. The same completed split-modal pattern becomes the target shape for the `기록 히스토리` popup modal.

## CDA component order

1. primitive: `renderR7CdaModalOverlay`
2. primitive: `renderR7CdaModalCard`
3. primitive: `renderR7CdaModalHeader`
4. primitive: `renderR7CdaSearchFilterBar`
5. primitive: `renderR7CdaCompactListRow`
6. composition: `renderR7CdaListPanel`
7. composition: `renderR7CdaDetailSection`
8. composition: `renderR7CdaDetailPanel`
9. composition: `renderR7CdaActionFooter`
10. completed modal: `renderR7CdaSplitModal`

## Approval modal usage

`renderR7SettingsApprovalListModal()` now composes:

- CDA header
- CDA search/filter bar
- CDA compact list rows
- CDA list panel
- CDA detail sections
- CDA detail panel
- CDA action footer
- CDA split modal

It preserves approval-specific markers such as `data-r7-settings-approval-reference-modal="true"`, list row markers, validation markers, and decision markers.

## Record history modal usage

`renderR7RecordHistoryCdaBody()` turns the previous simple history list into the same 완성형 split modal pattern:

- left: compact `기록 히스토리` list
- right: selected record detail panel
- detail sections: 기록 정보, 기록 요약, 원본 근거
- action footer: export placeholder and close

The old record modal shell markers are preserved, but the shell now includes CDA overlay/card/header markers. This makes record history the same product-grade modal family as approval review.

## Boundary

This is a UI architecture refactor. It does not change record write API, approval decision API, DB schema, or device execution behavior.
