# R7-090 Settings greenhouse common components

Status: current baseline for `v1.14.28`.

## Scope

`설정 > 온실·구역` 화면을 공통 컴포넌트 기반으로 재구성한다.

## Component mapping

- `온실 기본 정보`, `구역 구성`: 새 설정 전용 공통 컴포넌트 `renderR7SettingsInfoCard` 사용.
- `구역 생성`: 기존 Record Card Shell (`renderR7RecordCardShell`) 사용.
- `구역 목록`: 기존 공통 목록 컴포넌트 `renderR7CommonRecentPanel` + `renderR7CommonRecentRow` 사용.

## Current layout

```text
[SettingsInfoCard: 온실 기본 정보] [SettingsInfoCard: 구역 구성] [Record Card Shell: 구역 생성]

[Common Recent Panel: 구역 목록]
```

## Boundary

구역 생성 버튼은 생성 affordance와 marker만 제공한다. 실제 저장/mutation은 별도 승인/저장 단계에서 처리한다.
