# R7-063 Records modal common responsive shell

Status: current baseline for `v1.14.43`.

## Scope

This slice applies to the records-workflow write modal used by:

- 생육조사
- 병해충 예찰
- 방제 기록

## Changes

- 필수 입력 카드 삭제: the old yellow card text `필수 입력 · 날짜와 기록 유형별 핵심 항목을 확인하세요.` is no longer rendered.
- Added a shared `renderR7RecordCommonModalShell()` common modal component — 공통 모달 컴포넌트.
- Added a sticky header (`sticky header`) so the modal title/close button stays visible while the form scrolls.
- Added `renderR7RecordFormLayout()` so all 조사 폼 use the same large frame: main form + 저장 전 참고 + actions.
- Added `renderR7RecordPreSaveChecklist()` as the common 저장 전 참고 checklist card area.
- Added cards to remind the operator to check 빈 칸 before saving:
  - 기본 정보
  - 생육 측정값 / 조사 핵심값 / 방제 핵심값
  - 품질/생리장해 측정값 / 후속 판단 / 안전 확인
- 모바일 layout now collapses to one column. On mobile, 저장 전 참고 is placed after the 메모/form area and before the buttons.

## Mobile rule

The modal is PC-first but must remain usable on mobile:

```text
form fields
→ memo
→ 저장 전 참고
→ buttons
```

The reference panel is sticky on desktop and static on mobile.

## Notes

The user will send a sample image for the visual style of the 저장 전 참고 checklist card. This slice creates the functional/common/responsive structure first; the card visual treatment can be refined from that sample without changing the save path.
