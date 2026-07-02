# R7-067 Settings visible tab cleanup

Status: current baseline for `v1.14.37`.

## Problem

After R7-066, the settings page showed both the new 7 tabs and the old compatibility tabs. This made the visible navigation too crowded.

## Fix

구버전 탭 버튼 노출 제거:

- Visible settings tabs now show 7개만 표시:
  - 온실·구역
  - 작기·작물 객체
  - 장치·센서 매핑
  - 사용자·권한
  - 안전·승인 정책
  - 시스템·연동
  - 진단·감사

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
