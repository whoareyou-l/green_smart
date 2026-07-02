# R7-081 Approval list compact rows

Status: current baseline for `v1.14.27`.

## Problem

When the approval queue had only 1 request, the left `승인 대기 목록` body used a grid area that filled the remaining panel height. With default grid alignment, the single item visually stretched into a large card-like area.

## Fix

stretch 방지 기준을 명시한다.

The left list remains a list/table even when there is only 1 item:

- The scroll body has `data-r7-settings-approval-list-body`.
- The body uses `align-content:start` so rows stay at the top.
- The body uses `grid-auto-rows:max-content` so each row keeps its content height.
- Each row has `data-r7-settings-approval-list-row-compact="true"`.
- Each row has compact sizing: `min-height:42px`, `max-height:54px`.

## Expected behavior

- 1건이어도 맨 위에 리스트 row 1줄로 보인다.
- 남는 공간은 빈 배경으로 남고, row가 카드처럼 커지지 않는다.
- 여러 건이면 동일한 compact row가 세로 리스트로 쌓인다.
- 선택 row는 배경/테두리 강조만 있고 높이는 늘어나지 않는다.

This is a pure UI layout fix; approval data/state behavior remains unchanged.
