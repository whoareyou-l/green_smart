# Control Phase C17 — 운영 모드/권한/확인 UX 강화

> 기준 버전: v1.9.19
> 상태: 완료
> 대상: `zone_control_views.py`, `green-smart-panel.js`, `zone_control_logs`

## 목표

manual/assist/auto 실행 권한, 운영자 확인, 재개/override UX를 현장 테스트 전에 명확히 한다.

## Backend contract

```text
OPERATOR_CONFIRMATION_PHRASE
OPERATOR_EXECUTION_ROLES
_operator_execution_confirmation
operatorConfirmationRequired
operatorConfirmed
operatorConfirmationPhrase
operatorConfirmationText
operatorRole
operatorOverrideReason
operator_confirmation_required
operator_execution_confirmed
```

## Panel contract

```text
_operatorConfirmationPhrase(domain)
_operatorExecutionConfirmationPayload(domain)
data-zone-operator-confirm-card
data-zone-operator-confirm-enabled
data-zone-operator-confirm-text
data-zone-operator-confirm-role
data-zone-operator-confirm-reason
data-zone-final-execute-confirmed
운영자 실행 확인
실제 장비 실행 확인
확인 문구
실행 권한
override 사유
manual/assist/auto
```

## 완료 기준

- 실제 실행 요청에는 운영자 확인 payload가 포함된다.
- 확인 누락/문구 불일치/권한 role 오류/override 사유 누락은 `operator_confirmation_required`로 차단된다.
- 확인 성공은 `operator_execution_confirmed` 로그로 남는다.
- 기존 Dry Run은 확인 없이 가능하다.
