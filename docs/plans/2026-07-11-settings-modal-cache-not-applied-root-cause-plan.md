# v1.15.56 설정 모달 취소 후 실제 카드 미반영 원인 분석/수정 계획

## 사용자 증상

- 설정 페이지 하위탭 `온실·구역`에서 `온실 추가` 모달 진입 후 하단 `취소`를 누르면 내용카드가 요약에서 실제 카드로 전환되지 않는다.
- 이전 수정(v1.15.34/v1.15.56)이 실제 화면에 반영되지 않은 것으로 보인다.

## 확인된 현재 상태

### 제품 repo `/home/smartfarm/green_smart`

- Git HEAD: `a023289e7 fix settings modal cancel cache close hydration`
- Tag: `v1.15.56`
- JS source contains:
  - `REBUILD_VERSION = "1.15.56"`
  - `settings-modal-close-cache-only`
  - `_closeR7SettingsRecordModalFromButton`
  - record workflow close 차단: `data-r7-record-modal-mode="settings-create"`

### Prod HA container `/config`

- `/config` is not the product repo. It is a bind mount:
  - host source: `/home/smartfarm/green_smart-deploy/prod/homeassistant/config`
  - container destination: `/config`
- Container file still contains:
  - `REBUILD_VERSION = "1.15.33"`
  - `manifest.json` version `1.15.33`
- Served URL also lacks v1.15.56 markers:
  - `/green_smart_panel/rebuild/green-smart-rebuild-panel.js?v=1.15.56`
  - served content is effectively v1.15.33 static file.

## Root cause

The code fixes were committed to the product repository but not copied into the actual prod HA bind-mounted config path. HA serves static panel files from the bind-mounted `/config/custom_components/green_smart`, not directly from `/home/smartfarm/green_smart`.

Therefore earlier source-level tests and product-repo release were valid, but the user's live browser kept receiving v1.15.33. The user correctly observed that the fix was not reflected.

## Secondary code-path risk already addressed in product repo

The modal close bug itself has two parts:

1. Settings modal bottom cancel (`data-r7-settings-detail-action-modal-close`) must call cache-only close and force real-card hydration.
2. Shared record workflow close binding (`data-r7-record-modal-close` -> `closeR7RecordWorkflowModal()` -> `this.render()`) must ignore settings-create modals, or it can re-trigger full render and revert settings panels to summary state.

## Delivery plan

1. Inspect deploy bind source files at `/home/smartfarm/green_smart-deploy/prod/homeassistant/config/custom_components/green_smart`.
2. Copy product repo `custom_components/green_smart` into the prod bind source, not only into the container runtime view.
3. Confirm host bind source and container `/config` hashes match the product repo.
4. Restart HA.
5. Fetch served module URL and assert:
   - `REBUILD_VERSION = "1.15.56"`
   - `green-smart-rebuild-panel-v1-15-35`
   - `settings-modal-close-cache-only`
   - `_closeR7SettingsRecordModalFromButton`
   - settings-create record workflow close guard exists.
6. Run a served/browser smoke against the actual served JS path, not a local file server, for:
   - settings domain open
   - `greenhouse-zones`
   - `온실 추가`
   - bottom cancel
   - cached panel remains `real-detail-subpage-html` and `real-settings-detail-card`
   - no `data-r7-mobile-light-subtab-panel="true"`
   - no `data-r7-settings-cached-patch-panel`
7. Check HA logs for Green Smart/Traceback/Error/Exception.
8. If served smoke passes but user still sees old behavior, add/verify stronger cache-busting by bumping to v1.15.56 and ensuring panel registration module URL changes in HA frontend metadata.

## Release criteria

- Product repo and deploy bind source are both at the same version.
- Container `/config` and served URL show the new markers.
- Real served browser smoke passes for bottom cancel.
- Full tests remain passing or only skipped if no code changed after v1.15.56.
