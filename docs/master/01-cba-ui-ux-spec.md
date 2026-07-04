# 1. CBA 화면 기획서 — UI/UX 설계도

> 기준일: `2026-06-27`
> 기준 버전: `v1.14.56`
> 문서 목적: Green Smart 화면을 **공통 부품(COM) → 복합 모듈(MOD) → 전체 페이지(PAGE)** 3단계로 정리하여, 코드가 화면마다 중복/난립하지 않도록 한다.

## 1. 설계 원칙

Green Smart UI는 Home Assistant 안에서 실행되지만, 사용자는 HA 개발자가 아니라 **농장주와 농장직원**이다. 따라서 UI는 내부 `entity_id`, MQTT topic, raw JSON, PID 용어보다 다음 질문에 먼저 답해야 한다.

- 지금 위험한가?
- 오늘 무엇을 해야 하는가?
- AI는 무엇을 추천했는가?
- 자동 실행 가능한가, 아니면 승인이 필요한가?
- 왜 차단되었는가?
- 누가 언제 어떤 제어를 했는가?

### 1.1 UI 런타임 기준

| 항목 | 기준 |
|---|---|
| Runtime | Home Assistant sidebar custom panel |
| 구현 | Vanilla JavaScript Web Component |
| Custom element | `green-smart-panel` |
| 소스 | `custom_components/green_smart/panel/green-smart-panel.js` |
| 스타일 톤 | Modern SaaS greenhouse dashboard |
| 모바일 | `.sb-mobile` topbar + 가로 스크롤 탭 |

### 1.1.1 스타일 톤 / 모바일 인터랙션 의무 규칙

모바일 WebView에서는 작은 터치 오작동과 배경 스크롤 누수가 실제 현장 입력 오류로 이어질 수 있다. 모든 COM/MOD/PAGE 구현은 아래 규칙을 만족해야 한다.

| 항목 | 의무 규칙 | 구현 기준 |
| :--- | :--- | :--- |
| 최소 터치 타겟 | 모든 클릭/터치 요소는 최소 `44px × 44px` 이상 | 버튼, 탭, icon-only action, 모달 닫기, 승인 버튼에 적용 |
| 터치 간격 | 독립 action 간 시각/터치 간격 최소 `8px` | 위험 action과 일반 action은 같은 줄에 밀착 금지 |
| body scroll lock | `COM-Modal` 활성화 시 모바일에서 배경 body 스크롤 잠금 | `document.body.classList.add("gs-modal-open")` 또는 동등 구현 |
| modal scroll | 모달 내부만 스크롤 허용 | `.gs-modal__body { overflow:auto; max-height: ... }` |
| backdrop touch | backdrop 터치로 닫는 모달은 destructive/approval 흐름에서 금지 | 승인/실행/삭제 모달은 명시적 닫기 버튼 필요 |
| keyboard safe area | 모바일 가상 키보드가 활성화되어도 primary action이 가려지거나 붕괴하지 않아야 함 | `window.visualViewport` 재계산 및 `--visual-viewport-height` CSS 변수 연동 |

표준 CSS 및 뷰포트 방어 스크립트 계약:

```css
body.gs-modal-open {
  overflow: hidden;
  touch-action: none;
}

.gs-touch-target {
  min-width: 44px;
  min-height: 44px;
}

:root {
  --visual-viewport-height: 100vh;
  --gs-keyboard-safe-bottom: env(safe-area-inset-bottom, 0px);
}

/* 모바일 가상 키보드 대응 레이아웃 상위 컨테이너 */
.gs-mobile-safe-container {
  height: calc(var(--visual-viewport-height, 100vh));
  display: flex;
  flex-direction: column;
}

.gs-modal-shell {
  max-height: calc(var(--visual-viewport-height, 100vh));
  display: flex;
  flex-direction: column;
}

.gs-modal__body {
  overflow: auto;
  flex: 1 1 auto;
  padding-bottom: calc(72px + var(--gs-keyboard-safe-bottom));
}

.gs-modal__actions,
.gs-primary-action-row {
  position: sticky;
  bottom: 0;
  z-index: 2;
  min-height: 44px;
  padding-bottom: var(--gs-keyboard-safe-bottom);
  background: var(--card-background-color, #fff);
}
```

PAGE 및 모달 컴포넌트 초기화(`connectedCallback`) 시 의무 바인딩:

```js
function bindVisualViewportHeight() {
  const handleResize = () => {
    const height = window.visualViewport?.height || window.innerHeight;
    document.documentElement.style.setProperty(
      "--visual-viewport-height",
      `${height}px`
    );
  };

  handleResize();

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", handleResize);
    window.visualViewport.addEventListener("scroll", handleResize);
    return () => {
      window.visualViewport.removeEventListener("resize", handleResize);
      window.visualViewport.removeEventListener("scroll", handleResize);
    };
  }

  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}
```

`MOD-GrowthSurveyList`, 병해충 예찰 입력, 방제 기록 입력, 승인/확인 모달처럼 모바일에서 텍스트/숫자 입력을 포함하는 모든 `COM-Modal`은 iOS Safari/WebView와 Android WebView의 viewport 계산 차이를 방어해야 한다. `height: 100vh`만 사용하면 키보드 활성화 시 하단 Primary Action이 가려질 수 있으므로 금지한다.

모달 입력 UX 의무 규칙:

```text
1. 모달 open 시 bindVisualViewportHeight()를 호출한다.
2. 모달 close/disconnect 시 listener를 반드시 해제한다.
3. 입력 focus 시 primary action row는 sticky 상태로 viewport 하단에 남아야 한다.
4. form body는 내부 스크롤만 허용하고, body 배경 스크롤은 계속 잠근다.
5. iOS에서 input focus 후 300ms 안에 active input을 scrollIntoView({block:'center'})로 보정할 수 있다.
6. submit/approve/delete 같은 primary action은 키보드가 열린 상태에서도 최소 44px 높이를 유지한다.
```

표준 focus 보정 예시:

```js
function bindModalInputFocusScroll(modalRoot) {
  const onFocusIn = (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (!target.matches("input, textarea, select")) return;
    window.setTimeout(() => {
      target.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
    }, 300);
  };
  modalRoot.addEventListener("focusin", onFocusIn);
  return () => modalRoot.removeEventListener("focusin", onFocusIn);
}
```

테스트/QA marker:

```text
data-mobile-keyboard-safe-modal
data-mobile-keyboard-sticky-actions
data-visual-viewport-height-bound
```

### 1.2 3단계 CBA 구조

```text
COM-*  = Shared Components, 데이터/맥락 없는 최소 UI 부품
MOD-*  = Feature Modules, 데이터/API/MQTT/로직이 결합된 독립 블록
PAGE-* = Pages/Views, MOD를 배치한 최종 화면
```

---

## 2. 1단계 — 공통 부품 Shared Components

| ID | 이름 | 역할 | 주요 Props / State | 금지사항 |
|---|---|---|---|---|
| COM-Button | 버튼 | 클릭 가능한 기본 action | `variant`, `size`, `disabled`, `loading`, `danger`, `icon` | 권한/실행 로직 직접 포함 금지 |
| COM-Input | 입력 | 텍스트/숫자 입력 | `type`, `value`, `unit`, `min`, `max`, `dirty` | 저장 API 직접 호출 금지 |
| COM-Select | 선택 | 작기/구역/모드 선택 | `options`, `value`, `label`, `disabledReason` | 선택 시 실제 실행 금지 |
| COM-Badge | 상태 배지 | 정상/경고/차단/승인필요 표시 | `status`, `label`, `tone` | raw code만 노출 금지 |
| COM-StateBadge | 상태 배지 | ok/partial/stale/empty/loading/error를 운영자 언어로 표시 | `state`, `tone`, `label` | raw state code만 노출 금지 |
| COM-EmptyState | 데이터 없음 안내 | 비어 있거나 오류인 상태를 안내 | `message`, `reason`, `nextHint` | 개발자/레거시 문구 노출 금지 |
| COM-LoadingSkeleton | 로딩 스켈레톤 | 데이터 로딩 중 자리 표시 | `loading`, `label` | spinner만 두고 맥락 생략 금지 |
| COM-DataFreshnessPill | 데이터 신선도 | 몇 분 전 갱신/갱신 없음 표시 | `freshnessMinutes`, `label` | 오래된 데이터를 정상처럼 표시 금지 |
| COM-Pill | 작은 정보 chip | 센서값/권한/범위 표시 | `label`, `value`, `unit` | 긴 문장/복잡 설명 금지 |
| COM-Card | 카드 shell | 정보 그룹화 | `title`, `subtitle`, `actions`, `compact` | 데이터 fetch 직접 금지 |
| COM-Metric | 지표 | label/value/help 3단 구조 | `label`, `value`, `unit`, `help`, `trend` | 값만 던지고 의미 생략 금지 |
| COM-Modal | 팝업 | 상세/입력/승인 화면 | `open`, `title`, `onClose`, `size` | 초기 렌더 노출 금지 |
| COM-Tab | 탭 | 하위 화면 전환 | `active`, `icon`, `label` | 중복 emoji+icon 표시 금지 |
| COM-ZoneTabs | 구역 탭 | 전체/A/B 등 구역 선택 | `activeZoneId`, `stageKey`, `aria-selected` | 모든 구역 내용을 펼쳐 스크롤바로 탐색시키지 않음 |
| COM-ZonePanel | 선택 구역 패널 | 선택된 구역 요약만 표시 | `zoneId`, `stageKey`, `hidden` | 비활성 구역 내용은 `hidden` 처리 |
| COM-ZoneDetailModal | 구역 상세 모달 | 선택 구역 상세 확인 | `open`, `zoneId`, `stageKey` | `COM-Modal` scroll lock 규칙 준수 |
| COM-Typography | 텍스트 | 제목/본문/도움말 | `variant`, `tone` | 개발자 내부 문구 노출 금지 |

### 2.1 공통 DOM 계약

```text
data-common-main-page
data-common-main-hero
data-common-main-body
data-crop-ui-shell
data-crop-ui-tab-bar
data-crop-ui-action-bar
data-crop-ui-record-list
#main-area.has-sidebar
```

---

## 3. 2단계 — 복합 모듈 Feature Modules

| ID | 모듈명 | 사용 페이지 | 데이터 소스 | 핵심 동작 | 필수 로그/안전 |
|---|---|---|---|---|---|
| MOD-Sidebar | 사이드바 | 전체 | local UI state | Home/Crop/Env/Irr/Device/Settings 전환 | 설정에서 page 클릭 시 `_state=dashboard` |
| MOD-MobileTopbar | 모바일 상단바 | 전체 | local UI state | 모바일 nav/설정/로그아웃 | desktop과 page key 동일 |
| MOD-SensorCard | 센서 카드 | Home/Env | HA entity, sensor_logs | 온도/습도/CO2/VPD 표시 | stale/unavailable 표시 |
| MOD-VpdMetric | VPD 지표 | Home/Env/ML | temp/rh | VPD 계산값과 상태 표시 | RH 범위 검증 |
| MOD-ZoneSeasonSelector | 구역+현재작기 선택 | Env/Irr/Device | crop_cycles, greenhouses | zone parent + attached current crop cycle 선택 | 실행 권한 없음 |
| MOD-CropCycleCard | 작기 카드 | Crop | crop_cycles | 상추/토마토 작기 상태 표시 | crop_cycle_id 유지 |
| MOD-GrowthSurveyList | 생육조사 목록 | Crop | growth_surveys | 주간 기록 입력/수정/삭제 | 수행자 user_id 기록 |
| MOD-CropAiSummary | 작물 AI 요약 | Crop AI | crop model API | 작물단계/상태/환경/관수/병충해 요약 | read-only |
| MOD-CropStageZoneDetail | 작물 운영 단계별 구역 상세 | Rebuild Home | REBUILD_HOME_CONTEXT, REBUILD_ZONE_CONTEXTS, stage details | 작물상태/생육목표/환경·관수·장치 영향/추천·실행 각각에서 구역 탭으로 선택 구역 패널 표시 | 별도 `구역별 작물 운영` 섹션 금지 |
| MOD-InterlockSummary | 안전/인터록 요약 | Crop/Control | interlock API | 안전상태/인터록/오류건수 표시 | 오류건수 클릭 모달 |
| MOD-WindowController | 천창 제어 | Device/Env | controlService, HA cover | Dry Run, 승인 후 제어 | SafetyGuard 필수 |
| MOD-ControlModeCard | 제어 모드 | Env/Irr/Device | control mode API | manual/assist/auto/disabled | auto는 allowAutoExecution 필요 |
| MOD-DeviceMapping | 장치 매핑 | Settings | devices, HA entity | 장치↔entity/service mapping | validation 필수 |
| MOD-ControlLogList | 제어 로그 | Home/Control | control_logs | 누가/언제/무엇을/결과 표시 | user_id 필수 |
| MOD-EmergencyBanner | 비상 배너 | 전체 | safety events | 센서오류/강풍/통신장애 표시 | dismiss/ack/clear audit |
| MOD-WeatherConfig | 날씨 설정 | Settings | KMA/WeatherFlow config | 주소/격자/API key 설정 | API key masked |

### 3.1 Feature Module 작성 규칙

```markdown
### MOD-XXX 모듈명
- 목적:
- 사용 PAGE:
- 입력 데이터:
- 출력 DOM:
- Frontend service:
- Backend endpoint:
- DB table/log:
- MQTT/HA entity 영향:
- RBAC:
- Interlock/Safety:
- 테스트 marker:
```

### 3.1.1 Rebuild Home Context Source 계약

`PAGE-CropCenteredHome`의 구역 데이터는 API 연결 전이라도 명시적인 context source shape를 따라야 한다.

```text
REBUILD_HOME_CONTEXT
contextSource: static-fixture-before-api
greenhouseId / greenhouseName / generatedAt
zone parent + currentCrop attached
zones[]
  currentCrop: cropSeasonId, cropType, cropLabelKo, growthStage
  equipmentProfile: labels[]
  dataAvailability: state, freshnessMinutes, note
```

규칙:

- `currentCrop`은 zone의 하위 attached context다.
- `equipmentProfile`은 구역별 장비 표시 source다.
- `dataAvailability`는 `COM-StateBadge`, `COM-DataFreshnessPill`, `COM-EmptyState`, `COM-LoadingSkeleton`의 입력이다.
- RS-006에서는 `contextSource`가 `static-fixture-before-api`이며, fetch/API/service execution은 금지한다.

### 3.1.2 RS-007 read-only home context API shell

```text
GET /api/green_smart/rebuild/home/context
summary + zones
static-fixture-before-api
readOnly: true
executionEnabled: false
DB 연결 없음
서비스 실행 없음
```

이 API shell은 `PAGE-CropCenteredHome`의 context source를 backend route로 고정하기 위한 read-only 계약이다. RS-007에서는 fixture response만 반환하고, DB 연결/HA service 실행/실행 버튼은 추가하지 않는다.

### 3.2 작기 변경 State Propagation 계약

작기(Crop Cycle) 또는 구역(Zone) 변경은 하나의 카드 내부 상태로 끝나면 안 된다. `MOD-ZoneSeasonSelector`에서 선택이 바뀌면 같은 PAGE 안의 모든 독립 Feature Module이 동일한 `greenhouse_id`, `zone_id`, `crop_cycle_id`를 받아 다시 조회해야 한다.

#### 3.2.1 표준 Custom Event

| 항목 | 계약 |
|---|---|
| 이벤트 이름 | `crop-cycle-changed` |
| 템플릿 표기 | `@crop-cycle-changed` |
| 발생 주체 | `MOD-ZoneSeasonSelector`, `MOD-CropCycleCard` 중 active crop cycle을 바꾸는 모듈 |
| 수신 주체 | 같은 PAGE 아래의 `MOD-SensorCard`, `MOD-GrowthSurveyList`, `MOD-CropAiSummary`, `MOD-InterlockSummary`, `MOD-WindowController`, `MOD-ControlLogList` 등 |
| 전파 방식 | `bubbles: true`, `composed: true` |
| 필수 결과 | 모든 수신 모듈은 기존 in-flight 요청을 취소/무시하고 새 context로 re-fetch |

#### 3.2.2 Event payload

```ts
type CropCycleChangedDetail = {
  greenhouse_id: number;
  zone_id: number;
  crop_cycle_id: number | null;
  crop_type: "tomato" | "lettuce" | "paprika" | "strawberry" | "cucumber" | "herb" | "other" | null;
  crop_label_ko: string | null;
  source_module: "MOD-ZoneSeasonSelector" | "MOD-CropCycleCard";
  changed_at: string; // ISO-8601
};
```

#### 3.2.3 발생 코드 표준

```js
this.dispatchEvent(new CustomEvent("crop-cycle-changed", {
  bubbles: true,
  composed: true,
  detail: {
    greenhouse_id,
    zone_id,
    crop_cycle_id,
    crop_type,
    crop_label_ko,
    source_module: "MOD-ZoneSeasonSelector",
    changed_at: new Date().toISOString(),
  },
}));
```

#### 3.2.4 수신 모듈 Re-fetch 규칙

| 수신 모듈 | Re-fetch 대상 | stale 처리 |
|---|---|---|
| `MOD-SensorCard` | `sensorService.getCurrentSensors({ greenhouse_id, zone_id })` | 기존 센서값은 `loading` skeleton으로 전환 |
| `MOD-GrowthSurveyList` | `cropService.listGrowthSurveys(crop_cycle_id)` | 이전 작기 기록 즉시 숨김 |
| `MOD-CropAiSummary` | `cropAiService.getGrowthReport(crop_cycle_id)` | `read-only` summary 재조회 |
| `MOD-InterlockSummary` | `safetyService.getCropInterlock(crop_cycle_id, zone_id)` | 오류건수/승인 gate 재계산 |
| `MOD-WindowController` | `controlService.getFinalTargets({ crop_cycle_id, zone_id, domain:"device" })` | 실행 버튼 disabled until refresh |
| `MOD-ControlLogList` | `controlService.getLogs({ crop_cycle_id, zone_id })` | 이전 log page cursor 폐기 |

구현 금지:

```text
crop_cycle_id 변경 후 이전 작기의 생육조사/AI 요약/제어 로그를 계속 보여주기
구역만 바꾸고 crop_cycle_id를 갱신하지 않기
이벤트 없이 전역 mutable state만 바꾸기
하위 모듈이 직접 DOM을 뒤져 crop_cycle_id를 추론하기
```

---

## 4. 3단계 — 전체 페이지 Pages / Views

| ID | 페이지 | 사용자 | 핵심 모듈 | 성공 기준 |
|---|---|---|---|---|
| PAGE-Dashboard | 홈 | farm_owner, farm_staff | MOD-SensorCard, MOD-EmergencyBanner, MOD-ControlLogList | 현재 온실 상태와 조치 필요를 10초 안에 파악 |
| PAGE-CropCenteredHome | 새 작물 중심 홈 | farm_owner, farm_staff | MOD-CropStageZoneDetail | 작물상태 → 생육목표 → 환경/관수/장치 영향 → 추천/실행 흐름에서 구역 탭으로 세부 확인 | 개발/레거시 전환 문구 노출 금지 |
| PAGE-CropSettings | 작물 설정 | 전 역할 | MOD-CropCycleCard, MOD-GrowthSurveyList, MOD-CropAiSummary, MOD-InterlockSummary | 상추/토마토 작기와 기록을 한 흐름으로 관리 |
| PAGE-EnvironmentControl | 환경 제어 | owner/admin | MOD-ZoneSeasonSelector, MOD-VpdMetric, MOD-ControlModeCard | 온습도/VPD 목표와 safety 상태 확인 |
| PAGE-IrrigationControl | 관수 제어 | owner/admin/staff 제한 | 관수전략, EC/pH, drain feedback | 자동 급액 전 safety/approval 확인 |
| PAGE-DeviceControl | 장치 제어 | admin/owner 제한 | MOD-WindowController, MOD-DeviceMapping, MOD-ControlLogList | 천창/측창/팬 등 장치 dry-run/실행/로그 확인 |
| PAGE-Settings | 환경 설정 | admin 중심 | MOD-WeatherConfig, MOD-DeviceMapping | 앱 shell 안에서 연결/구역/날씨/중앙/장치 매핑 관리 |
| PAGE-AdminSystem | 관리자 | admin | RBAC, diagnostics, backup | 시스템 설정과 운영 진단 분리 |

---

## 5. 대표 화면 상세 초안

### 5.1 PAGE-Dashboard — 홈

```text
[Sidebar]
└─ Main
   ├─ Hero: Green Smart / 현재 농장 상태
   ├─ MOD-EmergencyBanner
   ├─ KPI Row: 온도, 습도, CO2, VPD, 광량
   ├─ MOD-SensorCard grid
   ├─ MOD-ZoneSeasonSelector summary
   ├─ 오늘 할 일 / 조치 필요
   └─ 최근 ControlLog 5건
```

핵심 DOM marker:

```text
data-home-action-summary
data-home-action-result
data-kpi-temp
data-kpi-humidity
data-kpi-vpd
data-zone-card
data-control-log-list
```

### 5.2 PAGE-CropSettings — 작물 설정

| 탭 | 목적 | 주요 모듈 |
|---|---|---|
| 작기 설정 | 작기 등록/수정/철거/삭제 | MOD-CropCycleCard |
| 생육조사 | 상추/토마토 주간 생육조사 | MOD-GrowthSurveyList |
| AI 전략 | 작물 모델 요약/read-only evidence | MOD-CropAiSummary, MOD-InterlockSummary |
| 병해충 예찰 | 발생도/위치/후속 방제 연결 | pest scouting modules |
| 방제 기록 | PLS/PHI/REI 중심 기록 | control treatment modules |

AI 전략 상단 3카드:

```text
1. 작물 요약
   - 작물단계
   - 작물상태
   - 환경요약
   - 관수요약
   - 병충해요약
2. 안전/인터록 상태 요약
   - 안전상태
   - 인터록 상태
   - 오류건수 → 클릭 시 상세 모달
3. 모델 상태 요약
   - 5개 작물 모델 pipeline
   - 상세 근거 버튼
```

### 5.3 PAGE-DeviceControl — 천창 제어 예시

```text
[천창 카드]
- 현재 개도율: 30%
- AI 후보: 40%
- 최종 적용값: 30%
- 안전 상태: clear / blocked / failsafe
- 버튼: Dry Run, 승인 요청, 실행
```

실제 실행 버튼은 다음 조건이 모두 true일 때만 활성화한다.

```text
RBAC 허용
Control Mode 허용
Limited Auto 또는 수동 확인 완료
SafetyGuard clear
Interlock clear
Entity mapping valid
Dry Run pass
```

---

## 6. UI 금지사항

```text
data-crop-ai-execute-device
data-crop-ai-train-production-model
cropAiAllowExecution
data-crop-control-execute-spray
data-env-direct-execute
environmentAllowDirectExecution
```

- 작물 AI 카드에서 장치 실행 버튼을 직접 노출하지 않는다.
- 병해충/방제 기록에서 자동 살포/자동 방제 스케줄을 생성하지 않는다.
- 설정 페이지를 HA full-screen page처럼 분리하지 않는다. 항상 Green Smart sidebar shell 안에 둔다.


## VS-N002 Crop cycle recording scaffold

```text
VS-N002 Crop cycle recording scaffold
cropCycleRecordingScaffold
recordingMode = scaffold_only
```

The UI grammar may show crop-cycle recording ownership later, but VS-N002 itself does not add a visible save form or change existing Crop Settings save behavior.


## VS-N003 Real-time monitoring read-only scaffold

```text
VS-N003 Real-time monitoring read-only scaffold
realtimeMonitoringReadOnlyScaffold
monitoringMode = scaffold_only
```

The UI grammar may show real-time monitoring later, but VS-N003 itself does not add a visible monitoring card or bind live sensor values.


## VS-N004 Interlock/Safety core scaffold

```text
VS-N004 Interlock/Safety core scaffold
interlockSafetyCoreScaffold
safetyMode = scaffold_only
```

The UI grammar may show safety/interlock state later, but VS-N004 itself does not add a visible safety card or execution/override control.
