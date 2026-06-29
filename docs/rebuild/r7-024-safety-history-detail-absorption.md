# R7-024 Safety/History Detail Absorption

> 기준 버전: v1.12.82
> Status: planned via RED contract
> Scope: 안전 제어 도메인을 zone-scoped visual 하위탭으로 전환

## 1. Why this slice exists

After 작물 운영 was corrected in R7-023, the next remaining R7 domain detail card is `안전 제어`. R7-024 absorbs the old R7-012 read-only safety/history detail into visual sub-tabs while preserving its authoritative allow/block evidence boundary.

## 2. Source inventory

| Old source | Old responsibility | Visual destination |
|---|---|---|
| `renderR7SafetyHistoryDetail()` | old rendered read-only detail card | removed from product render path after absorption |
| `data-r7-safety-history-status` | Safety / Interlock / Fail Safe / alarm status | `현재 안전 상태` tab / `data-r7-safety-status-card` |
| `data-r7-safety-history-reasons` | block/allow reasons, stale/errors | `차단·허용 이유` tab / `data-r7-safety-reason-card` |
| `data-r7-safety-history-timeline` | manual/rule/AI/device/execution history | `이벤트 이력` and `운영 이력` tabs / `data-r7-safety-event-card` / `data-r7-safety-operation-card` |
| `data-r7-safety-history-audit` | audit/read-only boundary | `감사·근거` tab / `data-r7-safety-audit-card` |
| freshness/trends | zone-scoped safety evidence | `추세·근거` tab / `data-r7-safety-trend-evidence` |

## 3. Product UI mapping

Required sub-tabs:

| Tab key | Korean label | Required evidence |
|---|---|---|
| `status-summary` | 현재 안전 상태 | Safety 상태, Interlock 상태, Fail Safe 상태, 알람 |
| `block-allow` | 차단·허용 이유 | 차단 이유, 허용 이유, 센서 stale 이력, 오류/Traceback/통신 장애 |
| `event-history` | 이벤트 이력 | safety event, stale/error event, alarm evidence |
| `operation-history` | 운영 이력 | 수동 조작 이력, 기본 자동제어 이력, AI 추천/적용/미적용, 장치 명령 후보, 실제 실행 이력 later only |
| `audit-evidence` | 감사·근거 | authoritative allow/block history, read-only, no ack/clear/override/mutation |
| `trend-evidence` | 추세·근거 | safety/interlock/failsafe trend and freshness evidence |

## 4. Required markers

```text
data-r7-safety-zone-visual="true"
data-r7-safety-detail-absorbed="true"
data-r7-safety-subtab="status-summary"
data-r7-safety-subtab="block-allow"
data-r7-safety-subtab="event-history"
data-r7-safety-subtab="operation-history"
data-r7-safety-subtab="audit-evidence"
data-r7-safety-subtab="trend-evidence"
data-r7-safety-status-card
data-r7-safety-reason-card
data-r7-safety-event-card
data-r7-safety-operation-card
data-r7-safety-audit-card
data-r7-safety-trend-evidence
```

Old rendered marker that must be absent from rendered product HTML after absorption:

```text
data-r7-safety-history-detail
```

## 5. Boundary

R7-024 is UI/documentation/contract absorption only:

```text
No API route change
No DB migration
No HA service call
No MQTT/device command
No alarm ack/clear
No approval/override release
No execution history mutation
No save/apply/execute control
No SafetyGuard/Interlock runtime behavior change
No physical device hookup
```

## 6. Acceptance criteria

```text
Focused RED contract fails before implementation
safety-history active domain renders data-r7-safety-zone-visual="true"
old data-r7-safety-history-detail is absent from rendered HTML
old safety status/reasons/timeline/audit concepts are visible through visual tabs/cards
subtab click smoke switches to operation-history and renders operation cards
Existing R7-012 contract is updated as stale after absorption, not by restoring old detail card
Full pytest and node syntax checks pass
Prod served-source + render smoke passes before release
```
