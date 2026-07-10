# R7-015 Common Visual UI System

> 기준 버전: `v1.15.15`
> Status: R7-015 complete
> Purpose: R7 rebuild 화면을 긴 설명/텍스트 card 중심에서 운영자가 한눈에 판단할 수 있는 visual dashboard 중심으로 전환한다.

## 1. Scope

R7-015 changes the rebuild panel visual grammar only.

```text
Before: domain pages contain mostly explanatory paragraphs and plain cards
After: common visual components summarize status, severity, freshness, metrics, alerts, and trend placeholders first
```

R7-015 starts with common components and operations-home visual dashboard. Deeper per-domain visual rewrites remain later slices.

## 2. Required common components

```text
StatusBadge: 정상 / 주의 / 경고 / 차단 / 데이터 부족
SeverityCard: green / yellow / orange / red / gray emphasis
FreshnessPill: 최신 / 지연 / stale / 오류
MetricCard: 현재값 / 목표값 / 편차 / 상태
DomainHealthStrip: 도메인별 health row
AlertBanner: 차단 / 인터록 / Fail Safe / 센서 오류
MiniTrendChart placeholder: chart area without real chart data until API-backed charts are approved
```

## 3. Required markers

```text
data-r7-visual-system="true"
data-r7-status-badge
 data-r7-status="normal"
 data-r7-status="attention"
 data-r7-status="warning"
 data-r7-status="blocked"
 data-r7-status="unknown"
data-r7-severity-card
 data-r7-severity="green"
 data-r7-severity="yellow"
 data-r7-severity="orange"
 data-r7-severity="red"
 data-r7-severity="gray"
data-r7-freshness-pill
data-r7-metric-card
data-r7-domain-health-strip
data-r7-domain-health-item
data-r7-alert-banner
data-r7-mini-trend-chart
```

## 4. Operations-home acceptance

The default operations-home page must feel like a control-room dashboard, not a document.

Required visual sections:

```text
visual hero summary
status badge row
metric card grid
domain health strip
alert banner stack
mini trend chart placeholders
```

Required Korean visible labels:

```text
정상
주의
경고
차단
데이터 부족
최신
지연
stale
오류
현재값
목표값
편차
상태
Fail Safe
센서 오류
```

## 5. Operator acceptance

```text
Operator can identify normal/warning/danger/block status without reading long paragraphs.
Long explanations move below the visual summary or into detail/help areas.
Operations home prioritizes state, metrics, freshness, alerts, and trend placeholders.
```

## 6. Runtime boundaries

```text
No API route change in R7-015
No DB migration in R7-015
No HA service call in R7-015
No MQTT/device command in R7-015
No save/apply/execute controls in R7-015
No approval/override release in R7-015
No SafetyGuard/Interlock runtime behavior change in R7-015
```

## 7. Acceptance

```text
R7-015 targeted contract passes
Existing R7-014 routing contract still passes
Full pytest passes
node --check passes for both panel files
Prod HA check_config/restart/static smoke passes before release
```
