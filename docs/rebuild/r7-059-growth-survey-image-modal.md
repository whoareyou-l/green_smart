# R7-059 Growth survey image-style modal

Status: current baseline for `crop-operations.records-workflow` as of `v1.14.14`.

## Scope

이미지 참고형 생육조사 작성 모달을 구현한다.

User direction:

- 저장 후 검증 과잉 UX 제외
- 이미지처럼 좌측 작성 폼 + 우측 참고 패널 구조
- 조사항목 동일 반영

## Layout

```text
생육조사 작성
├─ left form
│  ├─ 기본 정보
│  ├─ 생육 측정값
│  ├─ 품질/생리장해 측정값
│  └─ 메모
└─ right panel
   ├─ 저장 전 참고
   ├─ 생육값 상태
   ├─ SPAD 입력 대기
   ├─ V-Score 계산 대기
   └─ 작물 근거
```

## Survey fields

Basic:

- 조사일
- 조사구역
- 생육단계
- 조사자

Growth measurements:

- 초장
- 엽장
- 엽폭
- 엽수
- 엽면적
- 생체중
- 근장

Quality / physiological disorder:

- SPAD
- 잎끝마름
- 추대 징후
- 잎색/상품성
- 수확 가능 여부

## Persistence policy

Legacy columns remain limited to the existing growth survey columns:

- `plant_height` from `plantHeight`
- `leaf_count` from `leafCount`

Additional image-modal survey items persist through `metrics_json`.

## Boundary

장치/MQTT/자동실행 제외.

This slice does not add device commands, MQTT publishing, automatic execution, safety override, or final control authority.
