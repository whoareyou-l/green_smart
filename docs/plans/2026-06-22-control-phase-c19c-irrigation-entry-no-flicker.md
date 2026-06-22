# Control Phase C19C — 관수설정 초기 진입 no-flicker hydration

> 기준 버전: v1.9.22

## 배경

관수설정 페이지에 처음 들어갈 때 localStorage fallback 화면이 먼저 렌더링된 뒤 API 응답이 도착할 때마다 전체 화면이 여러 번 재렌더되어, 사용자에게 화면이 깜박였다가 정상으로 돌아오는 것처럼 보였다.

## Root cause

- `_renderIrrigSettingsPage()`가 렌더 중 `_getScopedControlState("irrigation")`를 호출한다.
- `_getScopedControlState()`는 캐시가 없으면 렌더 중 `_fetchScopedControlStateFromApi()`를 비동기로 시작했다.
- `_fetchScopedControlStateFromApi()`, `_fetchZoneAiOutputs()`, `_fetchZoneFinalTargets()`는 응답마다 `_pageRendered = null; _update()`를 호출했다.
- 관수 페이지에는 strategy preview/final target/log/state summary 등 여러 카드가 있으므로 초기 진입 직후 전체 DOM 교체가 연속 발생했다.

## Fix

- `_zoneControlHydrationInFlight` 추가.
- `_requestZoneControlHydration(domain)`로 초기 데이터 hydration을 한 번으로 묶음.
- 초기 hydration fetch는 `{ patchOnly: true }`로 수행.
- 응답마다 전체 화면을 재렌더하지 않고, 모든 hydration 작업이 settle된 뒤 현재 페이지가 그대로이고 dirty editor가 없으면 카드 단위 patch만 수행.
- `_fetchScopedControlStateFromApi`, `_fetchZoneAiOutputs`, `_fetchZoneFinalTargets`에 `patchOnly` 옵션 추가.
- `_renderZoneAiFinalTargetCard()`의 render-time fetch도 patchOnly로 변경.

## UX effect

- 관수설정 초기 진입 시 localStorage fallback 화면이 즉시 표시된다.
- API 데이터가 도착해도 전체 화면을 여러 번 갈아엎지 않는다.
- 사용자가 입력 중이면 patch도 건너뛰어 dirty state를 보존한다.

## Regression test

- `test_irrigation_page_initial_hydration_does_not_full_rerender_contract`

## Verification

- `pytest -q` → 121 passed
- `python3 -m py_compile custom_components/green_smart/*.py` → pass
- `node --check custom_components/green_smart/panel/green-smart-panel.js` → pass
- `git diff --check` → pass
