# v1.15.60 장치 추가 버튼 HA 기기 페이지 모달 미반영 분석/수정 계획

## 사용자 증상

설정 페이지 `장치 연결 작성` 하위탭의 `장치 추가` 버튼을 누르면 기대한 HA 기기 페이지 iframe 모달이 아니라 기존 `장치 생성` 팝업 모달이 열린다.

## 기대 동작

- `장치 추가` 카드의 버튼은 `data-r7-settings-ha-devices-page-button`을 가져야 한다.
- 클릭 시 `_openSettingsHaDevicesPageModal()`이 실행되어야 한다.
- 팝업에는 `data-r7-settings-ha-devices-page-modal="true"`와 iframe `src="/config/devices/dashboard"`가 있어야 한다.
- 기존 내부 Green Smart 장치 생성 모달 `_openSettingsDeviceCreateModal()`은 이 카드 클릭 경로에서 실행되면 안 된다.

## 가능한 원인 분류

### A. 운영 반영 불일치

제품 repo에는 v1.15.60 코드가 있으나 운영 HA가 실제로 서빙하는 bind source/container JS는 이전 JS일 수 있다.

검증:
- repo JS marker 확인
- deploy bind source JS marker 확인
- container `/config` JS marker 확인
- 실제 HTTP served JS marker 확인

판정:
- deploy/container/served 중 하나라도 `data-r7-settings-ha-devices-page-button`이 없으면 반영 불일치.

### B. WebView/브라우저/HA module cache

served JS는 v1.15.60인데 모바일 WebView가 기존 custom element/module을 계속 사용하면 이전 DOM이 보일 수 있다.

검증:
- 실제 화면 custom element name이 `green-smart-rebuild-panel-v1-15-39`인지 확인
- served module URL이 `?v=1.15.60`인지 확인
- 필요 시 v1.15.60으로 version bump해 cache bust.

### C. settings persistent DOM cache stale panel

settings cache가 브라우저 메모리에서 이전 `device-sensor-mapping` panel DOM을 들고 있고, 새 JS가 hydrate를 강제하지 않으면 기존 `data-r7-settings-device-create-button`이 남을 수 있다.

검증:
- 실제 DOM의 `device-create` action card snippet에서 old/new marker 확인
- `_hydrateR7CachedSettingsPanel()`이 dirty 상태에서 실제 detail subpage HTML로 replace하는지 확인

수정:
- version bump 시 settings panel cache를 새 version 기준으로 강제 dirty 처리하거나, hydration 완료 후 old marker가 남으면 강제 재hydrate.

### D. 이벤트 경로 충돌

새 버튼과 old 버튼이 같은 카드에 동시에 있거나, event binding이 old selector를 우선 처리하면 `_openSettingsDeviceCreateModal()`이 실행될 수 있다.

검증:
- 카드 snippet에 old/new marker 동시 존재 여부 확인
- click 후 host marker `data-r7-settings-ha-devices-page-open` 확인
- `장치 생성` 모달 marker 존재 여부 확인

수정:
- 장치 추가 카드에서 old marker 제거 보장
- old handler는 유지하되 해당 카드에서는 사용할 수 없게 함
- new handler가 명확히 HA devices page modal만 mount하도록 함

## 현재 1차 발견

- repo rebuild JS에는 `data-r7-settings-ha-devices-page-button` 존재.
- deploy bind source rebuild JS에는 `data-r7-settings-ha-devices-page-button`이 없음.
- deploy bind source에는 기존 `data-r7-settings-device-create-button`이 있음.

따라서 1차 유력 원인은 운영 bind source/served JS 반영 불일치다.

## 작업 순서

1. repo/deploy/container/served JS 네 곳의 version/marker를 표로 비교한다.
2. prod bind source가 root-owned이면 `docker cp` 또는 container 내부 복사로 실제 `/config`를 갱신하고 host bind에도 반영됐는지 재확인한다.
3. 반영 불일치가 지속되면 v1.15.60으로 bump하여 제품 repo, deploy source, container served를 강제 정렬한다.
4. stale DOM cache까지 방지하기 위해 `device-sensor-mapping` panel이 old `data-r7-settings-device-create-button`을 포함하면 강제 real-card rehydrate하는 marker/guard를 추가한다.
5. 실제 HA served-origin smoke:
   - `장치 연결 작성` 하위탭 렌더
   - `장치 추가` 버튼 클릭
   - old button false
   - HA devices modal true
   - iframe src `/config/devices/dashboard`
   - `장치 생성` modal false
6. 전체 pytest.
7. 운영 HA 재시작 후 served JS 및 HA 로그 확인.
