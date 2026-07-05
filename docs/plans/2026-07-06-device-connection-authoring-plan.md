# 장치 연결 작성 / 장치·그룹 고도화 계획

## 목표

설정 도메인의 기존 `장치·그룹` 하위탭을 단순 조회 화면이 아니라 다음 흐름이 명확한 운영 UI로 재구성한다.

1. `장치·그룹` 표시 라벨을 `장치 연결 작성`으로 변경한다.
2. 장치 연결 작성 폼에서 Home Assistant에 존재하지만 Green Smart 장치로 아직 연결되지 않은 장비/entity를 선택한다.
3. 장비 종류는 `역활/역할`이 아니라 농장 장비 도메인 용어의 드롭다운으로 선택한다.
4. 사용자가 장치명을 직접 입력한다.
5. 장치 목록은 등록/연결된 장치를 보여주고 수정/삭제 액션을 제공한다.
6. 그룹 생성은 이미 장치 연결이 완료되었고 아직 그룹에 등록되지 않은 장치만 체크박스로 다중 선택한다.
7. 그룹 목록 버튼은 실제 그룹 목록 CDA 팝업을 연다.

## UI 구조

### 하위탭 라벨

- 기존: `장치·그룹`
- 변경: `장치 연결 작성`

내부 route key/API path는 호환을 위해 `device-sensor-mapping`을 유지한다.

### 장치 연결 작성 버튼/모달

기존 `장치 연결` 버튼은 장치 연결 작성 모달을 연다.

폼 필드:

| 필드 | UI | 값 source |
|---|---|---|
| 장비 엔티티 ID | select/dropdown | HA에는 있으나 Green Smart 장치 연결에 아직 쓰이지 않은 entity 후보 |
| 장비종류 | select/dropdown | 온습도 센서, CO2 센서, 일사 센서, VWC 센서, 천창 장치, 측창 장치, 스크린 장치, 유동팬 장치, 배기팬 장치, 관수 장치 |
| 장치명 | input | 사용자 직접 입력 |
| 구역 | select/dropdown | 설정 snapshot zones |
| 메모 | textarea | 선택 |

부족한 부분 보강:

- 지금 당장 HA entity registry 전체 조회 backend가 없으면 프론트는 `settingsSnapshot.deviceSensorMappings`, zone equipment labels, HA entity fallback list를 합성해 후보를 만들고 `data-r7-settings-unlinked-ha-entity-option` marker로 계약화한다.
- 이미 매핑된 `deviceEntity`/`entityId`는 후보에서 제외한다.
- 나중에 backend가 HA entity registry 후보를 내려주면 동일 dropdown이 그 값을 우선 사용한다.

### 장치 목록 모달

`장치 목록` 버튼은 CDA 목록/상세 모달을 연다.

- 목록: 장치명, 장비종류, entity id, 구역, 상태
- 상세 footer: `삭제` negative, `수정` positive
- 사용자 요구에 따라 모달 하단 `닫기` 버튼은 두지 않는다. 단, 공통 header X/overlay close는 유지한다.

### 그룹 생성 모달

그룹 생성 폼은 다음 장치만 체크박스에 표시한다.

- 장치 연결/매핑이 이미 된 장치
- 아직 그룹에 등록되지 않은 장치

다중 선택:

- `data-r7-settings-device-group-candidate-checkbox`
- `name="deviceIds"`

### 그룹 목록 모달

`그룹 목록` 버튼은 CDA split modal을 연다.

- 목록: 그룹명, 그룹 유형, 구역, 장치 수
- 상세: 포함 장치, 센서/장치/관수 유형, 상태
- footer: 필요 시 `삭제`/`수정`

## 계약 테스트

추가/갱신할 계약:

1. `장치 연결 작성` 라벨/탭 표시 계약
2. 장치 연결 작성 모달의 dropdown/input 계약
3. 장비종류 옵션 전체 계약
4. 미연결 HA entity 후보에서 이미 연결된 entity 제외 계약
5. 장치 목록 CDA 모달의 수정/삭제 footer 및 닫기 버튼 제거 계약
6. 그룹 생성 체크박스 후보 계약
7. 그룹 목록 버튼과 CDA 모달 계약

## 릴리스 기준

- 집중 계약 통과
- JS syntax check
- Python compile
- 전체 pytest
- Prod copy + HA config check + restart
- served smoke marker
- API auth boundary smoke
- 안정 로그 20초
- commit/tag/push/GitHub Release
