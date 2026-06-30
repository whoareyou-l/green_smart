# Green Smart Current UI, Design System, Navigation and Page Contract

> 기준 버전: `v1.13.4`
> 기준 파일: `custom_components/green_smart/panel/green-smart-panel.js`
> 목적: 앞으로 UI/UX, 사이드바, 페이지, 하위탭, 설정값, 사용자 선호 디자인을 수정할 때 반드시 참조하는 현재 구현 기준서.

---

## 1. 문서 사용 원칙

이 문서는 **현재 제품에 실제로 들어있는 UI 기준**을 설명한다. 현재 Green Smart UI는 React/Vue 앱이 아니라 Home Assistant custom panel 안에서 실행되는 **Vanilla JavaScript Web Component**다.

| 구분 | 현재 기준 |
|---|---|
| UI runtime | Home Assistant sidebar custom panel |
| UI 구현 | Vanilla JS Web Component |
| Custom element | `green-smart-panel` |
| 소스 파일 | `custom_components/green_smart/panel/green-smart-panel.js` |
| module URL | `/green_smart_panel/green-smart-panel.js?v={manifest.version}` |
| 현재 version | `1.12.58` |

작업 시 우선순위:

1. 실제 구현 기준은 `green-smart-panel.js`다.
2. UI 요소를 어디에 배치할지, 어떤 역할이 볼 수/실행할 수 있는지는 [`ui-information-architecture-and-rbac.md`](ui-information-architecture-and-rbac.md)를 먼저 따른다.
3. 이 문서는 해당 파일에서 추출한 상세 현재 UI 기준이다.
4. `docs/design/irrigation-control-page.md`, `docs/design/device-control-page.md`는 현재 구현과 상당히 일치하지만 일부 API 경로/프레임워크 초안은 미래 설계 흔적이다.
5. UI 동작 변경 후에는 manifest/panel `VERSION`을 함께 올려 HA/WebView cache 문제를 방지한다.

---

## 1.1 정보구조/RBAC 기준

Green Smart의 최종 사용자인 농장주와 농장직원은 컴퓨터 전공자가 아니다. 따라서 UI는 기능을 개발 순서대로 나열하지 않고, 농장 운영 흐름과 역할별 권한에 맞게 정리한다.

R1 기준 상세 문서:

```text
docs/design/ui-information-architecture-and-rbac.md
```

모든 UI 요소는 아래 bucket 중 하나로 분류한 뒤 배치한다.

```text
조회 / 기록 / 전략 / 실행 / 안전 / 고급설정
```

역할별 UI 상태는 `visible_enabled`, `visible_disabled`, `summary_only`, `hidden` 중 하나로 정의한다. Admin/System은 `고급설정` bucket의 기본 위치이며, `entity_id`, PID, raw JSON, API key/token, Central activation, DB/API diagnostics는 농장주/직원 기본 화면이 아니라 Admin/System 또는 admin-only 고급 접힘 영역에 둔다.

핵심 역할:

| role | 한국어 | UI 방향 |
|---|---|---|
| `admin` | 어드민 | 설치, 시스템, DB/API/HA, 권한, 고급 설정 |
| `farm_owner` | 농장주 | 상태 확인, 전략 승인, 중요 실행, 리포트/이력 |
| `farm_staff` | 농장직원 | 오늘 할 일, 기록 입력, 알림 확인, 허용된 수동 조작 |

핵심 배치 원칙:

```text
조회/기록/전략/실행/안전/고급설정을 섞지 않는다.
농장직원에게 entity_id, PID, raw JSON, API key를 노출하지 않는다.
권한이 없거나 안전상 실행 불가하면 이유를 표시한다.
위험 실행은 항상 SafetyGuard 상태와 운영자 확인 근처에 둔다.
```

RB-005 Safety/Execution UI proximity (`v1.13.4`) 기준:

```text
data-zone-execution-proximity-safety-summary
SafetyGuard/Interlock/Fail Safe summary near execution-capable controls
Dry Run/운영자 최종 실행 버튼 앞에서 SafetyGuard → Interlock → Fail Safe → State verification 순서 표시
virtual rehearsal before physical device hookup
실행 semantics 변경 없음
API/DB 변경 없음
device execution 변경 없음
actual service call authority 변경 없음
```

---

## 2. 사용자 선호 디자인 방향

사용자가 선호하고 현재 코드가 따르는 UI 방향은 다음과 같다.

### 2.1 제품 톤

```text
Modern SaaS greenhouse dashboard
Home Assistant 내부 패널이지만 독립 SaaS 제품처럼 보이는 카드형 운영 화면
AI보다 안전/인터록/운영자 확인을 우선하는 현장 친화 UI
```

### 2.2 디자인 키워드

- Green Smart 브랜드 그린 중심
- 카드형 정보 구조
- 운영자가 즉시 판단할 수 있는 KPI/상태 badge/pill
- 위험 동작 전 Dry Run, SafetyGuard, Fail Safe, 운영자 확인 강조
- 모바일 WebView에서도 사용할 수 있는 compact topbar와 가로 스크롤 탭
- 입력 중 화면이 깜박이거나 reset되지 않는 no-flicker/dirty-state 보존

### 2.3 공통 메인 포맷

v1.9.70부터 작물 설정 / 환경 제어 / 관수 제어 / 장치 제어 / Admin/System 페이지는 `_renderCommonMainPageShell(...)`을 공통 진입 포맷으로 사용한다.

공통 메인 포맷은 다음 구조를 기본으로 한다.

```text
hero + scope/status summary + content card
```

계약 marker:

```text
data-common-main-page
data-common-main-hero
data-common-main-body
data-common-main-page="crop"
data-common-main-page="environment"
data-common-main-page="irrigation"
data-common-main-page="device"
data-common-main-page="admin-system"
```

적용 대상:

| page key | page |
|---|---|
| `crop` | 작물 설정 |
| `environment` | 환경 제어 |
| `irrigation` | 관수 제어 |
| `device` | 장치 제어 |
| `admin-system` | Admin/System |

원칙:

- 페이지마다 hero 위치와 본문 카드 시작 위치를 통일한다.
- 제어 페이지는 scope/status summary를 hero 아래, content card 위에 둔다.
- Admin/System은 RBAC/role summary를 content body의 첫 카드로 둔다.
- 공통 포맷은 실행 권한을 부여하지 않으며, 권한/안전 판단은 기존 RBAC/SafetyGuard 계약을 따른다.

### 2.4 색상 기준

| 목적 | 색상 |
|---|---|
| 배경 | `#F8FAF8` |
| 카드 | `#fff` |
| Primary green | `#51AE60` |
| Light green | `#DFF3E2`, `#f5faf6`, `#f3fbf4` |
| 기본 텍스트 | `#24323F` |
| 보조 텍스트 | `#7a9780`, `#5d7d64` |
| 경고 | `#f4b400`, `#fff8e8` |
| 오류 | `#c0392b`, `#fdecea` |

### 2.4 공통 UI 패턴

| 패턴 | 기준 |
|---|---|
| 카드 | `.gs-card`, border-radius 16px, soft shadow |
| 탭 | `.c-tab`, active 상태는 light green + primary green |
| 입력 | 둥근 input/select, focus 시 green border/glow |
| 상태 | pill/badge/muted helper text 적극 사용 |
| 애니메이션 | page fadeUp, popup popIn/slideUp, weather modal hover lift |
| Desktop nav | 70px 좌측 고정 sidebar |
| Mobile nav | `.sb-mobile` topbar + 가로 스크롤 메뉴 |

---

## 3. 전체 화면 상태 흐름

`_update()`는 상태에 따라 화면을 분기한다.

| 상태 | 렌더 함수 | 설명 |
|---|---|---|
| loading/saving | `_renderLoading()` | 불러오는 중/저장 중 |
| `wizard_step1` | `_renderWizardPage()` | 장치/가상모드 선택 |
| `wizard_step2` | `_renderWizardPage()` | 구역/WeatherFlow 설정 |
| `wizard_step3` | `_renderWizardPage()` | 확인/central activation |
| `settings` | `_renderSettingsPage()` | PLC/구역/날씨/central 설정 |
| `dashboard` + `home` | `_renderHomePage(sim)` | 홈 대시보드 |
| `dashboard` + `crop` | `_renderCropSettingsPage()` | 작물 설정 |
| `dashboard` + `environment` | `_renderEnvSettingsPage()` | 환경 제어 |
| `dashboard` + `irrigation` | `_renderIrrigSettingsPage()` | 관수 제어 |
| `dashboard` + `device` | `_renderDeviceControlPage()` | 장치제어 |

---

## 4. Sidebar / Mobile navigation

### 4.1 Desktop sidebar 구성

`_renderSidebar()` 기준.

1. Brand
   - icon: `mdi:leaf`
2. Main navigation
3. Spacer
4. Bottom actions
   - 설정
   - 로그아웃

### 4.2 Sidebar 메뉴

| page key | 라벨 | 아이콘 | tooltip/목적 |
|---|---|---|---|
| `home` | 홈 | `mdi:home-variant` | 온실 현황 · 환경 추세 · 날씨 확인 |
| `crop` | 작물 설정 | `mdi:sprout` | 작물 종류 · 생육 단계 · 재배 방식 설정 |
| `environment` | 환경 제어 | `mdi:thermometer-lines` | 온도 · 습도/VPD · CO₂ · AI 보정 제어 |
| `irrigation` | 관수 제어 | `mdi:water` | 기본 관수 인터록 · AI 보정 · 양액 전략 |
| `device` | 장치제어 | `mdi:cog-box` | 설비 운영 · 수동 제어 · 인터록 · Fail Safe |

### 4.3 Sidebar bottom actions

| 기능 | 아이콘 | 동작 |
|---|---|---|
| 설정 | `mdi:cog` | `_openSettings()` |
| 로그아웃 | `mdi:logout` | `window.location.href = "/"` |

### 4.4 Mobile topbar

모바일에서는 sidebar가 `.sb-mobile` topbar로 전환된다.

- row1
  - leaf brand
  - alert pill
  - settings button
  - logout button
- row2
  - desktop과 동일 nav item을 가로 스크롤 버튼으로 표시

모바일 최적화:

- 환경 chart, 관수 chart, alerts card 일부를 숨겨 초기 가독성 확보
- zone status section은 유지

---

## 5. Home dashboard

렌더 함수: `_renderHomePage(sim)`

### 5.1 구성 순서

1. Virtual mode badge
2. Home operator-first action summary card
   - 위험 알림
   - 오늘 할 일
   - 조치 필요
   - 현재 온실 상태 숫자 chip
3. KPI strip
4. 환경 trend chart + alerts + weather card
5. 관수 chart + 목표 환경 + 관수 계획
6. zone cards
7. 장비 상태 grid + zone selector

### 5.1.1 Home action summary API/Dry Run 기준

Home 첫 카드의 상태 chip을 누르면 `_openHomeStatusPopup(key)`가 상태 팝업을 연다. 팝업 버튼은 다음 baseline만 수행한다.

| 버튼 | 실제 연결 | 안전 기준 |
|---|---|---|
| `확인` | `POST green_smart/zones/safety-guard-events/ack` | SafetyGuard event lifecycle/audit log에 확인 기록 |
| `조치 완료 기록` | `POST green_smart/zones/safety-guard-events/clear` | 조치 완료 lifecycle/audit log 기록 및 notification clear 흐름 사용 |
| `장치 정지 Dry Run` | `POST green_smart/zones/execute-final-targets` with `domain: "device"`, `dry_run: true` | 실제 장비 실행 안 함. device final-target/Mapping/SafetyGuard 사전점검만 수행 |
| `제한 실행 Dry Run` | `POST green_smart/zones/execute-final-targets` with status domain, `dry_run: true` | 실제 장비 실행 안 함. Control Mode/Limited Auto/SafetyGuard 사전점검만 수행 |

구현 marker:

```text
_homeAcknowledgeStatusAction(item)
_homeCompleteStatusAction(item)
_homePreviewStopDeviceDryRun(item)
_homePreviewLimitedExecutionDryRun(item)
data-home-action-result
```

Home에서 실제 장비 실행은 아직 연결하지 않는다. 실제 실행은 각 제어 페이지의 운영자 확인/권한/Control Mode/SafetyGuard/Interlock/fail-safe 경로를 통과해야 한다.

### 5.2 환경 KPI series

| key | label | unit | color |
|---|---|---|---|
| `temp` | 온도 | °C | `#51AE60` |
| `humidity` | 습도 | % | `#4A90D9` |
| `co2` | CO₂ | ppm | `#E06B2E` |
| `vpd` | VPD | kPa | `#9B59B6` |
| `light` | 광량 | μmol | `#F4B400` |

### 5.3 관수 chart series

| key | label | unit |
|---|---|---|
| `amount` | 관수량 | L/m² |
| `drain` | 배액량 | L/m² |
| `moisture` | 함수율 | % |
| `feed_ph` | 급액 pH |  |
| `feed_ec` | 급액 EC | mS |
| `drain_ph` | 배액 pH |  |
| `drain_ec` | 배액 EC | mS |

### 5.4 장비 grid

| key | label | icon |
|---|---|---|
| `roof_window` | 천창 | `mdi:window-open` |
| `side_window` | 측창 | `mdi:window-open-variant` |
| `shade_screen` | 차광스크린 | `mdi:roller-shade` |
| `thermal_curtain` | 보온커튼 | `mdi:curtains` |
| `irrigation` | 관수 | `mdi:water` |
| `nutrient_machine` | 양액기 | `mdi:flask` |
| `circulation_fan` | 유동팬 | `mdi:fan` |
| `co2_generator` | CO₂발생기 | `mdi:molecule-co2` |

장비 클릭 시 `_showPopup(key)`가 열리고 자동/수동 모드, 0~100% slider 제어가 가능하다.

---

## 6. 초기 설정 Wizard

렌더 함수:

- `_renderWizardPage()`
- `_renderModbusStep()`
- `_renderZonesStep()`
- `_renderReviewStep()`
- `_renderCentralActivationCard()`

### 6.1 단계

| step | state | 목적 |
|---|---|---|
| 1 | `wizard_step1` | 실제 장치/가상 장치 선택 및 PLC 접속 정보 |
| 2 | `wizard_step2` | 온실/양액/스티븐슨 스크린/WeatherFlow 구역 설정 |
| 3 | `wizard_step3` | 설정 확인 및 central activation |

### 6.2 Step 1 fields

| id | 설명 |
|---|---|
| `real-mode` | 실제 장치 모드 |
| `virtual-mode` | 가상 장치 모드 |
| `host` | PLC IP 주소 |
| `port` | 포트, 1~65535 |
| `unit_id` | Unit ID, 1~255 |

가상 장치 선택 시 내부값:

```text
host = virtual
port = 502
unit_id = 1
virtual = true
```

### 6.3 Step 2 fields

| id | 설명 | 범위/기본 |
|---|---|---|
| `greenhouse_zones` | 온실 구역 수 | 1~20 |
| `nutrient_zones` | 양액 구역 수 | 1~10 |
| `stevenson_screens` | 스티븐슨 스크린 수 | 1~10 |
| `weatherflow_prefix` | WeatherFlow 접두사 | `sensor.tempest_` |

### 6.4 Step 3 fields

| id | 설명 | 비고 |
|---|---|---|
| `central_base_url` | Central API base URL | 기본 `http://127.0.0.1:18000` |
| `activation_code` | 활성화 코드 | 저장하지 않고 교환에만 사용 |
| `weather_mid_land_reg_id` | 중기예보 날씨 권역 | 기본 `11H10000` |
| `weather_mid_ta_reg_id` | 중기예보 기온 권역 | 기본 `11H10701` |

---

## 7. Settings page

렌더 함수: `_renderSettingsPage()`

### 7.1 목적

- PLC/가상 장치 config 수정
- 온실/양액/스티븐슨 구역 수 수정
- WeatherFlow/KMA 위치 설정
- Central installation 설정 확인

### 7.2 fields

| id | 라벨 | 비고 |
|---|---|---|
| `host` | PLC IP 주소 |  |
| `port` | 포트 | 1~65535 |
| `unit_id` | Unit ID | 1~255 |
| `greenhouse_zones` | 온실 구역 | 1~20 |
| `nutrient_zones` | 양액 구역 | 1~10 |
| `stevenson_screens` | 스티븐슨 스크린 | 1~10 |
| `weatherflow_prefix` | WeatherFlow 접두사 |  |
| `greenhouse_address` | 온실 주소 | 위치 매칭 입력 |
| `nx` | 단기 nx | KMA 격자 |
| `ny` | 단기 ny | KMA 격자 |
| `weather_mid_land_reg_id` | 중기예보 날씨 권역 |  |
| `weather_mid_ta_reg_id` | 중기예보 기온 권역 |  |

### 7.3 actions

| selector | 동작 |
|---|---|
| `#weather_location_match` | 주소 기반 날씨 위치 자동 매칭 |
| `#save` | 설정 저장 |
| `#cancel` | 저장값 복원 후 dashboard 복귀 |

주의: `_bindSettings()`에는 weather/PSIS API key 관리 selector도 존재하지만 현재 `_renderSettingsPage()` HTML에는 해당 입력 DOM이 직접 포함되어 있지 않아 과거/예정 UI 흔적으로 봐야 한다.

---

## 8. Crop settings page

렌더 함수:

- `_renderCropSettingsPage()`
- `_renderSeasonSelector()`
- `_renderCropTabContent()`
- `_renderCropBasicTab()`
- `_renderCropGrowthTab()`
- `_renderCropAiStrategyTab()`
- `_renderCropPestTab()`
- `_renderCropControlTab()`

### 8.1 v1.9.68 Crop Settings IA rule

작물 설정 페이지는 더 이상 카드를 계속 추가하는 방식으로 확장하지 않는다. **하위페이지 1개 = 슬라이스 1개**로 작업하며, 각 슬라이스는 `카드 병합/삭제/추가/접기` 결정을 문서화한 뒤 진행한다. 기준 사용자는 비전문가인 **농장주/농장직원**이며, 모든 하위페이지는 **모바일 + PC 반응형** 레이아웃과 **RBAC** 표시/권한 문구를 고려한다.

공통 UI marker 정책:

```text
data-crop-ui-shell
data-crop-ui-tab-bar
data-crop-ui-subpage-summary
data-crop-ui-kpi-grid
data-crop-ui-action-bar
data-crop-ui-record-list
data-crop-ui-advanced-details
data-crop-ui-empty-state
```

금지 marker / behavior:

```text
data-crop-ui-execute-device
data-crop-ui-train-production-model
cropSettingsAllowExecution
```

### 8.2 하위 탭

v1.9.70부터 작물 설정 하위 탭은 환경 제어 하위 탭과 같은 **아이콘 + 텍스트** 탭 패턴을 사용한다.

v1.9.78부터 사용자 수정 기준에 따라 하위 탭은 **이모티콘(HA icon) + 하위탭명**만 표시한다. 중복 텍스트 emoji fallback(`data-crop-tab-emoji`, `${t.emoji}`)은 렌더하지 않는다.

계약 marker:

```text
data-crop-ui-icon-tab
data-crop-tab-icon
data-crop-tab-label
```

| key | label | icon | 목적 |
|---|---|---|---|
| `basic` | 작기 설정 | `mdi:sprout` | 작기 등록/수정/철거/삭제와 선택 작기 lifecycle 확인 |
| `growth` | 생육조사 | `mdi:clipboard-pulse-outline` | 작물별 dynamic metrics 기록과 최신 조사/다음 조사 안내 |
| `ai` | AI 전략 | `mdi:brain` | 생육 리포트, 모델/인터록/정책/데이터 준비 상태를 read-only로 요약 |
| `pest` | 병해충 예찰 | `mdi:bug-outline` | 발생 위치/심각도 기록과 후속 방제 필요 여부 확인 |
| `control` | 방제 기록 | `mdi:spray` | 약제/PLS/PHI/REI/방제 이력 기록과 안전 확인 |

### 8.3 작기 selector

표시 항목:

- 작물명/품종은 crop key 대신 한국어 crop label로 표시
- zoneName
- 정식일
- 재배 중/철거 완료
- 작물 emoji

작물 emoji:

| crop | emoji |
|---|---|
| tomato | 🍅 |
| paprika | 🫑 |
| strawberry | 🍓 |
| lettuce | 🥬 |
| herb | 🌿 |
| cucumber | 🥒 |
| other | 🌱 |

### 8.4 작기 설정 탭 (`basic`)

현재 기능:

- CSV 내보내기
- 정식 등록
- 작기 수정
- 철거
- 삭제
- 5개 단위 pagination

v1.9.69 UI Slice 1 기준:

- `data-crop-basic-overview-card`: 선택 작기 요약. 농장주/농장직원이 먼저 확인할 내용과 현재 기록 기준을 보여준다.
- `data-crop-basic-selected-season`: 선택된 작물/품종/구역/재배 방식/상태를 한 곳에 병합한다.
- `data-crop-basic-lifecycle-kpis`: 전체 작기, 재배 중, 철거 완료 KPI chip grid.
- `data-crop-basic-next-action`: 다음 행동 안내. 활성 작기는 생육조사·병해충·방제 기록으로 이어가고, 종료 작기는 기록 확인/새 정식 등록으로 안내한다.
- `data-crop-basic-lifecycle-actions`: 상단 action bar. `data-crop-basic-primary-action`은 정식 등록, `data-crop-basic-secondary-actions`는 CSV/수정/철거, `data-crop-basic-danger-actions`는 삭제로 분리한다.
- `data-crop-basic-season-list`: 선택 작기와 중복되는 정보는 줄이고 lifecycle 상태와 필요한 행동을 compact record list로 보여준다.
- `data-crop-basic-empty-state`: 아직 등록된 작기가 없을 때 “정식 등록으로 첫 작기를 추가하세요. 농장주와 직원이 같은 작기 기준으로 기록을 관리합니다.” 문구를 보여준다.

카드 병합/삭제/추가/접기 결정:

| Operation | Applied change |
|---|---|
| Merge | selector/list에 흩어진 선택 작기·상태·구역 정보를 `data-crop-basic-overview-card`로 병합 |
| Delete/Reduce | 목록 row의 중복 강조를 줄이고 lifecycle 상태/action만 남김 |
| Add | 선택 작기 요약, lifecycle KPI, owner-friendly empty state 추가 |
| Split | 수정/철거 보조 action과 destructive delete action을 분리 |

v1.9.72 공통 포맷 재적용 기준:

- `data-crop-basic-summary-card`: v1.9.70 이후 공통 하위페이지 summary alias. 기존 `data-crop-basic-overview-card`는 호환용으로 유지한다.
- `data-crop-basic-latest-season`: 현재 선택/최신 작기 영역. `현재 작기 설정` 제목을 사용한다.
- `data-crop-basic-kpi-grid` + `data-crop-basic-lifecycle-kpis` + `data-crop-ui-kpi-grid`: 작기 KPI grid를 공통 KPI marker와 함께 유지한다.
- `data-crop-basic-record-row`: 작기 목록 row를 compact record row로 표시한다.
- `data-crop-basic-record-summary`: 작물/품종/status summary.
- `data-crop-basic-record-meta`: 정식일/철거일/구역/재배방식/주수 meta.
- `data-crop-basic-record-actions`: row-level 수정/철거/삭제 action group.
- `data-crop-ui-action-bar`: `+ 정식 등록` primary와 `CSV 내보내기` secondary를 분리한다.

UX 문구:

```text
현재 작기 설정
작기 설정도 공통 하위페이지 포맷
농장주와 직원이 같은 작기 기준으로 생육·예찰·방제 기록을 이어갑니다.
작기 목록은 compact record list로 유지하고, 삭제는 danger action으로 분리합니다.
```

향후 유지 방향:

- 새 카드 추가보다 기존 overview/list/action hierarchy를 먼저 보강한다.
- 삭제는 danger action 영역으로 분리하고, primary 정식 등록 버튼과 나란히 경쟁시키지 않는다.

### 8.5 생육조사 탭 (`growth`)

현재 기능:

- CSV 내보내기
- 생육조사 추가
- 조사 row 수정
- 조사 row 삭제
- 작물별 dynamic metrics 기록

v1.9.71 UI Slice 2 기준:

- `data-crop-growth-summary-card`: 최근 생육조사 요약. 농장주와 직원이 같은 작기 기준으로 주간 생육 상태를 확인합니다.
- `data-crop-growth-latest-survey`: 최신 조사일/작기/핵심값 preview. crop key는 `_cropLabelForDisplay(`와 `const latestCropLabel = this._cropLabelForDisplay(`를 거쳐 `토마토`, `상추`, `파프리카`, `오이`, `허브` 같은 한국어로 표시한다.
- `data-crop-growth-next-action`: 다음 조사 안내. 기록이 없으면 첫 주간 기록 입력, 기록이 있으면 다음 주 생육값과 품질·장해 변화 메모를 안내한다.
- `data-crop-growth-kpi-grid` + `data-crop-ui-kpi-grid`: 최신 조사 / 핵심값 수 / 품질·장해 기록 KPI를 `repeat(auto-fit,minmax(...))` 반응형으로 표시한다.
- `data-crop-ui-action-bar`: CSV 내보내기와 생육조사 추가를 action hierarchy로 분리한다.
- `data-crop-growth-primary-action`: 생육조사 추가.
- `data-crop-growth-secondary-actions`: CSV 내보내기.
- `data-crop-growth-record-list` + `data-crop-ui-record-list`: compact record list.
- `data-crop-growth-record-row`: 날짜별 compact row.
- `data-crop-growth-core-metrics`: 핵심 생육값 그룹.
- `data-crop-growth-quality-metrics`: 품질·장해값 그룹.
- `data-crop-growth-note`: 메모 표시.
- `data-crop-growth-edit-action` + `data-growth-edit` + `data-growth-edit="${i}"`: row 수정 action. 기존 생육조사 입력 팝업을 수정 모드로 열고 `_openGrowthEditPopup(` / `PUT", `green_smart/crop/growth/${id}``로 저장한다.
- `data-crop-growth-delete-action`: row 삭제 action.
- `data-crop-ui-empty-state`: 기록 없음 안내.

UX 문구:

```text
최근 생육조사
다음 조사 안내
핵심 생육값
품질·장해값
기록이 많아도 날짜별 핵심값을 먼저 보고, 품질/장해와 메모는 아래에서 확인합니다.
```

작물별 dynamic metrics:

| 작물 | 필드 |
|---|---|
| 토마토 | 초장, 엽수, 줄기 경, 화방 위치, 착과 절위 |
| 파프리카 | 초장, 엽수, 줄기 경, 분지/화방 위치, 착과 절위 |
| 딸기 | 관부직경, 엽수, 엽장, 화방수, 런너/과방 수 |
| 상추 | 엽장, 엽수, 엽폭, 생체중, 초장 |
| 오이 | 초장, 엽수, 줄기 경, 마디수, 착과 절위 |
| 허브 | 초장, 엽수, 줄기 경, 분지수, 수확 가능 줄기수 |

### 8.6 AI 전략 탭 (`ai`)

Source-of-truth UI/DOM pattern: [`docs/design/crop-ai-strategy-ui-dom-pattern.md`](./crop-ai-strategy-ui-dom-pattern.md). AI 전략 하위탭 또는 유사한 패널형 하위탭을 수정할 때는 이 문서의 메인 카드 shell, 내부 metric/note/action 구조, 상세 evidence section 분류, 금지 marker 기준을 먼저 적용한다.

현재 기능:

- `_renderGrowthReportCard()`
- `data-growth-report-card`
- `data-growth-report-refresh`
- `GET green_smart/crop/seasons/{season_id}/growth-report`
- operator workflow, stage prediction, validation, trainable baseline, feature sources, dataset readiness, center policy/interlock analytics 등 read-only 모델 근거 표시

UI Slice 3 v1.9.74 구현 기준:

- `data-crop-ai-readonly-boundary`: 상단 공통 경계 배너. 문구는 `현장 Edge가 최종 판단 · read-only · 자동 실행 없음 · 자동 학습/배포 없음 · 환경/관수/장치 PID 적용은 제외`.
- `data-crop-ai-primary-summary`: 농장주/직원용 “이번 주 작물 판단 요약”. 입력 상태, 생육단계/예측, 리스크, ML 준비도를 한 화면에서 먼저 보여준다.
- `data-crop-ai-next-action`: `operatorWorkflow`, `validationStatusLabel`, `mlReady`, `cropInterlock` 상태를 기준으로 이번 주 다음 행동을 한 줄로 안내한다.
- `data-crop-ai-advanced-details`: 학습 데이터, feature source, score components, Center policy raw 변수는 `<details data-crop-ai-advanced-details` / `<summary` 구조로 접는다. summary 문구는 `상세 모델 근거`.
- `data-crop-ai-technical-evidence-grid`: 접힌 상세 모델 근거 영역. 기존 `data-crop-trainable-baseline-card`, `data-crop-stage-prediction-score-card`, `data-crop-kma-weather-stress-card`, `data-crop-training-dataset-export-card`, `data-crop-model-feature-sources-card`, `data-center-crop-policy-card` marker는 보존한다.

금지 marker / behavior:

```text
data-crop-ai-execute-device
data-crop-ai-train-production-model
centerPolicyAllowExecution
cropAiAllowExecution
autoDeployProductionModel
```

UI Slice 3에서 정리한 내용:

- operator workflow + 예측/검증/readiness를 하나의 primary summary로 병합
- training dataset, feature source, score components, center policy raw variables는 advanced details로 접기
- 반복되는 read-only/no-execution 문구는 하나의 boundary banner로 통합
- 장치 실행/자동 학습/production model 교체 권한은 추가하지 않음

### 8.7 병해충 예찰 탭 (`pest`)

현재 기능:

- CSV 내보내기
- 병해충 추가
- 삭제

필드:

- 조사일
- 현재 작기 + 발생 범위 compact row
- 병해충 type + 발생도 row 단위 입력
- note

발생도:

| key | 표시 |
|---|---|
| `1` | 낮음 |
| `2` | 보통 |
| `3` | 높음 |
| `4` | 위험 |

UI Polish Phase P1 v1.9.80 병해충 예찰 모달 compact 기준:

- `data-pest-compact-modal`: 병해충 예찰 추가 모달은 compact popup card로 렌더한다.
- `data-pest-scope-row`: 현재 작기와 발생 범위를 같은 줄에 배치한다.
- `data-pest-active-season-pill`: 선택 작기를 읽기 전용 pill로 표시한다.
- `data-pest-location-scope-select`: 발생 범위는 `전체/부분` 드롭다운만 제공한다.
- `data-pest-type-severity-list`: 병해충 종류와 발생 정도를 행 단위로 묶는다.
- `data-pest-type-severity-row`: 각 행은 병해충명 autocomplete input과 발생 정도 select를 함께 가진다.
- `data-pest-type-add-row`: 병해충/발생 정도 행을 추가한다.
- `data-pest-note-compact`: 비고는 마지막 compact 입력으로 둔다.
- 자유 입력 상세 위치 field는 제공하지 않는다. 저장 시 위치는 `${현재 작기} · ${전체/부분}`으로 정규화한다.

UI Slice 4 v1.9.75 구현 기준:

- `data-crop-pest-summary-card`: 예찰 건수, 최신 예찰, 고위험/미해결 상태를 상단 `병해충 예찰 요약`으로 표시한다.
- `data-crop-pest-severity-overview`: 낮음/보통/높음/위험 중 특히 `고위험/미해결`인 `high`/`critical` 개수를 농장주/직원이 먼저 보게 한다.
- `data-crop-pest-next-action`: `다음 행동` 문구와 `방제 기록으로 이동` 버튼을 제공한다. 버튼 marker는 `data-crop-pest-go-control`이며 방제 기록 탭으로 이동만 한다.
- `data-crop-pest-record-list`: compact record list. 각 row는 `data-crop-pest-record-row`, `data-crop-pest-record-summary`, `data-crop-pest-record-meta`, `data-crop-pest-delete-action`, 기존 삭제 바인딩용 `data-pest-del`을 가진다.
- 방제 입력 폼/약제 실행을 이 탭에 중복하지 않는다.

금지 marker / behavior:

```text
data-crop-pest-control-form
data-crop-pest-apply-treatment
data-crop-pest-execute-control
pestAllowPesticideExecution
```

UI Slice 4에서 정리한 내용:

- severity summary 추가
- 미해결/고위험 예찰을 상단에 집중 표시
- 방제 기록으로 이어지는 다음 행동 문구 제공

### 8.8 방제 기록 탭 (`control`)

현재 기능:

- CSV 내보내기
- 방제 기록 추가
- 삭제

표시:

- 방제일
- 약제 목록
- PLS 여부 badge
- 구역
- 면적
- note

UI Slice 5 v1.9.76 구현 기준:

- `data-crop-control-safety-summary`: 방제 건수보다 안전 판단을 먼저 보이게 하는 `방제 안전 요약` 카드.
- `data-crop-control-pls-overview`: PLS 확인 상태를 적합/미확인/경고로 표시한다.
- `data-crop-control-phi-rei-overview`: PHI/REI 확인 누락 여부를 `PHI/REI 확인`으로 표시한다.
- `data-crop-control-next-check`: `다음 점검` 문구로 PLS 경고, PHI/REI 누락, 효과/재발 점검을 안내한다.
- `data-crop-control-treatment-list`: compact treatment list. 각 row는 `data-crop-control-treatment-row`, `data-crop-control-treatment-summary`, `data-crop-control-treatment-meta`, `data-crop-control-pesticide-chip-group`, `data-crop-control-delete-action`, 기존 삭제 바인딩용 `data-control-del`을 가진다.
- export/add/delete는 유지하되 action hierarchy를 명확히 한다.

UI Polish Phase P1 v1.9.96 방제 기록 모달 compact 기준:

- `data-control-compact-modal`: 방제 기록 추가 모달은 compact popup card로 렌더한다.
- `data-control-date-field`: 방제일은 모달 첫 입력으로 둔다.
- `data-control-scope-row`: 방제일 아래 현재 작기와 처리 범위를 같은 줄에 배치한다.
- `data-control-active-season-pill`: 선택 작기를 읽기 전용 pill로 표시한다.
- `data-control-location-scope-select`: 처리 범위는 `전체/부분` 드롭다운만 제공한다.
- `data-control-pesticide-list`: 약제 입력 목록은 scope row 다음에 배치한다.
- `data-control-pesticide-entry`: 약제 1개 입력 단위를 명확히 표시한다.
- `data-control-pesticide-name-field`: 약제명/PSIS 검색 field는 각 약제 entry의 첫 입력으로 둔다.
- `data-control-pesticide-add-row`: 약제 추가 버튼은 약제 목록 다음, 비고 이전에 둔다.
- `data-control-note-compact`: 비고는 마지막 compact 입력으로 둔다.
- `data-control-dose-grid`, `data-chemical-amount-input`, `data-water-amount-input`, `data-treatment-area-input`, `data-pyeong-amount-output` 계산 필드는 유지한다.
- 자유 입력 세부 위치 field는 제공하지 않는다. 저장 시 zone은 `${현재 작기} · ${전체/부분}`으로 정규화한다.

금지 marker / behavior:

```text
data-crop-control-execute-spray
data-crop-control-auto-apply
controlAllowPesticideExecution
autoSchedulePesticideApplication
```

UI Slice 5에서 정리한 내용:

- PLS/PHI/REI 안전 요약 추가
- 약제 chip 그룹을 더 읽기 쉽게 정리
- 삭제/export/add action hierarchy 정리

---

### 8.9 P1 rendered-flow QA v1.10.4

Home/Crop P1 흐름은 실제 브라우저 렌더 smoke 기준으로 다음을 함께 확인한다.

v1.9.84에서는 사용자 확인 없이 진행됐던 v1.9.83 Home real-state tasks 변경을 되돌렸다. Home 첫 카드의 `오늘 할 일`/`조치 필요`는 v1.9.82 기준의 고정 안내 구조를 유지하며, 실제 SafetyGuard/Growth/Pest/Control 기반 산출은 후속 고도화 후보로만 둔다.

v1.9.85 five requested Crop Settings UI corrections:

Compatibility note: v1.9.99 five requested Crop Settings UI corrections 문구는 기존 current-version 계약 호환을 위해 유지하되, 실제 5개 요청사항 완료 릴리스는 v1.9.85이고 v1.9.86은 그 위의 공통 하위탭 목록 레이아웃 보정, v1.9.99은 환경 제어 작기구역 카드 보정이며, AI 전략 패널 타입 보정은 이전 호환 기준으로 유지한다.

- 하위탭은 `data-crop-tab-icon` + `data-crop-tab-label`만 사용하고 중복 emoji marker를 렌더하지 않는다.
- 작기/생육조사/병해충 예찰/방제 기록 row는 공통 수정+삭제 action group을 사용한다. 철거 버튼은 작기 목록의 `data-season-demolish`에만 존재한다.
- AI 전략은 `data-crop-ai-summary-card` 한 개의 상단 요약과 `data-crop-ai-advanced-details` 접힘 기술 근거로 정리한다.
- 병해충 예찰과 방제 기록은 요약 카드 → 액션 줄 → 기록 목록 순서를 공유한다.
- 방제 모달은 `data-control-usage-row` 안에서 약제 사용량과 물 사용량을 같은 2열 grid에 배치한다.

v1.9.86 Crop Settings unified subtab list layout:

- 기록형 하위탭은 `data-crop-subtab-main-format` 안에서 하위탭 요약 카드(`data-crop-subtab-summary-card`) → 목록 헤더(`data-crop-subtab-list-header`) → 목록 리스트(`data-crop-subtab-record-list`) 순서를 공유한다.
- 목록 헤더는 `data-crop-list-title`, `data-crop-list-description`, `data-crop-list-count`, `data-crop-list-actions`를 포함한다.
- 병해충 예찰/방제 기록의 제목 블록은 요약 카드 위가 아니라 목록 헤더로 이동한다.

v1.9.87 AI Strategy panel-type layout:

- AI 전략은 기록 목록이 아니므로 `data-crop-ai-strategy-panel`, `data-crop-ai-strategy-header`, `data-crop-ai-evidence-panel` 타입을 사용한다.
- AI 전략에는 `data-crop-ai-list-header`, `data-crop-ai-evidence-list`, `data-crop-subtab-record-list`, `data-crop-list-count`, `data-crop-list-actions`를 사용하지 않는다.
- 첫 화면에는 `data-crop-ai-primary-summary`의 `이번 주 작물 판단 요약` 1개와 `data-crop-ai-next-action`만 노출하고, 모델/데이터/인터록 카드들은 `data-crop-ai-advanced-details` 접힘 영역으로 정리한다.

v1.9.99 AI Strategy panel-type layout compatibility: v1.9.87에서 도입한 panel-type layout은 현재 버전에서도 유지한다.

v1.9.99 AI Strategy model hierarchy restructure:

- AI 메인 영역은 `data-crop-ai-primary-summary` 작물 상태 요약 → `data-crop-ai-interlock-summary` 인터록 상태 요약 → `data-crop-ai-model-status-summary` 모델 상태 요약 → `data-crop-ai-advanced-details` 상세 모델 근거 버튼 순서로 노출한다.
- 작물 상태 요약은 `data-crop-ai-primary-gl-index`, `data-crop-ai-primary-yield-prediction`, `data-crop-ai-primary-pest-risk`를 우선 노출한다.
- 기존 `입력 상태`, `생육단계/예측`, `리스크`, `ML 준비도`는 메인 영역의 `data-crop-ai-model-status-summary`로 이동한다.
- 상세 모델 근거는 `data-crop-ai-stage-prediction-model` → `data-crop-ai-reproductive-vegetative-model` → `data-crop-ai-pest-prediction-model` 상위 모델 뒤에 `data-crop-ai-submodel-evidence-section` 이하 하위 모델/입력 근거 순서로 정리한다.

v1.9.99 AI Strategy decision-oriented DOM:

- `data-crop-ai-decision-summary`는 operator-facing 작물 상태 요약이며 `data-crop-ai-primary-metric-grid` 안에 G/L-Index, 수확량 예측, 병해 위험도만 우선 노출한다.
- v1.9.96부터 `data-crop-ai-decision-flow`, `data-crop-ai-decision-flow-steps`, `data-crop-ai-flow-step` 판단 흐름 카드는 제거한다.
- 메인 영역 순서는 `data-crop-ai-strategy-header` → `data-crop-ai-readonly-boundary` → `data-crop-ai-decision-summary` → `data-crop-ai-interlock-summary` → `data-crop-ai-model-status-summary` → `data-crop-ai-advanced-details`이다.
- `data-crop-ai-decision-summary`, `data-crop-ai-interlock-summary`, `data-crop-ai-model-status-summary`는 `data-crop-ai-main-card`, `data-crop-ai-main-card-header`, `data-crop-ai-main-card-body`, `data-crop-ai-main-card-chip-group` 공통 shell을 사용한다.
- 상세 근거는 `data-crop-ai-technical-evidence-stack` 내부에서 `data-crop-ai-top-models` → `data-crop-ai-submodels` → `data-crop-ai-center-reference-summary` 순서로 정리한다.

v1.9.99 AI main card unification:

- AI 판단 흐름 카드는 제거한다: `data-crop-ai-decision-flow`, `data-crop-ai-decision-flow-steps`, `data-crop-ai-flow-step`를 사용하지 않는다.
- AI 메인 3카드(`data-crop-ai-decision-summary`, `data-crop-ai-interlock-summary`, `data-crop-ai-model-status-summary`)는 `data-crop-ai-main-card`, `data-crop-ai-main-card-header`, `data-crop-ai-main-card-body`, `data-crop-ai-main-card-chip-group` 공통 shell을 사용한다.

v1.9.99 AI main card inner consistency:

- 메인 3카드 내부는 `data-crop-ai-main-metric-grid` → `data-crop-ai-main-metric` → `data-crop-ai-main-metric-label`/`data-crop-ai-main-metric-value`/`data-crop-ai-main-metric-help` 구조를 공유한다.
- 각 메인 카드는 `data-crop-ai-main-note`와 `data-crop-ai-main-action-row`를 가진다. 인터록 승인 버튼은 제거하지 않고 같은 action row 안에 둔다.

v1.9.99 AI detail unified evidence UI:

- 접히는 상세 모델 근거 영역은 `data-crop-ai-evidence-section` section shell과 `data-crop-ai-evidence-card` card shell을 사용해 상위 모델/하위 모델 UI 포맷을 통일한다.
- 각 상세 카드는 `data-crop-ai-evidence-card-header`, `data-crop-ai-evidence-card-body`, `data-crop-ai-evidence-chip-group`을 가진다.
- 상위 모델은 `data-crop-ai-evidence-section="top-models"`, 하위 모델은 `data-crop-ai-evidence-section="submodels"`, 센터 참고는 `data-crop-ai-evidence-section="center-reference"`로 구분한다.

v1.9.99 AI detail cleanup:

- `이번 주 작물 모델 작업 안내`(`data-crop-operator-workflow-card`)는 상위 모델이 아니므로 `data-crop-ai-evidence-section="model-operations"` 아래 `data-crop-ai-evidence-card="operator-workflow"`로 분리한다.
- 이전 히스토리에서 추가된 지원 카드인 `data-crop-quality-disorder-summary-card`, `data-crop-prediction-validation-card`, `data-crop-training-dataset-export-card`는 하위 모델이 아니므로 `model-operations` section으로 분리한다. 각 카드는 `data-crop-ai-evidence-card="quality-disorder"`, `data-crop-ai-evidence-card="prediction-validation"`, `data-crop-ai-evidence-card="training-dataset-export"`로 구분한다.
- 센터 분석 참고는 센터 인터록/분석 카드가 먼저, `data-center-crop-policy-card` 센터 작물 정책이 그 다음에 오도록 정리한다.

- Home 첫 카드는 `data-home-action-summary`로 위험 알림/오늘 할 일/조치 필요를 담당하고, 온도/습도/CO₂/VPD 숫자는 `_renderKPIStrip(kpi)`에서 확인한다.
- 병해충 예찰은 `data-crop-pest-summary-card` → `data-crop-pest-action-row` → `data-crop-pest-record-list` 순서를 유지한다.
- 병해충 추가 모달은 `data-pest-compact-modal`, `data-pest-scope-row`, `data-pest-type-severity-row`를 렌더하고 상세 위치 자유입력 필드를 제공하지 않는다.
- 방제 기록은 `data-crop-control-summary-card` → `data-crop-control-action-row` → `data-crop-control-record-list` 순서를 유지한다.
- 방제 기록 추가 모달은 `data-control-compact-modal`, `data-control-date-field`, `data-control-scope-row`, `data-control-pesticide-list`, `data-control-pesticide-add-row`, `data-control-note-compact`, `data-control-dose-grid`, `data-control-usage-row`를 렌더하고 상세 위치 자유입력 필드를 제공하지 않는다.
- 금지 실행 marker(`data-crop-pest-control-form`, `data-crop-pest-execute-control`, `data-crop-control-execute-spray`, `data-crop-control-auto-apply`)는 렌더하지 않는다.

---

## 9. 환경/관수/장치제어 공통 UI contract

세 제어 페이지는 같은 scope와 공통 카드 구조를 공유한다.

| page | domain |
|---|---|
| 환경 제어 | `environment` |
| 관수 제어 | `irrigation` |
| 장치제어 | `device` |

scope:

```text
crop_season_id + zone_id + domain
```

cache key:

```js
`${domain}:${seasonId}:${zoneId}`
```

localStorage:

```text
green_smart_zone_control_settings
green_smart_control_scope
green_smart_zone_control_migrated_v1
```

### 9.1 공통 카드 순서

환경/관수 공통:

1. SubHero
2. Control Scope Bar
3. 제어 모드 카드
4. 인터록 설정 카드
5. Entity 상태 요약 카드
6. SafetyGuard Watchdog 카드
7. SafetyGuard 이벤트 이력 카드
8. 제한적 자동제어 카드
9. domain-specific strategy preview 카드
10. AI 전략 출력 / 최종 적용값 카드
11. 운영자 실행 확인 카드
12. 현장 리허설 카드
13. 가상 장치 리허설 카드
14. Dry Run UI 카드
15. 실행/안전 로그 카드
16. 장치/센서 Entity 매핑 카드
17. Entity Mapping 검증 카드
18. domain-specific 상세 탭 카드
19. 저장 버튼

장치제어는 strategy preview 카드 없이 공통 safety/execution/mapping 카드와 장치 상세 탭을 포함한다.

### 9.2 Control Scope Bar

렌더 함수: `_renderControlScopeBar(domain)`

| data attribute | 의미 |
|---|---|
| `data-control-scope-season` | 현재 작기 |
| `data-control-scope-zone` | 현재 구역 |
| `data-control-scope-apply` | 현재 구역만/전체 구역 적용 |
| `data-control-copy-target-zone` | 복사 대상 구역 |
| `data-control-copy-zone` | 현재 설정 복사 |
| `data-control-copy-all-zones` | 전체 구역에 적용 |
| `data-control-scope-summary` | 저장 대상 표시 |
| `data-control-save-notice` | 마지막 저장 표시 |

관수 domain은 `nutrient_zones`, 환경/장치는 `greenhouse_zones`를 zone count 기준으로 사용한다.

### 9.3 제어 모드 카드

렌더 함수: `_renderZoneControlModeCard(domain)`

| field | 설명 |
|---|---|
| mode | `manual`, `auto`, `assist`, `disabled` |
| allowAutoExecution | 자동 실행 허용 |
| overrideReason | override 사유 |
| overrideExpiresAt | override 만료 |

실행 gate:

- `disabled`는 실제 실행 차단
- `auto`/`assist`는 `allowAutoExecution` 필요
- dry run은 실행 전 preview로 허용

### 9.4 인터록 설정 카드

렌더 함수:

- `_renderZoneInterlockSettingsCard(domain)`
- `_renderZoneInterlockRuleBuilder(domain, settings)`

상위 설정:

| field | 설명 |
|---|---|
| emergency_stop | 긴급 정지 |
| block_on_unavailable | unavailable 차단 |
| apply_safe_state_on_block | 차단 시 safe_state 적용 |
| rules | 세부 인터록/센서 규칙 |

rule fields:

| field | 설명 |
|---|---|
| control_role | 제어 역할 |
| condition | 조건 |
| threshold | 임계값 |
| sensor_entity_id | 센서 entity |
| sensor_attribute | 센서 속성 |
| sensor_operator | 센서 연산자 |
| reasonCode | reason code |
| action | `block`, `failsafe`, `warn` |
| message | 운영자 메시지 |

조건 옵션:

```text
unavailable, unknown, above, below, equals,
wind_speed_above, temperature_below, temperature_above,
vwc_below, vwc_above, ec_below, ec_above, sensor_integrity
```

센서 연산자:

```text
above, below, equals, not_equals, is_on, is_off, truthy, falsy
```

### 9.5 Entity 상태 요약 카드

렌더 함수: `_renderZoneEntityStateSummaryCard(domain)`

표시:

- totalCount
- availableCount
- unavailableCount
- unknownCount
- hasBlockingState
- mapping별 entity current state

### 9.6 SafetyGuard Watchdog 카드

렌더 함수: `_renderZoneSafetyGuardWatchdogCard(domain)`

표시:

- watchdogStatus
- criticalEvents
- lastCheckedAt
- staleThresholdSeconds
- entity별 watchdog status
- reasons/ruleResults

### 9.7 SafetyGuard 이벤트 이력 카드

렌더 함수: `_renderZoneSafetyGuardEventHistoryCard(domain)`

lifecycle:

```text
active → acknowledged → cleared
```

기능:

- 이벤트 새로고침
- 운영자 확인
- 조치 완료
- note 입력

### 9.8 제한적 자동제어 카드

렌더 함수: `_renderZoneLimitedAutoPolicyCard(domain)`

장비군:

```text
ventilation, screen, irrigation, fertigation, fan, co2
```

설정:

- 장비군별 자동 허용
- 반자동 승인 필요
- 자동 최대 지속 시간
- 재개 요청

### 9.9 AI 전략 출력 / 최종 적용값 카드

렌더 함수: `_renderZoneAiFinalTargetCard(domain)`

구성:

- AI 전략 출력
- final target summary
- AI 출력 새로고침
- AI 전략 적용
- 최종값 실행

원칙:

```text
AI output은 실행 명령이 아니다.
AI output은 final target 후보이고, final target으로 승격된 뒤 SafetyGuard/Interlock을 통과해야 실행된다.
```

### 9.10 운영자 실행 확인 카드

렌더 함수: `_renderZoneOperatorConfirmCard(domain)`

확인 문구:

```text
실제 장비 실행 확인
```

fields:

- operator confirmed checkbox
- confirmation text
- operator role
- override reason

roles:

```text
operator, technician, admin, owner
```

### 9.11 현장 리허설 카드

렌더 함수: `_renderZoneRehearsalReadinessCard(domain)`

시나리오:

```text
normal_operation, strong_wind_block, rain_block,
low_temperature_block, sensor_fault_block,
failsafe_recovery, operator_recovery
```

### 9.12 가상 장치 리허설 카드

렌더 함수: `_renderZoneVirtualRehearsalCard(domain)`

원칙:

```text
virtualDeviceOnly = true
physicalDeviceConnectionAllowed = false
```

가상 entity 예시:

```text
sensor.green_smart_virtual_environment_wind_speed
cover.green_smart_virtual_environment_ventilation
switch.green_smart_virtual_environment_irrigation_pump
```

C19D evidence marker:

```text
_virtualRehearsalEvidenceText(data)
data-zone-virtual-rehearsal-evidence-row
data-zone-virtual-rehearsal-evidence-copy
data-zone-virtual-rehearsal-pass-rate
data-zone-virtual-rehearsal-c20-gate
가상 시나리오 증거
C20 gate
normal/strong-wind/rain/low-temp/sensor-fault/blocked/Fail Safe/recovery
실제 장비 연결 금지
```

### 9.13 Dry Run UI 카드

렌더 함수: `_renderZoneDryRunPreviewCard(domain)`

표시:

- planned service calls
- SafetyGuard 판단
- limited auto gate
- blocked call
- safe_state/failsafe call
- pre/post state verification preview

### 9.14 실행/안전 로그 카드

렌더 함수: `_renderZoneExecutionLogCard(domain)`

표시:

- action/result/createdAt
- safetyStatus
- blocked/failsafe 여부
- SafetyGuard ruleResults
- before/after state
- call count

### 9.15 Entity 매핑 / 검증 카드

Entity mapping card fields:

- device_type
- entity_id
- control_role
- safe_state

Validation card checks:

- entity exists
- domain/service compatible
- safe_state valid
- unmapped target keys

---

## 10. 환경 제어 페이지

Source-of-truth UI/DOM slice plan: [`docs/design/environment-control-ui-dom-slice-plan.md`](./environment-control-ui-dom-slice-plan.md). 환경 제어 페이지는 작물 설정과 달리 설정값을 직접 변경하는 하위탭이 있으므로, 정보/상태/기록형 하위탭은 공통 summary/list 패턴을 따르고 설정값 변경형 하위탭은 `data-env-setvalue-*` UI/DOM 표준을 따른다.

렌더 함수: `_renderEnvSettingsPage()`

SubHero:

```text
환경 제어
AI가 꺼져도 기본 인터록 제어로 온실을 안전하게 유지하고, AI 활성화 시 생육전략 보정값을 적용합니다.
```

### 10.1 환경 하위 탭

| key | label | icon |
|---|---|---|
| `mode` | 제어 모드 | `mdi:tune-variant` |
| `temperature` | 온도 제어 | `mdi:thermometer-lines` |
| `humidity` | 습도 / VPD 제어 | `mdi:water-percent` |
| `co2` | CO₂ 제어 | `mdi:molecule-co2` |
| `ai` | AI 전략 / 최종 적용값 | `mdi:brain` |
| `safety` | 안전 한계 | `mdi:alert-octagon` |
| `logs` | 작동 로그 | `mdi:clipboard-text-clock` |

### 10.2 환경 상태 그룹

- `controlMode`
- `systemStatus`
- `baseInterlockSettings`
- `aiStrategySettings`
- `lowLightStrategySettings`
- `safetyLimits`
- `finalAppliedTargets`
- `controlLogs`

### 10.3 탭별 주요 설정

| 탭 | 주요 필드 |
|---|---|
| 제어 모드 | mode, AI 사용, AI 오류 시 fallback, AI 연결 상태 |
| 온도 제어 | 주간/야간 목표온도, ADT, DIF, 난방/환기 시작·정지 온도, 고온/저온 경보 |
| 습도/VPD | 목표 습도, 목표 VPD, 최대 습도, 최소/최대 VPD, 결로 위험, 제습 환기/난방 |
| CO₂ | 목표 CO₂, 공급 시작/정지, 환기 중 공급 제한 |
| AI 전략 | G-Index, 생육단계, ADT/DIF/VPD 보정, 주야간 온도 보정, 저광기 전략 |
| 안전 한계 | 절대 최고/최저온도, 최대/최소 환기 개도율, 강풍 폐쇄 풍속, 센서/AI 오류 모드 |
| 로그 | `controlLogs` 배열 |

### 10.4 환경 전략 모델 카드

렌더 함수: `_renderEnvironmentStrategyPreviewCard(domain)`

입력:

- sourceMode: `auto`, `entity_state`, `operator`
- manual radiation
- manual temperature
- manual humidity
- manual CO₂

출력:

- CORP G-Index
- TEMHUM ADT/DIF/VPD
- VENT/SCRN target
- Preview Diff
- final target save

---

## 11. 관수 제어 페이지

렌더 함수: `_renderIrrigSettingsPage()`

SubHero:

```text
관수 제어
기본 관수 인터록으로 안전하게 작동하고, AI 활성화 시 생육 상태와 일사량에 따라 EC, pH, 관수량, 드라이백을 보정합니다.
```

### 11.1 관수 하위 탭

| key | label | icon |
|---|---|---|
| `mode` | 제어 모드 | `mdi:tune-variant` |
| `base` | 기본 관수 설정 | `mdi:timer-outline` |
| `saturation` | 포수 전략 | `mdi:cup-water` |
| `solar` | 일사 비례 관수 | `mdi:white-balance-sunny` |
| `dryback` | 드라이백 전략 | `mdi:water-minus` |
| `drain` | 배액 피드백 | `mdi:tray-arrow-down` |
| `nutrient` | 양액 전략 | `mdi:flask-outline` |
| `ai` | AI 관수 보정 | `mdi:brain` |
| `safety` | 안전 한계 | `mdi:alert-octagon` |
| `device` | 양액기 설정 | `mdi:pipe-valve` |
| `logs` | 관수 로그 | `mdi:clipboard-text-clock` |

### 11.2 관수 상태 그룹

- `irrigationControlMode`
- `baseIrrigationSettings`
- `saturationStrategy`
- `solarIrrigationStrategy`
- `drybackStrategy`
- `drainFeedback`
- `nutrientStrategy`
- `aiIrrigationCorrection`
- `irrigationSafetyLimits`
- `fertigationDeviceSettings`
- `finalIrrigationTargets`
- `irrigationLogs`

### 11.3 탭별 주요 설정

| 탭 | 주요 필드 |
|---|---|
| 제어 모드 | mode, AI 관수 보정, AI 오류 시 인터록 복귀, 자동 관수, 수동 관수 허용, 상태 |
| 기본 관수 | 시작/종료 시간, 일출/일몰 offset, 1회 급액량, 최소 간격, 최대 횟수, 기본 EC/pH, zone valve order |
| 포수 전략 | 포수 사용, 목표/완료 VWC, 포수 시작, 첫 배액 목표, 분할 횟수, 포수 급액량 |
| 일사 비례 | 기준 누적 일사, 흐린/맑은 날 기준, 최소/최대 간격, 고온/VPD 보정 |
| 드라이백 | 주간 허용폭, 야간 목표폭, VWC 상하한, 야간 비상 관수 |
| 배액 피드백 | 전날 급액/배액량, 배액률, 배액 EC/pH, 측정 시각 |
| 양액 전략 | 작물군, 생육단계, 기본/AI/최종 EC, 기본/AI/최종 pH, A/B/산/알칼리 사용 |
| AI 관수 보정 | G-Index, 작물군, 생육단계, EC/pH/급액량/간격/드라이백/종료시간/배액률 보정 |
| 안전 한계 | VWC 한계, EC 한계, pH 한계, 최대 1회/일 관수량, 최소 간격, 펌프 연속 시간, 유량 이상, 밸브 오류, 센서/AI 오류 모드 |
| 양액기 설정 | 펌프/밸브/sensor entity, EC/pH PID, 센서/유량계 보정 |
| 로그 | 관수 이력 |

관수 우선순위:

```text
비상 정지 → 안전 한계 → 기본 관수 인터록 → AI 관수 보정 → 수동 명령
```

### 11.4 관수 전략 모델 카드

렌더 함수: `_renderIrrigationStrategyPreviewCard(domain)`

입력:

- sourceMode: `auto`, `entity_state`, `operator`
- accumulatedRadiation
- currentVwc
- currentEc
- currentPh

출력:

- IRR EC/pH/VWC/드라이백
- shotAmountL
- minIntervalMin
- targetEc
- targetPh
- targetDryback
- targetDrainRate
- emergencyIrrigation
- Preview Diff
- final target save

### 11.5 관수 초기 진입 no-flicker contract

v1.9.56 기준 관수 페이지는 초기 진입 시 여러 API 응답마다 전체 화면을 재렌더하지 않는다.

관련 구현:

```text
_zoneControlHydrationInFlight
_requestZoneControlHydration(domain)
_fetchScopedControlStateFromApi(domain, { patchOnly: true })
_fetchZoneAiOutputs(domain, { patchOnly: true })
_fetchZoneFinalTargets(domain, { patchOnly: true })
_fetchIrrigationStrategyPreview(domain, { patchOnly: true })
_patchZoneControlElementCards(domain)
```

정책:

- localStorage fallback 화면은 즉시 표시
- API hydration은 in-flight guard로 1회 묶음
- 응답마다 `_update()` 금지
- hydration settle 후 dirty editor가 없으면 카드 단위 patch

---

### 11.6 v1.9.56 생육 AI 전략/제어 페이지 정보 구조 contract

v1.9.56 기준 작물 관리와 제어 페이지는 다음 UI 구조를 유지한다.

작물 관리:

- 하위탭: `작기 설정`, `생육조사`, `AI 전략`, `병해충 예찰`, `방제 기록`
- `생육조사` 탭: 생육조사 기록 목록/등록/수정/삭제/내보내기에 집중한다.
- `AI 전략` 탭: `_renderGrowthReportCard()`를 렌더링해 생육 리포트, G-Index, 수확량 예측, 병해 위험 분석을 모아 보여준다.
- Stage Diagnosis / Crop Interlock 카드: `data-stage-diagnosis-card`, `data-crop-interlock-card` marker로 현재 생육단계, 단계 신뢰도, Index band, 다음 조사, 부족한 증거, 작물 인터록 상태, target promotion/자동 실행 차단 여부, 수확 안전 확인 필요 여부를 표시한다.
- 센터 작물 정책 카드: `data-center-crop-policy-card` marker로 `centerCropPolicy`, `cropPolicyAppliedToModel`, `cropPolicyAppliedToInterlock`, `policyStatus`, `applyMode`, `cropModelVariables`, `cropInterlockVariables`, `recommendationHints`를 read-only로 표시한다. 문구는 `현장 Edge가 최종 판단`을 유지하고, 현재 범위는 Crop이므로 환경/관수/장치 PID 적용은 제외한다.
- Center policy guidance: `data-center-crop-policy-guidance`, `data-center-crop-policy-reasons`, `data-center-crop-policy-next-action` marker로 정책 상태 이유와 다음 조치를 한국어로 표시한다. `fresh/stale_usable/stale_restricted/fallback_safe/rejected` 상태를 농장 운영 문구로 번역하되 실행 버튼은 추가하지 않는다.
- v1.9.56 Crop policy alert/audit: `data-center-crop-policy-alert-summary` marker로 `stale_restricted`, `fallback_safe`, `rejected` 상태에 작물 정책 경고를 표시한다. 이 경고는 audit 기록/알림 기준 상태를 알려주는 read-only 요약이며 실행 버튼 없음 원칙을 유지한다.
- v1.9.56 Crop policy notification opt-in: `data-center-crop-policy-notification-toggle`, `data-center-crop-policy-notification-dismiss`, `data-center-crop-policy-notification-state` marker로 작물 정책 알림 ON/OFF와 알림 해제를 제공한다. `fallback_safe/rejected`는 기본 알림 대상이고 `stale_restricted`는 설정에 따라 알림한다. 작물 정책 알림은 운영 알림이며 실행 버튼 없음 원칙을 유지한다.
- Center analytics 카드: `data-center-crop-interlock-analytics-card` marker로 Center reason/approval 집계를 표시하되 실행권은 부여하지 않는다.
- 주간 리포트 알림: `data-weekly-report-notification-toggle` 버튼으로 제공하며 체크박스를 사용하지 않는다.
- 알림 상태 색상: ON `#f5a623` + `mdi:bell-ring-outline`, OFF `#9aa6a0` + `mdi:bell-off-outline`
- 리포트 새로고침: `data-growth-report-refresh` 클릭 시 `_refreshWeeklyGrowthReportFromButton()`이 `_fetchGrowthReport()`를 호출하고, 작업 중 `is-spinning` / `gs-spin` 회전 모션을 적용한다.

환경/관수/장치 제어 공통:

- 최상단 범위 선택은 `_renderControlScopeBar(domain)` 안에서 `_renderControlZoneTabs(domain)`을 호출한다.
- 구역 선택 카드는 작물 설정의 작기 선택 카드와 동일한 flex 카드 구조를 사용한다.
  - wrapper: `id="control-zone-selector"`, `display:flex`, `gap:8px`, `overflow-x:auto`
  - card marker: `data-control-zone-tab-card`, `data-control-zone-tab`, `data-control-zone-id`
  - selected style: `border:2px solid #51AE60`, `background:#f0faf1`
  - default style: `border:2px solid #e0e0e0`, `background:#fafafa`
- 카드 클릭 시 `_selectControlZoneFromCard(domain, zoneId)`가 `crop_season_id + zone_id + domain` scope를 즉시 바꾼다.
- 현재 작기는 별도 dropdown으로 고르지 않고 작물 설정의 현재 활성 작기(`_activeSeasonId` / 미철거 작기)를 따라간다.
- 상단 scope bar에는 구역 dropdown, 작기 dropdown, 적용 범위 dropdown, 즉시 복사 버튼을 두지 않는다.
- 설정 복사는 제목 옆 `프리셋 설정` 버튼에서 `_renderControlPresetModal(domain)` 팝업을 열어 `선택 구역에 복사` 또는 `전체 구역에 적용`으로 수행한다.
- 상단 과밀 카드들은 페이지 본문 상단에 펼쳐두지 않고 하위탭 내부로 정리한다.

제어 하위탭 정리:

| 페이지 | 신규/정리 탭 | 포함 카드 |
|---|---|---|
| 환경 제어 | `AI 운영` | 환경 전략 preview, AI 최종 적용값, 운영자 확인, 실행 로그 |
| 환경 제어 | `안전/리허설` | ControlMode, Interlock, SafetyGuard watchdog/event, 제한적 자동제어, readiness, virtual rehearsal, dry-run |
| 환경 제어 | `장치 매핑` | entity 상태 요약, entity mapping, mapping validation |
| 관수 제어 | `AI 운영` | 관수 전략 preview, AI 최종 적용값, 운영자 확인, 실행 로그 |
| 관수 제어 | `안전/리허설` | ControlMode, Interlock, SafetyGuard, 제한적 자동제어, readiness, virtual rehearsal, dry-run |
| 관수 제어 | `장치 매핑` | entity 상태 요약, entity mapping, mapping validation |
| 장치 제어 | `AI 운영` | AI 최종 적용값, 운영자 확인, 실행 로그 |
| 장치 제어 | `안전/리허설` | ControlMode, Interlock, SafetyGuard, 제한적 자동제어, readiness, virtual rehearsal, dry-run |
| 장치 제어 | `장치 매핑` | entity 상태 요약, entity mapping, mapping validation |

---

### 11.7 v1.9.56 Admin/System 관리 기능 contract

Admin/System 페이지는 placeholder가 아니라 다음 탭과 바인딩을 제공한다.

| 탭 | 기능 |
|---|---|
| `사용자/권한` | HA 사용자 ID/이름/Green Smart 역할(admin/farm_owner/farm_staff) 매핑을 입력하고 `green_smart_admin_role_mappings` localStorage fallback에 저장 |
| `연동 상태` | 현재 HA 사용자, Green Smart 역할, Central API 설정 여부, MariaDB, MQTT 상태 요약 및 새로고침 감사 로그 |
| `시스템 설정` | Central API URL, 날씨 API 사용, 농약 API 사용, MQTT host, 백업 보관일 저장 |
| `진단/백업` | panel version/RBAC/DB/MQTT 요약 진단, Admin/System 백업 JSON export |
| `감사 로그` | 권한/설정/진단/백업/연동 상태 작업 로그 표시 |

관련 구현 marker:

- `_adminSystemTabs()`
- `_renderAdminSystemTabBar()`
- `_renderAdminSystemTabContent()`
- `_bindAdminSystemInputs(root)`
- `_saveAdminRoleMapping(root)`
- `_saveAdminSystemConfig(root)`
- `_runAdminDiagnostics()`
- `_exportAdminBackup()`

---

## 12. 장치제어 페이지

렌더 함수: `_renderDeviceControlPage()`

SubHero:

```text
장치제어
Home Assistant와 실제 설비를 연결해 장치 운영, 수동 제어, 인터록, Fail Safe를 관리합니다.
```

### 12.1 장치제어 하위 탭

| key | label | icon |
|---|---|---|
| `status` | 장치 현황 | `mdi:view-dashboard` |
| `manual` | 수동 제어 | `mdi:gesture-tap-button` |
| `auto` | 자동 제어 상태 | `mdi:robot` |
| `vent` | 환기 장치 설정 | `mdi:fan` |
| `screen` | 스크린 장치 설정 | `mdi:roller-shade` |
| `groups` | 장치 그룹 관리 | `mdi:group` |
| `interlock` | 인터록 설정 | `mdi:shield-link-variant` |
| `failsafe` | Fail Safe 설정 | `mdi:shield-alert` |
| `alarms` | 알람 및 장애 | `mdi:bell-alert` |
| `logs` | 제어 이력 | `mdi:history` |

### 12.2 장치제어 상태 그룹

- `devices`
- `deviceGroups`
- `deviceStatus`
- `deviceControlLogs`
- `deviceInterlocks`
- `deviceFailsafeRules`
- `deviceAlarms`
- `ventilationDeviceSettings`
- `screenDeviceSettings`

### 12.3 탭별 기능

| 탭 | 기능 |
|---|---|
| 장치 현황 | 장치명, 유형, 현재상태, 동작모드, 제어주체, 통신상태, 마지막 업데이트 |
| 수동 제어 | ON/OFF/OPEN/CLOSE 명령, 0~100% 비율 제어, confirm 후 logs 추가 |
| 자동 제어 상태 | HA 연결상태, 자동제어 활성, AI 전략 적용, 현재 전략, 마지막 실행 |
| 환기 장치 설정 | 천창/측창/배기팬/순환팬 활성, 자동/수동, 개도율, 지연, 강풍/강우/저온 제한 |
| 스크린 장치 설정 | 보온/차광/다중 스크린 활성, 전개율, 일사/온도/야간 보온/결로/강풍 설정 |
| 장치 그룹 관리 | 환기/난방/관수/스크린 그룹 생성/수정/삭제/장치 추가 제거 |
| 인터록 설정 | 강풍 천창 보호, 배기팬-난방기 충돌 방지, 양액기-관수밸브 보호 등 |
| Fail Safe | HA 연결 끊김, MQTT 장애, 장치 응답 없음 등 안전 동작 |
| 알람 및 장애 | 발생시간, 장치명, 장애유형, 장애내용, 처리상태 |
| 제어 이력 | 시간, 장치, 이전/변경 상태, 제어유형, 실행주체 |

---

## 13. UI 변경 시 필수 검증

UI/문서 변경 후 최소 검증:

```bash
pytest -q
python3 -m py_compile custom_components/green_smart/*.py
node --check custom_components/green_smart/panel/green-smart-panel.js
git diff --check
```

패널 JS 동작/캐시 관련 변경 시 추가 기준:

1. `manifest.json` version bump
2. `green-smart-panel.js` `VERSION` bump
3. 운영 HA에 복사 후 `homeassistant --script check_config`
4. HA restart
5. marker grep으로 운영 반영 확인
6. 최근 HA logs에서 `Traceback|ERROR|Non-thread-safe operation` 확인

---

## 14. 주의해야 할 현재 차이점

| 항목 | 현재 상황 |
|---|---|
| Settings API key UI | 바인딩 일부는 있으나 현재 Settings HTML에 key input이 직접 보이지 않음 |
| 관수/장치 기존 설계 문서 API | 일부 `/api/irrigation/...`, `/api/devices/...` 초안은 현재 wrapper/zones API와 다름 |
| UI framework | 설계 문서 일부의 React/Vue 표현은 future migration reference이며 현재 runtime은 Vanilla JS |
| 실제 장비 연결 | C20 전까지 금지. 현재는 virtual HA entities/rehearsal 기준 |
---

## Crop Settings subpage consistency final state — v1.9.77

UI Slice 6 final pass locks the Crop Settings subpages to a shared operator-facing pattern.

Required consistency markers:

```text
data-crop-consistency-shell
data-crop-consistency-mobile-safe
data-crop-consistency-action-row
data-crop-consistency-card-radius
data-crop-consistency-final-pass
```

Final state rules:

- 농장주/직원용 요약 우선: every subpage starts from a summary/workflow/safety card before dense rows.
- 모바일 360px 기준: subpage summaries and action rows use `repeat(auto-fit,minmax(` and/or `flex-wrap:wrap` so narrow screens do not require card dumping.
- Consistent card radius: summary cards keep the 16~18px rounded Green Smart card family.
- Consistent action hierarchy: primary add/action buttons stay green, secondary export/edit buttons stay outlined, destructive delete buttons stay small red outlined buttons.
- Hidden duplicate cards are forbidden; prior detail-heavy evidence stays collapsed or lower in hierarchy.

Subpage summary anchors:

```text
data-crop-basic-summary-card
data-crop-growth-summary-card
data-crop-growth-workflow-card
data-crop-ai-primary-summary
data-crop-pest-summary-card
data-crop-control-safety-summary
```

Scope boundary markers that must remain absent from panel code:

```text
data-crop-ai-execute-device
data-crop-ai-train-production-model
data-crop-pest-control-form
data-crop-pest-apply-treatment
data-crop-control-execute-spray
data-crop-control-auto-apply
centerPolicyAllowExecution
cropAiAllowExecution
pestAllowPesticideExecution
controlAllowPesticideExecution
autoSchedulePesticideApplication
```

---

## Crop Settings requested UI corrections — v1.9.96

User-requested correction slice after the v1.9.77 final pass.

### Subtab labels

- Crop Settings 하위탭은 이모티콘 + 하위탭명만 표시한다.
- HA icon marker `data-crop-tab-icon`은 유지하되, duplicate emoji text marker `data-crop-tab-emoji` / `${t.emoji}`는 panel render에서 제거한다.

### Shared record row action format

The default record-list action format is shared through:

```text
_cropRecordActionGroup
data-crop-record-action-group
data-crop-record-secondary-actions
data-crop-record-danger-actions
data-crop-growth-record-actions
data-crop-pest-record-actions
data-crop-control-record-actions
```

Rules:

- 생육조사 기록, 병해충 예찰 기록, 방제 기록은 작기 목록과 같은 edit/delete danger hierarchy를 사용한다.
- `철거` / `data-season-demolish` is allowed only in the 작기 설정 작기 목록.
- 병해충 예찰/방제 기록은 요약 카드 다음에 액션 줄과 기록 목록 순서로 렌더한다.

### AI strategy cleanup

AI 전략 is guarded by:

```text
data-crop-ai-consolidated-layout
data-crop-ai-summary-stack
data-crop-ai-evidence-details
data-crop-ai-duplicate-card-guard
```

Rules:

- one primary operator summary first;
- technical/model evidence under collapsed details;
- duplicate standalone AI cards must not be reintroduced.

### Control modal dose calculation

방제 기록 추가 modal exposes structured dose inputs:

```text
data-control-dose-grid
data-chemical-amount-input
data-water-amount-input
data-dil-input
data-treatment-area-input
data-pyeong-amount-output
_calculateControlDilution
_calculateTreatmentAreaFromSeason
_calculatePyeongUsage
_syncControlDoseCalculations
chemicalAmount
waterAmount
treatmentAreaM2
perPyeongUsage
cropModelNutritionHint
```

Behavior:

- 약제 사용량 and 물 사용량 are shown side-by-side.
- If both values are present, 희석 배수 자동 계산 fills the dilution field with `waterAmount / chemicalAmount`.
- The active crop season + treatment scope estimates used area when possible. Operators may override area manually.
- 평당 사용량 자동 계산 uses `waterAmount / (areaM2 / 3.305785)`.
- The calculated summary is preserved in `amount`, and structured fields are carried in payload as crop model/nutrition evidence candidates only; this does not grant execution authority.

---

## Rendered UI QA hotfix — v1.9.96

Scope is intentionally limited to v1.9.78 requested Crop Settings UI corrections plus QA findings.

- Browser/login check: Prod HA reaches the login screen without console errors; authenticated panel rendering was not performed because no HA user credentials were used or changed.
- Render harness check: Crop Settings page rendered with mocked HA data using the production panel JS.
- Confirmed in browser DOM: subtab text is icon + label only, no `data-crop-tab-emoji`; growth/pest/control record action markers render; AI summary/evidence markers render; pest/control order is summary → action row → records.
- Confirmed in browser DOM: Control modal auto-fills dilution, treatment area, per-pyeong usage (`0.5` chemical + `500` water → `1000` dilution, `363.64㎡`, `4.55L/평`).
- Hotfix: `.popup-card` now has `max-height:min(88vh,760px)`, `overflow-y:auto`, and `overscroll-behavior:contain` so long dose-calculation modals do not lose access to lower fields/actions on short viewports.
- Runtime hotfix: Center crop policy datetime fields from DB may arrive as ISO strings; `_coerce_naive_datetime()` normalizes datetime/date/string values before age and expiry checks, preventing `replace() takes at least 2 positional arguments` scheduler warnings.


### 8.10 v1.10.0 Environment Control final QA

Environment Control final QA covers all seven tabs: `overview / setpoints / rules / ai / operations / devices / logs`. The QA baseline keeps setValue save/reset binding, status/record grammar, Prod marker smoke, and direct-execution forbidden markers under contract.


### 8.11 v1.10.0 Environment zone-centric crop-season scope

환경 제어 상단의 기존 구역 선택 카드 위치는 `data-env-season-zone-selector` 작기구역 카드로 대체한다. 이 카드는 작물 설정의 작기 선택 카드와 같은 형식(`crop-season-selector` clone contract)을 사용하며, 각 카드가 작기 ID와 구역 ID를 함께 선택해 `crop_season_id + zone_id + environment` 저장 scope를 바꾼다. 직접 실행 권한은 추가하지 않는다.


### 8.13 v1.10.1 Environment zone card UI/UX alignment

환경 제어 상단 scope selector의 표시 이름은 `구역 선택 카드`로 통일한다. 도메인 모델은 계속 구역이 부모, 작기는 구역에 연결되는 현재 재배 상태이며, 카드 UI는 작기 선택 카드와 동일한 3줄 카드 문법을 사용한다: 1줄 `구역 · 현재 작기`, 2줄 `정식일`, 3줄 `재배 상태`. 불필요한 `구역 중심`, `현재 작기:` 접두어, 카드 내부 마지막 저장 줄은 제거해 작기 선택 카드와 같은 밀도와 리듬을 유지한다.

- v1.10.1 Environment Control final QA: 환경 제어 구역 선택 카드 UI/UX 보정 후 전체 렌더/계약 기준을 유지한다.


### 8.14 v1.10.2 Environment zone card header cleanup

환경 제어 구역 선택 카드 상단에서는 중복된 큰 `구역 선택` 제목/설명을 숨기고, 카드 목록 위 녹색 소제목 `구역 선택`만 표시한다. `프리셋 설정` 버튼은 이 축약 header에 맞춰 11px, pill 형태, 작은 padding으로 정리한다.

- v1.10.2 Environment zone card UI/UX alignment: 구역 선택 카드 UI/UX 정렬 기준은 v1.10.2에서도 유지된다.
- v1.10.2 Environment Control final QA: 환경 제어 구역 선택 카드 header cleanup 후 전체 렌더/계약 기준을 유지한다.


### 8.15 v1.10.3 AI-first control tab alignment

작물 설정과 환경 제어 모두 `AI 전략` 하위탭을 첫 번째 탭으로 배치한다. 환경 제어의 `AI 전략`은 작물 설정 AI 전략과 동일한 visible grammar를 따른다: 운영 판단 요약 우선, read-only boundary, 3개 main card(`환경 상태 요약`, `인터록 상태 요약`, `모델 상태 요약`), 접힌 모델·데이터 근거. 기존 `AI 보정·최종값` 편집 UI는 `AI 보정 설정` 탭으로 분리한다. 환경 제어 composition에서 별도 `제어 모드` 카드는 제거하고, 관련 상태는 AI/인터록 요약과 설정 탭 안에서만 표시한다. setValue 행은 고정 컬럼(`label/current/recommended/control`)과 오른쪽 정렬을 사용해 글자 수와 무관하게 정렬을 유지한다.

- v1.10.3 Environment zone card header cleanup: current v1.10.3 compatibility marker retained after AI-first control tab alignment.
- v1.10.3 Environment zone card UI/UX alignment: current v1.10.3 compatibility marker retained after AI-first control tab alignment.
- v1.10.3 Environment Control final QA: current v1.10.3 compatibility marker retained after AI-first control tab alignment.


### 8.16 v1.10.5 Environment interlock/safety tab split

환경 제어의 `목표값 설정`과 `인터록·안전 설정`은 `인터록 설정`으로 병합한다. 목표값은 결국 인터록/PID 기준값이므로 온도·습도/VPD·CO₂ PID 목표와 온도/습도/CO₂ 인터록 기준을 한 탭에서 관리한다. 별도 `안전 설정` 탭은 절대 안전 한계, 센서 오류 시 제어 방식, 강풍 폐쇄 풍속, SafetyGuard gate처럼 PID 목표값과 분리해야 하는 안전 경계를 담당한다. 운영 요약과 인터록/안전 관련 탭에서는 독립 `제어 모드` 카드를 표시하지 않는다.

- v1.10.4 AI-first control tab alignment: current v1.10.4 compatibility marker retained after interlock/safety split.
- v1.10.4 Environment zone card header cleanup: current v1.10.4 compatibility marker retained after interlock/safety split.
- v1.10.4 Environment zone card UI/UX alignment: current v1.10.4 compatibility marker retained after interlock/safety split.
- v1.10.5 Environment Control final QA: current v1.10.4 compatibility marker retained after interlock/safety split.

- v1.10.5 Environment unified scope/tab card: 작물 설정의 작기 선택 + 하위탭 단일 카드 구조와 맞추기 위해 환경 제어의 구역 선택과 하위탭을 `data-env-unified-scope-tab-card` 하나의 `gs-card` 안에 배치했다. 환경 제어 scope bar는 `data-env-scope-inline`으로 카드 껍데기를 만들지 않는다.

- P1 rendered-flow QA v1.10.5: current v1.10.5 compatibility marker retained after unified environment scope/tab card polish.
- v1.10.5 AI-first control tab alignment: current v1.10.5 compatibility marker retained after unified environment scope/tab card polish.
- v1.10.5 Environment zone card header cleanup: current v1.10.5 compatibility marker retained after unified environment scope/tab card polish.
- v1.10.5 Environment zone card UI/UX alignment: current v1.10.5 compatibility marker retained after unified environment scope/tab card polish.

- v1.10.6 Environment storage target moved to docs: 환경 제어 화면의 `저장 대상 · 1구역 / 작물 / 환경 제어 구역 + 현재 작기 + 제어영역 → green_smart_zone_control_settings` 문구는 UI에서 제거한다. 저장 scope는 문서 기준으로 `crop_season_id + zone_id + domain`이며 저장 테이블/키는 `green_smart_zone_control_settings`를 사용한다.
- P1 rendered-flow QA v1.10.6: current v1.10.6 compatibility marker retained after storage target summary removal.
- v1.10.6 AI-first control tab alignment: current v1.10.6 compatibility marker retained after storage target summary removal.
- v1.10.6 Environment zone card header cleanup: current v1.10.6 compatibility marker retained after storage target summary removal.
- v1.10.6 Environment zone card UI/UX alignment: current v1.10.6 compatibility marker retained after storage target summary removal.
- v1.10.6 Environment Control final QA: current v1.10.6 compatibility marker retained after storage target summary removal.
- v1.10.6 Environment interlock/safety tab split: current v1.10.6 compatibility marker retained after storage target summary removal.
- v1.10.6 Environment unified scope/tab card: current v1.10.6 compatibility marker retained after storage target summary removal.

- v1.10.7 Environment zone helper text moved to docs: 환경 제어 화면의 `작기 선택 카드와 동일한 3줄 카드 문법으로 구역과 현재 작기를 함께 표시합니다.` 설명 문구는 UI에서 제거한다. 구역 카드는 작기 선택 카드와 동일하게 3줄 구조(구역+현재 작기 / 정식일 / 재배 상태)를 유지하며, 이 문법 설명은 문서와 hidden marker(`data-env-zone-card-helper-doc-only`)로만 남긴다.
- P1 rendered-flow QA v1.10.7: current v1.10.7 compatibility marker retained after zone helper text removal.
- v1.10.7 AI-first control tab alignment: current v1.10.7 compatibility marker retained after zone helper text removal.
- v1.10.7 Environment zone card header cleanup: current v1.10.7 compatibility marker retained after zone helper text removal.
- v1.10.7 Environment zone card UI/UX alignment: current v1.10.7 compatibility marker retained after zone helper text removal.
- v1.10.7 Environment Control final QA: current v1.10.7 compatibility marker retained after zone helper text removal.
- v1.10.7 Environment interlock/safety tab split: current v1.10.7 compatibility marker retained after zone helper text removal.
- v1.10.7 Environment unified scope/tab card: current v1.10.7 compatibility marker retained after zone helper text removal.
- v1.10.7 Environment storage target moved to docs: current v1.10.7 compatibility marker retained after zone helper text removal.

- v1.10.8 Environment overview tab removed: 환경 제어의 `운영 요약` 하위탭은 UI에서 제거한다. 기본 첫 탭은 `AI 전략`이고 다음 visible 탭은 `인터록 설정`이다. 과거 overview 키는 hidden legacy marker(`data-env-legacy-tab="overview"`)로만 유지한다.
- P1 rendered-flow QA v1.10.8: current v1.10.8 compatibility marker retained after Environment overview tab removal.
- v1.10.8 AI-first control tab alignment: current v1.10.8 compatibility marker retained after Environment overview tab removal.
- v1.10.8 Environment zone card header cleanup: current v1.10.8 compatibility marker retained after Environment overview tab removal.
- v1.10.8 Environment zone card UI/UX alignment: current v1.10.8 compatibility marker retained after Environment overview tab removal.
- v1.10.8 Environment Control final QA: current v1.10.8 compatibility marker retained after Environment overview tab removal.
- v1.10.8 Environment interlock/safety tab split: current v1.10.8 compatibility marker retained after Environment overview tab removal.
- v1.10.8 Environment unified scope/tab card: current v1.10.8 compatibility marker retained after Environment overview tab removal.
- v1.10.8 Environment storage target moved to docs: current v1.10.8 compatibility marker retained after Environment overview tab removal.
- v1.10.8 Environment zone helper text moved to docs: current v1.10.8 compatibility marker retained after Environment overview tab removal.

- v1.10.9 Settings page environment-control style shell: 톱니바퀴 `환경 설정` 화면을 환경 제어 페이지와 같은 단일 `gs-card` + 하위탭 구조로 맞춘다. 하위탭은 `연결 설정`, `구역 설정`, `날씨 설정`, `중앙 연동`이며 기존 설정 저장/날씨 위치 매칭/기상청 API 키/중앙 URL·활성화 코드 입력만 제공한다. 제어 실행, 수동 장치 제어, 신규 기능은 추가하지 않는다.
- v1.10.10 Settings page inside Green Smart shell hotfix: `환경 설정`은 독립 전체화면이 아니라 Green Smart 앱 shell 내부 페이지다. `_update()`는 `settings` 상태에서도 Green Smart sidebar를 렌더하고 `#main-area.has-sidebar`를 유지하며, 설정 톱니바퀴 버튼을 active로 표시한다. 설정 내용 카드는 v1.10.9의 하위탭/기존 기능 제한을 유지하되 기존 `page-head` 우회 헤더는 제거하고 공통 main-page hero를 사용한다.
- v1.10.11 Settings sidebar navigation hotfix: `환경 설정` 상태에서 취소 버튼을 누르지 않고 Green Smart sidebar의 `홈/작물 설정/환경 제어/관수 제어/장치제어/Admin/System`을 눌러도 `_state`가 `dashboard`로 복귀하고 선택한 `_page`가 정상 렌더된다. 설정 입력 저장/취소 기능은 그대로 유지하며, sidebar page click은 저장 실행이나 새 제어 기능을 만들지 않는다.
- v1.10.12 Device mapping moved to Settings: 환경 제어 visible 하위탭에서 `장치 매핑·상태`를 제거하고, 환경 설정 하위탭으로 `장치 매핑·상태`를 이동한다. 기존 entity 상태 요약, entity 매핑 추가/삭제/새로고침, 매핑 검증은 그대로 유지하되 환경 설정 화면의 구역 선택 scope 안에서 관리한다. 환경 제어에는 `data-env-legacy-tab="devices"` hidden marker만 남겨 호환성을 유지한다.
- v1.10.13 Crop Stage Model validation loop hardening: UI/DOM 확장은 중단하고 작물 상위 모델의 1~5단계(생육단계 예측 모델, 작물별 stage rule, feature snapshot, 예측 row 저장, 실제 조사 기반 validation loop)만 보강한다. 7일 예측은 정확히 7일 차 생육조사로만 검증하며, 정확한 7일 차 조사 데이터가 없으면 `validation_needs_review`와 `exact_7_day_survey_missing`로 저장한다. 생육상태 진단, 리스크 예측, 수확량 예측 본체는 사전 계획 전까지 작업하지 않는다.
- v1.10.14 Ordered Crop Stage Model steps: 사용자가 요청한 작업 순서대로 1단계 생육단계 예측 모델 → 2단계 작물별 stage rule → 3단계 feature snapshot → 4단계 prediction row 저장 → 5단계 정확히 7일 차 validation loop를 독립 계약으로 잠근다. `trainableBaseline.pipelineSteps`는 1~5 순서를 그대로 노출하고, 5단계는 nearest survey fallback 금지 및 `exact_7_day_survey_missing` review 정책을 유지한다. 생육상태 진단/리스크 예측/수확량 예측 본체는 이 릴리스 범위가 아니다.
- v1.10.15 Sequential Crop Stage Model implementation: 1~5단계를 묶지 않고 각 단계별로 설계→구현→검증을 완료한다. 1단계는 `stagePrediction7d`에 모델 메타데이터/입력/결정/한계/read-only boundary를 추가한다. 2단계는 tomato=G-Index, lettuce=L-Index stage rule 및 stage sequence metadata를 보강하고 unknown crop의 tomato fallback을 차단한다. 3단계는 feature snapshot의 required source groups, coverage, limitations, no-authority boundary를 명시한다. 4단계는 `predictionPersistence`와 sourceSurveyId 없는 orphan row 저장 차단을 추가한다. 5단계는 success/review validation row에 exact-7-day validation policy metadata를 저장한다.
- v1.10.16 Growth State Prediction Model: AI 전략의 생육상태 수치 예측 카드가 `growthStatePrediction`을 표시한다. core state는 문자열 없이 `balanceScore`, `directionCode`, `magnitudeBandCode`, `predictedBalance7d`, `movementScore7d`, `driverContributions`, `confidenceScore`로만 표시하고, UI는 `data-crop-growth-state-numeric-card`, `data-crop-growth-state-numeric-evidence`, `data-crop-growth-state-driver-contributions` marker를 제공한다. 기존 `data-crop-ai-evidence-card="reproductive-vegetative"` 및 yield marker는 호환 alias로 유지한다.
- v1.10.17 Risk Factor Prediction Model: AI 전략의 위험요소 수치 카드가 `riskFactorPrediction`을 표시한다. core risk는 `score`, `bandCode`, `trendCode`, `riskCode`, `confidenceScore`, `evidenceScore`로만 표시하고, UI는 `data-crop-risk-factor-numeric-card`, `data-crop-risk-factor-numeric-evidence`, `data-crop-risk-factor-item` marker를 제공한다. 이 카드는 read-only evidence이며 방제/환경/관수 실행 버튼을 만들지 않는다.
- v1.10.18 Integrated Crop Diagnosis Model: AI 전략의 통합진단 수치 카드가 `integratedCropDiagnosis`을 표시한다. UI는 `data-crop-integrated-diagnosis-card`, `data-crop-integrated-diagnosis-evidence`, `data-crop-diagnosis-source-sink-gap`, `data-crop-diagnosis-transition-need-code`, `data-crop-diagnosis-review-signal` marker를 제공한다. 이 카드는 read-only diagnosis evidence이며 setpoint/work-order/execution 버튼을 만들지 않는다.
- v1.10.19 Crop Action Recommendation Model: AI 전략의 조치 추천 요청 카드가 `cropActionRecommendation`을 표시한다. UI는 `data-crop-action-recommendation-card`, `data-crop-action-recommendation-evidence`, `data-crop-action-work-request`, `data-crop-action-model-request`, `data-crop-action-priority-code` marker를 제공한다. 이 카드는 read-only request evidence이며 target 값/work-order/execution 버튼을 만들지 않는다.
- v1.10.20 AI Strategy model pipeline UI: AI 전략 하위탭의 첫 화면은 완성된 5개 작물 모델 파이프라인을 우선 표시한다. `data-crop-ai-model-pipeline-summary`, `data-crop-ai-model-pipeline-step`, `data-crop-ai-review-request-summary`, `data-crop-ai-support-status-summary` marker를 사용하며, 순서는 생육단계 예측 → 생육상태 예측 → 위험요소 예측 → 통합 작물 진단 → 조치 추천 요청이다. 인터록/입력/ML 준비도는 support status로 내려가고 상세 모델/input evidence는 `data-crop-ai-advanced-details` 안에 접힌 상태로 유지한다. 실행/setpoint/work-order/자동 ML 컨트롤은 추가하지 않는다.
- v1.10.21 AI Strategy top summary cards: AI 전략 상단은 사용자 요청대로 `작물 요약` → `안전/인터록 상태 요약` → `모델 상태 요약(상세 버튼 포함)` 순서로 구성한다. 작물 요약은 `data-crop-ai-crop-summary` 안에 작물단계, 작물상태, 환경리스크, 관수리스크, 병충해리스크를 표시하고, 안전/인터록 요약은 `data-crop-ai-safety-interlock-summary` 안에 안전상태, 인터록 상태, 오류건수를 표시한다. 모델 상태 요약은 `data-crop-ai-model-detail-toggle` 상세 버튼과 모델 파이프라인/검토요청 요약을 유지하며 상세 evidence는 접힘 영역에 둔다.
- v1.10.22 Crop summary card labels: AI 전략의 `작물 요약` 카드 표시 문법을 사용자 요청대로 조정한다. 작물단계는 텍스트 stage label을 메인값으로 두고 작물단계 모델 스코어/신뢰점수를 하단에 표시한다. 작물상태는 강한 생식생장/영양생장 등 텍스트와 방향 이모티콘을 메인값으로 표시하고 작물상태 모델 스코어/신뢰점수를 하단에 표시한다. 환경리스크/관수리스크 명칭은 각각 환경요약/관수요약으로 바꾸고 메인값은 고온/저온/온도급변, 높은 EC/과관수 같은 텍스트 요약으로 표시한다. 병충해요약은 병충해 위험 스코어를 메인값으로 표시하고 신뢰점수를 하단에 표시한다.
- v1.10.23 Crop summary operator labels: 환경요약/관수요약은 `안정` fallback을 메인값으로 쓰지 않고 위험요소 모델의 top factor 텍스트를 메인값으로 표시한다. 하단에는 각 영역의 스코어와 신뢰도 점수만 표시한다. 병충해요약은 `매우심각`/`심각`/`보통`/`낮음` 등급 텍스트를 메인값으로 표시하고, 하단에는 병충해 영역 스코어와 신뢰도 점수만 표시한다. 작물상태 방향 이모티콘은 과실/잎 아이콘이 아니라 영양↔생식 방향성을 보여주는 `↗️`/`⏫`/`↘️`/`⏬`/`➡️` 계열로 표시한다. Required markers: `data-crop-ai-summary-environment-label`, `data-crop-ai-summary-irrigation-label`, `data-crop-ai-summary-pest-label`, `data-crop-ai-summary-growth-direction-emoji`.
- v1.10.24 Crop summary visible text cleanup: 작물 요약 카드의 보이는 subtitle은 `이번 주 모델을 통해서 출력된 작물 상태의 요약입니다.`로 표시한다. UI에는 개발/내부 안내 성격의 `작물 요약` 보조 chip, `상세 근거는 모델 상태 카드`, `농장주/직원용 요약 우선 · read-only · 자동 실행 없음` 문구를 노출하지 않는다. 해당 boundary/구성 의도는 문서와 계약에만 보존한다. 앞으로도 read-only/자동 실행 없음/상세 근거 위치/농장주 우선 같은 개발·운영 boundary 문구를 작물 요약 카드의 visible UI에 직접 노출하지 않는다.
- v1.10.25 Interlock detail modal: 안전/인터록 상태 요약 카드에서 중복 안내문 `안전/인터록 확인 안전상태 · 인터록 상태 · 오류건수를 먼저 확인합니다.`를 `상태 요약 현재 작물 모델 적용 전 확인이 필요한 안전·승인 상태입니다.`로 교체한다. 승인 gate, 승인으로 해소, 미해소 차단, 운영자 확인/농장주 승인/관리자 승인 버튼은 기본 카드에서 숨기고 `오류건수` metric 클릭 시 표시되는 상세 모달로 이동한다. Required markers: `data-crop-ai-error-count-open`, `data-crop-ai-interlock-detail-modal`, `data-crop-ai-interlock-detail-close`, `data-crop-ai-interlock-modal-gate`, `data-crop-ai-interlock-modal-resolved`, `data-crop-ai-interlock-modal-unresolved`, `data-crop-ai-interlock-modal-actions`.
- v1.13.4 Interlock detail modal hidden hotfix: `data-crop-ai-interlock-detail-modal`은 초기 렌더에서 반드시 `display:none`이어야 하며, `오류건수` 클릭 핸들러에서만 `modal.style.display = "flex"`로 열린다. 닫기 버튼은 `modal.style.display = "none"`으로 되돌린다. `hidden` 속성과 inline `display:flex`를 동시에 두면 사이드바에서 작물 설정을 클릭하자마자 모달이 노출될 수 있으므로 금지한다.
- P1 rendered-flow QA v1.10.9: current v1.10.9 compatibility marker retained after settings page shell alignment.
- v1.10.9 AI-first control tab alignment: current v1.10.9 compatibility marker retained after settings page shell alignment.
- v1.10.9 Environment zone card header cleanup: current v1.10.9 compatibility marker retained after settings page shell alignment.
- v1.10.9 Environment zone card UI/UX alignment: current v1.10.9 compatibility marker retained after settings page shell alignment.
- v1.10.9 Environment Control final QA: current v1.10.9 compatibility marker retained after settings page shell alignment.
- v1.10.9 Environment interlock/safety tab split: current v1.10.9 compatibility marker retained after settings page shell alignment.
- v1.10.9 Environment unified scope/tab card: current v1.10.9 compatibility marker retained after settings page shell alignment.
- v1.10.9 Environment storage target moved to docs: current v1.10.9 compatibility marker retained after settings page shell alignment.
- v1.10.9 Environment zone helper text moved to docs: current v1.10.9 compatibility marker retained after settings page shell alignment.
- v1.10.9 Environment overview tab removed: current v1.10.9 compatibility marker retained after settings page shell alignment.


## R7-000 Main Dashboard / Sidebar / Detail Page IA Blueprint

`v1.13.4`에서 R7-000 IA blueprint를 완료했다.

Reference:

```text
docs/rebuild/r7-000-main-dashboard-sidebar-detail-ia-blueprint.md
```

Boundary:

```text
R7-000 Main Dashboard / Sidebar / Detail Page IA Blueprint
작물상태 → 생육목표 → 환경/관수/장치 영향 → 추천/실행
R7-000 is an IA blueprint only
No panel DOM implementation change in R7-000
No API route change in R7-000
No DB migration in R7-000
No execution authority in R7-000
No SafetyGuard/Interlock runtime behavior change in R7-000
question gates must use clarify tool
```


## R7-001 Main Dashboard Redesign

`v1.13.4`에서 R7-001 main dashboard redesign을 완료했다.

Reference:

```text
docs/rebuild/r7-001-main-dashboard-redesign.md
```

Boundary:

```text
R7-001 Main Dashboard Redesign
implements the first operator-visible crop-centered dashboard
render from existing GET /api/green_smart/rebuild/home/context shape
No fixture-only cards in R7-001
No API route change in R7-001
No DB migration in R7-001
No execution authority in R7-001
No approval/override release in R7-001
No SafetyGuard/Interlock runtime behavior change in R7-001
```


## R7-002 Sidebar Navigation + Page Shell

`v1.13.4`에서 R7-002 sidebar navigation + page shell을 완료했다.

Reference:

```text
docs/rebuild/r7-002-sidebar-navigation-page-shell.md
```

Boundary:

```text
R7-002 Sidebar Navigation + Page Shell
implements the R7 sidebar primary groups and page shell
운영 홈 / 작물 중심 운영 / 현장 상태 / 추천·실행 검토 / 설정
No API route change in R7-002
No DB migration in R7-002
No execution authority in R7-002
No approval/override release in R7-002
No SafetyGuard/Interlock runtime behavior change in R7-002
```


## R7-003 Detail/Configuration Subpages Baseline

`v1.13.4`에서 R7-003 detail/configuration subpages baseline을 완료했다.

Reference:

```text
docs/rebuild/r7-003-detail-configuration-subpages-baseline.md
```

Boundary:

```text
R7-003 Detail/Configuration Subpages Baseline
selected scope: all five sidebar groups receive read-only detail/config placeholder baselines
운영 홈 / 작물 중심 운영 / 현장 상태 / 추천·실행 검토 / 설정
No API route change in R7-003
No DB migration in R7-003
No execution authority in R7-003
No approval/override release in R7-003
No SafetyGuard/Interlock runtime behavior change in R7-003
No MQTT/device command in R7-003
```


## R7-004 Settings/Admin Read-only Detail

`v1.13.4`에서 R7-004 settings/admin read-only detail을 완료했다.

Reference:

```text
docs/rebuild/r7-004-settings-admin-readonly-detail.md
```

Boundary:

```text
R7-004 Settings/Admin Read-only Detail
user-selected scope: 설정 — RBAC/config/admin read-only detail
No API route change in R7-004
No DB migration in R7-004
No execution authority in R7-004
No role assignment mutation in R7-004
No raw secrets in R7-004
No MQTT/device command in R7-004
```
