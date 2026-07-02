# R7-065 Growth survey plant object selector

Status: current baseline for `v1.14.23`.

## Scope

생육조사 작성 모달의 `기본 정보` 영역에 객체 번호 드롭다운을 추가한다.

## Product rule

- 작기는 구역과 연관되어 있다.
- 작기마다 4개의 작물 객체를 조사 대상으로 선정한다.
- 입력 폼의 객체 번호는 선택된 구역의 현재 작기 번호를 기준으로 생성한다.
- 객체 번호 형식은 `작기 번호-객체 번호`이다.
  - 예: 작기 번호가 4이고 3번 객체이면 `4-3`.

## UI

`기본 정보` 항목:

- 조사일
- 조사구역
- 객체 번호
- 생육단계
- 조사자

객체 번호 드롭다운 option:

```text
<crop_cycle_id>-1
<crop_cycle_id>-2
<crop_cycle_id>-3
<crop_cycle_id>-4
```

## Persistence

현재는 별도 DB 컬럼을 추가하지 않고 생육조사 확장 지표 저장 경로를 사용한다.

- `plantObjectNumber`를 payload에 포함한다.
- `metricsJson`에도 다음 키를 저장한다.
  - `plantObjectNumber`
  - `cropCycleObjectLabel`

별도 물리 컬럼/작물 객체 테이블은 후속 DB 설계 slice에서 다룬다.
