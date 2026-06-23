# Green Smart Crop Safety/Interlock Real-Use Deepening Design

> **Status:** 질문 기반 설계 진행 중
> **Baseline reference:** `v1.9.56` adds stage diagnosis API on top of C-S1/C-S2 skeleton; it is still calibration-driven baseline, not final agronomic readiness.
> **Goal:** C-S1/C-S2를 실제 농장 운영에 사용할 수 있는 수준으로 구체화한다.
> **Do not implement code from this document until each directly relevant question is answered.**

---

## 1. 왜 다시 설계하는가

현재 C-S1/C-S2는 다음 marker와 helper를 만들었다.

```text
CROP_SAFETY_RULE_VERSION
CROP_INTERLOCK_VERSION
_crop_safety_rule_snapshot(...)
_crop_interlock_decision(...)
cropSafety
cropInterlock
```

하지만 이 상태는 실제 운영 판단 기준으로 부족하다.

- PLS/혼용/약제 안전 기준이 실제 방제 의사결정 수준이 아니다.
- G-Index와 생육 지표 threshold가 작물·품종·생육단계·조사주기 기준으로 보정되지 않았다.
- 병해충 위험, 방제 이력, 날씨/환경 위험, 작물 상태가 어떻게 결합되는지 정책이 부족하다.
- 인터록의 차단/확인/승인/fallback이 운영자 역할, 위험도, 실제 작업 흐름과 연결되지 않았다.
- UI에서 농장주/직원이 이해할 수 있는 설명·해결 조치·승인 흐름이 아직 없다.

따라서 다음 구현 전, 질문 기반으로 요구사항을 확정한다.

---

## 2. 질문 운영 원칙

1. 질문은 한 번에 하나씩 진행한다.
2. 답변이 구현 정책에 영향을 주는 경우, 이 문서에 `Confirmed decision`으로 기록한다.
3. 애매한 답변은 임의 구현하지 않고 다시 질문한다.
4. 질문 묶음이 충분히 정리되기 전에는 코드 구현/릴리즈를 하지 않는다.
5. 기존 `v1.9.56`는 유지하되, 실사용 readiness로 표현하지 않는다.
6. `v1.9.56` Stage Diagnosis API는 사용자가 구현을 승인한 DB/API baseline이며, 실제 제어 자동화 결합 전에는 추가 검증 질문을 계속 진행한다.

---

## 3. 우선 질문 영역

### A. 대상 작물/재배 방식

확정해야 할 것:

- 1차 실사용 대상 작물
- 재배 방식: 수경/토경/혼합
- 작물별 생육단계 구분
- 품종 차이 반영 여부
- 작기 단위와 구역 단위의 기준

왜 필요한가:

- G-Index, 초장, 엽수, 줄기경, 화방, 마디, 착과 절위 등의 정상 범위가 작물과 생육단계별로 달라진다.
- 관수/환경 fallback도 작물별로 달라진다.

### B. 생육조사 항목과 이상치 정책

확정해야 할 것:

- 작물별 필수/선택 조사 항목
- 조사 주기
- 단일값 범위 이상치
- 직전 조사 대비 변화량 이상치
- 여러 지표 간 모순 검출
- 결측/오입력 처리
- 수동 override 허용 여부

예시 질문:

- 토마토에서 초장보다 중요한 실사용 안전 지표는 무엇인가?
- 엽수/줄기경/화방/착과절위/마디수는 어떤 조합으로 봐야 하는가?
- G-Index가 낮을 때와 높을 때 각각 어떤 환경/관수 action을 금지해야 하는가?

### C. PLS/혼용/방제 안전 정책

확정해야 할 것:

- PLS 미확인, PLS 부적합, PLS 경고의 차이
- 혼용 가능/불가/정보 없음의 처리
- 같은 작용기작 반복 사용 제한
- 수확 전 안전사용기준/PHI 반영 여부
- 희석배수/사용량/처리범위 검증
- 특정 약제 계열의 금지/주의 정책
- 외부 PSIS 조회 실패 시 fallback 정책

예시 질문:

- 혼용 정보 없음은 차단인가, 관리자 승인인가, 운영자 경고인가?
- PLS 미확인은 PLS 부적합과 같은 hard block인가?
- 같은 작용기작 연속 사용은 며칠/몇 회 기준으로 제한할 것인가?

### D. 병해충/날씨/환경 위험 결합

확정해야 할 것:

- 병해충 예찰 severity 기준
- 습도/강우/온도/VPD와 병해 위험 결합 방식
- 최근 방제 이력이 위험도를 낮추는 조건
- 방제했지만 PLS/혼용 문제가 있을 때 위험도 처리
- 병해 위험 high에서 금지해야 할 환경/관수 action

### E. Interlock/Fallback 운영 정책

확정해야 할 것:

- 차단/block, 확인/confirm, 경고/warn, 허용/allow 기준
- operator / farm_owner / admin 승인 경계
- 자동 실행 금지 범위
- preview는 허용할지
- conservative baseline의 실제 값/범위
- 해결 조치 안내 문구
- 승인 기록/감사 로그 필드

### F. UI/운영자 경험

확정해야 할 것:

- 농장주/직원에게 보여줄 위험 설명 수준
- “왜 차단됐는지” 카드 구성
- “무엇을 하면 해제되는지” 조치 안내
- 승인 버튼/권한/메모
- 잘못된 입력 정정 UX

---

## 4. 현재 baseline의 재분류

| Version | 기존 표현 | 재분류 |
|---|---|---|
| `v1.9.37` | C-S1 baseline complete | 작물 안전 룰 skeleton |
| `v1.9.38` | C-S1B baseline complete | PLS/혼용/생육 이상치 저장 및 rule skeleton |
| `v1.9.56` | C-S2 baseline complete | cropInterlock decision skeleton |

이 문서 완료 전에는 위 버전들을 실사용 안전 정책으로 간주하지 않는다.

---

## 5. 질문 기록

### Q1. 1차 실사용 대상 작물과 재배 방식

**Status:** Confirmed

**Question:** C-S1/C-S2를 실제로 먼저 맞출 작물과 재배 방식은 무엇인가?

**Options:**

1. 토마토 수경재배 우선
2. 상추 수경재배 우선
3. 토마토 + 상추 수경재배 동시
4. 다른 작물/재배 방식 직접 지정

**Confirmed decision:** 토마토 + 상추 수경재배 동시

**Implication:** C-S1/C-S2 심화 기준은 토마토 수경재배와 상추 수경재배를 동시에 다룬다. 단, 생육단계·생육조사 항목·PLS/혼용 판단·fallback 값은 작물별로 분리한다.

---

### Q2. 생육단계 세분화 수준

**Status:** Confirmed

**Question:** 토마토+상추 수경재배의 안전/인터록 기준을 생육단계별로 나눌 때, 단계 구분은 어느 수준으로 잡을까?

**Options:**

1. 토마토와 상추 모두 단순 단계로 시작: 활착기/영양생장/생식생장/수확기
2. 토마토는 세분화, 상추는 단순 단계로 시작
3. 둘 다 작물별로 세분화해서 설계
4. 우선 생육단계 대신 생육조사 항목부터 정한다

**Confirmed decision:** 둘 다 작물별로 세분화해서 설계

**Implication:** 토마토와 상추는 같은 stage enum을 공유하지 않는다. 각 작물별 생육단계, 필수 조사 항목, 정상 범위, 이상치, fallback action을 별도 matrix로 설계한다.

---

### Q3. 생육단계 기준 소스

**Status:** Confirmed

**Question:** 토마토/상추의 세부 생육단계 이름과 기준은 어떤 방식으로 확정할까?

**Options:**

1. 사용자가 단계명을 직접 제공
2. 국내 스마트팜/농진청 등 표준 자료를 조사해서 초안을 만들고 사용자 검토
3. 현재 UI/DB 필드 기반 최소 단계 초안을 만들고 사용자 수정
4. 토마토 단계부터 먼저 질문하고 상추는 나중에

**Confirmed decision:** 국내 스마트팜/농진청 등 표준 자료를 조사해서 초안 만들고 사용자 검토

**Implication:** 다음 작업은 코드 구현이 아니라 국내 공개 기준 자료 조사 → 토마토/상추 stage 초안 작성 → 사용자 검토 순서다.

#### Q3 research notes — initial source review

Sources reviewed:

1. 농사로/RDA 토마토 작목 정보  
   - URL: `https://www.nongsaro.go.kr/portal/ps/psz/psza/contentSub.ps?cntntsNo=101611&menuId=PS03172&sSeCode=335001&totalSearchYn=Y`
   - Key points: 토마토 발아/생육/정식 온도, 정식 기준, 제1화방 10% 개화, 본잎 7~9매, 수확 기준, 병해충/생리장해.
2. 농사로/RDA 토마토·방울토마토 재배력  
   - URL: `https://www.nongsaro.go.kr/portal/ps/psb/psbl/workScheduleDtl.ps?cntntsNo=30646&menuId=PS00087`
   - Key points: 육묘 기간, 정식 기준, 활착 후~제2화방 착과기, 제3화방 개화기 웃거름, 착과비대 이후, 수확기 수분관리, 병해충/환경 문제.
3. 토마토 생육 진단 시스템 연구  
   - URL: `https://www.kais99.org/jkais/journal/Vol16No12/p65/9s.html`
   - Key points: 토마토는 영양생장과 생식생장이 공존. MI: 개화 속도, 생장점~첫 화방 거리, 경경. PI: 영양/생식 생장 치우침 판정.
4. 농사로/RDA 상추 재배 정보  
   - URL: `https://www.nongsaro.go.kr/portal/ps/psb/psbl/workScheduleDtl.ps?cntntsNo=30624&menuId=PS00087`
   - Key points: 상추 정식 기준 본엽 3~5매, 생육적온 15~20℃, 고온 시 꽃대신장/쓴맛/생리장해 증가, 적산온도 1,400~1,700℃에서 꽃대신장.
5. 상추 식물공장/수경·폐쇄형 재배 연구  
   - URL: `https://koreascience.kr/article/JAKO201205759633828.pdf`
   - Key points: 상추 생육조사 항목으로 초장, 엽장, 엽폭, 엽수, 엽면적, SPAD/엽록소, 근장, 생체중/건물중, Fv/Fm 등이 사용됨.

#### Q3 draft stage proposal — revised after user correction, not confirmed

User corrections that supersede the first draft:

1. Default crop stages start from **정식**. 파종/육묘/발아는 추후 업데이트로 추가할 수 있지만, v1 real-use default scope에서는 제외한다.
2. This is **수경재배**. Therefore 토양재배식 `웃거름` 표현은 쓰지 않는다. Management transitions must be expressed as nutrient-solution/irrigation controls: 급액 EC/pH, 1회 급액량, 급액 횟수/간격, 배액률, 배액 EC/pH, 드라이백, 수온, 근권부 상태.
3. **G-Index exists to numerically express vegetative vs reproductive state**. It is not merely an anomaly score. Stage identifies crop lifecycle position; G-Index expresses growth-balance direction/intensity.

##### Tomato hydroponic stage draft — default starts from transplanting

| Stage ID | Korean label | Draft entry/exit idea | G-Index role | Hydroponic safety/interlock focus |
|---|---|---|---|---|
| `tomato_transplant_establishment` | 정식·활착기 | 정식일~활착 안정. 뿌리 활착, 위조 회복, 초기 생장 재개 확인 | G-Index는 아직 보조값. 극단값만 입력/센서 오류로 판단 | 급격한 EC/pH 변화 금지, 과도한 급액/드라이백 금지, 수온/근권 스트레스 확인 |
| `tomato_vegetative_build_up` | 영양생장 형성기 | 활착 후~제1화방 개화 전후. 초세/엽수/경경/마디 전개 확인 | G-Index가 `+` 방향이면 영양생장 우세, `-` 방향이면 생식생장 쪽으로 치우침 | 영양생장 과다 시 급액/EC/일사/VPD 보정 제한, 약세 시 과도한 생식 유도 금지 |
| `tomato_first_cluster_flowering_fruit_set` | 제1화방 개화·착과기 | 제1화방 10% 개화~착과 안정 | G-Index는 착과 실패 risk와 함께 해석. 생식 치우침이 과하면 초세 약화 위험 | 수정/착과 실패, 약제 처리, PLS/PHI, 수정벌/약제 충돌, 급격한 EC 상승 금지 |
| `tomato_cluster_expansion_balance` | 화방 전개·생육균형 조정기 | 제2화방 착과~제3화방 이후 화방 전개가 안정되는 구간 | 핵심 지표. G-Index로 영양/생식 균형을 수치화하고 환경·관수 보정 방향을 결정 | EC/pH/급액량/드라이백 조정은 G-Index 기반으로 하되 safety/interlock block 우선 |
| `tomato_fruit_expansion_quality` | 과실비대·품질관리기 | 착과 후 과실비대, 품질/생리장해 관리 구간 | 생식 우세가 과하면 초세 약화·소과 risk, 영양 우세가 과하면 착색/당도/비대 불균형 risk | 배꼽썩음, 열과, 배액 EC/pH, 배액률, 수분 급변, 칼슘 관련 risk, PLS/PHI |
| `tomato_continuous_harvest` | 연속 수확기 | 1화방 수확 시작 이후 연속 수확 구간 | G-Index는 수확 지속성을 위한 세력 유지/생식 부하 관리 수치 | 방제 후 수확 차단, PHI/REI, 품질 저하, 병해 누적, 무리한 수량 유도 차단 |
| `tomato_late_crop_termination` | 후기·작기 종료기 | 수세 저하, 적심/종료 판단, 다음 작기 전환 준비 | G-Index 보정보다 작기 종료/병해 누적/경제성 판단 우선 | 병해 누적, 무리한 생장 회복 제어 금지, 안전한 종료/전환 안내 |

##### Tomato future-update stages — excluded from default

| Future Stage ID | Korean label | Why excluded now |
|---|---|---|
| `tomato_germination` | 발아기 | 현재 실사용 default는 정식 이후 관리. 파종부터 관리하는 모듈은 추후 추가 |
| `tomato_seedling` | 육묘기 | 모종 품질/육묘장 관리까지 포함하면 입력·UI·판정 기준이 크게 늘어나므로 추후 업데이트 |

##### Lettuce hydroponic stage draft — default starts from transplanting

| Stage ID | Korean label | Draft entry/exit idea | G-Index role | Hydroponic safety/interlock focus |
|---|---|---|---|---|
| `lettuce_transplant_establishment` | 정식·활착기 | 정식일~활착 안정. 본엽 3~5매 정식 후 뿌리 활착/위조 회복 확인 | 상추 G-Index는 토마토식 생식/영양 균형보다 엽생장 활력/스트레스 방향 수치로 제한 사용 | EC/pH 급변 금지, 수온/근권 산소/활착 실패, 초기 과습·과농도 차단 |
| `lettuce_leaf_expansion_early` | 초기 엽생장기 | 활착 후 잎수/엽장/엽폭 증가가 시작되는 구간 | G-Index는 생장 활력·엽생장 부진/과속 proxy. 생식생장 해석은 하지 않음 | 엽수/엽장/엽폭 증가율, 광/온도/EC/pH 불균형, 입력 오류 detection |
| `lettuce_leaf_expansion_main` | 본격 엽생장기 | 수확 전 주 생장 구간 | G-Index는 상품엽 형성 속도와 스트레스 방향을 보조 | EC/pH, 급액량/순환, 배액/수온, 고온, 광량, tipburn/생리장해 risk |
| `lettuce_pre_harvest_quality` | 수확 전 품질관리기 | 수확 직전 상품성·안전성 확인 구간 | G-Index보다 품질/안전 overlay 우선. 과속 생장·고온 스트레스 확인 | PLS/PHI/REI, 고온·쓴맛, 잎끝마름, 병해충, 수확 보류/허용 판단 |
| `lettuce_harvest_window` | 수확기 | 수확 가능 상태 | G-Index는 수확 지연/품질 저하 risk 보조 | 방제 후 출하 차단, 수확 가능/보류, 저장/품질 기준, 작업자 확인 |

##### Lettuce future-update stages — excluded from default

| Future Stage ID | Korean label | Why excluded now |
|---|---|---|
| `lettuce_germination` | 발아기 | 현재 실사용 default는 정식 이후 관리. 파종부터 관리하는 모듈은 추후 추가 |
| `lettuce_seedling` | 육묘기 | 육묘 품질/본엽 전개/묘장 환경 관리는 별도 업데이트로 분리 |

##### Overlay model — revised

Stage alone is insufficient. The real-use design uses stage + crop-specific overlays.

| Crop | Lifecycle stage | Balance / numeric status | Risk overlays |
|---|---|---|---|
| Tomato | 정식 이후 화방/수확 lifecycle | `gIndex`: 영양생장 우세 ↔ 생식생장 우세를 수치화 | PLS/PHI/REI, 혼용, 착과 실패, 열과, 배꼽썩음, 병해충, 센서/입력 오류 |
| Lettuce | 정식 이후 엽생장/수확 lifecycle | `lIndex`: 엽생장 활력/스트레스/품질 위험 수치. 토마토식 생식/영양 균형으로 과해석 금지 | PLS/PHI/REI, 추대, 쓴맛, tipburn, 고온, 병해충, 센서/입력 오류 |

Confirmed decision: 상추는 토마토용 `G-Index`를 쓰지 않고 `L-Index`를 사용한다. `G-Index`는 토마토의 영양생장 ↔ 생식생장 균형 수치이고, `L-Index`는 상추의 엽생장 활력/스트레스/추대·품질 위험 방향을 표현하는 별도 지표다.

#### Revised stage boundary rules — confirmed direction

Stage definitions must use explicit boundary points. A stage is not a vague label; it must have:

```text
entryCondition
exitCondition
minimumRequiredObservations
manualOverrideAllowed
fallbackIfDataMissing
```

The default product scope starts at transplanting. Germination/seedling stages remain future update modules.

##### Tomato hydroponic stage boundaries — draft v2

| Stage ID | Korean label | Entry condition | Exit condition | Minimum required observations | Main index |
|---|---|---|---|---|---|
| `tomato_transplant_establishment` | 정식·활착기 | `transplant_date` exists and no later stage is confirmed | Rooting/establishment confirmed OR `days_after_transplant >= establishment_days_threshold` | 정식일, 위조/활착 상태, 급액 EC/pH, 배액 EC/pH or 없음 표시 | G-Index optional/low confidence |
| `tomato_vegetative_build_up` | 영양생장 형성기 | 활착 완료 and 제1화방 개화 전 | 제1화방 개화율 reaches threshold, default 10% | 초장, 경경, 엽수, 마디수, 제1화방 상태 | G-Index active |
| `tomato_first_cluster_flowering_fruit_set` | 제1화방 개화·착과기 | 제1화방 개화율 >= threshold, default 10% | 제1화방 착과 안정 confirmed OR 착과 실패 risk 확정 | 제1화방 개화율, 착과수/착과 여부, 꽃 상태, 경경, G-Index | G-Index active + fruit-set risk |
| `tomato_cluster_expansion_balance` | 화방 전개·생육균형 조정기 | 제1화방 착과 안정 and 제2~3화방 전개 시작 | 과실비대 stage confirmed by fruit expansion/harvest-prep signals | 현재 화방 번호, 개화/착과 진행, 초장, 경경, 엽수, 마디수, G-Index | G-Index primary |
| `tomato_fruit_expansion_quality` | 과실비대·품질관리기 | 착과 과실 비대 진행 confirmed | 1화방 또는 첫 수확 target reaches harvest window | 과실비대 상태, 열과/배꼽썩음 여부, 배액률, 배액 EC/pH, G-Index | G-Index + quality risk |
| `tomato_continuous_harvest` | 연속 수확기 | first harvest started OR harvestable fruit confirmed | crop termination decision confirmed | 수확일/수확량, 방제일, PHI/REI, 품질장해, G-Index | G-Index for crop vigor sustainability |
| `tomato_late_crop_termination` | 후기·작기 종료기 | termination planned OR vigor decline/경제성/병해 누적 threshold reached | crop ended | 수세, 병해 누적, 수확성, 종료 예정일 | G-Index secondary |

##### Tomato stage missing-data fallback

| Missing data | Fallback |
|---|---|
| no `transplant_date` | cannot infer real-use stage; require operator input |
| no flower/cluster data after establishment | stay in `tomato_vegetative_build_up` with `stageConfidence=low` |
| no fruit-set data after first-flower stage | keep `tomato_first_cluster_flowering_fruit_set`, require survey update |
| no harvest record but fruit expansion exists | stay in `tomato_fruit_expansion_quality`, allow preview only |

##### Lettuce hydroponic stage boundaries — draft v2 with L-Index

| Stage ID | Korean label | Entry condition | Exit condition | Minimum required observations | Main index |
|---|---|---|---|---|---|
| `lettuce_transplant_establishment` | 정식·활착기 | `transplant_date` exists and no later stage is confirmed | Rooting/establishment confirmed OR `days_after_transplant >= establishment_days_threshold` | 정식일, 활착/위조 상태, 엽수, 급액 EC/pH, 수온 optional | L-Index optional/low confidence |
| `lettuce_leaf_expansion_early` | 초기 엽생장기 | 활착 완료 and leaf expansion started | leaf count/leaf size reaches main-growth threshold | 엽수, 엽장, 엽폭, 초장, 잎색/스트레스 memo | L-Index active |
| `lettuce_leaf_expansion_main` | 본격 엽생장기 | 엽수/엽장/엽폭 증가 stable and harvest not imminent | harvest-prep threshold reached OR quality risk moves crop to pre-harvest | 엽수, 엽장, 엽폭, 초장, 생체중 proxy optional, EC/pH | L-Index primary |
| `lettuce_pre_harvest_quality` | 수확 전 품질관리기 | harvest size nearly reached OR planned harvest date within threshold | harvest started OR harvest blocked by safety/quality | 상품 크기, 잎색, tipburn, 추대 징후, 방제일, PHI/REI | L-Index + quality risk |
| `lettuce_harvest_window` | 수확기 | harvestable size confirmed and PHI/REI clear | crop ended OR next cut/harvest cycle starts | 수확 가능 여부, 수확일, 품질, 방제 안전 | L-Index for harvest delay/quality decline |

##### Lettuce stage missing-data fallback

| Missing data | Fallback |
|---|---|
| no `transplant_date` | cannot infer real-use stage; require operator input |
| no leaf metrics after establishment | stay in `lettuce_transplant_establishment` or `lettuce_leaf_expansion_early` with `stageConfidence=low` |
| no harvest plan/date | stay in `lettuce_leaf_expansion_main`, show harvest readiness as unknown |
| no PHI/REI data after pesticide use | block `lettuce_harvest_window` promotion until confirmed |

##### Index split — confirmed

| Crop | Index | Meaning | Direction |
|---|---|---|---|
| Tomato | `G-Index` | 영양생장 ↔ 생식생장 균형 수치 | `+` 영양생장 우세, `0` 균형, `-` 생식생장 우세 |
| Lettuce | `L-Index` | 엽생장 활력/스트레스/품질 위험 수치 | direction to be calibrated, but not interpreted as tomato-style reproductive balance |

#### Stage-specific index ranges — initial draft, requires calibration

These ranges are initial operating assumptions for safety/interlock design. They must be calibrated with farm data later. The goal here is to define how the system should interpret index values by stage.

##### Tomato G-Index interpretation

`G-Index` expresses tomato vegetative ↔ reproductive balance.

```text
G-Index > 0  = vegetative bias / 영양생장 우세
G-Index = 0  = balanced / 균형
G-Index < 0  = reproductive bias / 생식생장 우세
```

Generic severity bands:

| Band | G-Index range | Meaning | Default action |
|---|---:|---|---|
| severe reproductive bias | `<= -4.0` | 생식생장 과다, 초세 약화/소과/회복력 저하 위험 | block aggressive reproductive steering; require operator check |
| reproductive caution | `-4.0 ~ -2.0` | 생식생장 경향 강함 | conservative correction only |
| balanced target | `-2.0 ~ +2.0` | 균형권 | normal model preview allowed |
| vegetative caution | `+2.0 ~ +4.0` | 영양생장 경향 강함 | avoid further vegetative steering |
| severe vegetative bias | `>= +4.0` | 영양생장 과다, 과번무/착과 지연/품질 저하 위험 | block aggressive vegetative steering; require operator check |

##### Tomato stage-specific G-Index bands

| Stage ID | Korean label | Target range | Caution range | Problem range | Hard block / invalid range | Interpretation |
|---|---|---:|---:|---:|---:|---|
| `tomato_transplant_establishment` | 정식·활착기 | `-1.5 ~ +1.5` | `-2.5 ~ -1.5` or `+1.5 ~ +2.5` | `-4.0 ~ -2.5` or `+2.5 ~ +4.0` | `<= -4.0` or `>= +4.0` | 활착기에는 G-Index 신뢰도가 낮다. 극단값은 상태 판단보다 입력/센서 오류 또는 활착 실패 risk로 본다. |
| `tomato_vegetative_build_up` | 영양생장 형성기 | `+0.5 ~ +2.5` | `-1.0 ~ +0.5` or `+2.5 ~ +3.5` | `<= -1.0` or `+3.5 ~ +5.0` | `<= -3.0` or `>= +5.0` | 초기에는 약한 영양 우세가 정상. 너무 생식 쪽이면 초세 형성 부족, 너무 영양 쪽이면 과번무/착과 지연 risk. |
| `tomato_first_cluster_flowering_fruit_set` | 제1화방 개화·착과기 | `-0.5 ~ +1.5` | `-2.0 ~ -0.5` or `+1.5 ~ +3.0` | `<= -2.0` or `+3.0 ~ +4.5` | `<= -4.0` or `>= +4.5` | 착과기에는 균형 또는 약한 영양 우세가 적정. 생식 과다는 초세 약화, 영양 과다는 착과 지연/낙화 risk. |
| `tomato_cluster_expansion_balance` | 화방 전개·생육균형 조정기 | `-1.0 ~ +1.0` | `-2.5 ~ -1.0` or `+1.0 ~ +2.5` | `<= -2.5` or `>= +2.5` | `<= -4.0` or `>= +4.0` | 핵심 균형 구간. G-Index가 환경·관수 보정의 중심 입력이지만 safety/interlock이 우선한다. |
| `tomato_fruit_expansion_quality` | 과실비대·품질관리기 | `-1.5 ~ +0.5` | `-3.0 ~ -1.5` or `+0.5 ~ +2.0` | `<= -3.0` or `+2.0 ~ +3.5` | `<= -4.5` or `>= +3.5` | 과실비대기에는 약한 생식 우세가 허용된다. 과도한 생식 우세는 초세 붕괴/소과, 영양 우세는 착색·당도·비대 균형 문제. |
| `tomato_continuous_harvest` | 연속 수확기 | `-1.0 ~ +1.0` | `-2.5 ~ -1.0` or `+1.0 ~ +2.5` | `<= -2.5` or `>= +2.5` | `<= -4.0` or `>= +4.0` | 수확기에는 세력 유지와 생식 부하 균형이 중요하다. 극단값은 수확 지속성/품질/병해 risk로 본다. |
| `tomato_late_crop_termination` | 후기·작기 종료기 | `-2.0 ~ +1.0` | `-3.5 ~ -2.0` or `+1.0 ~ +2.5` | `<= -3.5` or `>= +2.5` | `<= -5.0` or `>= +4.0` | 후기에는 G-Index correction보다 작기 종료/병해/경제성 판단이 우선한다. 극단 보정 금지. |

##### Tomato G-Index interlock action map

| Stage severity | Interlock action |
|---|---|
| target range | allow model preview and candidate target promotion if other safety checks pass |
| caution range | allow preview; require explanation; limit magnitude of EC/pH/irrigation/environment correction |
| problem range | block auto execution; require operator confirmation; fallback to conservative baseline |
| hard block / invalid range | block target promotion and auto execution; require fresh survey or manager/admin review depending on risk |

##### Lettuce L-Index interpretation

`L-Index` expresses lettuce leaf-growth vigor, stress, and quality-risk direction. It is not a tomato-style reproductive/vegetative balance index.

Proposed direction:

```text
L-Index > 0  = fast/lush leaf growth, possible soft growth/tipburn/bolting-quality risk if excessive
L-Index = 0  = stage-appropriate leaf growth
L-Index < 0  = suppressed leaf growth, stress, poor rooting, low vigor, or delayed harvest risk
```

Generic severity bands:

| Band | L-Index range | Meaning | Default action |
|---|---:|---|---|
| severe suppressed growth | `<= -4.0` | 엽생장 심한 부진/스트레스 | block auto correction; require survey/environment check |
| suppressed caution | `-4.0 ~ -2.0` | 엽생장 부진 경향 | conservative correction only |
| target | `-2.0 ~ +2.0` | 단계 적정 생장 | normal preview allowed |
| excessive lush caution | `+2.0 ~ +4.0` | 과속/연약 생장, 고온·추대·tipburn risk 가능 | limit aggressive nutrient/light/temp steering |
| severe excessive growth / quality risk | `>= +4.0` | 품질 위험, 추대/쓴맛/tipburn 가능성 | block aggressive growth steering; require operator check |

##### Lettuce stage-specific L-Index bands

| Stage ID | Korean label | Target range | Caution range | Problem range | Hard block / invalid range | Interpretation |
|---|---|---:|---:|---:|---:|---|
| `lettuce_transplant_establishment` | 정식·활착기 | `-1.0 ~ +1.5` | `-2.5 ~ -1.0` or `+1.5 ~ +2.5` | `<= -2.5` or `+2.5 ~ +4.0` | `<= -4.0` or `>= +4.0` | 활착기에는 L-Index 신뢰도가 낮다. 음수 극단은 활착 실패/근권 스트레스, 양수 극단은 입력 오류 또는 과속 초기 생장 의심. |
| `lettuce_leaf_expansion_early` | 초기 엽생장기 | `+0.5 ~ +2.5` | `-1.0 ~ +0.5` or `+2.5 ~ +3.5` | `<= -1.0` or `+3.5 ~ +4.5` | `<= -3.5` or `>= +4.5` | 초기에는 잎 확장이 살아나는 약한 양수가 정상. 음수는 활착/광/EC 문제, 과한 양수는 연약 생장 risk. |
| `lettuce_leaf_expansion_main` | 본격 엽생장기 | `0.0 ~ +2.0` | `-2.0 ~ 0.0` or `+2.0 ~ +3.5` | `<= -2.0` or `+3.5 ~ +4.5` | `<= -4.0` or `>= +4.5` | 본격 엽생장기는 안정적 양수 또는 균형이 적정. 음수는 생장 부진, 과한 양수는 tipburn/품질 저하 risk. |
| `lettuce_pre_harvest_quality` | 수확 전 품질관리기 | `-0.5 ~ +1.0` | `-2.0 ~ -0.5` or `+1.0 ~ +2.5` | `<= -2.0` or `+2.5 ~ +4.0` | `<= -4.0` or `>= +4.0` | 수확 전에는 과속 생장보다 품질 안정이 우선. 높은 양수는 추대/쓴맛/tipburn risk와 함께 본다. |
| `lettuce_harvest_window` | 수확기 | `-1.0 ~ +1.0` | `-2.5 ~ -1.0` or `+1.0 ~ +2.5` | `<= -2.5` or `+2.5 ~ +3.5` | `<= -4.0` or `>= +3.5` | 수확기는 L-Index보다 PLS/PHI/품질/수확 지연 risk가 우선. 높은 양수는 수확 지연 시 품질 저하 가능성. |

##### Lettuce L-Index interlock action map

| Stage severity | Interlock action |
|---|---|
| target range | allow model preview and harvest/irrigation recommendations if other safety checks pass |
| caution range | allow preview; show quality/stress explanation; limit correction magnitude |
| problem range | block auto execution; require operator confirmation and fresh growth survey |
| hard block / invalid range | block harvest promotion or growth steering depending on PHI/REI/quality risk; require manager review if tied to pesticide/food-safety issue |

Open issue: 각 범위는 초기 설계값이다. 실제 운영 전에는 사용자 농장 데이터, 품종, 계절, 시설, 센서 신뢰도에 따라 calibration table을 별도로 둬야 한다.

#### Research-backed threshold draft — fills previous open items

This section converts the remaining open items into a research-backed initial draft. These values are not final calibration constants, but they are no longer arbitrary placeholders.

##### Source-backed findings used

| Topic | Source finding | Design use |
|---|---|---|
| Tomato transplant readiness | RDA/Nongsaro: 정식 적정 묘는 본잎 7~9매, 제1화방 꽃 약 10% 개화. 재배력 자료도 봄·가을 본잎 8매+제1화방 10%, 고온/저온기 본잎 6~7매+제1화방 발달을 제시. | 제1화방 10% 개화를 tomato first-cluster stage entry 기준으로 유지. |
| Tomato establishment | 표준재배지침 계열 자료: 이식/옮겨심기 후 3~4일 비교적 고온/차광/충분 관수로 활착 촉진. | 토마토 정식·활착기 기본 기준일을 DAT 4일로 설정하되, 수경에서는 root/위조 회복 확인이 우선. |
| Tomato post-transplant management | 농사로 재배력: 활착 후~제2화방 착과기, 제3화방 개화기 이후, 1화방 수확 시작을 관리 전환점으로 제시. | stage boundary를 제1화방/제2~3화방/과실비대/첫 수확 기준으로 구분. |
| Tomato harvest timing | 농사로: 수정 후 3~5일 착과, 30일 후 과실비대 거의 완성, 저온기 45~50일·고온기 35~40일이면 수확. | fruit expansion → harvest window 전환 보조 기준으로 착과 후 35~50일 사용. |
| Tomato growth diagnosis | 토마토 생육진단 연구: MI는 개화속도, 생장점~첫 화방 거리, 경경; PI는 영양생장/생식생장 치우침 판단. | G-Index 입력 후보와 균형 판단 구조 근거로 사용. |
| Lettuce transplant readiness | 농사로: 상추 정식은 본엽 3~5매 플러그묘. | future seedling module에는 쓰되, default는 transplant date부터 시작. |
| Lettuce harvest timing | RDA webzine: 상추는 정식 후 25~30일경부터 수확 가능, 수확 잎 크기 폭 5~6cm·길이 15~18cm. | pre-harvest/harvest window threshold 근거. |
| Lettuce growth survey timing | 상추 생육 연구: 정식 후 3일, 14일, 21일 생육조사; 다른 식물공장 연구는 정식 후 23일 수확/평가. | DAT 3/14/21/23/25~30 기반 stage thresholds 구성. |
| Lettuce growth metrics | 상추 연구: 엽장, 엽폭, 엽수, 엽면적, SPAD, 근장, 생체중/건물중, Fv/Fm 사용. | L-Index 입력 후보와 stage confidence 기준. |
| Lettuce temperature/bolting | 농사로: 생육적온 15~20℃, 고온 시 꽃대신장/쓴맛/생리장해 증가, 적산온도 1,400~1,700℃에서 꽃대신장. | L-Index risk overlay와 pre-harvest 품질 risk 기준. |

##### Tomato threshold table — draft v3

| Threshold key | Initial value | Applies to | Source / rationale | Override rule |
|---|---:|---|---|---|
| `tomato.establishmentDays` | `4 DAT` | 정식·활착기 종료 보조 기준 | 이식 후 3~4일 활착 촉진 관리 근거 | 활착/위조 회복/근권 상태가 나쁘면 연장 |
| `tomato.establishmentMaxDaysWithoutReview` | `7 DAT` | 활착 지연 경고 | 4일을 넘겨도 회복 안 되면 실사용 risk | 7일 초과 시 operator survey required |
| `tomato.firstClusterFloweringEntryPercent` | `10%` | 제1화방 개화·착과기 진입 | RDA/Nongsaro 정식 기준의 제1화방 10% 개화 | 작형/품종별 calibration 가능 |
| `tomato.firstClusterFruitSetConfirm` | `fruit_set_seen OR 3~5 days after flowering with set record` | 제1화방 착과 안정 판단 | 수정 후 3~5일 착과 시작 근거 | 착과수/꽃 상태 기록 없으면 confidence low |
| `tomato.clusterExpansionEntry` | `first_cluster_fruit_set_confirmed AND cluster_no >= 2` | 화방 전개·균형 조정기 진입 | 토마토는 3엽 전개마다 화방 진행, 제2~3화방 관리 전환 | 화방 번호 입력 없으면 stage low confidence |
| `tomato.thirdClusterManagementPoint` | `cluster_no >= 3 OR 25~30 DAT` | 수경 EC/급액 전환 검토점 | 농사로: 제3화방 개화기 전후 관리 전환. 토경 웃거름 표현은 수경에서는 EC/급액 검토로 변환 | 수경에서는 “웃거름” 금지, EC/pH/배액률로만 표현 |
| `tomato.fruitExpansionEntry` | `fruit_diameter_growth_seen OR fruit_age >= 7 days after set` | 과실비대·품질관리기 진입 | 착과 후 과실비대 진행을 stage boundary로 사용 | 과실 metric 없으면 착과일 기준 보조 추정 |
| `tomato.harvestWindowEntry` | `first_harvest_recorded OR fruit_age >= 35~50 days after set` | 연속 수확기 진입 | 농사로: 고온기 35~40일, 저온기 45~50일 수확 | 온도/계절에 따라 35/40/45/50일 calibration |
| `tomato.lateTerminationEntry` | `termination_planned OR vigor_decline + disease_accumulation + low_yield_signal` | 후기·작기 종료기 | 자료 기반 단일일수보다 운영 판단 우선 | manager/owner confirmation 권장 |

##### Tomato stage boundaries — revised with thresholds

| Stage | Entry | Exit | Confidence rules |
|---|---|---|---|
| 정식·활착기 | `transplant_date` exists | DAT >= 4 and 활착/위조 회복 확인 | DAT > 7 with no recovery → `stageConfidence=low`, interlock: fresh survey required |
| 영양생장 형성기 | 활착 완료 | 제1화방 개화율 >= 10% | 화방 기록 없으면 DAT만으로 추정하지 않음. preview only |
| 제1화방 개화·착과기 | 제1화방 개화율 >= 10% | 착과 확인 or 개화 후 3~5일 착과 기록 | 착과 기록 없음 → operator survey required |
| 화방 전개·생육균형 조정기 | 제1화방 착과 안정 + 제2화방 이상 전개 | 과실비대 확인 | `cluster_no`/화방 기록 없으면 low confidence |
| 과실비대·품질관리기 | 착과 과실 비대 확인 or 착과 후 7일 이상 | 첫 수확 or 착과 후 35~50일 수확 가능 추정 | 과실 크기 기록 없으면 PHI/품질 판단 제한 |
| 연속 수확기 | 첫 수확 기록 or 수확 가능 과실 확인 | 종료 판단 | 방제 기록/PHI 없으면 harvest promotion block |
| 후기·작기 종료기 | 종료 예정 or 수세/병해/수확성 악화 | crop ended | 자동 보정보다 종료/전환 의사결정 우선 |

##### Lettuce threshold table — draft v3

| Threshold key | Initial value | Applies to | Source / rationale | Override rule |
|---|---:|---|---|---|
| `lettuce.establishmentDays` | `3 DAT` | 정식·활착기 1차 확인 | 상추 연구가 DAT 3을 초기 조사점으로 사용 | 활착 불량이면 연장 |
| `lettuce.establishmentMaxDaysWithoutReview` | `7 DAT` | 활착 지연 경고 | 상추는 생육기간이 짧으므로 7일 이상 활착 불명은 운영상 문제 | operator survey required |
| `lettuce.earlyLeafExpansionEntry` | `DAT >= 3 AND leaf_count >= transplant_leaf_count` | 초기 엽생장기 진입 | 정식 후 3일 초기 조사점 + 본엽 3~5매 정식 기준 | leaf metrics 없으면 confidence low |
| `lettuce.mainLeafExpansionEntry` | `DAT >= 14 OR clear leaf_size increase` | 본격 엽생장기 진입 | 상추 연구에서 DAT 14부터 엽폭/SPAD 차이 확인 | 엽장/엽폭 증가율이 없으면 DAT 보조만 사용 |
| `lettuce.preHarvestEntry` | `DAT >= 21 OR leaf_length >= 15cm OR leaf_width >= 5cm` | 수확 전 품질관리기 | 연구 DAT 21 생육후기; RDA 수확 잎 길이 15~18cm, 폭 5~6cm | 품종/목표 규격별 calibration |
| `lettuce.harvestWindowEntry` | `DAT >= 25 OR leaf_length 15~18cm AND leaf_width 5~6cm` | 수확기 진입 | RDA: 정식 후 25~30일경 수확 가능, 수확 잎 폭/길이 기준 | PHI/REI/품질 조건 통과 필요 |
| `lettuce.harvestWindowMaxDays` | `30 DAT` | 수확 지연 경고 | RDA: 정식 후 25~30일 수확 가능 | 수확 지연+고온 시 bolting/quality warning |
| `lettuce.boltingRiskHeat` | `temp > 25°C sustained OR accumulated_temp approaching 1,400~1,700°C` | 추대/품질 risk overlay | 농사로: 고온 시 꽃대신장/쓴맛, 적산온도 1,400~1,700℃ | 시설/품종별 calibration |

##### Lettuce stage boundaries — revised with thresholds

| Stage | Entry | Exit | Confidence rules |
|---|---|---|---|
| 정식·활착기 | `transplant_date` exists | DAT >= 3 and 활착/위조 회복 확인 | DAT > 7 with no leaf/root recovery → fresh survey required |
| 초기 엽생장기 | DAT >= 3 and leaf metrics available | DAT >= 14 or 엽장/엽폭/엽수 증가 안정 | leaf metrics missing → low confidence |
| 본격 엽생장기 | DAT >= 14 or clear leaf expansion | DAT >= 21 or harvest-size approaching | 고온/EC/pH 이상이면 L-Index보다 risk overlay 우선 |
| 수확 전 품질관리기 | DAT >= 21 or leaf length/width near harvest spec | DAT >= 25 or harvest spec reached | PHI/REI/mix/PLS 미확인 시 harvest promotion block |
| 수확기 | DAT 25~30 or leaf 15~18cm × 5~6cm and food-safety clear | crop ended or next harvest/cut cycle starts | 고온/추대/tipburn/쓴맛 risk 있으면 operator confirmation |

##### Approval/interlock thresholds — research-backed initial policy

| Case | Default severity | Required action | Rationale |
|---|---|---|---|
| Missing transplant date | hard block for stage inference | operator must enter transplant date | 정식 이후 default scope이므로 기준점 없음 |
| Tomato no cluster/flower data past DAT 14 | caution/problem depending G-Index | fresh growth survey required | 제1화방/화방 정보 없이 G-Index 보정하면 실사용 위험 |
| Tomato harvest window but pesticide PHI/REI unknown | hard block | manager/admin review before harvest promotion | 식품안전/방제 안전 우선 |
| Lettuce harvest window but PHI/REI unknown | hard block | manager/admin review before harvest promotion | 엽채류는 수확부위가 직접 섭취되므로 보수적 차단 |
| Any PLS non-compliant pesticide record | hard block | admin review; block harvest/target promotion | PLS 식품안전 risk |
| Mix forbidden pesticide record | hard block | admin review; block automation and harvest promotion | 혼용 위해/약해/안전 risk |
| Mix unknown with 2+ pesticides | problem | operator confirmation + manager review if near harvest | 정보 없음은 허용이 아니라 확인 필요 |
| Stage index in caution range | caution | preview allowed; limit correction magnitude | 생육 보정은 가능하되 과격한 제어 금지 |
| Stage index in problem range | problem | block auto execution; conservative fallback | 데이터/생육 상태 확인 전 자동화 금지 |
| Stage index in hard block range | hard block | target promotion block; fresh survey or manager/admin review | 극단값은 입력 오류/센서 오류/실제 위험 모두 가능 |

##### Updated implementation implication

- The code should not use vague stage names alone.
- Each crop stage must be calculated with `stageId`, `stageConfidence`, `entryEvidence`, `missingEvidence`, and `nextRequiredSurvey`.
- G-Index/L-Index thresholds must be stored as calibration data, not hard-coded forever.
- For 수경재배, all nutrition-management language must use EC/pH/irrigation/drainage/root-zone terms, not 토경 `웃거름` terms.

##### Implemented DB/API baseline — v1.9.56 Stage Diagnosis

`v1.9.56` adds a read-only diagnosis endpoint that combines `crop_seasons`, latest `growth_surveys`, recent `control_records/control_pesticides`, and `crop_stage_calibrations`.

```http
GET /api/green_smart/crop/seasons/{season_id}/stage-diagnosis?farmId=1
```

Response contract:

| Field | Meaning |
|---|---|
| `version` | `crop_stage_diagnosis_v1` |
| `seasonId` | diagnosis target crop season |
| `cropType` / `cultivationMethod` | crop/method used to choose calibration rows |
| `daysAfterTransplant` | DAT calculated from `crop_seasons.plant_date` |
| `latestMetrics` | latest growth survey row and dynamic `metrics_json` |
| `stageDiagnosis.stageId` | selected calibration stage id |
| `stageDiagnosis.stageLabel` | Korean stage label from calibration table |
| `stageDiagnosis.indexType` | `G-Index` for tomato, `L-Index` for lettuce calibration |
| `stageDiagnosis.indexValue` | current index value from latest growth survey baseline formula |
| `stageDiagnosis.indexBand` | `target`, `caution`, `problem`, `hardBlock`, or `unknown` by stage threshold |
| `stageDiagnosis.stageConfidence` | calibration boundary confidence text, lowered when survey data is missing |
| `stageDiagnosis.entryEvidenceStatus` | required/available/missing entry evidence summary |
| `stageDiagnosis.missingEvidence` | missing evidence list for operator survey guidance |
| `stageDiagnosis.nextRequiredSurvey` | next record the operator should collect |
| `sourceTables` | includes `crop_stage_calibrations` as the calibration source |

Initial inference rules:

| Crop | Primary stage drivers |
|---|---|
| Tomato | DAT, first-cluster flowering %, fruit-set count, cluster/truss no, fruit age/diameter, harvest/termination evidence |
| Lettuce | DAT, leaf length/width/count metrics, harvest record, harvest window thresholds |

This remains a DB/API baseline. It does not yet promote final control targets or change SafetyGuard execution.

##### Implemented model/interlock baseline — v1.9.56 Stage diagnosis → cropInterlock integration

`v1.9.56` connects the stage diagnosis result to the crop model snapshot and crop interlock decision. The integration keeps the existing `Safety → Interlock → Model(AI)` order: stage diagnosis does not directly execute devices, but it can block target promotion and auto execution before downstream model targets are used.

New crop interlock reasons:

| Reason code | Trigger | Default action |
|---|---|---|
| `stage_index_hard_block` | `stageDiagnosis.indexBand == hardBlock` | `block_stage_based_target_promotion`, `block_auto_execution`, conservative fallback, manager review |
| `stage_index_problem` | `stageDiagnosis.indexBand == problem` | block auto execution and target promotion; conservative fallback |
| `stage_index_caution` | `stageDiagnosis.indexBand == caution` | preview allowed, `limit_stage_based_correction_magnitude`, operator confirmation |
| `stage_missing_evidence` | calibration required/missing evidence remains unresolved | `require_stage_evidence_survey`, operator confirmation, conservative fallback |
| `stage_harvest_phi_rei_unknown` | harvest/pre-harvest stage has recent pesticide records without PHI/REI evidence | `require_harvest_safety_clearance`, target promotion block, manager/admin review |

Crop model response additions:

| Field | Meaning |
|---|---|
| `cropModel.stageDiagnosis` | stage diagnosis snapshot used by interlock |
| `cropModel.cropInterlock.stageDiagnosis` | same diagnosis embedded in interlock decision |
| `cropModel.cropInterlock.stageInterlockRuleResults` | matched/unmatched stage interlock rule results |
| `cropModel.cropInterlock.cropStageInterlockVersion` | `crop_stage_interlock_v1` |

This is still a baseline interlock integration. It blocks/limits model promotion, but does not yet add a dedicated panel card or override/audit approval workflow for every stage reason.

##### Implemented approval/audit baseline — v1.9.56 Crop Interlock approval

`v1.9.56` adds edge-local crop interlock approval and audit persistence.

```http
GET  /api/green_smart/crop/seasons/{season_id}/interlock-approval?farmId=1
POST /api/green_smart/crop/seasons/{season_id}/interlock-approval
```

Approval types:

| approvalType | Intended role | Use |
|---|---|---|
| `operator_confirm` | operator/farm_staff | 현장 확인, 최신 생육조사 필요 등 confirm성 차단 사유 확인 |
| `manager_approve` | farm_owner | 수확 안전/운영 위험 판단 승인 |
| `admin_approve` | admin | PLS/혼용/강제 override 성격의 높은 위험 승인 |

Persistence:

| Table | Purpose |
|---|---|
| `crop_interlock_approvals` | active approval state by `farm_id + season_id + approval_type` |
| `audit_logs` | immutable approval audit event snapshot |

Center API role decision:

> 센터 API는 실시간 계산 주체가 아니라 edge 계산 snapshot/audit 수집 주체다.

Therefore stage diagnosis, cropInterlock, approval gating, and automatic execution blocking remain inside edge HA/Green Smart. A future center API extension may collect `stageDiagnosis`, `cropInterlock`, `crop_interlock_approvals`, and `audit_logs` snapshots for fleet reporting and policy distribution, but it must not become the final real-time safety decision maker.

##### Implemented approval gate integration — v1.9.56

`v1.9.56` connects active approvals to cropInterlock target promotion gating.

Runtime policy:

| Approval | Can resolve | Effect |
|---|---|---|
| `operator_confirm` | `stage_missing_evidence`, `stage_index_caution`, freshness/confidence confirmation reasons | May clear `blockTargetPromotion` when all remaining target-blocking reasons are resolved |
| `manager_approve` | `stage_harvest_phi_rei_unknown`, high pest risk, unknown mix confirmation | May clear `blockTargetPromotion`, but does not clear `blockAutoExecution` |
| `admin_approve` | hard stage/index/pesticide/anomaly reasons | May clear target promotion for reviewed candidate/preview flows, but does not clear `blockAutoExecution` |

Output fields added to `cropInterlock`:

```json
{
  "approvalGateStatus": "clear | approval_required | target_promotion_approved",
  "approvalResolvedReasons": [],
  "approvalUnresolvedReasons": [],
  "approvalAudit": []
}
```

Important safety invariant:

```text
Approval may relax target promotion for reviewed candidate handling, but approval does not re-enable automatic execution for active cropInterlock reasons.
```

Panel marker:

```html
data-crop-interlock-approval-gate
```

##### Implemented center snapshot collection — v1.9.56

`v1.9.56` adds edge-to-center crop interlock snapshot sync. 센터 API는 snapshot 수집/분석 주체이며 실시간 safety/interlock 최종 판단자가 아니다.

Center API:

```http
POST /edge/snapshots/crop-interlock
GET  /edge/snapshots/crop-interlock/latest?farm_id=1&season_id={season_id}
```

Edge HA API:

```http
POST /api/green_smart/central/crop/interlock-snapshot/sync
```

Snapshot payload:

```json
{
  "farm_id": 1,
  "season_id": 1,
  "zone_id": 1,
  "stageDiagnosis": {},
  "cropInterlock": {},
  "approvalAudit": [],
  "auditSummary": {},
  "edgeVersions": {}
}
```

Center persistence:

| Table | Purpose |
|---|---|
| `crop_interlock_snapshots` | tenant/site/installation scoped immutable-ish snapshot history with idempotent `snapshot_hash` |
| `audit_events` | `crop_interlock_snapshot.received` event for sync audit |

Safety boundary:

```text
Center may analyze snapshots for reports, calibration/policy recommendations, and fleet comparison.
Center must not become the real-time safety/interlock execution authority.
```

##### Implemented center analytics summary — v1.9.56

`v1.9.56` adds a center-side crop interlock analytics summary endpoint. 센터 분석 API는 analytics/reporting only이며 실시간 safety/interlock 최종 판단자가 아니다.

```http
GET /analytics/crop-interlock/summary?farm_id=1&season_id={season_id}
```

Response fields:

```json
{
  "reason_counts": {},
  "approval_gate_counts": {},
  "approval_type_counts": {},
  "harvest_safety_unknown_count": 0,
  "stage_index_problem_count": 0,
  "stage_index_hard_block_count": 0,
  "snapshot_count": 0
}
```

Use cases:

- repeated `stage_harvest_phi_rei_unknown` detection
- repeated `stage_index_problem` / `stage_index_hard_block` detection
- `approval_required` vs `target_promotion_approved` frequency analysis
- approval/override overuse detection
- reporting and policy recommendation candidates

Non-goal:

```text
The analytics summary must not be used as the edge live execution allow/block authority.
```

##### Implemented edge/panel analytics read-only card — v1.9.56

`v1.9.56` adds an Edge HA proxy and Panel read-only card for center crop interlock analytics.

Edge HA API:

```http
GET /api/green_smart/central/crop/interlock-analytics/summary?farm_id=1&season_id={season_id}
```

Panel placement:

```text
작물 관리 → AI 전략 → 생육 리포트 → 센터 분석 참고
```

Panel marker:

```html
data-center-crop-interlock-analytics-card
```

UI rule:

```text
센터 분석 참고 — 실시간 제어 판단은 현장 Edge가 수행합니다.
읽기 전용 카드이며 실행/승인/차단 권한을 제공하지 않는다.
```

Displayed fields:

- `snapshot_count`
- `reason_counts`
- `approval_gate_counts`
- `approval_type_counts`
- `harvest_safety_unknown_count`
- `stage_index_problem_count`
- `stage_index_hard_block_count`

##### Implemented snapshot sync policy — v1.9.56

확정 기준:

```text
Edge 실시간 판단/감시 기준: 1분
Center snapshot/analytics sync 기준: 5분
이벤트 발생 시 즉시 sync
```

Code constants:

```python
EDGE_REALTIME_EVALUATION_INTERVAL_SECONDS = 60
CENTER_CROP_INTERLOCK_SNAPSHOT_SYNC_INTERVAL_SECONDS = 300
```

Architecture:

```text
Center는 push 수신
Edge가 주기/이벤트 기반 전송
Center는 analytics/reporting/recommendation only
Edge remains execution authority
```

Event sync triggers:

- `scheduled_5m` — HA scheduler sends active crop season snapshots every 5 minutes.
- `growth_report_refresh` — Panel growth report refresh sends snapshot immediately.
- `approval_saved` — Crop interlock approval save sends snapshot immediately.
- `manual_panel` — Operator can manually push snapshot from the read-only Center analytics card.

Failure policy:

```text
Center sync 실패는 작물 보호/제어 판단을 차단하지 않는다.
Edge 로컬 SafetyGuard/Interlock/Fail Safe가 1분 기준으로 계속 최종 판단한다.
다음 5분 tick 또는 다음 이벤트에서 재시도한다.
```

---

## 6. 구현 전 완료 조건

C-S1/C-S2 심화 구현 전 최소한 아래가 확정되어야 한다.

- [ ] 1차 대상 작물/재배 방식
- [ ] 작물별 생육조사 항목과 정상/이상 기준
- [ ] G-Index 상·하한 및 단계별 해석
- [ ] PLS/혼용/작용기작/희석배수/사용량/PHI 정책
- [ ] 병해충/날씨/방제 이력 결합 정책
- [ ] interlock action matrix
- [ ] role별 승인/override 정책
- [ ] UI 조치 안내 문구 정책
- [ ] audit/log 저장 필드

---

## 7. 다음 액션

Q1부터 답변을 받아 `Confirmed decision`에 기록한다. 이후 Q2, Q3... 순서로 진행한다.
