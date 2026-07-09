# R7-064 Records modal overlap/sticky hotfix

Status: current baseline for `v1.14.88`.

## Problem

User screenshot showed the `저장 전 검증` card overlapping the growth survey form fields. The 겹침 원인 was an unintended nested layout:

- `renderR7RecordFormLayout()` added a two-column wrapper.
- `renderR7GrowthSurveyImageFields()` already contained its own left-form + right-validation two-column grid.
- The inner grid was squeezed into the outer grid's left column, causing the validation card to visually overlap the form.

## Fix

- 이중 grid wrapper 제거 for growth survey forms.
- Growth survey now uses `data-r7-record-form-layout="embedded-reference"` and lets `data-r7-growth-survey-image-modal` span the full modal body width.
- Non-growth forms still use `data-r7-record-form-layout="side-reference"` with the common side reference panel.
- The growth modal grid is now `minmax(0,1fr) minmax(300px,340px)` so the form gets stable width and the validation card has a bounded width.
- `저장 전 검증` remains sticky but is anchored 헤더 바로 아래 using `top:76px`, so it does not slide under the sticky header.
- 모바일 uses a wider breakpoint and collapses to one column; the validation panel becomes static with `top:0` and remains between memo/form and actions.

## Verification markers

- `data-r7-record-form-layout="embedded-reference"`
- `data-r7-record-form-layout="side-reference"`
- `data-r7-record-modal-sticky-header`
- `data-r7-record-pre-save-checklist`
- `position:sticky;top:76px`
- `@media (max-width: 860px)`
