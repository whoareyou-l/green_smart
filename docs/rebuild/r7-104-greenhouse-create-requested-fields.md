# R7-104 greenhouse create requested fields

## 목적

사용자 제공 이미지와 요청 기준으로 **온실 생성 모달**의 입력 구조를 단순화한다.

## 기본 정보

왼쪽 작성 영역의 첫 섹션은 입력폼 2개만 둔다.

```text
온실명 input
위치 input
```

## 운영 기준

두 번째 섹션은 드롭박스 3개로 구성한다.

```text
운영상태 select
설치유형 select
기본 시간대 select
```

### 운영상태 옵션

```text
운영중(active)
대기(standby)
점검중(maintenance)
비활성(inactive)
```

### 설치유형 옵션

우선은 사용자 요청대로 하나만 둔다.

```text
NUC edge
```

### 기본 시간대 옵션

```text
Asia/Seoul · 한국 표준시
UTC
Asia/Tokyo
America/Los_Angeles
```

## 메모

세 번째 섹션은 생성 사유 textarea만 둔다.

```text
생성 사유 textarea
```

## 제거

온실 생성 모달에서는 기존 `승인 범위` 입력을 제거한다. 단, 기존 온실 정보 상세 엔티티에서 저장된 `approvalScope`를 보여주는 호환 계약은 이 작업 범위가 아니다.

```text
승인 범위 제거
approvalScope create input 제거
```
