# v1.14.98 도메인 화면 폭 grid-contained 맞춤 계획

## 증상

v1.14.98에서 `ha-sidebar-hidden` 모드의 content width를 `100dvw`로 바꾼 결과, 실제 화면에서 오른쪽 content가 화면 폭을 넘어가며 하단 horizontal scrollbar가 생겼다.

스크린샷 기준 계산은 다음과 같았다.

```text
Green Smart sidebar 256px + content 100dvw + padding = viewport 초과
```

즉, `100dvw`는 전체 viewport 기준이므로 grid의 두 번째 column 안에서 쓰면 sidebar 폭만큼 초과된다.

## 목표

- Green Smart 사이드바 + 오른쪽 content 전체가 화면 폭 안에 딱 맞는다.
- 도메인 카드는 오른쪽 content column 안에서 100%를 채운다.
- 하단 horizontal scrollbar가 생기지 않는다.
- v1.14.93의 hero/text 세로 찢어짐 회귀는 계속 막는다.

## 수정 원칙

### 유지

- `green-smart-rebuild-panel` host는 block/fill 유지.
- shell grid는 `grid-template-columns:${sidebarTrack} minmax(0,1fr)` 유지.
- domain frame/content card는 `safe-fill` 유지.
- hero는 `safe-natural` 유지.

### 변경

- content column width에는 `100dvw`를 쓰지 않는다.
- hidden/visible 모드 모두 grid column 안에서 `100%`를 사용한다.
- root/shell width style은 `max-width:100%`와 `overflow-x:clip`를 포함해 화면 밖으로 계산되지 않게 한다.
- host maxWidth도 `none`이 아니라 `100%`로 둔다.

## 계약

- `data-r7-content-width-policy="grid-contained-fill"`
- `data-r7-content-width-contained="true"`
- `data-r7-content-width-uses-dvw="false"`
- `--r7-content-main-width:100%`
- `--r7-content-viewport-width:100%`
- `--r7-content-main-width:100dvw` 금지
- `contentWidthMode === "ha-sidebar-hidden" ? "100dvw" : "100%"` 금지

## 완료 기준

- 화면 오른쪽 content가 viewport를 넘어가지 않는다.
- 도메인 카드가 content column 안에서 꽉 찬다.
- Prod served smoke에서 v1.14.98 marker와 금지 패턴 부재를 확인한다.
