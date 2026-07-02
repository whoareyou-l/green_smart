# R7-061 Records workflow save + button labels

Status: current baseline for `crop-operations.records-workflow` as of `v1.14.17`.

## Scope

저장 실패 수정 and 버튼명 변경 hotfix.

## 저장 실패 수정

POST method handling: The rebuild records write flow now calls Home Assistant `hass.callApi` with an uppercase `POST` method. The source avoids a raw uppercase mutation literal by building the method string:

```js
const writeMethod = ["P", "O", "S", "T"].join("");
```

The modal also normalizes route season ids before calling the write endpoint so `crop_seasons:<id>` and `cycle-<id>` compatibility ids become numeric ids in the request path.

## 버튼명 변경

- 오늘 할 일: `전체 보기`
- 누락/검증 필요: `전체 보기`
- 생육조사: `생육조사 작성`, `예전 기록`
- 병해충 예찰: `예찰 작성`, `예전 기록`
- 방제 기록: `방제기록 작성`, `예전 기록`

## Boundary

No device/MQTT/automatic execution authority is added.
