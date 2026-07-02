# R7-073 Common recent default limit policy

Status: current baseline for `v1.14.41`.

## Why

공통 컴포넌트 기본 limit 정책은 호출부마다 같은 규칙을 반복하지 않게 하기 위한 기준이다. 공통 컴포넌트를 쓰는 이유는 호출부마다 같은 규칙을 반복하지 않기 위해서다. 따라서 `최근 기록`, `사용자 목록` 같은 row/list/table형 컴포넌트의 기본 표시 개수는 호출부가 아니라 공통 컴포넌트 기본 정책에 있어야 한다.

## Rule

`renderR7CommonRecentPanel()` now resolves an `effectiveLimit` like this:

1. If the caller passes an explicit `limit`, use it as an override.
2. Otherwise call `r7CommonRecentDefaultLimit(kind, rowKind)`.
3. Apply `rows.slice(0, effectiveLimit)` when the effective limit is finite.

## Defaults

- `최근 기록` / `records-recent` / `records-recent-log`: default latest `5`
- `사용자 목록` / `settings-user` / `user-list`: default latest `5`

## Override

호출부에서 limit을 넘기지 않아도 공통 기본 정책이 적용된다. 예외적으로 카드별 제한이 달라야 할 때만 `limit: N`을 넘겨 override한다.

예:

```js
renderR7CommonRecentPanel({
  kind: "records-recent-log",
  rowKind: "records-recent",
  rows,
});
```

위 호출은 `limit`을 넘기지 않아도 기본 `5`가 적용된다.

```js
renderR7CommonRecentPanel({
  kind: "settings-audit-log",
  rowKind: "settings-audit",
  rows,
  limit: 2,
});
```

위처럼 특정 카드만 다르게 보여야 할 때 explicit override를 사용한다.

## Applied surfaces

- 작물 운영 `기록·작업 > 최근 기록`
- 설정 `사용자·권한 > 사용자 목록`
- 향후 동일 공통 컴포넌트를 쓰는 recent/list/table형 panel
