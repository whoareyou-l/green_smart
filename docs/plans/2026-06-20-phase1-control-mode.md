# Phase 1D — Manual / Auto / Override Control Mode

> 기준 버전: v1.9.6
> 대상: Home Assistant side panel zone control pages + `zone_control_modes` API foundation

## 목적

Phase 2 SafetyGuard 실행 완성 전에 운영자가 작기/구역/domain별로 현재 제어 상태를 명확히 볼 수 있어야 한다.

이번 Phase 1D는 실제 세부 안전 규칙을 완성하지 않고, 아래 기반만 추가한다.

```text
manual / auto / assist / disabled
allow_auto_execution
manual override reason
manual override expiration
execution API pre-gate
panel control-mode card
```

## DB

신규 테이블:

```sql
zone_control_modes
```

핵심 scope:

```text
farm_id + crop_season_id + zone_id + domain
```

주요 컬럼:

```text
mode VARCHAR(32) DEFAULT 'manual'
allow_auto_execution TINYINT(1) DEFAULT 0
override_reason TEXT NULL
override_expires_at DATETIME NULL
```

## API

신규 route:

```text
GET  /api/green_smart/zones/control-mode
POST /api/green_smart/zones/control-mode
```

기본 응답은 row가 없어도 안전하게 `manual`이다.

```json
{
  "mode": "manual",
  "allowAutoExecution": false,
  "found": false
}
```

## 실행 gate

`POST /api/green_smart/zones/execute-final-targets`는 final target 실행 전에 `_control_mode_decision`을 조회한다.

정책:

```text
manual   → 실제 실행 차단, dry-run 허용
auto     → allow_auto_execution=true일 때 실행 허용
assist   → allow_auto_execution=true일 때 실행 허용
disabled → 실제 실행 차단
```

차단 시 action log:

```text
blocked_by_control_mode
```

차단 message:

```text
manual override required before execution
```

## Panel UI

환경/관수/장치제어 페이지에 `제어 모드` 카드 추가.

카드 marker:

```text
data-zone-control-mode-card
data-zone-control-mode-refresh
data-zone-control-mode-save
```

표시/입력:

```text
수동
자동
반자동
비활성
자동 실행 허용
Override 사유
Override 만료
```

## 5초 요소별 갱신

Phase 1C patch refresh에 control mode card를 포함한다.

```text
_refreshZoneControlElements({ patchOnly: true })
→ _fetchZoneControlMode(domain, { patchOnly })
→ _patchZoneControlElementCards(domain)
→ _renderZoneControlModeCard(domain)
```

입력 중 dirty state 보호 대상에도 `data-zone-control-mode-card`를 포함한다.

## 검증

```text
pytest -q
→ 102 passed

node --check custom_components/green_smart/panel/green-smart-panel.js
→ pass

python3 -m py_compile custom_components/green_smart/zone_control_views.py custom_components/green_smart/db.py custom_components/green_smart/__init__.py
→ pass
```

## 다음 단계

Phase 1E에서는 세부 interlock rule UI를 확장하거나, Phase 2에서 SafetyGuard 독립 계층을 시작한다.
