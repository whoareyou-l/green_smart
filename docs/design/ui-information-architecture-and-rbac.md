# Green Smart UI Information Architecture and RBAC Plan

> 기준 버전: `v1.9.55`
> 목적: 앞으로 Green Smart UI 요소를 어디에 배치하고, 어떤 역할이 어떤 페이지/기능을 볼 수 있으며, 비전공자인 농장주·농장직원이 직관적으로 사용할 수 있게 만드는 기준을 고정한다.

---

## 1. 핵심 원칙

현재 개발 과정에서 환경/관수/장치/안전/리허설/설정 요소가 빠르게 누적되면서 화면 안에서 일부 기능이 섞여 보일 수 있다. 앞으로 UI를 추가하거나 이동할 때는 아래 원칙을 먼저 적용한다.

```text
사용자는 컴퓨터 전공자가 아니다.
화면은 기능 목록이 아니라 농장 운영 흐름이어야 한다.
위험한 실행 기능은 숨기지 말고, 맥락·확인·안전상태와 함께 배치한다.
어드민/농장주/농장직원의 역할에 따라 볼 수 있는 정보와 실행 가능한 기능을 분리한다.
```

### 1.1 사용자 유형

| 사용자 | 기술 수준 | 주 관심사 | UI 원칙 |
|---|---:|---|---|
| 어드민 | 높음 | 설치, 시스템 설정, DB/API/HA 연결, 권한, 진단 | 고급 설정은 별도 Admin/System 영역에 모은다 |
| 농장주 | 중간~낮음 | 농장 상태, 생산성, 위험 알림, 전략 승인, 중요한 실행 | 매출/작물/환경/관수/위험을 한눈에 보여주고, 승인 흐름을 단순화한다 |
| 농장직원 | 낮음 | 오늘 할 일, 알림 확인, 기록 입력, 허용된 수동 조작 | 전문 용어를 줄이고 “해야 할 일” 중심으로 구성한다 |

### 1.2 화면 설계 언어

- `설정`과 `운영`을 같은 카드에 섞지 않는다.
- `조회`, `기록`, `권장`, `승인`, `실행`, `고급설정`을 시각적으로 분리한다.
- 안전/인터록/Fail Safe는 항상 실행 버튼 근처에 요약으로 보여준다.
- 농장직원이 매일 쓰는 화면은 3초 안에 이해되어야 한다.
- 관리자용 technical field는 기본 접힘 또는 Admin 전용 화면에 둔다.
- 에러 메시지는 `DB 오류`, `API 실패`가 아니라 “무엇을 해야 하는지”로 표현한다.

---

## 2. 정보구조 목표

현재 sidebar는 다음 5개 페이지다.

```text
home, crop, environment, irrigation, device
```

앞으로는 사용자의 업무 흐름에 맞춰 다음 개념으로 정리한다.

| 업무 흐름 | 현재/권장 위치 | 설명 |
|---|---|---|
| 오늘 상태 확인 | 홈 | 환경/관수/장치/알림/오늘 할 일을 한눈에 표시 |
| 작물과 기록 관리 | 작물 설정 | 작기, 생육조사, 병해충, 방제 기록 |
| 환경 전략 관리 | 환경 제어 | 온도/습도/VPD/CO₂ 전략, 안전 한계, 실행 |
| 관수 전략 관리 | 관수 제어 | 관수량/EC/pH/VWC/드라이백/양액기 전략, 실행 |
| 장비 상태와 수동 조작 | 장치제어 | 장치 현황, 허용된 수동 조작, 알람, 이력 |
| 시스템/연동/권한 | 설정 또는 Admin 영역 | HA/DB/API/Central/날씨/사용자·역할 관리 |

향후 sidebar가 많아지면 1차 메뉴를 아래처럼 그룹화한다.

```text
홈
작물/기록
제어
  - 환경
  - 관수
  - 장치
알림/작업
관리
  - 시스템 설정
  - 사용자/권한
  - 진단/백업
```

현재 5개 sidebar는 유지하되, 각 페이지 내부에서 “농장 운영자가 보는 영역”과 “고급 설정 영역”을 분리하는 것을 우선한다.

---

## 3. 역할 정의 / RBAC

사용자가 말한 “rbek” 기준은 Green Smart에서는 **RBAC(Role-Based Access Control)**로 정의한다.

### 3.1 기본 역할

| Role key | 한국어 | 설명 |
|---|---|---|
| `admin` | 어드민 | 설치자/시스템 관리자. 모든 설정과 권한 관리 가능 |
| `farm_owner` | 농장주 | 농장 운영 책임자. 전략 승인, 중요 실행, 기록/리포트 확인 가능 |
| `farm_staff` | 농장직원 | 현장 작업자. 조회, 기록 입력, 알림 확인, 허용된 수동 조작 가능 |

### 3.1.1 계정/역할 매핑

Green Smart는 별도 사용자/비밀번호 체계를 만들지 않고 Home Assistant 사용자를 기준으로 역할을 매핑한다.

```text
Home Assistant user ID
→ Green Smart role(admin/farm_owner/farm_staff)
→ permissions
```

Admin/System의 사용자/권한 화면은 `admin`에게만 보이며, HA 사용자 목록/ID와 Green Smart role mapping을 관리하는 방향으로 구현한다. Admin/System은 `admin` 전용 sidebar 별도 메뉴로 추가한다.

### 3.2 권한 레벨

| 권한 | 설명 | admin | farm_owner | farm_staff |
|---|---|---:|---:|---:|
| `view_dashboard` | 홈/상태 조회 | ✓ | ✓ | ✓ |
| `view_crop_records` | 작물/기록 조회 | ✓ | ✓ | ✓ |
| `edit_crop_records` | 생육/병해충/방제 기록 입력 | ✓ | ✓ | ✓ |
| `manage_crop_seasons` | 작기 생성/수정/철거/삭제 | ✓ | ✓ | 제한 또는 요청 |
| `view_control_pages` | 환경/관수/장치 제어 페이지 조회 | ✓ | ✓ | ✓ |
| `edit_strategy_settings` | 환경/관수 전략 설정 변경 | ✓ | ✓ | ✕ |
| `edit_interlock_thresholds` | SafetyGuard/인터록 기본 임계값 변경 | ✓ | 확인 팝업 후 가능 | ✕ |
| `edit_interlock_rules` | 고급 rule builder 변경 | ✓ | ✕ | ✕ |
| `edit_entity_mapping` | HA entity mapping 변경 | ✓ | ✕ | ✕ |
| `run_dry_run` | Dry Run 실행 | ✓ | ✓ | ✓ |
| `execute_final_targets` | 실제/제한적 실행 | ✓ | ✓ | 제한된 장비만 |
| `manual_device_control` | 수동 장치 조작 | ✓ | ✓ | 농장주가 허용한 장치별 범위 |
| `ack_safety_event` | 안전 이벤트 확인 | ✓ | ✕ | ✕ |
| `clear_safety_event` | 안전 이벤트 조치 완료/해제 | ✓ | ✕ | ✕ |
| `manage_users_roles` | 사용자/권한 관리 | ✓ | 선택적 위임 | ✕ |
| `system_settings` | HA/Central/API/DB/날씨 key 설정 | ✓ | 일부 조회 | ✕ |
| `view_audit_logs` | 감사 로그/실행 이력 상세 | ✓ | ✓ | 제한 요약 |

### 3.3 보안 원칙

- 프론트엔드에서 버튼을 숨기는 것은 UX 보조일 뿐 보안 경계가 아니다.
- 모든 write/execute API는 backend에서 role/permission을 다시 검증해야 한다.
- 위험 실행은 `role + operator confirmation + SafetyGuard + control mode`를 모두 통과해야 한다.
- 감사 로그에는 `actor`, `actor_role`, `action`, `before_json`, `after_json`, `result`, `message`를 남긴다.

---

## 4. 역할별 볼 수 있는 페이지

### 4.1 페이지 접근 매트릭스

| Page | admin | farm_owner | farm_staff | 비고 |
|---|---:|---:|---:|---|
| 홈 | ✓ | ✓ | ✓ | 역할별 카드 노출 다름 |
| 작물 설정 | ✓ | ✓ | ✓ | 직원은 기록 입력 중심 |
| 환경 제어 | ✓ | ✓ | 조회+일부 실행 | 설정 변경은 owner 이상 |
| 관수 제어 | ✓ | ✓ | 조회+일부 실행/기록 | 양액기/PID/entity는 admin |
| 장치제어 | ✓ | ✓ | 현황+허용 수동조작 | Fail Safe/interlock은 admin/owner |
| 알림/작업 | ✓ | ✓ | ✓ | 향후 별도 페이지 권장 |
| 시스템 설정 | ✓ | ✕ | ✕ | Admin/System은 admin 전용 sidebar 메뉴 |
| 사용자/권한 | ✓ | ✕ | ✕ | HA 사용자 → Green Smart 역할 매핑 |
| 진단/개발자 | ✓ | ✕ | ✕ | 로그, API 상태, DB 상태 |

### 4.2 홈 화면 역할별 구성

| 카드 | admin | farm_owner | farm_staff |
|---|---:|---:|---:|
| 농장 현재 상태 KPI | ✓ | ✓ | ✓ |
| 위험 알림 / 해야 할 일 | ✓ | ✓ | ✓ |
| 환경/관수 요약 | ✓ | ✓ | ✓ |
| 장치 이상 요약 | ✓ | ✓ | ✓ |
| AI 전략 추천 요약 | ✓ | ✓ | 읽기 전용 |
| 오늘 작업 체크리스트 | ✓ | ✓ | ✓ 핵심 |
| 시스템 상태/연동 상태 | ✓ | 요약만 | ✕ |
| DB/API/HA 진단 | ✓ | ✕ | ✕ |

### 4.3 작물 설정 역할별 구성

| 기능 | admin | farm_owner | farm_staff |
|---|---:|---:|---:|
| 작기 조회 | ✓ | ✓ | ✓ |
| 작기 생성/수정/철거 | ✓ | ✓ | 요청/제한 |
| 생육조사 입력 | ✓ | ✓ | ✓ |
| 병해충 예찰 입력 | ✓ | ✓ | ✓ |
| 방제 기록 입력 | ✓ | ✓ | ✓ |
| 기록 삭제 | ✓ | ✓ | ✕ 또는 승인 필요 |
| CSV export | ✓ | ✓ | 제한 |

### 4.4 환경/관수/장치제어 역할별 구성

공통 원칙:

- `농장직원`은 “설정을 바꾸는 사람”이 아니라 “상태를 보고 현장 작업을 수행하는 사람”이다.
- `농장주`는 전략을 이해하고 승인하는 사람이다.
- `어드민`은 시스템과 고급 제어를 구성하는 사람이다.

| 영역 | admin | farm_owner | farm_staff |
|---|---:|---:|---:|
| 상태 요약 | ✓ | ✓ | ✓ |
| 전략 preview | ✓ | ✓ | 요약만 |
| 설정값 입력 | ✓ | ✓ | ✕ |
| 인터록 기본 임계값 | ✓ | 확인 팝업 후 가능 | ✕ |
| 인터록 고급 rule builder | ✓ | ✕ | ✕ |
| SafetyGuard watchdog | ✓ | 요약 조회 | 요약만 |
| 이벤트 확인 | ✓ | ✕ | ✕ |
| 이벤트 clear | ✓ | ✕ | ✕ |
| Dry Run | ✓ | ✓ | ✓ |
| 실제 실행 | ✓ | ✓ | 제한된 시나리오만 |
| Entity mapping | ✓ | ✕ | ✕ |
| Fail Safe/safe_state 설정 | ✓ | ✕ | ✕ |
| PID/센서 보정 | ✓ | ✕ | ✕ |

---

## 5. 페이지별 요소 재배치 기준

## 5.1 홈: “오늘 농장을 운영하는 화면”

홈은 개발자용 대시보드가 아니라 농장주/직원이 처음 보는 화면이다.

### 홈에 있어야 하는 것

1. 오늘 위험 알림
2. 지금 당장 봐야 하는 환경/관수/장치 상태
3. 오늘 작업 목록
4. 자동제어/AI 상태 요약
5. 최근 실행/차단 로그 요약
6. 날씨 요약

### 홈에서 빼야 하는 것

- DB/API 상세 진단
- entity_id 목록
- PID/센서 보정값
- 긴 JSON 설정
- 개발자 marker

이런 요소는 Admin/System 또는 각 제어 페이지의 고급 접힘 영역으로 이동한다.

### 홈 확정 카드 순서

```text
1. 위험 알림
2. 오늘 할 일
3. 조치 필요 작업
4. 현재 온실 상태 간단 요약
5. KPI 상세 카드: 온도/습도/VPD/CO₂/관수/장치 상태
6. 날씨/외부 조건
7. 최근 실행/차단 로그 요약
8. AI/자동제어 요약
```

Home의 첫 카드는 `알림/작업` 영역으로 유지한다. 별도 sidebar 메뉴로 분리하지 않는다.

상태 요약은 숫자 중심으로 표시하고, 색상/배지로 정상·주의·위험을 구분한다. 예: `온도 24.5°C [정상]`, `습도 88% [주의]`. 상태 카드를 클릭하면 팝업으로 상세 설명을 표시한다.

상세 팝업에는 역할별 버튼을 다르게 표시한다.

| 역할 | Home 팝업 조치 |
|---|---|
| `farm_staff` | `확인`, `조치 완료 기록`, 권한이 있으면 `장치 정지 Dry Run` |
| `farm_owner` | `확인`, `조치 완료 기록`, `장치 정지 Dry Run`, `제한 실행 Dry Run` |
| `admin` | 모든 Home 조치 + 진단/고급 설정 이동 |

Home 팝업 버튼의 현재 baseline은 **실제 장비 실행이 아니라 감사 로그와 Dry Run 사전점검**이다.

```text
확인              → safety-guard-events/ack 기록
조치 완료 기록    → safety-guard-events/clear 기록
장치 정지 Dry Run → execute-final-targets(dry_run=true, domain=device)
제한 실행 Dry Run → execute-final-targets(dry_run=true, status domain)
```

Home에서 실제 장치를 움직이는 버튼은 제공하지 않는다. 실제 실행은 제어 페이지에서 운영자 확인/권한/Control Mode/SafetyGuard/Interlock/fail-safe를 통과해야 한다.

---

## 5.2 작물 설정: “기록 업무 화면”

작물 설정은 제어 설정과 섞지 않는다.

### 남겨야 할 것

- 작기 관리
- 생육조사
- 병해충 예찰
- 방제 기록
- CSV/export
- 사진/메모/작업자 기록 향후 확장

### 빼야 할 것

- 환경/관수/장치 실행 버튼
- SafetyGuard rule builder
- entity mapping
- HA service call 상세

### 비전공자 UX

- “생육조사 추가”는 전문 form보다 작물별 쉬운 field 이름 사용
- 심각도는 `낮음/보통/높음/위험`처럼 한글 단계 사용
- 저장 후 “기록되었습니다” + 다음 할 일 표시

---

## 5.3 환경 제어: “온실 환경 목표와 안전을 관리하는 화면”

환경 제어에는 온도/습도/VPD/CO₂와 환기/스크린 목표가 들어간다.

### 상단에 배치

1. 현재 환경 상태 요약
2. 목표와 현재의 차이
3. SafetyGuard 상태
4. Dry Run / 실행 가능 여부

### 중단에 배치

- 환경 전략 preview
- AI 전략 추천
- 최종 적용값
- 운영자 확인
- 실행 로그

### 하단/고급에 배치

- 인터록 rule builder
- 센서 rule
- Entity mapping
- mapping validation
- raw JSON/settings

---

## 5.4 관수 제어: “물/양액을 안전하게 주는 화면”

관수 제어는 사용자가 자주 쓰는 화면이므로 가장 직관적이어야 한다.

### 상단에 배치

1. 현재 관수 상태
2. 오늘 관수 횟수 / 마지막 관수 / 다음 예상
3. 현재 VWC/EC/pH
4. 긴급 차단 여부
5. 오늘 권장 관수량/간격

### 중단에 배치

- 관수 전략 preview
- 최종 적용값
- Dry Run
- 운영자 확인
- 실행/차단 로그

### 하위탭 정리

| 사용자 친화 그룹 | 현재 탭 | 설명 |
|---|---|---|
| 기본 운영 | 제어 모드, 기본 관수 설정 | 농장주가 이해해야 하는 핵심 |
| 작물 수분 전략 | 포수, 일사 비례, 드라이백 | 농장주 중심 |
| 양액/배액 | 배액 피드백, 양액 전략 | 농장주/전문 직원 |
| AI/안전 | AI 관수 보정, 안전 한계 | 농장주 승인, admin 고급 |
| 장비/기술 | 양액기 설정 | admin 전용 또는 고급 접힘 |
| 이력 | 관수 로그 | 모두 조회 가능 |

### 하단/고급에 배치

- 양액기 entity ID
- PID 값
- EC/pH 보정 계수
- mapping validation
- raw JSON

### 비전공자 용어 변환

| 기술 용어 | UI 권장 표현 |
|---|---|
| VWC | 배지 수분율 또는 배지 함수율 |
| EC | 양액 농도(EC) |
| pH | 산도(pH) |
| dryback | 야간 수분 빠짐(드라이백) |
| final target | 실행할 최종 목표 |
| interlock | 안전 차단 조건 |
| failsafe | 안전 위치로 전환 |

---

## 5.5 장치제어: “장비 상태와 허용된 조작 화면”

장치제어는 기술 설정과 현장 조작이 섞이기 쉽다. 반드시 분리한다.

### 상단에 배치

1. 장치 이상 여부
2. 주요 장치 현재 상태
3. 허용된 수동 조작
4. 알람/장애

### 중단에 배치

- 장치 현황
- 수동 제어
- 자동 제어 상태
- 알람 및 장애
- 제어 이력

### 하단/고급에 배치

- 환기 장치 설정
- 스크린 장치 설정
- 장치 그룹 관리
- 인터록 설정
- Fail Safe 설정
- entity mapping

### 직원용 장치제어

농장직원에게는 아래처럼 보여야 한다.

```text
장치 상태: 정상/주의/위험
할 수 있는 조작: 열기/닫기/정지/확인
왜 못 하는지: 강풍으로 천창 닫힘, 안전 차단 중
다음 행동: 관리자에게 알림, 현장 점검, 알림 확인
```

---

## 5.6 설정/Admin: “기술 설정과 권한을 모으는 화면”

현재 Settings page에는 PLC/구역/날씨/Central 설정이 들어간다. 앞으로는 Admin 전용 영역으로 분리하는 것이 좋다.

### Admin/System에 모을 것

- PLC/Modbus/virtual mode
- HA entity mapping
- Central API activation/token 상태
- KMA/PSIS API key
- DB/API 상태
- 사용자/역할/RBAC 관리
- 백업/복구
- 진단 로그
- 개발자/contract marker

### 농장주에게 보여줄 수 있는 것

- 연결 상태 요약
- 날씨 위치
- 설치 정보
- 사용자 목록 일부

### 농장직원에게 숨길 것

- API key
- DB 설정
- entity_id mapping
- PID/보정값
- raw JSON
- Central token/activation

---

## 6. RBAC 기반 UI 표시 규칙

### 6.1 표시 상태 4단계

권한이 없다고 무조건 숨기면 사용자가 “왜 안 되는지” 모른다. 다음 4단계를 사용한다.

| 상태 | 사용 상황 | UI 표현 |
|---|---|---|
| `visible_enabled` | 권한 있고 실행 가능 | 일반 버튼/입력 |
| `visible_disabled` | 볼 수는 있으나 현재 조건상 불가 | 비활성 + 이유 표시 |
| `summary_only` | 상세는 제한, 요약만 허용 | 카드 요약만 표시 |
| `hidden` | 보안상 노출 금지 | 화면에서 제거 |

예시:

```text
농장직원이 인터록 설정을 볼 필요는 없다 → hidden 또는 summary_only
농장직원이 강풍 차단으로 천창을 열 수 없다 → visible_disabled + “강풍 안전차단 중”
농장주가 entity_id mapping을 볼 필요는 없다 → hidden
농장주가 SafetyGuard 상태는 봐야 한다 → summary_only
```

### 6.2 버튼/기능 표시 기준

| 기능 | farm_staff UI | farm_owner UI | admin UI |
|---|---|---|---|
| 저장 | 기록 저장만 | 전략/기록 저장 | 전체 저장 |
| 실행 | 제한된 실행 | 승인 후 실행 | 전체 실행 |
| 설정 변경 | 없음/요청 | 주요 전략 설정 | 고급 설정 포함 |
| 삭제 | 대부분 숨김 | 확인 후 허용 | 허용 |
| 고급 설정 | 숨김 | 접힘 요약 | 전체 표시 |
| 진단 | 숨김 | 요약 | 상세 |

---

## 7. 구현 시 필요한 데이터 모델 / API 방향

현재 Home Assistant 인증은 기본적으로 HA user context에 의존한다. Green Smart RBAC는 별도 로그인 체계가 아니라 **HA 사용자 ID → Green Smart 역할 매핑**으로 구현한다.

### 7.1 권장 신규 개념

```text
HA user ID
Green Smart role mapping
Green Smart role permissions
optional farm/zone scope mapping
```

1차 persistence는 HA Store 기반 role mapping을 우선 검토한다. MariaDB role table은 multi-farm/edge tenancy나 복잡한 권한 query가 필요해질 때 별도 migration으로 추가한다. 별도 Green Smart username/password 체계는 이번 기준에서 제외한다.

### 7.2 최소 API 방향

향후 추가 권장:

```text
GET /api/green_smart/auth/me
GET /api/green_smart/auth/permissions
GET /api/green_smart/admin/users
POST /api/green_smart/admin/users/{user_id}/role
```

`/auth/me` 응답 예:

```json
{
  "userId": "ha-user-id",
  "displayName": "홍길동",
  "role": "farm_owner",
  "permissions": ["view_dashboard", "run_dry_run", "execute_final_targets"],
  "farmId": 1,
  "allowedZones": [1, 2]
}
```

### 7.3 backend enforcement 원칙

- 모든 write/execute API는 `require_permission(permission)` 형태의 공통 helper를 통과한다.
- `farm_id`, `zone_id`도 권한 범위와 비교한다.
- 현재 `actor_role` log field를 RBAC role과 연결한다.
- frontend role gate는 UX용이며 backend 검증이 최종이다.

---

## 8. UI 재구성 로드맵

### Phase IA-1. 현재 요소 inventory와 그룹 재배치

목표:

- 각 페이지의 카드/탭/버튼을 `조회`, `기록`, `전략`, `실행`, `안전`, `고급설정`으로 태깅한다.

산출물:

- `data-ui-section` / 문서 표
- 페이지별 “상단/중단/하단/고급” 배치표

### Phase IA-2. 농장주/직원 모드 UX

목표:

- role별 표시 상태를 적용한다.
- 직원용 화면에서 고급 기술 용어와 위험 설정을 숨긴다.

산출물:

- role별 sidebar/page visibility
- disabled reason message
- 안전 차단 이유 표시

### Phase IA-3. RBAC backend contract

목표:

- `auth/me`, permission helper, audit role 연결 설계.

산출물:

- DB/API contract test
- backend permission helper
- write/execute API enforcement

### Phase IA-4. Admin/System 분리

목표:

- entity mapping, HA/Central/API key, DB 진단, 사용자/권한을 Admin 영역에 모은다.

산출물:

- Admin sidebar/group
- system settings page
- role management page

### Phase IA-5. 비전공자 UX polish

목표:

- 전문 용어를 쉬운 한글로 보완하고, 작업 흐름 중심 안내를 추가한다.

산출물:

- field label/help text dictionary
- empty/error/success states
- mobile first layout 검증

---

## 9. 작업 Definition of Done

UI/RBAC 관련 작업은 아래 조건을 모두 만족해야 완료다.

- [ ] 해당 변경이 어느 사용자 역할을 위한 것인지 명시되어 있다.
- [ ] farm_staff가 볼 필요 없는 고급 설정은 숨김/요약/접힘 처리되어 있다.
- [ ] 위험 실행 버튼에는 SafetyGuard 상태와 실행 전 확인이 붙어 있다.
- [ ] 권한 없는 버튼은 이유 없이 사라지지 않는다. 필요한 경우 비활성 + 이유를 표시한다.
- [ ] backend write/execute API 권한 검증 계획 또는 구현이 있다.
- [ ] `zone_control_logs` 또는 후속 audit log에 actor/role/action이 남는다.
- [ ] 모바일 WebView에서 핵심 작업이 가능하다.
- [ ] 문서가 `PROJECT_MASTER_PLAN.md`와 관련 상세 기준서에 반영되어 있다.

---

## 10. 즉시 적용할 문서 기준

앞으로 Green Smart UI를 수정할 때는 다음 순서로 확인한다.

1. 이 문서: 정보구조/RBAC/비전공자 UX 기준
2. `../plans/2026-06-22-ui-rbac-reorganization-implementation-plan.md`: 실제 정리·업데이트·모듈화 실행 플랜과 모호성 10% 이하 질문 gate
3. `current-ui-design-and-navigation.md`: 현재 페이지/탭/필드 구조
4. `current-backend-api-db-ha-contract.md`: API/DB/실행/SafetyGuard 기준
5. `PROJECT_MASTER_PLAN.md`: Phase와 완료 기준

구현 전에 반드시 답해야 하는 질문:

```text
이 요소는 누구를 위한 것인가? admin, farm_owner, farm_staff 중 누구인가?
이 요소는 조회/기록/전략/실행/안전/고급설정 중 어디에 속하는가?
농장직원이 이 문구를 보고 바로 행동할 수 있는가?
권한이 없거나 안전상 실행 불가할 때 이유가 표시되는가?
이 기능이 backend에서도 권한 검증되는가?
```
