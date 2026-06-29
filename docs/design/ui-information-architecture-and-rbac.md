# Green Smart UI Information Architecture and RBAC Baseline

> 기준 버전: `v1.12.79`
> 리빌딩 단계: `R1 — 제품 IA/RBAC baseline`
> 목적: Green Smart 화면을 농장 운영 흐름과 역할 권한 기준으로 재정렬한다. 모든 UI 요소는 `조회 / 기록 / 전략 / 실행 / 안전 / 고급설정` 중 하나로 분류하고, `admin / farm_owner / farm_staff` 역할별 표시·실행 상태를 명확히 한다.

---

## 1. R1 핵심 원칙

```text
사용자는 컴퓨터 전공자가 아니다.
화면은 기능 목록이 아니라 농장 운영 흐름이어야 한다.
설정/운영/안전/실행/진단을 같은 카드에 섞지 않는다.
위험한 실행은 SafetyGuard 상태와 운영자 확인 근처에 둔다.
frontend hidden/disabled는 UX 보조일 뿐, write/execute API는 backend permission으로 강제한다.
```

R1 이후 모든 UI 변경은 아래 질문을 먼저 통과해야 한다.

| 질문 | 기준 |
|---|---|
| 이 요소는 어떤 업무 bucket인가? | `조회 / 기록 / 전략 / 실행 / 안전 / 고급설정` 중 하나 |
| 주 사용자는 누구인가? | `admin`, `farm_owner`, `farm_staff` 중 하나 이상 |
| 권한이 없으면 어떻게 보이나? | `visible_enabled`, `visible_disabled`, `summary_only`, `hidden` 중 하나 |
| backend enforcement가 필요한가? | 모든 write/execute/save/delete/ack/clear/apply는 필요 |
| 농장직원에게 기술정보가 노출되는가? | `entity_id`, PID, raw JSON, API key, token, Central ID는 노출 금지 |

---

## 2. 업무 bucket 정의

| Bucket | 설명 | 대표 UI | 대표 권한 |
|---|---|---|---|
| `조회` | 상태와 요약 확인 | Home KPI, 환경/관수/장치 상태, 최근 로그 요약 | `view_dashboard`, `view_control_pages` |
| `기록` | 현장 기록 입력 | 작기, 생육조사, 병해충 예찰, 방제 기록 | `edit_crop_records`, `manage_crop_seasons` |
| `전략` | AI/규칙이 제안하는 운영 방향 | 환경 전략, 관수 전략, 작물 모델 리포트 | `edit_strategy_settings` 또는 summary-only |
| `실행` | Dry Run, 제한 실행, 수동 조작 | final target 실행, 장치 제어 | `run_dry_run`, `execute_final_targets`, `manual_device_control` |
| `안전` | 차단/인터록/Fail-Safe/알림 | SafetyGuard, Interlock, event ack/clear, recovery checklist | `ack_safety_event`, `clear_safety_event`, admin/owner approval |
| `고급설정` | 설치/연동/진단/키/권한 | Admin/System, HA entity mapping, DB/API diagnostics, Central/weather/pesticide config | `system_settings`, `manage_users_roles`, `edit_entity_mapping` |

---

## 3. 역할 정의

Green Smart는 별도 사용자/비밀번호 체계를 만들지 않고 Home Assistant 사용자를 기준으로 역할을 매핑한다.

```text
Home Assistant user ID
→ Green Smart role(admin/farm_owner/farm_staff)
→ permissions
```

Admin/System은 `admin` 전용 sidebar 별도 메뉴이며, HA 사용자 목록/ID와 Green Smart role mapping을 관리하는 방향으로 유지한다.

| Role key | 한국어 | 제품 관점 | 기술 노출 수준 |
|---|---|---|---|
| `admin` | 어드민 | 설치자/관리자. 시스템, 연동, 권한, 진단, 고급 설정 담당 | 전체 기술 정보 가능 |
| `farm_owner` | 농장주 | 운영 책임자. 상태 확인, 전략 승인, 중요 실행, 리포트/감사 요약 담당 | 기술 상세는 요약/접힘 중심 |
| `farm_staff` | 농장직원 | 현장 작업자. 오늘 할 일, 기록 입력, 알림 확인, 허용된 수동 조작 담당 | 기술 정보 숨김 또는 쉬운 말 요약 |

### 3.1 표시 상태

| State | 의미 | 사용 예 |
|---|---|---|
| `visible_enabled` | 권한과 안전 조건이 모두 맞아 실행 가능 | farm_owner의 Dry Run, admin의 설정 저장 |
| `visible_disabled` | 보여주되 비활성. 이유와 다음 행동을 표시 | SafetyGuard 차단, 권한 부족, 장치 unavailable |
| `summary_only` | 상세 기술정보 없이 요약만 표시 | farm_staff의 AI 전략 요약, owner의 시스템 상태 요약 |
| `hidden` | 역할상 무관하거나 보안상 노출 금지 | farm_staff에게 API key/token/raw JSON 숨김 |

---

## 4. Sidebar / Page IA

현재 sidebar는 6개 운영 page를 기준으로 정렬한다.

| Page key | 표시명 | Primary bucket | 주 사용자 | 설명 |
|---|---|---|---|---|
| `home` | 홈 | 조회 / 안전 | 전체 | 오늘 상태, 위험 알림, 오늘 할 일, 최근 실행/차단 요약 |
| `crop` | 작물/기록 | 기록 / 전략 | 전체 | 작기, 생육조사, 병해충, 방제, 작물 AI 요약 |
| `environment` | 환경 제어 | 조회 / 전략 / 실행 / 안전 | owner/admin, 일부 staff | 온습도/VPD/CO₂ 상태, 전략, Dry Run, 안전 차단 |
| `irrigation` | 관수 제어 | 조회 / 전략 / 실행 / 안전 | owner/admin, 일부 staff | VWC/EC/pH/관수 상태, 전략, Dry Run, 안전 차단 |
| `device` | 장치제어 | 조회 / 실행 / 안전 | owner/admin, 제한 staff | 장치 상태, 허용 수동 조작, 알람, 이력 |
| `admin` | Admin/System | 고급설정 | admin | 사용자/권한, HA 연결, API key, Central, 진단/백업 |

> R1 기준: Admin/System은 `system_settings` 권한이 있는 사용자에게만 sidebar에 보인다.

---

## 5. Page별 배치 기준

### 5.1 Home — 오늘 농장을 운영하는 화면

| 영역 | Bucket | admin | farm_owner | farm_staff | 기술 노출 |
|---|---|---:|---:|---:|---|
| 위험 알림 | 안전 | visible_enabled | visible_enabled | visible_enabled | 쉬운 말 요약 |
| 오늘 할 일 | 조회/기록 | visible_enabled | visible_enabled | visible_enabled | 쉬운 말 |
| 현재 온실 상태 KPI | 조회 | visible_enabled | visible_enabled | visible_enabled | 숫자+상태 badge |
| 환경/관수/장치 요약 | 조회 | visible_enabled | visible_enabled | visible_enabled | staff는 요약 |
| 최근 실행/차단 로그 | 안전/조회 | visible_enabled | visible_enabled | summary_only | actor/result 중심 |
| 시스템 진단 | 고급설정 | visible_enabled | summary_only | hidden | Admin/System 이동 |

Home에서 실제 장치를 움직이는 버튼은 제공하지 않는다. 실행은 각 제어 page에서 SafetyGuard/Interlock/Control Mode/operator confirmation을 통과해야 한다.

### 5.2 Crop — 작물/기록 화면

| 기능 | Bucket | admin | farm_owner | farm_staff | 기준 |
|---|---|---:|---:|---:|---|
| 작기 조회 | 조회 | visible_enabled | visible_enabled | visible_enabled | crop_cycle 기준 요약 |
| 작기 생성/수정 | 기록 | visible_enabled | visible_enabled | visible_disabled 또는 요청 | 농장 운영 정책에 따라 제한 |
| 작기 철거/삭제 | 기록/안전 | visible_enabled | visible_enabled | hidden 또는 승인 필요 | destructive action |
| 생육조사 입력 | 기록 | visible_enabled | visible_enabled | visible_enabled | staff 핵심 업무 |
| 병해충 예찰 입력 | 기록 | visible_enabled | visible_enabled | visible_enabled | staff 핵심 업무 |
| 방제 기록 입력 | 기록/안전 | visible_enabled | visible_enabled | visible_enabled | PLS/PHI/REI 안내 필요 |
| 작물 AI 전략 | 전략 | visible_enabled | visible_enabled | summary_only | staff에게 raw model detail 숨김 |

### 5.3 Environment — 환경 제어

| 기능 | Bucket | admin | farm_owner | farm_staff | 기준 |
|---|---|---:|---:|---:|---|
| 현재 환경 상태 | 조회 | visible_enabled | visible_enabled | visible_enabled | 온도/습도/VPD/CO₂ 숫자 중심 |
| 설정값 SetValue | 전략 | visible_enabled | visible_enabled | hidden | staff 설정 변경 금지 |
| 전략 preview | 전략 | visible_enabled | visible_enabled | summary_only | 이유는 쉬운 말 요약 |
| Dry Run | 실행 | visible_enabled | visible_enabled | visible_enabled | 실제 실행 아님 |
| 실제/제한 실행 | 실행/안전 | visible_enabled | visible_enabled | visible_disabled | 권한+SafetyGuard 필요 |
| Interlock 설정 | 안전/고급설정 | visible_enabled | visible_disabled 또는 승인 | hidden | admin 중심 |
| Entity mapping/PID | 고급설정 | visible_enabled | hidden | hidden | Admin/System 이동 |

### 5.4 Irrigation — 관수 제어

| 기능 | Bucket | admin | farm_owner | farm_staff | 기준 |
|---|---|---:|---:|---:|---|
| VWC/EC/pH/관수 상태 | 조회 | visible_enabled | visible_enabled | visible_enabled | 비전문 용어 병기 |
| 관수 전략 preview | 전략 | visible_enabled | visible_enabled | summary_only | staff는 오늘 조치 중심 |
| 양액/관수 설정값 | 전략 | visible_enabled | visible_enabled | hidden | owner 이상 |
| Dry Run | 실행 | visible_enabled | visible_enabled | visible_enabled | 실제 실행 전 검증 |
| 실제/제한 실행 | 실행/안전 | visible_enabled | visible_enabled | visible_disabled | 안전 조건 필요 |
| 양액기/PID/entity | 고급설정 | visible_enabled | hidden | hidden | Admin/System 이동 |

### 5.5 Device — 장치제어

| 기능 | Bucket | admin | farm_owner | farm_staff | 기준 |
|---|---|---:|---:|---:|---|
| 장치 상태 | 조회 | visible_enabled | visible_enabled | visible_enabled | available/unavailable 쉬운 말 표시 |
| 허용 수동 조작 | 실행 | visible_enabled | visible_enabled | visible_disabled 또는 visible_enabled | 농장주가 허용한 장치별 범위만 |
| 장치 알람/이력 | 안전/조회 | visible_enabled | visible_enabled | summary_only | staff는 조치 중심 |
| Fail Safe/safe_state 설정 | 안전/고급설정 | visible_enabled | hidden | hidden | admin 전용 |
| HA entity mapping | 고급설정 | visible_enabled | hidden | hidden | admin 전용 |

### 5.6 Admin/System — 고급설정 화면

Admin/System은 농장 운영 화면이 아니라 설치·진단·연동·권한 관리 화면이다.

| 기능 | Bucket | admin | farm_owner | farm_staff |
|---|---|---:|---:|---:|
| 사용자/역할 매핑 | 고급설정 | visible_enabled | hidden | hidden |
| HA 연결/entity mapping | 고급설정 | visible_enabled | hidden | hidden |
| API key / Central activation / weather / pesticide config | 고급설정 | visible_enabled | hidden | hidden |
| DB/API/HA diagnostics | 고급설정 | visible_enabled | hidden 또는 summary_only | hidden |
| audit/backup | 고급설정/안전 | visible_enabled | summary_only | hidden |

---

## 6. Technical field 이동 기준

아래 항목은 운영자 화면(Home/Crop/Environment/Irrigation/Device)의 기본 노출에서 제외하고, Admin/System 또는 고급 접힘 영역으로 이동한다.

| Technical field | 기본 위치 | 예외 |
|---|---|---|
| `entity_id` | Admin/System HA 연결/entity mapping | 장애 팝업에서 admin에게만 표시 가능 |
| PID/제어 계수 | Admin/System 또는 고급 설정 | owner에게는 “제어 민감도” 수준 요약만 |
| raw JSON | Admin/System diagnostics | contract/debug 문서에만 허용 |
| API key/token/activation code | Admin/System secure config | 값은 절대 표시하지 않고 masked hint만 |
| DB/API 상세 오류 | Admin/System diagnostics | 운영자 화면에는 “무엇을 해야 하는지”만 표시 |
| MQTT topic | Admin/System 또는 통신 명세서 | staff/owner 기본 UI에는 숨김 |
| 개발자 marker/data attribute | 코드/테스트 전용 | 화면 표시 금지 |

---

## 7. Backend enforcement 기준

Frontend 역할 상태는 UX일 뿐이다. 아래 API 유형은 backend에서 반드시 permission을 검증해야 한다.

| API 유형 | Required permission 예시 |
|---|---|
| crop create/update/delete | `manage_crop_seasons`, `edit_crop_records` |
| growth/pest/control record write | `edit_crop_records`, `growth_survey.write`, `pest_scouting.write`, `control_treatment.write` |
| strategy setting save | `edit_strategy_settings` |
| interlock rule save | `edit_interlock_rules`, `edit_interlock_thresholds` |
| dry run | `run_dry_run`, `control.dry_run` |
| final target execution | `execute_final_targets`, `control.execute.manual` |
| safety event ack/clear | `ack_safety_event`, `clear_safety_event` |
| entity mapping | `edit_entity_mapping`, `device.mapping.manage` |
| user/role/system config | `manage_users_roles`, `system_settings` |

---

## 8. Non-technical wording dictionary

| Technical | 운영자 표현 |
|---|---|
| `entity_id` | 연결된 장치 주소 |
| VPD | 공기 건조도(VPD) |
| EC | 양액 농도(EC) |
| VWC | 배지 수분율 |
| dryback | 야간 수분 빠짐 |
| final target | 실행할 최종 목표 |
| interlock | 안전 차단 조건 |
| failsafe | 안전 위치 전환 |
| unavailable | 장치 연결 안 됨 |
| timeout | 정해진 시간 안에 응답 없음 |
| stale sensor | 오래된 센서값 |
| fixed sensor | 값이 변하지 않는 센서 의심 |

---

## 9. R1 완료 기준

- [x] UI 요소 bucket 기준 고정
- [x] role별 page/function matrix 고정
- [x] Admin/System 이동 대상 technical field 고정
- [x] visible/disabled/summary/hidden 표시 상태 고정
- [x] backend permission enforcement 대상 고정
- [x] `docs/design/current-ui-design-and-navigation.md`와 연결
- [x] `docs/design/current-backend-api-db-ha-contract.md`와 연결
- [x] R1 contract test로 회귀 방어
