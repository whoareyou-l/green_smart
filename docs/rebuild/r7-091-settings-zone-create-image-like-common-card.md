# R7-091 Settings zone create image-like common card

Status: current baseline for `v1.15.47`.

## Correction

사용자가 말한 `구역 생성` 공통 컴포넌트 카드는 Record detail/data-row 카드가 아니라, 생육조사 참고 이미지처럼 보이는 이미지형 공통 카드다.

## Required shape

`구역 생성`은 기존 `renderR7RecordCardShell` / `renderR7CommonCardShell`을 사용하되 body는 다음 패턴만 사용한다.

```text
[icon + 구역 생성]                         [오늘 필요]

              새 구역 없음
     구역을 추가하려면 승인 후 저장이 필요합니다

[+ 새 구역 추가] [구역 목록]
```

## Component rule

- `primary + note + action buttons` 구조를 사용한다.
- `data row를 사용하지 않는다`.
- status key는 이미지형 카드와 같은 pill이 보이도록 `due-today`를 사용한다.
- 생성 버튼은 실제 저장이 아니라 승인/저장 flow 진입 affordance다.
