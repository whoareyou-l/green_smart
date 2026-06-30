# R7-056 Records Workflow common components

Status: current baseline for `crop-operations.records-workflow` as of `v1.14.8`.

## Scope

This slice refactors the visible records-workflow dashboard without changing backend behavior.

Included cards:

```text
오늘 할 일
누락/검증 필요
AI 근거 연결
생육조사
병해충 예찰
방제 기록
최근 기록
```

## Component rule

The top and core cards must use shared `head/body/action-row/button 공통 컴포넌트` instead of per-card bespoke header/body/button snippets.

Required component grammar:

```text
renderR7RecordCardShell()
renderR7RecordCardHeader()
renderR7RecordCardBody()
renderR7RecordCardActionRow()
renderR7RecordCardButton()
renderR7RecentRecordPanel()
renderR7RecentRecordRow()
```

## Visual alignment rules

- 버튼은 동일 높이와 전체 폭 정렬을 사용한다.
- 버튼 높이는 `34px`로 통일한다.
- 카드 버튼은 `width:100%`로 카드 하단 영역 안에서 균형 있게 배치한다.
- 아이콘과 텍스트는 수평 중앙 정렬한다.
- 아이콘과 텍스트 간격은 `gap:6px`로 통일한다.
- 버튼 내부 텍스트는 `white-space:nowrap`로 줄바꿈 깨짐을 방지한다.
- header는 아이콘 영역, 제목, 상태 배지를 같은 rhythm으로 배치한다.
- body는 primary/note/html 슬롯을 사용해 카드마다 다른 정보를 같은 간격으로 배치한다.
- 최근 기록도 동일한 header/body/row grammar를 사용한다.

## Recent records row grammar

최근 기록은 전체 폭 row로 남긴다. 내부 row는 다음 슬롯을 가진다.

```text
kind | time | memo | state | chevron
```

Required markers:

```text
data-r7-record-recent-header
data-r7-record-recent-body
data-r7-record-recent-row
data-r7-record-recent-kind
data-r7-record-recent-time
data-r7-record-recent-memo
data-r7-record-recent-state
```

## Boundary

No DB migration, route/API implementation, submit binding, HA service call, MQTT/device command, or automatic apply/execute authority is added.
