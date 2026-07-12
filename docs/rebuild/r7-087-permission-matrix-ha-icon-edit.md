# R7-087 Permission matrix ha-icon and edit action hotfix

Status: current baseline for `v1.15.43`.

## Scope

`설정 > 사용자·권한 > 권한 매트릭스 보기` 팝업 모달에서 권한 상태를 이모지 문자로 표시하지 않고 Home Assistant `ha-icon` MDI 아이콘으로 표시한다. 또한 각 버킷의 **수정 버튼**은 표시만 하는 버튼이 아니라 선택 버킷 검토 패널을 여는 실제 동작을 가져야 한다.

## Changes

- 권한 상태를 `data-r7-settings-permission-state-icon`이 있는 `ha-icon` 기반 pill로 렌더한다.
- 이모지 `✅`, `🛡️`, `👁️`, `🕘`, `🔒`는 권한 매트릭스 모달에서 제거한다.
- 상태별 아이콘:
  - 허용: `mdi:check-circle-outline`
  - 확인: `mdi:shield-check-outline`
  - 읽기 전용: `mdi:eye-outline`
  - 요청 후 실행: `mdi:clock-outline`
  - 없음: `mdi:lock-outline`
- `data-r7-settings-permission-edit` 버튼 클릭 시 `_selectSettingsPermissionMatrixBucket()`이 선택 버킷을 저장한다.
- 선택된 버킷은 `data-r7-settings-permission-edit-panel` 검토 패널에 표시된다.

## Boundary

수정 버튼은 이번 slice에서 버킷별 수정 검토 패널을 여는 동작까지 수행한다. 실제 권한 저장/변경 mutation은 별도 승인 필요 작업 흐름에서 처리한다.
