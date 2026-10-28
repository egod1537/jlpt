# JLPT 개인 단어장

개인용 JLPT 단어장·학습 웹 앱입니다. Next.js Node 서버와 SQLite를 사용하며, 원본 27개 세트는 private seed 경로에서 DB로 한 번만 가져옵니다. 브라우저의 IndexedDB는 캐시와 오프라인 outbox이고 서버 DB가 정본입니다.

## 구조

```text
src/front/  Next.js 화면, route handlers, IndexedDB 동기화
src/back/   SQLite migration, 서비스, seed, 운영 CLI
jlpt-vocabulary-dataset/data/  변경하지 않는 원본 seed
spec/       구현 명세(로컬 작업 자료)
```

`src/front/public/data`에는 단어 자료를 두지 않습니다. 앱 로그인은 없으며 페이지와 데이터 API에 바로 접근할 수 있습니다. 쓰기 API는 브라우저의 교차 사이트 요청을 줄이기 위해 설정한 `JLPT_APP_ORIGIN`과 요청 Origin이 같은지 확인합니다.

## 기능 범위와 제한

- 최대 5단계 폴더, 세트/단어 전체 편집, 일괄 이동·즐겨찾기·휴지통·복구·2단계 완전 삭제를 지원합니다.
- CSV/JSON 가져오기는 10MB까지 미리보기와 열 매핑 후 새 세트로 저장합니다. CSV 다중 값은 `|` 또는 `;`, 예문/출처 같은 중첩 값은 JSON 배열로 직렬화합니다. 세트별 CSV/JSON 내보내기와 전체/진도 JSON 백업을 제공합니다.
- 학습은 전체/폴더/세트 범위, 미학습/복습 대기/취약 단어, 세션 이어하기, 오프라인 평가 outbox를 지원합니다. 이미 열린 앱과 캐시된 세트만 오프라인에서 사용할 수 있으며 PWA 앱 셸은 이번 범위가 아닙니다. 오프라인 중 강제 새로고침하면 재연결 후 화면이 다시 열리고 보존된 outbox가 동기화됩니다.
- 통계는 실제 평가 이벤트와 Asia/Seoul 날짜 경계를 사용합니다. 이전 localStorage snapshot은 누적 진도에는 병합할 수 있지만 과거 일별 이벤트는 복원하지 않습니다.
- 에메랄드 책 아이콘을 브라우저 favicon과 iOS·Android 홈 화면 아이콘으로 제공하며 웹 앱 manifest에 연결합니다.
- 자동 30일 영구 삭제, 공개 공유 URL, 다중 사용자, FSRS, 객관식/주관식 학습은 이번 범위가 아닙니다. 휴지통 완전 삭제와 운영 DB 복원은 사용자가 명시적으로 실행해야 합니다.

## 로컬 개발

Node.js 22 이상이 필요합니다. 저장소 루트에서 실행합니다.

```bash
npm ci
npm run db:migrate
npm run db:seed
npm run dev
```

기본 DB는 `var/jlpt.sqlite`이고 원본은 `jlpt-vocabulary-dataset/data`입니다.

검증 명령:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm --prefix jlpt-vocabulary-dataset test
```

## Docker 최초 설정

운영 경로는 저장소 밖의 전용 디렉터리를 권장합니다. 컨테이너의 `node` 사용자는 UID/GID 1000입니다.

```bash
sudo install -d -m 700 -o 1000 -g 1000 /srv/jlpt/var /srv/jlpt/backups
cp .env.example .env
```

`.env`에서 아래 호스트 경로와 공개 origin을 설정합니다.

```dotenv
JLPT_DATA_DIR=/srv/jlpt/var
JLPT_BACKUP_HOST_DIR=/srv/jlpt/backups
JLPT_APP_ORIGIN=https://jlpt.mangagaki.net
```

```bash
docker compose up -d --build
curl -fsS http://127.0.0.1:8081/healthz
```

컨테이너 시작 시 migration과 해시 기반 seed를 실행합니다. 동일 seed 재실행은 no-op이고 사용자 편집을 덮어쓰지 않습니다. DB는 `/app/var/jlpt.sqlite`, 백업은 별도 `/app/backup` mount에 있습니다. 애플리케이션 코드와 루트 파일시스템은 읽기 전용입니다.

## 백업과 복원

온라인 SQLite backup API를 사용하므로 실행 중인 WAL 파일을 복사하지 않습니다. 결과 DB와 migration·revision·건수 메타데이터는 mode `0600`으로 생성되고 복제 DB에서 `integrity_check`를 수행합니다.

```bash
docker compose exec -T web node /app/ops/backup.mjs --prune
```

`--prune`은 최신 7개와 추가 주간 백업 4개를 유지합니다. macOS/Linux host scheduler 예시(매일 03:20):

```cron
20 3 * * * cd /path/to/jlpt && docker compose exec -T web node /app/ops/backup.mjs --prune >>/var/log/jlpt-backup.log 2>&1
```

복원은 서비스를 중단하고 기존 DB를 별도 이름으로 보존한 뒤 검증된 `.sqlite`를 `JLPT_DATA_DIR/jlpt.sqlite`로 배치하고 UID 1000, mode 0600을 적용합니다. 먼저 별도 임시 경로에서 `PRAGMA integrity_check`, 세트·항목·이벤트 건수를 백업 메타데이터와 대조하세요. 설정 화면의 JSON 백업은 보조 수단이며 운영 DB 백업을 대체하지 않습니다.

## main 배포와 롤백

배포는 추적 변경이 없고 로컬 `main`이 `origin/main`과 일치할 때만 실행됩니다.

```bash
./src/front/scripts/deploy-main.sh
```

스크립트는 기존 동적 컨테이너의 DB를 먼저 백업하고 이전 이미지를 `jlpt-vocabulary-web:rollback`으로 태그합니다. 새 이미지를 올린 뒤 health, 공개 `/api/books`의 200, 구 `/data/collections.json` 비노출을 확인합니다. health 실패 시 이전 이미지를 다시 시작합니다. migration 이후 새 서버 쓰기가 있었다면 이미지 롤백만으로 DB schema를 되돌리지 말고, 중단 공지 후 배포 직전 DB 백업 복원이 필요한지 판단해야 합니다.

Caddy upstream은 Docker network alias `jlpt-vocabulary-web:3000`입니다. host port는 계속 `127.0.0.1:8081`에만 바인딩하며 Docker socket은 mount하지 않습니다.

## 운영 주의

- 로그인 없이 공개 주소로 서비스하므로 URL에 접근할 수 있는 사람은 데이터 API를 읽고 쓸 수 있습니다. 접근 제한이 필요하면 애플리케이션 밖의 프록시나 VPN에서 설정합니다.
- 교재·기출·신문 등 원자료의 재배포 권한은 별도 확인해야 합니다.
- 로그에 백업 본문이나 단어 원문 전체를 남기지 않습니다.
- 구 앱 localStorage 키 `jlpt-vocab:progress:v1`, `jlpt-vocab:session:v1`은 설정에서 미리보기 후 병합하며 자동 삭제하지 않습니다.
- 정적 앱으로 롤백해도 새 서버의 학습 이벤트가 구 localStorage로 자동 복사되지는 않습니다.
