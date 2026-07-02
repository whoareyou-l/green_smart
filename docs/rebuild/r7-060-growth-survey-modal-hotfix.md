# R7-060 Growth survey modal hotfix

Status: current baseline for `crop-operations.records-workflow` as of `v1.14.40`.

## User corrections

1. 모달 폭 확장: 기존 `720px` 폭에서 생육 측정값 입력폼이 찌그러져 `1120px`급 폭으로 확장한다.
2. 조사구역 드롭다운: DB/API home context에 들어온 구역 목록을 옵션으로 사용하고, 디폴트는 현재 선택 구역이다.
3. 생육단계 드롭다운: 정확한 단계 체계는 추후 확정하되 우선 드롭다운으로 제공한다.
4. 근장 제거.
5. SPAD는 생육 측정값으로 이동하고, 생체중/엽면적은 품질/생리장해 측정값으로 이동한다.
6. 잎색/상품성은 추후 세부 색상 단계를 확정하기 전까지 드롭다운으로 제공한다.
7. 품질/생리장해 측정값에는 이미지 추가 버튼을 둔다. 이미지는 품질/생리장해 분석 입력의 근거이며, 현재 slice에서는 파일명 선택 UI와 분석 결과 메모를 저장 payload에 반영한다.
8. save-failed 방어: 작기 ID가 숫자 외 `crop_seasons:<id>` 또는 `cycle-<id>` 형태여도 백엔드가 정규화한다.

## Persistence

- 기존 column 호환: `plant_height`, `leaf_count`.
- 추가 조사항목, 이미지 첨부 여부, 이미지 분석 결과는 `metrics_json`에 `{key,value}` 배열로 저장한다.

## Boundary

장치/MQTT/자동실행/이미지 AI 자동분석 서버 호출은 이번 hotfix 범위가 아니다. 이미지 분석 결과는 사용자가 확인하거나 별도 후속 slice에서 분석 모듈이 채운 텍스트를 저장하는 형태로 둔다.
