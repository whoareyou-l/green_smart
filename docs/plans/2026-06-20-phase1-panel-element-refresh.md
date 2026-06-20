# Green Smart Phase 1C Panel Element Refresh Plan

> 기준 버전: v1.9.3
> 목표: 마스터 플랜의 panel 갱신 정책을 제어 페이지부터 계약화한다.

## Scope

Phase 1C는 전체 panel을 완전히 리팩터링하지 않고, 환경/관수/장치제어 페이지의 API 카드부터 5초 요소별 refresh loop를 적용한다.

## Implemented contract

- `PANEL_ELEMENT_REFRESH_MS = 5000`
- `this._zoneElementRefreshInterval`
- `_startZoneElementRefresh()` / `_stopZoneElementRefresh()`
- `_refreshZoneControlElements({ patchOnly: true })`
- `_isZoneControlPage()`
- `_hasDirtyZoneControlEditor()`
- `_patchZoneControlElementCards(domain)`
- `_replaceZoneControlCard(selector, html)`

## Refreshed cards

- `data-zone-interlock-settings-card`
- `data-zone-entity-state-summary-card`
- `data-zone-execution-log-card`

## Dirty state protection

If the operator is editing a textarea/input/select or a zone-control editor card, the 5-second refresh loop skips the tick to preserve unsaved input.

## Explicit non-goals

- Do not change chart refresh cadence.
- Do not change weather/watchdog cadence.
- Do not wire SafetyGuard execution yet.
- Do not force full page `_update()` from the periodic refresh section.

## Verification

```text
pytest: 101 passed
node --check: pass
py_compile: pass
```
