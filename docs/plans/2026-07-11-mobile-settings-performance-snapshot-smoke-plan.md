# v1.15.42 모바일 설정 성능 snapshot/smoke 계획

## 목표

v1.15.42는 모바일 설정 상호작용 구간별 성능 marker를 기록한다. v1.15.42의 목표는 그 marker를 운영/브라우저/테스트에서 한 번에 읽고 판정할 수 있는 snapshot/summary 계층을 추가하는 것이다.

## 배경

개별 marker만 있으면 다음 값을 각각 찾아야 한다.

- `data-r7-perf-settings-tab-active-ms`
- `data-r7-perf-settings-panel-visible-ms`
- `data-r7-perf-settings-dirty-patch-ms`
- `data-r7-perf-settings-modal-open-ms`
- `data-r7-perf-settings-interaction-complete-ms`

운영 확인에서는 이 값을 한 번에 수집하고, SLA over 여부를 바로 봐야 한다.

## 구현 방향

### 1. snapshot helper

```js
_snapshotR7SettingsPerf()
```

반환 내용:

- eventKind
- lastLabel
- tabActiveMs/Sla
- panelVisibleMs/Sla
- shellVisibleMs/Sla
- dirtyPatchMs/Sla
- modalOpenMs/Sla
- interactionCompleteMs/Sla
- summary

### 2. summary marker

```text
data-r7-perf-settings-summary="all-under-sla | has-over-sla | no-samples"
data-r7-perf-settings-snapshot-json="..."
data-r7-perf-settings-snapshot-updated="true"
```

### 3. record helper 연결

`_recordR7SettingsPerf()`가 값을 기록할 때마다 snapshot/summary를 갱신한다.

### 4. self-smoke helper

```js
_runR7SettingsPerfMarkerSmoke()
```

테스트/운영 콘솔에서 helper가 marker 기록과 snapshot 갱신을 정상 수행하는지 빠르게 확인할 수 있게 한다. 실제 UI 클릭을 대체하는 것이 아니라, marker 수집 파이프라인의 자체 점검용이다.

## 성공 기준

- snapshot helper 존재
- summary marker 존재
- record helper에서 snapshot 갱신
- self-smoke helper 존재
- Node 계약 테스트에서 helper를 호출해 `all-under-sla` snapshot 확인
- 전체 테스트 통과
- Prod served smoke 통과
- GitHub Release v1.15.42 완료
