# v1.15.45 root/content 폭 분리 계획

## 문제

v1.14.96은 root와 content column 모두에 `100dvw`를 넣어 화면을 넘겼다.

v1.15.45은 root와 content column 모두에 `100%`를 넣어 HA/custom-element 부모가 0폭 또는 shrink 폭이면 화면이 blank처럼 보일 수 있었다.

핵심 원인은 root main과 grid content column에 같은 width style을 재사용한 것이다.

## 목표

- 화면은 다시 표시된다.
- Green Smart root는 viewport 폭을 확보한다.
- 오른쪽 content column은 Green Smart sidebar grid 안의 남은 폭만 사용한다.
- 하단 horizontal overflow는 만들지 않는다.
- 도메인 카드 내부 hero/text layout은 건드리지 않는다.

## 적용

### root main

root는 HA/custom-element 부모 shrink를 피하기 위해 viewport 폭을 확보한다.

```css
--r7-root-viewport-width:100dvw;
width:var(--r7-root-viewport-width);
max-width:100dvw;
overflow-x:clip;
```

### content column

content column은 sidebar grid의 두 번째 column 안에서만 100%를 사용한다.

```css
--r7-content-main-width:100%;
width:var(--r7-content-main-width);
max-width:100%;
overflow-x:clip;
```

### 금지

- `data-rebuild-shell-main`에 `100dvw` 금지.
- root와 content column에 같은 style 변수 재사용 금지.
- domain hero/card 내부에 v1.14.93 stretch 패턴 재도입 금지.

## 검증

- source contract: `_r7RootWidthVarsStyle`, `_r7ContentColumnWidthVarsStyle` 존재.
- rendered contract: root contains `--r7-root-viewport-width:100dvw`, shell main contains `--r7-content-main-width:100%`.
- shell main block does not contain `100dvw`.
- focused tests, full pytest, Prod smoke.
