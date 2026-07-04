# Green Smart R0 Rebuild Risk Register

> 기준일: `2026-06-28`
> 기준 버전: `v1.14.61`
> 목적: 제품 구조 리빌딩 중 prod 안정성, 데이터 보존, UI/API compatibility, 현장 안전을 해치지 않기 위한 위험 목록과 대응 기준을 고정한다.

---

## 1. Risk Gate

| Gate | 결정 |
|---|---|
| R0 prod 변경 | 금지 |
| R0 DB migration | 금지 |
| R0 신규 기능 | 금지 |
| R0 release | 문서/계약/버전 baseline만 `v1.12.0`으로 release |
| prod cutover | R6 이후 별도 승인 필요 |

---

## 2. 핵심 위험 목록

| ID | 위험 | 영향 | 가능성 | 대응 |
|---|---|---:|---:|---|
| RISK-001 | `green-smart-panel.js` monolith를 한 번에 분해하다가 HA panel 로딩 실패 | 높음 | 높음 | compatibility shell 유지. 첫 slice는 read-only 또는 Admin/System shell부터 |
| RISK-002 | API route path 변경으로 기존 Panel/자동화/테스트 깨짐 | 높음 | 중간 | 기존 `/api/green_smart/*` path 유지. 신규 구조는 adapter 뒤에서만 변경 |
| RISK-003 | `crop_seasons` → `crop_cycle` 실제 DB migration을 조기 수행 | 높음 | 중간 | R4 전까지 migration 금지. alias/문서/API compatibility만 사용 |
| RISK-004 | Safety/Interlock보다 Model/AI 리팩터를 먼저 진행 | 높음 | 중간 | 문서와 테스트에 `Safety → Interlock → Model` 고정 |
| RISK-005 | prod Docker/HA/DB stack을 제품 구조 baseline 전 변경 | 높음 | 낮음 | R6 전 prod stack 구조 변경 금지. dev stack 먼저 |
| RISK-006 | RBAC가 UI 숨김에만 남고 backend enforcement가 누락 | 높음 | 중간 | write/execute API마다 permission contract 추가 |
| RISK-007 | Frontend module split 후 HA resource loading/browser cache 문제 | 중간 | 중간 | module loading contract test + HA config check + version bump/cache busting |
| RISK-008 | crop/environment/irrigation/device 도메인 경계가 다시 섞임 | 중간 | 높음 | 5대 문서와 IA bucket 기반으로 모든 slice 선문서화 |
| RISK-009 | 테스트가 static marker 중심이라 실제 runtime 문제를 놓침 | 중간 | 중간 | rendered smoke/browser QA는 위험 높은 slice부터 추가 |
| RISK-010 | 운영자가 이해 못 하는 기술 용어가 UI에 남음 | 중간 | 높음 | `farm_staff`/`farm_owner` wording checklist 적용 |
| RISK-011 | Central/API key/날씨/농약 credential 문서화 중 secret 노출 | 높음 | 낮음 | `.env`/token/secret은 읽어도 출력 금지. 문서에는 `[REDACTED]`만 |
| RISK-012 | 실제 장비/MQTT 연결 전 virtual rehearsal 누락 | 높음 | 중간 | physical device gate 유지. normal/strong-wind/rain/low-temp/sensor-fault/blocked/Fail Safe/recovery rehearsal 필수 |

---

## 3. 리빌딩 slice별 위험 등급

| Slice | 위험 등급 | 이유 | 필수 검증 |
|---|---|---|---|
| RB-001 Admin/System shell 분리 | 낮음 | 운영 기록/제어 core와 분리 가능 | static contract + node check + panel marker |
| RB-002 Panel API client adapter | 낮음~중간 | callApi wrapper 변경은 전 페이지 영향 가능 | full pytest + browser console smoke |
| RB-003 Crop read-only component extraction | 중간 | crop page 렌더 영향 | crop UI contract + rendered smoke |
| RB-004 Crop write modal extraction | 중간 | 작기/생육 입력 저장 영향 | API contract + modal marker + DB payload contract |
| RB-005 Safety/Execution UI proximity | 중간~높음 | 실행 버튼/안전상태 UX 영향 | safety block/allow cases + browser QA |
| RB-006 Backend crop service/repo extraction | 중간 | API route는 유지하되 내부 query 이동 | route contract + service unit + full pytest |
| RB-007 Environment/Irrigation/Device service split | 높음 | 실행/인터록/설정 저장 영향 | virtual rehearsal + HA config check + prod readiness |

---

## 4. Abort / Escalation Rules

즉시 중단하고 사용자 확인이 필요한 경우:

1. 실제 DB migration이 필요한 경우.
2. prod container stop/recreate/cutover가 필요한 경우.
3. 실제 MQTT/장비 명령 송신 가능성이 있는 경우.
4. route path breaking change가 필요한 경우.
5. secret/token/API key를 새 위치로 옮겨야 하는 경우.
6. 전체 테스트가 기능 회귀로 실패하고 원인이 명확하지 않은 경우.

---

## 5. R0 이후 권장 순서

```text
R1 IA/RBAC 현행화
→ R2 Frontend split plan
→ R3 Backend/API split plan
→ R4 DB/schema rationalization
→ RB-001부터 작은 제품 리빌딩 slice 실행
→ R6 운영/배포 스택 리빌드 준비
```

---

## 6. Verification Policy

모든 리빌딩 slice는 최소 아래를 통과해야 한다.

```bash
node --check custom_components/green_smart/panel/green-smart-panel.js
python3 -m py_compile custom_components/green_smart/*.py custom_components/green_smart/api/*.py
pytest -q
```

위험도가 중간 이상인 slice는 추가로:

- 관련 domain targeted contract
- HA config check
- browser console smoke
- 필요 시 prod 반영 전 dev/virtual rehearsal

---

## 7. R0 상태

- R0 inventory 작성 완료
- R0 risk register 작성 완료
- R0 baseline contract 예정
- R0 release target: `v1.12.0`
