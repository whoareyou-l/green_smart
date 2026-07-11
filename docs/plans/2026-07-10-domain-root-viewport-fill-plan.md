# v1.15.18 도메인 루트 viewport fill 계획

## 현재 증상

v1.15.18에서 도메인 카드 외곽(`data-r7-domain-visual-frame`, `data-r7-domain-content-card`)에는 안전한 `width:100%; max-width:100%; box-sizing:border-box;`를 적용했다. 그러나 실제 화면에서는 카드가 여전히 약 600px 폭에서 멈추고 오른쪽에 큰 빈 영역이 남았다.

스크린샷 기준으로 카드 내부는 찢어지지 않았고, 카드도 자기 부모 안에서는 정상적으로 채워져 있다. 문제는 카드 내부가 아니라 더 상위의 Green Smart custom element / root main / HA sidebar hidden mode 폭 계산이다.

## 원인

현재 `_r7ContentWidthVarsStyle()`는 `--r7-content-viewport-width:100dvw` 변수를 만들지만 실제 `width`에는 `--r7-content-main-width:100%`만 사용한다.

```css
--r7-content-viewport-width:100dvw;
--r7-content-main-width:100%;
width:var(--r7-content-main-width);
```

Home Assistant panel 안에서 `green-smart-rebuild-panel` host가 shrink-to-content 폭으로 잡히면, 내부 모든 `width:100%`는 그 좁은 host 기준 100%에 머문다.

## 목표

- non-admin / HA sidebar hidden 모드에서는 Green Smart root가 실제 viewport 폭을 사용한다.
- admin / HA sidebar visible 모드에서는 기존처럼 HA content area 안에서 100%를 사용해 overflow를 피한다.
- 도메인 카드 내부 hero/title/text/grid에는 v1.14.93의 강제 stretch를 다시 넣지 않는다.

## 적용

### 1. Host width policy

`GreenSmartRebuildPanel` custom element host에 다음 정책을 적용한다.

```text
data-r7-host-width-policy="viewport-fill"
data-r7-host-display="block-fill"
```

style:

```css
display:block;
width:100%;
min-width:0;
max-width:none;
box-sizing:border-box;
```

### 2. Mode-aware content width

`_r7ContentWidthVarsStyle(contentWidthMode)`를 mode-aware로 바꾼다.

- `ha-sidebar-hidden`: `--r7-content-main-width:100dvw`
- `ha-sidebar-visible`: `--r7-content-main-width:100%`

이 값을 root main과 shell main이 동일하게 사용한다.

### 3. 내부 card 안전 규칙 유지

v1.15.18의 안전 규칙은 유지한다.

- domain frame/content card: `safe-fill`
- hero: `safe-natural`
- 금지: `max-width:none`, `justify-self:stretch`, `align-self:stretch`, `grid-template-columns:minmax(0,1fr)`를 hero/frame 강제 stretch로 재도입하지 않음

## 검증

1. Source contract
   - host width policy method/markers 존재.
   - `_r7ContentWidthVarsStyle(contentWidthMode)`가 hidden/visible mode를 분기.
   - hidden 모드에서 `--r7-content-main-width:100dvw` 렌더.
   - visible 모드에서 `--r7-content-main-width:100%` 렌더.
2. Render contract
   - `green-smart-rebuild-panel` instance style에 block/fill host policy가 적용됨.
   - hidden mode HTML에 root/shell width가 `100dvw`로 표시됨.
   - domain card는 safe-fill, hero는 safe-natural 유지.
3. Focused pytest + JS/Python syntax.
4. Full pytest.
5. Prod 반영 후 served smoke:
   - version 1.15.18
   - host policy marker 존재
   - hidden mode width policy marker 존재
   - safe-fill/safe-natural 유지
   - v1.14.93 bad marker 부재
6. HA readiness 및 안정 로그 확인.

## 완료 기준

- 스크린샷의 오른쪽 큰 빈 공간이 root width shrink 때문에 발생하지 않는다.
- Green Smart 도메인 카드가 오른쪽 content 영역을 실제로 넓게 사용할 수 있다.
- v1.14.93의 텍스트 세로 찢어짐 회귀가 재발하지 않는다.
