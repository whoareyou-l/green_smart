# Green Smart public HACS 설치 운영안

이 문서는 Green Smart v1.8.2 이상을 GitHub public repository와 HACS custom repository로 설치하는 기준입니다.

## 핵심 원칙

Green Smart 제품 repo는 HACS 설치 편의성을 위해 public으로 운영한다.
운영/배포 코드와 runtime secret은 별도 private deploy repo와 서버 runtime 파일에 둔다.

```text
제품 repo: whoareyou-l/green_smart        public
배포 repo: whoareyou-l/green_smart-deploy private
설치 안내 repo: whoareyou-l/green_smart_install private, 안내 전용
```

공개 repo에 넣지 않는 것:

- 고객 데이터
- Home Assistant `.storage`
- DB/MQTT/Cloudflare/GitHub token
- 운영 `.env`
- Docker prod/dev runtime volume
- 백업 파일과 보고서

## 권장 방식 A: HACS custom repository 설치

일반 설치/업데이트 기본 방식이다.

1. 고객의 Home Assistant에 HACS를 설치한다.
2. HACS → Integrations로 이동한다.
3. 우측 상단 메뉴 → Custom repositories를 연다.
4. 아래 repo를 추가한다.

```text
Repository: https://github.com/whoareyou-l/green_smart
Category: Integration
```

5. HACS에서 `Green Smart`를 설치한다.
6. Home Assistant를 재시작한다.
7. 설정 → 기기 및 서비스 → 통합구성요소 추가 → `Green Smart`를 추가한다.

v1.8.2 확인:

```text
/config/custom_components/green_smart/manifest.json
"version": "1.8.2"
```

## 권장 방식 B: release zip 수동 설치

HACS가 동작하지 않거나 오프라인 설치가 필요할 때 사용한다.

1. GitHub release `vX.Y.Z`에서 소스 zip을 받는다.
2. 압축을 풀고 아래 폴더만 복사한다.

```text
custom_components/green_smart/
```

3. 고객 장비의 Home Assistant 설정 디렉토리에 복사한다.

```text
<HA_CONFIG>/custom_components/green_smart/
```

대부분의 HA OS/Supervised 환경에서는 다음 위치다.

```text
/config/custom_components/green_smart/
```

4. Home Assistant를 재시작한다.
5. 설정 → 통합구성요소 → Green Smart를 추가한다.

주의:

- zip 파일 또는 임시 clone 디렉토리는 설치 후 삭제한다.
- 운영 token, SSH key, `.env`를 고객 장비나 repo에 남기지 않는다.
- 버전/설치일/고객명을 내부 계약 기록에 남긴다.

## 계약 해지 또는 권한 회수

제품 repo가 public이면 GitHub 접근권 회수만으로 설치/업데이트를 차단할 수 없다.
계약 해지 시에는 운영 정책과 계약 조항으로 사용 중지/삭제를 처리한다.

권장 절차:

1. 고객 장비의 Green Smart 사용 중지 또는 삭제를 안내/대행한다.
2. 회사가 관리하는 원격접속, 서비스 계정, 도메인/터널 권한을 회수한다.
3. 고객 장비에 회사 token/SSH key/임시 설치 파일이 남아 있지 않은지 확인한다.
4. 필요한 경우 버전별 라이선스/계약 검증 기능을 별도 제품 기능으로 설계한다.

## 왜 public 설치인가

HACS가 별도 GitHub 인증 없이 repository metadata, `hacs.json`, `manifest.json`, release/tag를 조회할 수 있어야 설치가 단순해진다.

```text
HACS custom repository → public GitHub API/raw 접근 가능 → 설치 가능
```

보안 경계는 public 제품 코드가 아니라 다음으로 둔다.

- 배포/운영 repo private 유지
- runtime secret 미커밋
- 고객 데이터 미커밋
- prod/dev Docker volume 미커밋
- 계약/라이선스/서비스 운영 정책으로 사용 권한 관리
