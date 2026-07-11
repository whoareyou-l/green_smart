# v1.15.35 모바일 즉시 패널 렌더 계획

## 사용자 피드백

- v1.15.35에서 화면은 표시되지만 실제 내용 전환까지 너무 오래 걸린다.
- 사용자는 탭/도메인 버튼을 누르면 바로바로 실제 화면이 바뀌는 UX를 원한다.

## 원인

v1.15.10~v1.15.35의 2단계 placeholder/hydration 구조는 freeze를 피하려는 목적이었지만, 실제 모바일 HA WebView에서는 사용자가 `화면을 전환하는 중입니다`를 오래 보게 만들었다. 또한 설정의 `사용자·권한` 탭을 눌렀을 때 이전 `온실·구역` 맥락이 남아 보이면 진짜 화면 전환처럼 느껴지지 않는다.

## 수정 방침

1. 모바일 fast mode에서 pending placeholder를 렌더하지 않는다.
2. active 탭의 실제 패널을 즉시 렌더한다.
3. inactive 탭은 계속 template로 defer해서 전체 패널 렌더 비용은 막는다.
4. 설정 탭은 클릭 즉시 해당 탭의 실제 카드/요약이 보이게 한다.
5. `화면을 전환하는 중입니다` 문구는 served JS에서 제거한다.

## 성공 기준

- 모바일 탭 클릭 시 placeholder 없이 실제 active panel이 바로 렌더된다.
- `data-r7-mobile-immediate-panel-render="true"` marker가 served JS에 존재한다.
- `화면을 전환하는 중입니다` 문구가 served JS에 없다.
- 전체 테스트, Prod served smoke, GitHub Release 완료.
