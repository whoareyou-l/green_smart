# Green Smart 환경제어 프로그램 마스터 플랜

상태: pending approval  
작성 기준일: 2026-06-20  
작성 목적: 초기 에이전트 명세서와 현재 개발 문서(`docs/PROJECT_GUIDE.md`, `docs/design/zone-control-roadmap-and-data-model.md`)를 이어 받아, Home Assistant 기반 Green Smart의 백엔드/프론트엔드/API/DB/제어 로직 기준선을 하나로 묶는다.

> 참고 제한: 현재 로컬 워킹트리는 `.git`만 있고 `HEAD`가 없는 상태라 실제 소스와 `docs/PROJECT_GUIDE.md`, `docs/design/zone-control-roadmap-and-data-model.md` 원문을 로컬에서 확인할 수 없었다. 따라서 본 문서는 사용자가 제공한 6개 초기 사양 파일과 사용자가 재확인해 준 현행 기술 스택을 1차 기준으로 삼고, 위 두 문서는 “반드시 병합해야 할 기존 개발 기준”으로 명시한다.

---

## 0. 현행 기술 스택 기준선

Green Smart는 독립 웹서비스가 아니라 Home Assistant 위에서 동작하는 HACS-compatible custom integration이다. 따라서 개발 계획은 일반 SaaS 서버/프론트 분리 구조가 아니라 `custom_components/green_smart/` 내부의 Python integration, Home Assistant HTTP API view, MariaDB 저장소, Vanilla JavaScript panel을 기준으로 수립한다.

| 구분 | 현행 기준 |
| :--- | :--- |
| 실행 환경 | Home Assistant custom integration |
| Backend | Python |
| Frontend | Vanilla JavaScript Web Component |
| HA UI 연결 | `panel_custom` sidebar panel |
| DB | MariaDB |
| DB Driver | `aiomysql==0.2.0` |
| 외부 날씨 API | 기상청 KMA 단기/중기 예보 API |
| 외부 농약 API | PSIS 농약/혼용 API |
| 테스트 | `pytest` static/contract tests |
| JS 검증 | `node --check` |
| 배포/설치 | HACS-compatible `custom_components` 구조 |
| 릴리즈 | GitHub tags / GitHub Releases |

현재 repo 기준 주요 파일/역할:

- `custom_components/green_smart/manifest.json`: integration manifest, 현재 버전 `1.8.42`, `aiomysql==0.2.0`.
- `custom_components/green_smart/__init__.py`: 통합 초기화, API view/panel/DB bootstrap 등록.
- `custom_components/green_smart/config_flow.py`: Home Assistant 설정 flow.
- `custom_components/green_smart/db.py`: MariaDB schema, connection pool, query helper.
- `custom_components/green_smart/crop_views.py`: 작기/생육/병해충/방제 API.
- `custom_components/green_smart/weather_views.py`: KMA/PSIS 관련 API.
- `custom_components/green_smart/central_views.py`: Central API view.
- `custom_components/green_smart/zone_control_views.py`: zone/environment/irrigation/devices 제어 API.
- `custom_components/green_smart/frontend_panel.py`: HA sidebar panel 등록과 JS serving.
- `custom_components/green_smart/panel/green-smart-panel.js`: 전체 Green Smart UI.
- `custom_components/green_smart/weather_api.py`, `kma_grid.py`: 기상청 API/grid/region mapping.
- `custom_components/green_smart/api/pesticide.py`: PSIS 농약 API.
- `custom_components/green_smart/central_api.py`, `central_store.py`: Greenity Central activation/token/proxy baseline.

현행 주요 DB 테이블:

- 작기/생육/방제: `zones`, `crop_seasons`, `growth_surveys`, `pest_surveys`, `control_records`, `control_pesticides`
- 구역 제어: `zone_control_settings`, `ai_zone_control_outputs`, `zone_final_control_targets`, `zone_device_entity_mappings`, `zone_control_logs`, `zone_control_copy_jobs`

현재 품질 기준:

- `pytest` 기준 contract tests 98개 통과 상태.
- `node --check custom_components/green_smart/panel/green-smart-panel.js`
- `python3 -m py_compile` 주요 Python 파일 문법 검증.
- 버전 릴리즈 시 `manifest.json version`, `green-smart-panel.js VERSION`, GitHub tag/release를 맞춘다.

---

## 0.1 확정된 아키텍처 결정

### ADR-001. 장비 제어 표준은 Home Assistant entity/service call 중심으로 한다

결정:

- Green Smart의 공식 장비 제어 표준은 Home Assistant entity/service call이다.
- Green Smart 전략 엔진은 직접 Modbus/PLC/릴레이/장비 패킷을 만들지 않는다.
- Green Smart는 Zone별 final target을 계산한 뒤 `zone_device_entity_mappings`를 통해 HA entity와 service call로 변환한다.
- MQTT, Modbus, PLC, ESPHome, 릴레이보드 등 실제 장비 통신 방식은 HA integration, MQTT bridge, PLC gateway, 운영 repo의 로컬 인프라 뒤쪽에 숨긴다.

기본 제어 매핑:

| 장비/목표 | 권장 HA 제어 방식 |
| :--- | :--- |
| 환기창, 스크린 개도율 | `cover.set_cover_position` |
| 팬, 펌프, 밸브 ON/OFF | `switch.turn_on`, `switch.turn_off` |
| 관수량, 개도율, EC/pH 목표값 등 숫자 설정 | `number.set_value` |
| 난방기/냉방기/온도 제어기 | `climate.set_temperature` 또는 장비별 HA service |
| 특수 장비/PLC/MQTT 장비 | HA entity로 래핑하거나 제한된 `mqtt.publish` adapter 사용 |

이유:

- 현재 제품 구조가 Home Assistant custom integration이므로 가장 자연스럽다.
- HA 장비 생태계를 활용할 수 있어 장비별 프로토콜 코드가 Green Smart 내부에 쌓이지 않는다.
- `zone_device_entity_mappings` 테이블과 panel UI 방향이 잘 맞는다.
- 사용자가 HA에서 수동 상태 확인/제어를 병행할 수 있다.
- HACS 배포와 유지보수 부담이 낮다.

제약:

- 초정밀 실시간 제어는 Green Smart가 직접 담당하지 않는다.
- HA entity 상태와 service call 성공/실패를 신뢰할 수 있게 매핑/로그/검증이 필요하다.
- 장비별 특수 기능은 “공통 entity 계약”으로 흡수하거나 예외 adapter로 제한한다.

제어 흐름:

```text
CORP/TEMHUM/IRR 전략 엔진
-> zone_final_control_targets 저장
-> zone_device_entity_mappings 조회
-> HA service call 후보 생성
-> Safety Guard 검증
-> Home Assistant service call 실행
-> zone_control_logs 저장
```

### ADR-002. Zone은 Green Smart의 최소 제어 단위로 정의한다

결정:

- Zone은 “같은 작물, 같은 생육 목표, 같은 센서 대표값, 같은 제어 장비 묶음을 공유하는 최소 제어 단위”이다.
- Farm/Greenhouse는 상위 묶음이고, 실제 전략 계산, final target, entity mapping, control log는 Zone을 기준으로 한다.
- 한 온실 안에서도 작물, 생육 단계, 관수 라인, 센서 대표값, 환기/스크린/팬/밸브 묶음이 다르면 서로 다른 Zone으로 분리한다.

Zone 분리 기준:

| 분리 조건 | Zone 분리 여부 |
| :--- | :--- |
| 작물이 다름 | 분리 |
| 같은 작물이지만 생육 단계/목표가 다름 | 분리 |
| 관수 라인 또는 양액 제어가 다름 | 분리 |
| 대표 센서 묶음이 다름 | 분리 |
| 환기창/스크린/팬/밸브 제어 묶음이 다름 | 분리 |
| 같은 온실동이지만 관리 전략이 다름 | 분리 |

예시:

- 1동 토마토 A라인, 1동 토마토 B라인이 같은 센서/관수/환기 제어를 공유하면 하나의 Zone으로 둘 수 있다.
- 1동 안에 토마토와 상추가 함께 있으면 반드시 Zone을 분리한다.
- 같은 토마토라도 한쪽은 성기수확, 다른 한쪽은 초기생장이면 Zone을 분리한다.
- 같은 작물이라도 관수 밸브와 VWC 센서가 다르면 Zone을 분리한다.

### ADR-003. MVP 작물은 토마토와 상추를 최소 지원한다

결정:

- MVP는 과채류 대표 작물로 토마토, 엽채류 대표 작물로 상추를 최소 지원한다.
- 하나의 작물만 깊게 구현하기보다, 과채류/엽채류 양쪽 데이터 구조와 전략 엔진 추상화를 처음부터 검증한다.
- 토마토는 CORP/TEMHUM/IRR의 고급 생육 조종 엔진을 검증하는 기준 작물로 사용한다.
- 상추는 엽채류의 단순하고 빠른 생장 사이클, 추대/팁번 방어, 안정적 수분 유지 전략을 검증하는 기준 작물로 사용한다.

MVP 범위:

| 작물 | 작물군 | MVP 생육 지표 | MVP 제어 핵심 |
| :--- | :--- | :--- | :--- |
| 토마토 | 과채류 | 줄기 굵기, 초장, 화방 거리, 착과 화방 수 | G-Index, ADT/DIF, VPD, 드라이백, EC/배액률 |
| 상추 | 엽채류 | 엽수, 엽길이, 엽폭, 추대 여부, 엽색, 엽두께 | V-Score, 낮은 DIF, VPD 안정화, 소량 다회 관수, 팁번 방어 |

제약:

- MVP에서는 토마토/상추의 “권장 기준값 + 계산 로직 + UI 입력 + final target 생성”까지를 우선한다.
- 파프리카, 오이, 딸기, 청경채 등은 CropProfile 확장 대상으로 두되 MVP 완료 전에는 깊게 구현하지 않는다.
- 수확량 예측은 MVP 핵심 경로 이후 Phase 5에서 정확도를 높인다.

### ADR-004. 자동화는 인터록 우선, AI 자동화는 단계적으로 확장한다

결정:

- Green Smart의 개발 우선순위는 AI 자동화가 아니라 안전 인터록 완성이다.
- AI가 작동하지 않거나, AI output이 비어 있거나, 외부 API가 실패해도 온실과 장비에 문제가 생기지 않아야 한다.
- 모든 AI final target과 자동 명령은 독립적인 Safety Guard/Interlock Layer를 통과해야 실행될 수 있다.
- MVP는 “인터록 + 계산/추천 + 반자동 적용”을 우선 완료하고, 이후 장비별 제한적 자동제어, 최종적으로 Zone별 자동제어로 확장한다.

자동화 단계:

| 단계 | 이름 | 실행 방식 | 목표 |
| :--- | :--- | :--- | :--- |
| 0 | 인터록/수동 안전 기반 | AI 없음, 사용자가 직접 제어하되 안전 조건 위반 시 차단/경고 | 장비와 작물 보호 |
| 1 | 추천/계산 모드 | AI 또는 전략 엔진이 final target만 생성, 실행하지 않음 | 제어 근거 검증 |
| 2 | 반자동 적용 | 사용자가 적용 버튼을 누르면 HA service call 실행 | 실행 경로 검증 |
| 3 | 제한적 자동제어 | 장비군별 자동 허용 스위치가 켜진 경우만 실행 | 환기/스크린/관수 단계별 자동화 |
| 4 | Zone 자동제어 | Zone별 정책에 따라 주기적 자동 실행 | 완성형 자동 환경제어 |

인터록 원칙:

- Safety Guard는 AI/전략 엔진보다 항상 우선한다.
- Safety Guard는 외부 API나 AI output에 의존하지 않는다.
- 센서 무결성 이상, 강풍, 저온, 고온, EC 과농도, VWC 하한, 장비 통신 실패는 자동화 단계와 무관하게 차단/보호 로직을 실행한다.
- 인터록은 “명령 생성 전 검증”과 “실행 직전 검증”을 모두 수행한다.
- 모든 차단 결과는 `zone_control_logs` 또는 안전 이벤트 테이블에 사유와 함께 기록한다.

확장성 원칙:

- AI output은 final target 후보일 뿐, 직접 장비 명령이 아니다.
- `ai_zone_control_outputs` -> `zone_final_control_targets` -> Safety Guard -> HA service call adapter 순서를 유지한다.
- 향후 AI를 고도화해도 인터록, entity mapping, 실행 로그 구조는 그대로 재사용한다.

### ADR-005. 데이터 갱신/저장 주기는 제어 안정성과 UX를 우선해 분리한다

결정:

- 화면 갱신, 제어 판단, 인터록 검사, MariaDB 저장, 장기 시계열 저장은 서로 다른 주기로 운영한다.
- Green Smart panel은 전체 화면을 한 번에 재렌더하지 않고, 카드/요소별 갱신 주기를 둔다.
- 제어 판단 주기는 MVP 기준 1분으로 시작하고, 운영 중 문제가 확인되면 조정한다.
- 인터록은 이벤트 기반, 실행 직전 검사, 1분 fallback 주기 검사를 함께 사용한다.
- MariaDB는 고빈도 raw sensor DB가 아니라 전략 판단/제어 결과 추적 DB로 사용한다.
- 장기 raw sensor 시계열은 Home Assistant recorder 또는 InfluxDB가 담당한다.

확정 주기:

| 영역 | 정책 |
| :--- | :--- |
| Panel 기본 갱신 | 5초 기준, 단 전체 화면 재렌더 금지 |
| Panel 요소별 갱신 | 현재값/장비상태/알림/로그/그래프를 요소별로 분리 갱신 |
| 제어 판단 | 1분 |
| 인터록 검사 | 이벤트 기반 + 실행 직전 검사 + 1분 fallback 검사 |
| MariaDB 저장 범위 | 전략 판단 스냅샷 + final target + control log |
| 전략 스냅샷 저장 | 5분마다 저장 + target 변경 시 즉시 저장 |
| 장기 raw sensor | HA recorder/InfluxDB 담당 |

Panel 요소별 갱신 가이드:

| UI 요소 | 권장 갱신 |
| :--- | :--- |
| 현재 센서값 카드 | 5초 |
| 장비 상태 카드 | 5초 또는 HA 상태 변경 감지 시 |
| 인터록/알림 배너 | 즉시 또는 5초 이내 |
| final target 카드 | target 변경 시 + 5초 polling |
| 실행/안전 로그 | 새 로그 발생 시 또는 10~30초 |
| 그래프/리포트 | 30초~5분, 화면 진입 시 즉시 |
| 설정 폼 | 자동 갱신 금지, 저장/새로고침 버튼 기준 |

제약:

- panel refresh는 사용자가 입력 중인 form state를 덮어쓰면 안 된다.
- 설정/입력 화면은 background refresh가 있더라도 dirty state를 보존한다.
- target 변경 여부 판단은 단순 문자열 비교가 아니라 normalized target payload 기준으로 한다.
- 같은 target이 반복 계산되면 중복 저장하지 않는다.

### ADR-006. 운영 구조는 다중 고객/SaaS 확장 가능 구조를 전제로 한다

결정:

- Green Smart는 MVP 단계부터 다중 고객/SaaS 확장 가능성을 고려해 개발한다.
- 각 고객 현장에는 Linux 기반 NUC PC를 설치하고, Docker 기반으로 Home Assistant, Green Smart custom integration, MariaDB, MQTT/InfluxDB 등 운영 구성요소를 배포한다.
- 현장 NUC는 로컬 제어와 인터록을 담당하는 edge appliance 역할을 한다.
- SaaS/Central 영역은 고객/현장/장비 상태를 중앙에서 모니터링하고, 원격 지원/라이선스/업데이트/백업/알림 확장을 담당한다.
- 단, MVP의 안전 제어는 중앙 서버 의존 없이 현장 NUC/HA/Green Smart 로컬 환경에서 독립적으로 동작해야 한다.

운영 계층:

```text
Central/SaaS Layer
-> 고객/현장 등록, 라이선스, 원격 모니터링, 원격 지원, 백업/업데이트 정책

Customer Edge Layer
-> Linux NUC + Docker
-> Home Assistant
-> Green Smart custom integration
-> MariaDB
-> MQTT / InfluxDB / Cloudflare tunnel 등 운영 구성

Device Layer
-> HA entity
-> MQTT/Modbus/PLC/ESPHome/릴레이 등 실제 장비 통신
```

repo 역할 분리:

| repo | 역할 |
| :--- | :--- |
| `green_smart` | HACS-compatible Home Assistant custom integration 제품 코드 |
| `green_smart-deploy` | 고객 현장 Linux NUC/Docker 배포, HA/MariaDB/MQTT/InfluxDB/Cloudflare tunnel 구성 |
| Central/SaaS repo 또는 서비스 | 고객/현장 관리, activation, token, 원격 API, 라이선스/운영 관제 |

설계 원칙:

- 제품 repo는 HACS custom integration 호환성을 유지한다.
- Docker Compose, OS bootstrap, tunnel, 백업, 모니터링 등은 배포 repo에서 관리한다.
- 모든 핵심 테이블/API는 향후 `customer_id`, `site_id`, `edge_id` 같은 상위 식별자를 붙일 수 있게 설계한다.
- 현장 NUC가 인터넷 연결을 잃어도 인터록과 로컬 제어는 계속 동작해야 한다.
- Central API는 allowlisted endpoint만 제공하고 generic vendor proxy는 만들지 않는다.
- activation code/raw token은 저장/노출하지 않는 현재 보안 원칙을 유지한다.

MVP에서 바로 해야 할 것:

- DB/API naming에서 Zone만 보지 말고 상위 site/farm 확장을 막지 않도록 설계한다.
- panel에는 당장 복잡한 tenant UI를 만들지 않더라도, 내부 모델은 고객 현장 단위 확장을 고려한다.
- Central activation/token store는 고객 현장 NUC를 식별할 수 있도록 edge/site 개념과 연결 가능해야 한다.
- 로그와 백업은 고객 지원을 위해 현장 단위로 export 가능해야 한다.

MVP에서 미루는 것:

- 과금/구독 결제.
- 복잡한 멀티테넌트 관리자 포털.
- 중앙에서 직접 장비를 제어하는 기능.
- 고객 간 데이터 통합 분석.

### ADR-007. MVP 알림은 panel과 Home Assistant persistent notification으로 제한한다

결정:

- MVP 알림 채널은 Green Smart panel 내부 알림과 Home Assistant persistent notification으로 제한한다.
- 현장 부저나 경광등은 설치하지 않으므로 MVP와 기본 로드맵 범위에서 제외한다.
- Telegram, SMS, 카카오, 이메일 등 원격 알림은 2차 확장으로 둔다.
- 알림은 반드시 DB 로그와 연결되어야 하며, 사용자가 나중에 원인/조치/해결 여부를 추적할 수 있어야 한다.

MVP 알림 범위:

| 알림 위치 | 역할 |
| :--- | :--- |
| Green Smart panel banner/card | 현재 Zone의 인터록, 안전 이벤트, 제어 차단, 센서 이상 표시 |
| Home Assistant persistent notification | 사용자가 HA 어디에 있든 확인해야 하는 중요 이벤트 표시 |
| `zone_control_logs` 또는 safety event table | 알림 원인, 발생 시각, Zone, 관련 entity, 조치 상태 기록 |

알림 우선순위:

| 등급 | 예시 | MVP 동작 |
| :--- | :--- | :--- |
| Critical | 강풍 폐쇄, EC 과농도, VWC 하한, 절대 고온/저온, 필수 센서 unavailable | panel 강조 + HA persistent notification + 실행/차단 로그 |
| Warning | VPD 이탈, 센서 품질 의심, target 적용 실패, 장비 응답 지연 | panel 표시 + 로그 |
| Info | final target 변경, 반자동 적용 완료, 설정 저장 | panel 또는 로그 중심 |

2차 확장:

- Central/SaaS 알림 대시보드.
- Telegram/SMS/카카오/이메일 중 고객 요구에 맞춘 원격 알림.
- 담당자별 알림 라우팅.
- 근무시간/야간/휴일 알림 정책.

제외:

- 현장 부저.
- 현장 경광등.
- 중앙 서버에서 직접 장비를 제어하는 긴급 remote action.

### ADR-008. 기존 문서와 새 마스터 플랜이 충돌하면 사용자에게 확인 후 작업한다

결정:

- 기존 문서(`docs/PROJECT_GUIDE.md`, `docs/design/zone-control-roadmap-and-data-model.md`)와 새 마스터 플랜 또는 신규 구현 방향이 충돌하면, 작업자가 임의로 한쪽을 선택하지 않는다.
- 충돌은 사용자에게 명확히 보고하고, 승인된 방향으로만 문서 수정/코드 변경/migration 작업을 진행한다.
- 이미 코드와 테스트에 반영된 기존 구조는 임의로 뒤집지 않는다.

충돌 처리 절차:

1. 충돌 감지
   - 문서 간 용어, DB schema, API path, 제어 흐름, 파일 책임, 테스트 기준이 다를 때 충돌로 본다.

2. 충돌 요약
   - 기존 문서 기준.
   - 새 마스터 플랜 기준.
   - 현재 코드/테스트 기준.
   - 영향 범위.

3. 사용자 확인
   - “기존 문서 유지”, “마스터 플랜으로 전환”, “단계적 migration”, “추가 검토” 중 어떤 방향인지 사용자에게 묻는다.

4. 승인 후 반영
   - 승인된 방향만 문서/코드에 반영한다.
   - migration이 필요한 경우 별도 작업 항목으로 분리한다.

5. 기록
   - 중요한 충돌은 `Decision / Conflict / Resolution / Migration` 형식으로 문서에 남긴다.

기본 원칙:

- 질문 없이 기존 구조를 삭제하지 않는다.
- 질문 없이 DB/API contract를 바꾸지 않는다.
- 질문 없이 테스트 기준을 완화하지 않는다.
- 질문 없이 운영/배포 구조를 바꾸지 않는다.

---

## 1. 제품 비전

Green Smart는 단순 센서 모니터링 프로그램이 아니라, 작물 생육 목표를 중심으로 온실 환경을 자동 조정하는 의사결정형 환경제어 플랫폼이다.

핵심 방향은 다음과 같다.

1. 작물 상태가 최상위 의사결정 기준이다.
2. 환경 목표값은 고정값이 아니라 생육 단계, 작물군, G-Index, 일사량, 예보, 안전 상태에 따라 매일/실시간 보정된다.
3. 하드웨어 제어는 항상 안전 리밋과 수동 개입 가능성을 우선한다.
4. 모든 자동 제어에는 “왜 이 제어가 내려갔는지”를 사용자에게 설명하는 근거 메시지가 남아야 한다.
5. 구역(zone) 단위 제어를 기본 단위로 삼아 여러 온실동, 여러 작물, 여러 장비 구성을 확장 가능하게 만든다.

---

## 2. 시스템 도메인 모델

### 2.1 최상위 개념

- Farm: 농장 또는 설치 고객 단위.
- Greenhouse: 온실동 단위.
- Zone: 제어 단위. 같은 온실 안에서도 작물, 센서, 창문, 스크린, 관수 라인이 다르면 별도 Zone으로 본다.
- CropCycle: 특정 Zone에서 진행 중인 작기.
- CropProfile: 토마토, 파프리카, 상추 등 작물별 기본 생육/환경 프로파일.
- GrowthPhase: 활착기, 초기생장, 성기수확, 급속성장, 수확적기 등 생육 단계.
- Device: 창문, 유동팬, 스크린, 펌프, 밸브, 양액기, 난방기, 미스트 등 물리 장치.
- Sensor: 온도, 습도, CO2, 일사, 풍향, 풍속, VWC, 배액 EC/pH, 급액 EC/pH 등 측정 장치.
- ControlIntent: 전략 엔진이 만든 목표. 예: 목표 ADT 18.5도, VPD 0.9kPa, 배액률 25%.
- ControlCommand: 실제 장비에 내려가는 명령. 예: 천창 15%, 스크린 70%, 1회 관수 100cc.
- Event/Alarm: 강풍, 센서 이상, EC 과농도, VWC 하한, 결로 위험 등 이벤트.

### 2.2 에이전트 계층

초기 문서의 5개 에이전트는 다음 계층으로 구현한다.

1. CORP: 작물 지능 전략 계층
   - 생육 데이터와 생육 단계 기준을 비교한다.
   - B-Score, V-Score, G-Index를 계산한다.
   - TEMHUM과 IRR에 생장 방향, 목표 보정값, 제어 사유를 전달한다.

2. TEMHUM: 온습도 전략 계층
   - ADT, DIF, VPD, 이슬점, 저광기 전략, 예보 보정 값을 계산한다.
   - VENT와 SCRN에 도달해야 할 목표 환경을 제공한다.

3. IRR: 관수 제어 전략 계층
   - 일사 기반 관수 트리거, 드라이백, 배액률, EC/pH 보정 값을 계산한다.
   - 관수 라인, 펌프, 밸브, 양액 배합 장치에 명령 후보를 만든다.

4. VENT: 환기 실행 계층
   - 천창/측창/유동팬을 제어한다.
   - 풍향/풍속, 강풍 모드, P-Band, dead-band, 최대/최소 개도 제한을 적용한다.

5. SCRN: 스크린 실행 계층
   - 차광 스크린과 보온 스크린을 제어한다.
   - 일사/온도/야간 습도/아침 개방 로직을 적용한다.

---

## 3. 제어 우선순위

모든 엔진은 아래 우선순위를 공통으로 따른다.

0. Lv.0 Interlock
   - AI, 외부 API, 전략 엔진과 독립적으로 동작하는 장비/작물 보호 조건.
   - 강풍, 절대 저온/고온, VWC 하한, EC 과농도, 센서 무결성 이상, 장비 통신 실패, 수동 비상정지.

1. Lv.1 Safety
   - 강풍 폐쇄, 절대 고온/저온 리밋, EC 과농도 정지, VWC 하한 긴급 관수, 센서 무결성 경보, 결로 위험 방어.

2. Lv.2 Vitality
   - VPD 골든존, 배지 함수율 하한, 작물 표면 결로 방지, 팁번/추대 방어, 뿌리 활력 유지.

3. Lv.3 Steering
   - CORP가 지시한 생육 방향, ADT/DIF/G-Index 기반 생식/영양 조타.

4. Lv.4 Optimization
   - 에너지 절감, 관수량 최적화, 배액률 최적화, 사용자 편의.

인터록/안전 레벨 명령은 전략 레벨 명령을 덮어쓸 수 있어야 하며, 덮어쓴 사유는 반드시 로그와 화면에 남긴다.

---

## 4. 백엔드 아키텍처

### 4.1 추천 구조

현행 구조는 Home Assistant custom integration 단일 패키지이므로, 초기/중기 버전은 `custom_components/green_smart/` 내부 모듈형 모놀리스를 유지한다. 제어 시스템은 데이터 일관성, 설치 단순성, HACS 배포 호환성, 장애 추적이 중요하므로 제품 repo에서 별도 웹 서버나 마이크로서비스를 추가하지 않는다.

권장 백엔드 모듈 매핑:

- Home Assistant integration core: `__init__.py`, `manifest.json`, `config_flow.py`.
- DB/storage: `db.py`, schema bootstrap, MariaDB query helper.
- crop domain: `crop_views.py`와 향후 `crop_engine.py`.
- weather/pesticide domain: `weather_api.py`, `weather_views.py`, `kma_grid.py`, `api/pesticide.py`.
- central domain: `central_api.py`, `central_store.py`, `central_views.py`.
- zone control API: `zone_control_views.py`.
- strategy engines: 향후 `corp_engine.py`, `temhum_engine.py`, `irrigation_engine.py`.
- device/entity control: Home Assistant entity mapping 기반 service call adapter.
- frontend: `panel/green-smart-panel.js`.
- panel registration: `frontend_panel.py`.
- tests: `tests/test_*_contract.py`.

### 4.2 실시간 제어 루프

제어 루프는 Home Assistant 실행 환경을 기준으로 주기와 책임을 분리한다.

- 즉시성 API 요청: panel에서 사용자가 저장/계산/복사/실행 요청 시 `HomeAssistantView`에서 처리.
- HA entity 상태 갱신 주기: Home Assistant state machine의 entity 상태를 기준으로 최신 센서/장비 상태를 읽는다.
- 1분 내외: 온습도/VPD/환기/스크린 목표 재계산 후보.
- 5분 내외: 센서 무결성 패턴 검사, 구역별 환경 요약.
- 10분~30분: 관수 트리거, 일사 누적, VWC 변화 분석.
- 1일: ADT/Thermal Credit, GDD, 작물 단계/리포트, 다음날 관수 전략.
- 1주: CORP 생육 측정 입력, B-Score/V-Score/G-Index 갱신, 수확 예측 보정.

실시간 명령은 다음 순서로 생성한다.

1. 최신 센서값과 예보를 수집한다.
2. 센서 품질과 안전 상태를 검증한다.
3. CORP의 현재 G-Index와 작물 목표를 읽는다.
4. TEMHUM/IRR이 목표 intent를 만든다.
5. Safety Guard가 intent를 검증하고 필요 시 제한한다.
6. VENT/SCRN/Device Adapter가 Home Assistant entity/service call 후보로 변환한다.
7. 실행 여부, 장비 응답, 결과 로그를 MariaDB에 저장한다.

---

## 5. 프론트엔드 아키텍처

### 5.1 주요 화면

1. 대시보드
   - 농장/온실/Zone 상태 요약.
   - 현재 온도, 습도, VPD, 일사, 풍속, VWC, EC/pH.
   - 현재 제어 모드: 자동, 수동, 안전정지, 센서이상, 유지보수.
   - 최근 자동 제어 사유: “VPD 0.42kPa로 가열 제습 모드”, “강풍 12m/s로 천창 폐쇄”.

2. Zone 제어 화면
   - 해당 Zone의 센서, 장비, 작물 작기, 생육 단계.
   - 목표값과 실제값 비교.
   - VENT/SCRN/IRR 명령 이력.
   - 수동 override와 자동 복귀 타이머.

3. 작물 지능 화면
   - 작물군, 품종, 생육 단계, 재식일, 목표 수확일.
   - 과채류: 줄기 굵기, 초장, 화방 거리, 착과 화방 수.
   - 엽채류: 엽수, 엽길이, 엽폭, 추대 여부, 엽색, 엽두께.
   - B-Score/V-Score/G-Index 추이와 설명 메시지.

4. 환경 전략 화면
   - ADT, DIF, VPD 목표 프로파일.
   - 6구간 변온 모델.
   - Thermal Credit, GDD, 저광기 전략 적용 여부.

5. 관수 전략 화면
   - 오늘의 관수 구간, 예상/실제 급액량, 첫 배액 시간.
   - 누적 일사량 트리거.
   - VWC 드라이백 그래프.
   - 급액/배액 EC/pH 비교.

6. 장비/센서 설정 화면
   - 장비 타입, 채널, 프로토콜, Zone 매핑.
   - 최대/최소 개도, 안전 리밋, dead-band.
   - 센서 보정값, 설치 위치, 품질 상태.

7. 알림/이력 화면
   - 안전 이벤트, 센서 이상, 수동 조작, 자동 명령, 설정 변경 이력.

### 5.2 UX 원칙

- 농장 운영자는 “현재 왜 이렇게 제어되는지”를 즉시 이해해야 한다.
- 자동제어는 숨기지 말고 설명해야 한다.
- 수동 제어는 가능해야 하지만 자동 복귀 조건과 남은 시간을 명확히 보여준다.
- 숫자 설정은 기본값, 권장 범위, 위험 범위를 함께 표시한다.
- 모바일에서는 “현재 상태 확인과 긴급 수동 제어”를 우선한다.

---

## 6. API 설계 방향

### 6.1 Home Assistant HTTP Views

초기 관리/조회 API는 Home Assistant `HomeAssistantView` 기반 HTTP API로 유지한다. URL prefix는 현행 `/api/green_smart/...` 체계를 따른다.

- `/api/green_smart/crop/...`
- `/api/green_smart/weather/...`
- `/api/green_smart/pesticide/...`
- `/api/green_smart/central/...`
- `/api/green_smart/zones/...`
- `/api/green_smart/environment/...`
- `/api/green_smart/irrigation/...`
- `/api/green_smart/devices/...`

향후 API 추가 원칙:

- crop/season/survey 계열은 `crop_views.py`에 둔다.
- weather/pesticide/central proxy는 기존 view 파일의 보안 정책을 유지한다.
- zone 제어 관련 API는 `zone_control_views.py`를 중심으로 확장한다.
- generic vendor proxy는 만들지 않는다.
- activation code/raw token은 저장하거나 응답에 노출하지 않는다.

### 6.2 실시간 API

Home Assistant panel 환경에서는 우선 현행 panel fetch 기반 갱신을 유지한다. 필요 시 Home Assistant의 기존 websocket API 또는 event bus 연동을 검토하되, MVP에서는 복잡한 별도 실시간 채널을 추가하지 않는다.

실시간화 후보 이벤트:

- zone telemetry updated
- zone strategy updated
- device command sent
- device state updated
- alarm raised/resolved

### 6.3 내부 엔진 계약

전략 엔진은 DB에 직접 명령을 흩뿌리지 말고 명확한 DTO를 반환한다.

예시:

```json
{
  "zoneId": "zone-1",
  "source": "TEMHUM",
  "intentType": "CLIMATE_TARGET",
  "targets": {
    "airTemperatureC": 18.5,
    "relativeHumidityPct": 78,
    "vpdKpa": 0.9
  },
  "reason": "G-Index -3.2로 세력 회복을 위해 ADT를 상향했습니다.",
  "validUntil": "2026-06-20T10:05:00+09:00"
}
```

---

## 7. DB 설계 방향

### 7.1 저장소 구분

- MariaDB: 기준정보, 설정, 작기, 생육 측정, 명령, 알림, 감사 로그, AI output, final target.
- Home Assistant state machine: entity의 최신 센서/장비 상태 참조.
- InfluxDB: 운영 배포 repo에서 시계열 장기 저장으로 연결 가능하나, 제품 repo의 1차 DB는 MariaDB로 유지한다.

제품 repo에서는 `aiomysql` connection pool과 `utf8mb4`, autocommit 기반의 현행 `db.py` 패턴을 유지한다. 별도 PostgreSQL/Redis 전환은 현재 마스터 플랜 범위에서 제외한다.

### 7.2 핵심 테이블

현행 테이블을 우선 확장한다.

- `zones`
- `crop_seasons`
- `growth_surveys`
- `pest_surveys`
- `control_records`
- `control_pesticides`
- `zone_control_settings`
- `ai_zone_control_outputs`
- `zone_final_control_targets`
- `zone_device_entity_mappings`
- `zone_control_logs`
- `zone_control_copy_jobs`

추가 검토 테이블:

- `zone_sensor_quality_events`
- `zone_control_safety_events`
- `zone_strategy_snapshots`
- `zone_irrigation_events`
- `zone_nutrient_measurements`
- `crop_growth_scores`

### 7.3 관계성

- `zones` 1:N `crop_seasons`
- `crop_seasons` 1:N `growth_surveys`
- `crop_seasons` 1:N `pest_surveys`
- `crop_seasons` 1:N `control_records`
- `control_records` N:M `control_pesticides` 또는 현행 schema 기준 연결
- `zones` 1:1 또는 1:N `zone_control_settings`
- `zones` 1:N `ai_zone_control_outputs`
- `zones` 1:N `zone_final_control_targets`
- `zones` 1:N `zone_device_entity_mappings`
- `zones` 1:N `zone_control_logs`
- `zones` 1:N `zone_control_copy_jobs`
- HA entity id는 별도 device/sensor 테이블보다 `zone_device_entity_mappings`의 외부 참조값으로 우선 관리한다.

### 7.4 데이터 보존 정책

- MariaDB에 저장하는 제어 결과, AI output, final target, 생육/방제 기록은 영구 보존을 권장한다.
- 고빈도 원시 센서값은 Home Assistant recorder/InfluxDB 정책과 충돌하지 않게 제품 repo에서 중복 저장을 최소화한다.
- Green Smart가 직접 저장해야 하는 값은 “전략 판단에 사용된 스냅샷”과 “최종 목표/명령/사유/결과”이다.
- 작물 생육 측정/수확량은 향후 AI 보정 데이터의 핵심이므로 영구 보존을 권장한다.

---

## 8. 제어 엔진 상세 개발 방향

### 8.1 CORP

MVP 구현:

- 작물군: 과채류, 엽채류.
- 생육 단계별 표준 목표치 저장.
- 과채류 B-Score 계산.
- 엽채류 V-Score 계산.
- G-Index 계산.
- 제어 사유 문구 생성.

추가 구현:

- 세력 보호, 과적 방지, 기상 대비, 수확 가속 트리거.
- 수확량 예측.
- 병해 위험도.
- PHI 방제 기록.

### 8.2 TEMHUM

MVP 구현:

- ADT 목표 계산.
- DIF 기반 주간/야간 목표 배분.
- VPD 계산.
- VPD 초과/미달 액션 제안.
- 이슬점 방어 판단.

추가 구현:

- 6구간 변온 모델.
- Thermal Credit 7일 보정.
- GDD.
- 저광기 전략.
- 예보 우선 모드.
- 센서 무결성 패턴 검출.

### 8.3 IRR

MVP 구현:

- 작물군/생육단계별 EC, 배액률, 드라이백 목표.
- 일사량 누적 관수 트리거.
- VWC 하한 긴급 관수.
- G-Index 기반 EC/드라이백/종료시간 보정.

추가 구현:

- 아침 포수 수량 계산.
- 첫 배액 유도.
- 배액 EC/pH 피드백.
- 양액 PID 제어.
- 2000J Rule.

### 8.4 VENT

MVP 구현:

- 목표 온도 대비 P-Band 개도 계산.
- dead-band.
- 최대/최소 개도 제한.
- 강풍 폐쇄.
- 풍상/풍하 제한.

추가 구현:

- 돌풍 30초 대기.
- 구역별 유동팬 제어.
- 장비 응답 지연 감지.
- 모터 이동시간 기반 위치 추정.

### 8.5 SCRN

MVP 구현:

- 차광 스크린 일사/온도 트리거.
- 보온 스크린 야간 외기온 트리거.
- 습기 갭.
- 아침 점진 개방.

추가 구현:

- 작물군별 차광 기준.
- VPD/고온 건조 연동.
- 에너지 절감 리포트.

---

## 9. 개발 로드맵

### Phase 0. 현재 상태 정리

목표:

- 실제 GitHub 코드와 문서 원문을 로컬에 정상 체크아웃한다.
- `docs/PROJECT_GUIDE.md`와 `docs/design/zone-control-roadmap-and-data-model.md`를 기준 문서로 삼아 본 계획과 충돌 여부를 확인한다.
- 현행 `custom_components/green_smart/` 구조와 이미 구현된 기능/미구현 기능을 표로 만든다.

산출물:

- `docs/PROJECT_MASTER_PLAN.md`
- `docs/design/system-architecture.md`
- `docs/design/data-model.md`
- `docs/design/control-engine-contracts.md`
- `docs/design/api-spec.md`
- `docs/design/home-assistant-integration-contract.md`

### Phase 1. 기반 모델과 대시보드 MVP

목표:

- 현행 `zones`, `crop_seasons`, `zone_control_settings`, `zone_device_entity_mappings` 기반 모델을 안정화한다.
- HA entity mapping을 통해 센서 최신값과 장비 상태를 panel에서 확인한다.
- 수동 명령과 자동/수동 상태 전환을 `zone_control_views.py`와 panel에서 구현한다.
- AI 없이도 동작하는 Zone별 인터록 설정 화면과 검증 로직을 구현한다.

완료 기준:

- Zone별 현재 HA entity 상태 조회 가능.
- 장비 명령 이력 저장.
- 수동 override가 자동제어보다 우선 적용.
- 인터록 위반 명령은 AI/수동/반자동 여부와 무관하게 차단 또는 경고된다.
- 모든 명령에 user/system source와 reason이 남음.

### Phase 2. 인터록/안전 실행 완성

목표:

- 강풍, 저온, 고온, 센서 무결성, EC 과농도, VWC 하한, 장비 통신 실패 인터록을 우선 구현한다.
- Safety Guard를 final target 생성 이후와 HA service call 실행 직전에 모두 적용한다.
- 인터록 이벤트를 panel과 `zone_control_logs`에 표시한다.

완료 기준:

- AI output이 없어도 수동/반자동 명령에 인터록이 적용된다.
- 센서 이상 또는 필수 entity unavailable 시 자동 실행이 차단된다.
- 강풍/저온/고온/VWC/EC 조건별 차단 또는 보호 액션이 테스트로 검증된다.
- 인터록 차단 사유가 사용자에게 명확히 표시된다.

### Phase 3. 환경 전략 MVP

목표:

- CORP 기본 G-Index.
- TEMHUM ADT/DIF/VPD.
- VENT/SCRN 기본 실행.

완료 기준:

- `growth_surveys` 입력 후 G-Index 계산.
- G-Index가 온습도 목표값에 반영.
- 목표 온도와 현재 온도 차이로 final target 또는 entity command 후보 생성.
- 차광/보온 스크린 트리거 동작.

### Phase 4. 관수 전략 MVP

목표:

- IRR 기본 관수 스케줄러.
- 일사량 기반 관수.
- VWC 하한 긴급 관수.
- EC/pH 기본 설정.

완료 기준:

- 일사 누적 기준으로 관수 이벤트 생성.
- 관수 종료 시간이 일몰 기준으로 계산.
- VWC 하한에서 즉시 긴급 관수 명령 생성.
- 급액/배액 EC/pH 기록 가능.

### Phase 5. 제한적 자동제어와 알림 강화

목표:

- 장비군별 자동 허용 스위치.
- 환기/스크린/관수 단계별 자동 실행.
- 강풍/결로/EC/VWC/고온/저온 안전 알림 고도화.
- 제어 차단과 사용자 확인/재개 흐름.

완료 기준:

- 센서 이상 패턴 감지 시 자동 제어 차단.
- 안전 이벤트가 자동 명령을 덮어쓴 기록이 남음.
- 사용자가 알림 확인, 조치 메모, 재개 처리를 할 수 있음.
- 자동 허용이 꺼진 장비군은 final target까지만 생성되고 실행되지 않음.

### Phase 6. 생육 리포트와 예측

목표:

- 수확량 예측.
- 병해 위험도.
- Thermal Credit, GDD, 저광기 전략.
- 리포트/그래프.

완료 기준:

- 작기별 생육 추세와 환경 전략 변화가 연결되어 보임.
- 예상 수확량과 실제 수확량을 비교해 보정 가능.
- “이번 주 제어 전략 변경 사유”가 리포트로 생성됨.

---

## 10. 테스트 전략

### 10.1 Contract/unit tests

- B-Score/V-Score/G-Index 계산.
- ADT/DIF/VPD/이슬점 계산.
- 관수 종료 시간 계산.
- P-Band/dead-band 계산.
- Safety Guard 우선순위.

### 10.2 Integration/contract tests

- HA entity 상태/DB 설정 입력 -> 전략 output -> final target -> control log 생성.
- 강풍 이벤트 -> 모든 창 폐쇄.
- 센서 이상 -> 자동 제어 차단.
- 수동 override 또는 copy job -> 자동 명령 무시/복사/실행 로그 -> 자동 복귀.

### 10.3 시뮬레이션 테스트

- 맑은 여름날.
- 흐린 저광기 3일 연속.
- 강풍 돌풍.
- 야간 고습 결로 위험.
- VWC 급락.
- 급액 EC 과농도.

### 10.4 프론트 검증

- 모바일에서 Zone 상태와 긴급 수동 제어 가능.
- 자동 제어 사유가 모든 명령에 표시.
- 위험 설정값 입력 시 경고 표시.

---

## 11. 운영 및 장애 대응

필수 운영 기능:

- 장비별 마지막 통신 시간.
- 센서별 품질 상태.
- 자동제어 엔진 heartbeat.
- 명령 전송 성공/실패율.
- 안전 차단 상태.
- 로컬 제어기와 서버 간 연결 끊김 시 fallback 정책.

장애 대응 원칙:

- 서버가 죽어도 로컬 제어기는 마지막 안전 설정을 유지한다.
- 센서 신뢰도가 낮으면 자동제어를 멈추고 안전한 기본값으로 전환한다.
- 장비 명령 실패가 반복되면 해당 장비를 unavailable로 표시하고 사용자에게 알린다.
- 모든 자동 변경은 되돌릴 수 있도록 변경 전/후 값을 저장한다.

---

## 12. 반드시 결정해야 할 질문

현재 대화 기준 핵심 방향 결정은 완료되었다.

추가 질문은 실제 repo 원문(`docs/PROJECT_GUIDE.md`, `docs/design/zone-control-roadmap-and-data-model.md`)과 현재 코드/테스트를 확인한 뒤, 충돌이 발견될 때만 사용자에게 묻는다.

확정된 질문:

- 제어 대상 하드웨어 방식: Home Assistant entity/service call 중심.
- 실제 장비 통신: MQTT/Modbus/PLC/릴레이 등은 HA entity 뒤쪽으로 숨김.
- Green Smart 직접 제어 범위: final target 생성, HA service call 후보 생성, Safety Guard, 실행 로그 저장.
- Zone 정의: 같은 작물, 같은 생육 목표, 같은 센서 대표값, 같은 제어 장비 묶음을 공유하는 최소 제어 단위.
- MVP 작물: 토마토와 상추를 최소 지원.
- 자동화 범위: 인터록/수동 안전 기반을 먼저 완성하고, 추천/반자동/제한적 자동/Zone 자동제어 순서로 확장.
- 데이터 주기: panel 5초 요소별 갱신, 제어 판단 1분, 인터록 이벤트/실행 직전/1분 fallback, MariaDB는 전략 스냅샷/final target/control log 중심, 전략 스냅샷은 5분 + target 변경 시 즉시.
- 운영 범위: 다중 고객/SaaS 확장 가능 구조. 고객 현장은 Linux NUC + Docker 기반 edge appliance로 설치.
- MVP 알림: Green Smart panel + Home Assistant persistent notification. 현장 부저/경광등 제외. 원격 알림은 2차 확장.
- 문서 충돌 정책: 기존 문서/코드/새 마스터 플랜이 충돌하면 사용자에게 확인 후 작업.

---

## 13. 1차 권장 결정안

현재 정보만 기준으로 하면 다음 결정을 권장한다.

- 아키텍처: Home Assistant custom integration 내부 모듈형 모놀리스 + 명확한 엔진 모듈 분리.
- DB: MariaDB/aiomysql 유지.
- 실시간: 우선 panel fetch + HA entity state 기반, 필요 시 HA websocket/event bus 검토.
- 제어 단위: Zone.
- MVP 작물: 토마토 + 상추 최소 지원으로 과채류/엽채류 추상화를 처음부터 검증.
- 자동화 수준: AI 없이도 동작하는 인터록을 먼저 완성하고, 추천/반자동/제한적 자동/Zone 자동제어 순서로 확대.
- 로컬 제어: Home Assistant service/entity mapping을 1차 실행 표준으로 삼고, 운영 repo의 MQTT/컨테이너 인프라는 별도 연동 계층으로 다룬다.
- 저장 정책: MariaDB는 제어 판단 재현에 필요한 스냅샷과 로그 중심, raw sensor 장기 시계열은 HA recorder/InfluxDB에 위임.
- 배포 정책: 제품 repo는 HACS custom integration을 유지하고, 고객 현장 Docker/NUC 구성은 `green_smart-deploy`에서 관리한다.
- SaaS 정책: Central은 원격 관제/activation/지원/백업/업데이트를 담당하되, 현장 인터록과 로컬 제어는 중앙 의존 없이 동작한다.
- 알림 정책: MVP는 panel + HA persistent notification, 원격 알림은 2차 확장, 현장 부저/경광등은 제외.
- 충돌 정책: 기존 문서와 새 마스터 플랜 충돌 시 임의 판단 금지, 사용자 확인 후 반영.

---

## 14. 다음 액션

1. 실제 GitHub 소스와 문서 원문을 로컬에 확보한다.
2. 기존 문서와 본 계획의 충돌 지점을 정리한다.
3. 충돌이 있으면 사용자에게 확인한다.
4. `docs/PROJECT_MASTER_PLAN.md`로 승격한다.
5. Phase 0 산출물을 먼저 만들고, 그 다음 Phase 1 개발로 들어간다.
