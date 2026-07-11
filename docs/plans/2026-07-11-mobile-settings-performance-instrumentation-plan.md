# v1.15.34 모바일 설정 성능 계측 계획

## 목표

v1.15.17~21에서 모바일 설정 도메인은 persistent shell/panel cache, compact dirty patch, lazy modal cache, delegated event 구조로 전환되었다. v1.15.34의 목표는 이 구조가 실제 사용자 체감 기준을 만족하는지 확인할 수 있도록 DOM marker 기반 성능 계측을 추가하는 것이다.

## 측정 기준

- 하위탭 active 표시: 100ms 이내
- cached panel visible: 150ms 이내
- dirty patch 완료: 500ms 이내
- modal open 완료: 500ms 이내
- interaction complete: 2000ms 이내

## 구현 지점

1. `_handleR7SettingsDelegatedClick(event)`
   - 클릭 시작 시 `this._startR7SettingsPerf(kind)` 호출
   - subtab 처리 후 `tab-active` 기록

2. `_showR7CachedSettingsPanel(panelSection, tabKey)`
   - cached panel show/hide 완료 후 `panel-visible` 기록

3. `_patchR7CachedSettingsPanelMetricValues(tabKey)`
   - textContent 기반 metric patch 완료 후 `dirty-patch`, `interaction-complete` 기록

4. `_mountR7CachedSettingsModal(type)`
   - modal root mount 완료 후 `modal-open`, `interaction-complete` 기록

5. `_attachR7CachedSettingsDomainShell(workspace)`
   - settings shell attach 완료 후 `shell-visible` 기록

## DOM marker

- `data-r7-perf-settings-event-kind`
- `data-r7-perf-settings-tab-active-ms`
- `data-r7-perf-settings-tab-active-sla`
- `data-r7-perf-settings-panel-visible-ms`
- `data-r7-perf-settings-panel-visible-sla`
- `data-r7-perf-settings-dirty-patch-ms`
- `data-r7-perf-settings-dirty-patch-sla`
- `data-r7-perf-settings-modal-open-ms`
- `data-r7-perf-settings-modal-open-sla`
- `data-r7-perf-settings-interaction-complete-ms`
- `data-r7-perf-settings-interaction-complete-sla`

## 주의 사항

- `console.log`를 사용하지 않는다.
- `performance.measure/getEntriesByName` 남용 없이 `performance.now()`만 사용한다.
- 계측 자체가 렌더/전환을 느리게 만들지 않도록 단순 attribute marker만 기록한다.

## 성공 기준

- 성능 helper와 marker가 served JS에 존재한다.
- 전체 테스트 통과.
- Prod served smoke 통과.
- GitHub Release v1.15.34 완료.
