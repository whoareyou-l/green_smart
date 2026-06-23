# Green Smart Current UI, Design System, Navigation and Page Contract

> 기준 버전: `v1.9.46`
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
| 현재 version | `1.9.46` |

작업 시 우선순위:

1. 실제 구현 기준은 `green-smart-panel.js`다.
2. UI 요소를 어디에 배치할지, 어떤 역할이 볼 수/실행할 수 있는지는 [`ui-information-architecture-and-rbac.md`](ui-information-architecture-and-rbac.md)를 먼저 따른다.
3. 이 문서는 해당 파일에서 추출한 상세 현재 UI 기준이다.
4. `docs/design/irrigation-control-page.md`, `docs/design/device-control-page.md`는 현재 구현과 상당히 일치하지만 일부 API 경로/프레임워크 초안은 미래 설계 흔적이다.
5. UI 동작 변경 후에는 manifest/panel `VERSION`을 함께 올려 HA/WebView cache 문제를 방지한다.

---

## 1.1 정보구조/RBAC 기준

Green Smart의 최종 사용자인 농장주와 농장직원은 컴퓨터 전공자가 아니다. 따라서 UI는 기능을 개발 순서대로 나열하지 않고, 농장 운영 흐름과 역할별 권한에 맞게 정리한다.

상세 기준:

```text
docs/design/ui-information-architecture-and-rbac.md
```

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

### 2.3 색상 기준

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

### 8.1 하위 탭

| key | label | 목적 |
|---|---|---|
| `basic` | 기본 설정 | 작기 등록/수정/철거/삭제 |
| `growth` | 생육조사 | 작물별 dynamic metrics 기록 + Phase 6 생육 리포트 |
| `pest` | 병해충 예찰 | 발생 위치/심각도 기록 |
| `control` | 방제 기록 | 약제/PLS/방제 이력 기록 |

### 8.2 작기 selector

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

### 8.3 기본 설정 탭

기능:

- CSV 내보내기
- 정식 등록
- 작기 수정
- 철거
- 삭제
- 5개 단위 pagination

표시:

- 작물명/품종
- 상태 badge
- 정식일
- 철거일
- 구역
- 재배 방식
- 총 주수

### 8.4 생육조사 탭

기능:

- 생육 리포트 카드 표시
- G-Index 추이 표시
- 수확량 예측 baseline 표시
- 작물별 수확 모델 상세 표시
- 주당/면적당 수확 예측 표시
- 예측 근거/yield driver 표시
- 병해 위험도 표시
- 병해 위험 모델 상세 표시
- 환경/날씨/방제 이력 driver 표시
- 권장 조치 표시
- 주간 리포트 summary/actions 표시
- 주간 리포트 CSV 내보내기
- 주간 리포트 Home Assistant 알림 보내기
- 병해충 예찰 추가 팝업: 현재 작기 기준 발생 위치, 전체/부분 범위, 상세 위치
- 병해충 예찰 추가 팝업: 농약 API 자동완성 기반 다중 병해충 입력
- 방제 기록 추가 팝업: 현재 작기 기준 처리 위치, 전체/부분 범위, 상세 위치
- 리포트 새로고침
- CSV 내보내기
- 생육조사 추가
- 조사 row 삭제

구현/API marker:

```text
_renderGrowthReportCard()
data-growth-report-card
data-growth-report-refresh
GET green_smart/crop/seasons/{season_id}/growth-report
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

### 8.5 병해충 예찰 탭

기능:

- CSV 내보내기
- 병해충 추가
- 삭제

필드:

- 조사일
- 병해충 type
- 위치
- 발생도
- note

발생도:

| key | 표시 |
|---|---|
| `low` | 낮음 |
| `mid` | 보통 |
| `high` | 높음 |
| `critical` | 위험 |

### 8.6 방제 기록 탭

기능:

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

v1.9.46 기준 관수 페이지는 초기 진입 시 여러 API 응답마다 전체 화면을 재렌더하지 않는다.

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

### 11.6 v1.9.46 생육 AI 전략/제어 페이지 정보 구조 contract

v1.9.46 기준 작물 관리와 제어 페이지는 다음 UI 구조를 유지한다.

작물 관리:

- 하위탭: `작기 설정`, `생육조사`, `AI 전략`, `병해충 예찰`, `방제 기록`
- `생육조사` 탭: 생육조사 기록 목록/등록/수정/삭제/내보내기에 집중한다.
- `AI 전략` 탭: `_renderGrowthReportCard()`를 렌더링해 생육 리포트, G-Index, 수확량 예측, 병해 위험 분석을 모아 보여준다.
- Stage Diagnosis / Crop Interlock 카드: `data-stage-diagnosis-card`, `data-crop-interlock-card` marker로 현재 생육단계, 단계 신뢰도, Index band, 다음 조사, 부족한 증거, 작물 인터록 상태, target promotion/자동 실행 차단 여부, 수확 안전 확인 필요 여부를 표시한다.
- Crop Interlock 승인 gate 표시: `data-crop-interlock-approval-gate` marker로 `approvalGateStatus`, 승인으로 해소된 reason, 미해소 차단 reason을 표시한다.
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

### 11.7 v1.9.46 Admin/System 관리 기능 contract

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
