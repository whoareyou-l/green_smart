# R7-099 Greenhouse info detail/edit/delete

## 목적

`온실 정보` 목록 모달을 단순 검토형 요약이 아니라 실제 온실 단위 운영 상세 화면으로 보정한다.

## UI 규칙

- 온실 정보 목록은 **온실별 목록**으로 표현한다.
- 왼쪽 목록의 한 행은 온실 1개를 의미한다.
- 오른쪽 패널 제목은 `선택 항목 검토`가 아니라 **선택 항목 상세**로 표현한다.
- 상세 패널은 선택한 온실의 실제 정보를 표시한다.
  - 온실명
  - 위치
  - 설치유형
  - 승인범위
  - 상태
  - 생성시각/수정시각
  - 메모
- 상세 패널에는 온실별 **수정**, **삭제** 버튼을 제공한다.

## API

온실 정보는 기존 collection endpoint에 item endpoint를 추가한다.

```text
PATCH  /api/green_smart/rebuild/settings/greenhouses/{greenhouse_id}
DELETE /api/green_smart/rebuild/settings/greenhouses/{greenhouse_id}
```

- `PATCH`는 온실명/위치/설치유형/승인범위/메모를 갱신한다.
- `DELETE`는 물리 삭제가 아니라 `status = 'deleted'` 방식의 **soft delete**를 수행한다.
- 목록 조회는 `status <> 'deleted'`만 반환한다.
- 수정/삭제 후 응답에는 최신 `settingsSnapshot`을 포함한다.

## 프론트 동작

- `data-r7-settings-greenhouse-info-row` 클릭 시 선택 온실 상세가 갱신된다.
- `data-r7-settings-greenhouse-edit-button`은 PATCH API를 호출한 뒤 snapshot을 다시 불러온다.
- `data-r7-settings-greenhouse-delete-button`은 DELETE API를 호출한 뒤 snapshot을 다시 불러온다.

## 비고

이번 slice의 수정 버튼은 온실별 상세에서 실제 PATCH 경로를 여는 baseline이다. 별도 편집 입력 모달은 다음 slice에서 생성 모달 shell을 재사용해 확장할 수 있다.
