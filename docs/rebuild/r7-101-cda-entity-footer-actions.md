# R7-101 CDA entity footer actions

## 목적

온실 정보 CDA entity 모달에서 `수정`/`삭제` 버튼을 상세 내용 섹션 안에 넣지 않고, 우측 상세 패널의 **footer action slot**으로 이동한다.

## 규칙

- `수정`과 `삭제`는 상세 필드의 일부가 아니다.
- 따라서 `2. 온실 작업` 같은 별도 본문 섹션을 만들지 않는다.
- 버튼 순서는 footer에서 다음 순서를 따른다.

```text
상세 로그 보기 → 수정 → 삭제 → 닫기
```

- `수정`/`삭제`는 **닫기 버튼의 왼쪽**에 위치한다.
- 이 배치는 CDA entity 공통 팝업 모달의 action grammar로 유지한다.

## 계약 marker

```html
data-r7-cda-entity-detail-footer="greenhouse-info"
data-r7-settings-greenhouse-edit-button="온실ID"
data-r7-settings-greenhouse-delete-button="온실ID"
```

## 통합 판단

이 변경은 단순 위치 이동이 아니라 CDA entity 공통 팝업에서 본문과 액션을 분리하는 규칙이다. 본문은 선택 엔티티 상세, footer는 실행/닫기 액션을 담당한다.
