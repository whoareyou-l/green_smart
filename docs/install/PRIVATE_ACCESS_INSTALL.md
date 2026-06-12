# Green Smart private 설치 운영안

이 문서는 Green Smart를 초대/계약된 사용자만 설치할 수 있게 운영하는 기준입니다.

## 핵심 원칙

Green Smart 제품 코드는 공개 배포하지 않는다.
설치 권한은 GitHub private repository 접근권으로 통제한다.

```text
제품 repo: whoareyou-l/green_smart       private
배포 repo: whoareyou-l/green_smart-deploy private
설치 안내 repo: whoareyou-l/green_smart_install private, 안내 전용
```

사용자가 설치 가능하려면 다음 둘 중 하나가 필요하다.

1. 계약된 고객의 GitHub 계정을 private repo collaborator로 초대한다.
2. 회사가 설치 대행을 하며 고객 장비에는 repo 접근 토큰을 남기지 않는다.

## 권장 방식 A: 회사 설치 대행

가장 안전한 기본 방식이다.

1. 계약/초대 상태를 내부에서 확인한다.
2. 회사 계정 또는 설치 전용 GitHub 계정으로 고객 장비에 접속한다.
3. private repo에서 정식 release/tag를 내려받아 설치한다.
4. 설치 후 고객 장비에서 GitHub token, SSH key, 임시 zip 파일을 제거한다.
5. 이후 업데이트는 회사가 유지보수 일정에 맞춰 대행한다.

장점:

- 고객에게 GitHub 토큰을 발급하지 않아도 된다.
- repo 접근 권한이 고객 장비에 오래 남지 않는다.
- 계약 해지 시 추가 설치/업데이트를 즉시 차단하기 쉽다.

## 권장 방식 B: 고객 GitHub 계정 초대 + HACS private repo

고객이 직접 설치/업데이트해야 하는 경우에 사용한다.

절차:

1. 고객에게 GitHub 계정을 받는다.
2. 계약 상태를 확인한 뒤 `whoareyou-l/green_smart` private repo에 read 권한으로 초대한다.
3. 고객이 GitHub 초대를 수락한다.
4. 고객의 Home Assistant에 HACS를 설치한다.
5. HACS에서 custom repository로 아래 repo를 추가한다.

```text
Repository: https://github.com/whoareyou-l/green_smart
Category: Integration
```

주의:

- private repo 접근에는 고객 GitHub 계정 또는 고객이 직접 만든 GitHub token이 필요할 수 있다.
- 회사 공용 token을 고객 장비에 넣지 않는다.
- 고객 token을 회사가 대신 보관하지 않는다.
- 설치가 안 되면 먼저 고객 계정이 repo 초대를 수락했는지 확인한다.

## 권장 방식 C: private release zip 수동 설치

HACS private repo 인증이 번거로운 고객에게 사용할 수 있는 대안이다.

1. 계약 상태를 확인한다.
2. private release `vX.Y.Z`에서 소스 zip을 받는다.
3. 고객 장비의 Home Assistant 설정 디렉토리에 복사한다.

```text
<HA_CONFIG>/custom_components/green_smart/
```

4. Home Assistant를 재시작한다.
5. 설정 → 통합구성요소 → Green Smart를 추가한다.

주의:

- zip 파일 또는 임시 clone 디렉토리는 설치 후 삭제한다.
- 고객에게 영구 repo token을 전달하지 않는다.
- 버전/설치일/고객명을 내부 계약 기록에 남긴다.

## 계약 해지 또는 권한 회수

계약 해지 시:

1. GitHub collaborator 접근권을 제거한다.
2. 고객 장비에 남아 있는 GitHub token/SSH key가 있으면 제거하도록 안내하거나 대행한다.
3. HACS 업데이트가 더 이상 private repo에 접근하지 못하는지 확인한다.
4. 운영 정책에 따라 서비스 계정, 원격접속 계정, 도메인/터널 권한도 회수한다.

이미 설치된 로컬 파일은 GitHub 권한 회수만으로 자동 삭제되지 않는다. 따라서 계약서에는 사용권 종료 후 사용 중지/삭제 조항이 필요하다.

## 왜 이것이 private 설치인가

Green Smart 설치 가능 여부를 공개 URL이 아니라 접근권으로 판단하기 때문이다.

```text
계약 완료 → GitHub 계정 초대 또는 회사 설치 대행 → 설치 가능
계약 없음 → private repo/release 접근 불가 → 신규 설치/업데이트 불가
```

설치 안내 repo도 private 상태로 유지한다. 과거 public raw URL 캐시가 남더라도 제품 코드와 설치 스크립트는 두지 않고, 초대/계약 절차와 문의 방법만 둔다.
