# R7-085 Approval card modal-only and Settings subtab icons

Status: current baseline for `v1.14.30`.

## Changes

1. `승인 필요 작업` card no longer renders an inline `확인` button per approval row. 확인 버튼 제거.
   - Approval review and decision handling belongs in the `모든 승인 요청 확인` CDA modal. 모달에서 처리.
   - The card remains a compact summary/list only.

2. 설정 하위탭 now use 고유 MDI 아이콘 instead of falling back to the same Settings icon.

## Settings subtab icon map

- 온실·구역 → `mdi:greenhouse`
- 작기·작물 객체 → `mdi:sprout-outline`
- 장치·센서 매핑 → `mdi:devices`
- 사용자·권한 → `mdi:account-key-outline`
- 안전·승인 정책 → `mdi:shield-check-outline`
- 시스템·연동 → `mdi:home-assistant`
- 진단·감사 → `mdi:file-search-outline`

## Boundary

This is UI-only. It does not change approval APIs, audit APIs, RBAC enforcement, DB schema, or device execution behavior.
