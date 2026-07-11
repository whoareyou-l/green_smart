# R7-067 Settings visible tab cleanup

Status: current baseline for `v1.15.23`.

## Problem

After R7-066, the settings page showed both the new settings tabs and the old compatibility tabs. R7-114 also moved the crop-cycle/object content to 작물 운영 > 작기·현재작물, so settings should now expose 6 visible tabs.

## Fix

구버전 탭 버튼 노출 제거:

- Visible settings tabs now show 4개만 표시:
  - 온실·구역
  - 장치·센서 매핑
  - 사용자·권한
  - 시스템·연동

- Old tabs are not shown as clickable/visible tab buttons:
  - 도메인 소유권
  - 역할·권한
  - 매핑·장치
  - 시스템·보안
  - RBAC 정책

## Compatibility

The old tab names and markers remain only as hidden compatibility marker text for older contracts:

- `hidden compatibility marker`
- `data-r7-settings-admin-subtab="domain-ownership"`
- `data-r7-settings-admin-subtab="rbac-policy"`

No user-facing visible panel/button should be rendered for those old tabs.
