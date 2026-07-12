# R7-097 Settings modal visual grammar rework

## 목적

온실·구역 설정의 버튼 모달을 단순히 공통 shell 이름에 맞추는 수준이 아니라, 실제 사용자가 느끼는 기준 UI 문법에 맞춘다.

## 기준

- **목록 버튼**: 승인 모달 / 감사 로그 모달 느낌
  - 검색·필터 바
  - 좌측 검토 목록
  - 우측 선택 항목 검토 패널
  - `요청 정보 → 변경 내용 → 감사 근거` 섹션
  - 하단 닫기/상세 로그 류 action footer
- **생성 버튼**: 생육조사 작성 모달 느낌
  - record common modal shell 유지
  - 좌측 sectioned form
  - 우측 저장 전 검증 checklist
  - 하단 취소/저장 action row

## 적용

### 생성 버튼

대상:

- `+ 새 온실 추가`
- `+ 새 구역 추가`
- `장치 연결 작성`

적용 marker:

```html
data-r7-settings-create-growth-like-modal="true"
data-r7-settings-create-left-form
data-r7-settings-create-section="basic-info"
data-r7-settings-create-pre-save-checklist
data-r7-record-pre-save-checklist
```

### 목록 버튼

대상:

- `온실 정보`
- `구역 목록`
- `장치 목록`

적용 marker:

```html
data-r7-settings-shortcut-review-like-modal="approval-audit"
data-r7-settings-shortcut-search-input
data-r7-settings-shortcut-review-list-panel
data-r7-settings-shortcut-review-row
data-r7-settings-shortcut-review-pane
data-r7-settings-shortcut-review-section="request-info"
data-r7-settings-shortcut-review-section="change-detail"
data-r7-settings-shortcut-review-section="evidence"
```

## 검증

`tests/test_r7_097_settings_modal_visual_grammar_rework_contract.py`에서 다음을 잠근다.

- 생성 모달이 생육조사 작성 모달의 sectioned form + 저장 전 검증 문법을 갖는지
- 목록 모달이 승인 모달 / 감사 로그 모달의 review list + detail evidence 문법을 갖는지
- 버전 표면이 `1.15.39`인지
