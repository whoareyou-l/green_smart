# R7-084 Settings modal record binding hotfix

Status: current baseline for `v1.14.78`.

## Problem

`전체 감사 로그 보기` used the common card button helper. That helper also adds record workflow attributes:

- `data-r7-record-card-button`
- `data-r7-record-action-mode`

So a single click opened the Settings audit CDA modal and also triggered the record workflow binding, creating an 이중 모달: an extra legacy loading modal with `히스토리를 불러오는 중입니다.`. This looked like an error shown together with the modal.

## Fix

The Settings audit button now declares:

```html
data-r7-settings-modal-skip-record-binding="true"
```

The record workflow binder now skips any button with that flag, in addition to the approval-specific skip flag.

## Boundary

This is a UI event-binding hotfix. It does not change the audit data model, DB schema, approval API, record API, or device execution behavior.
