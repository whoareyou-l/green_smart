# v1.15.56 도메인 카드 안전 가로폭 채우기 계획

## 문제

v1.14.93에서는 도메인 카드 가로폭을 채우기 위해 hero/card/panel 내부까지 `width:100%`, `max-width:none`, `justify-self:stretch`, `align-self:stretch`, `grid-template-columns:minmax(0,1fr)`를 강제로 적용했다. 실제 Home Assistant shell/grid 안에서는 일부 영역이 shrink-to-fit/0폭 기준으로 계산되어 hero 텍스트가 세로로 찢어지는 회귀가 발생했다.

v1.15.56에서 해당 강제 stretch를 되돌려 UI는 안정화했지만, 도메인 카드 외곽이 사용 가능한 가로폭을 충분히 쓰지 못하는 문제가 남았다.

## 목표

- 오른쪽 Green Smart content column 안에서 도메인 카드 외곽은 가로폭을 꽉 채운다.
- 내부 hero/title/text/tabs/panel content는 강제 stretch하지 않아 v1.14.93 회귀를 막는다.
- HA sidebar hidden/admin visible 상태와 관계없이 shell/page/workspace 폭 정책은 유지한다.

## 적용 대상

가로폭 fill 적용 대상은 정확히 두 곳으로 제한한다.

1. `data-r7-domain-visual-frame`
   - 도메인 hero + content card 전체를 감싸는 외곽 frame.
   - 적용: `width:100%; max-width:100%; box-sizing:border-box;`
   - marker: `data-r7-domain-frame-width="safe-fill"`

2. `data-r7-domain-content-card`
   - 하위탭/zone/panel을 감싸는 흰색 카드.
   - 적용: `width:100%; max-width:100%; box-sizing:border-box;`
   - marker: `data-r7-domain-content-card-width="safe-fill"`

## 비적용 대상

아래에는 가로폭 stretch 스타일을 직접 넣지 않는다.

- `data-r7-domain-visual-hero`
- hero 내부 flex row
- title/kicker/summary 텍스트 block
- subtab row
- zone context row
- panel 내부 grid/cards

Hero marker는 계속 `data-r7-domain-visual-hero-width="safe-natural"`로 둔다.

## 금지 규칙

계약 테스트로 아래 회귀를 금지한다.

- `data-r7-domain-card-width-policy="fill-available-content-column"`
- `data-r7-domain-content-panel-width="viewport"`
- hero에 `width:100%` 직접 적용
- hero/frame에 `justify-self:stretch` 또는 `align-self:stretch` 직접 적용
- hero/frame에 `grid-template-columns:minmax(0,1fr)` 직접 적용
- 카드 내부에서 `100dvw` 사용
- 카드 내부에서 `max-width:none` 사용

## 검증

1. Source contract
   - safe-fill marker 존재.
   - hero safe-natural marker 존재.
   - 금지 스타일/마커 부재.
2. Node render smoke
   - 실제 렌더 HTML에 frame/content card safe-fill, hero safe-natural이 동시에 존재.
   - v1.14.93 bad marker가 없다.
3. JS syntax check
4. 관련 집중 pytest
5. 전체 pytest
6. Prod 반영 후 served smoke
   - manifest/panel version `1.15.56`.
   - safe-fill marker 존재.
   - bad marker/style 부재.
7. HA readiness + 안정 로그 확인

## 완료 기준

- 도메인 카드 외곽은 오른쪽 content column의 사용 가능 폭을 채운다.
- hero 텍스트가 세로로 찢어지지 않는다.
- v1.14.93의 잘못된 강제 stretch 패턴이 재도입되지 않는다.
- Prod 반영 및 GitHub release까지 완료한다.
