# R7-066 Settings domain reclassification foundation

설정 도메인 재분류 foundation.

Status: current baseline for `v1.14.37`.

## Why

The settings domain must become the 기준 데이터 관리 도메인 before RBAC, zones, crop cycles, plant objects, and device mapping can be finalized. Previous tabs were mostly admin/RBAC/system-boundary explanation cards. That was not enough for product operation because essential configuration questions live here:

- 온실이 몇 구역인지
- 각 구역의 이름/상태가 무엇인지
- 각 구역의 현재 작기가 무엇인지
- 작기마다 4개의 작물 객체가 어떻게 표시되는지
- 센서/장치가 어느 구역에 매핑되는지
- 사용자가 어떤 구역/기능에 접근 가능한지

## New tabs

1. 온실·구역
   - 온실 기본 정보
   - 구역 구성
   - 구역별 현재 작기
   - 구역 row evidence

2. 작기·작물 객체
   - 작기별 4개 객체 rule
   - 객체 번호: 작기 번호-객체 번호
   - 예: `4-3`

3. 장치·센서 매핑
   - 구역별 센서
   - 구역별 장치
   - HA entity mapping
   - 매핑 상태

4. 사용자·권한
   - admin
   - farm_owner
   - farm_staff
   - 권한 버킷: 조회 · 기록 · 전략 · 실행 · 안전 · 고급설정

5. 안전·승인 정책
   - 실행 승인 정책
   - Fail Safe 기준
   - Interlock 정책
   - 알림 정책

6. 시스템·연동
   - Home Assistant 연동
   - DB 연결
   - API 상태
   - Secret redaction / `[REDACTED]`

7. 진단·감사
   - 시스템 진단
   - 매핑 진단
   - 권한 감사
   - 실행 감사

## Compatibility

Older tabs are preserved as hidden compatibility panels/markers for previous contracts:

- 도메인 소유권
- 역할·권한
- 매핑·장치
- 시스템·보안
- RBAC 정책

They are not the primary operator-facing settings IA anymore.

## Boundary

This slice is read-only foundation. It reclassifies settings IA/cards and does not add save/delete/apply/mutation authority. Actual 저장/수정 for greenhouse zones, crop-cycle objects, users, and mappings will be separate slices.
