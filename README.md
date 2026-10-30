# JLPT 개인 단어장

개인용 JLPT 단어장·학습 웹 앱입니다. Next.js Node 서버와 SQLite를 사용하며, 기존 원본 27개 세트와 HTML에서 정규화한 N1 세트 1개를 private seed 경로에서 증분·멱등 방식으로 가져옵니다. 브라우저의 IndexedDB는 캐시와 오프라인 outbox이고 서버 DB가 정본입니다.

## 구조

```text
src/front/  Next.js 화면, route handlers, IndexedDB 동기화
src/back/   SQLite migration, 서비스, seed, 운영 CLI
dataset/       변경하지 않는 HTML 원본과 검증·정규화 도구
dataset/data/  기존 27개 원본 seed와 생성된 HTML 정규화 JSON
spec/       구현 명세(로컬 작업 자료)
```

`src/front/public/data`에는 단어 자료를 두지 않습니다. 프로덕션의 페이지와 내부 API는 `JLPT_ACCESS_TOKEN`으로 만든 HttpOnly 세션이 있어야 접근할 수 있습니다. 쓰기 API는 세션 검사에 더해 `JLPT_APP_ORIGIN`과 요청 Origin이 같은지도 확인합니다. 서버 간 `/api/v1`은 별도의 Bearer 키를 사용합니다.

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

기본 DB는 `var/jlpt.sqlite`이고 원본은 `dataset/data`입니다.

Windows 로컬 환경에서는 네이티브 패키지에 포함된 사전 빌드를 사용하도록 아래 명령으로 한 번에 설정할 수 있습니다. 개발 서버는 기본 포트와 겹치지 않는 `http://127.0.0.1:3100`에서 실행됩니다.

```bash
npm run setup:local
npm run dev:local
```

## 외부 단어장 API

서버 간 연동용 API는 `/api/v1` 아래에 있으며 모든 요청에 `Authorization: Bearer <API_KEY>`가 필요합니다. `.env` 또는 `src/front/.env.local`의 `JLPT_EXTERNAL_API_KEY`에 16자 이상의 임의 값을 설정한 뒤 서버를 다시 시작하세요. 값이 비어 있으면 외부 API는 503으로 비활성화됩니다.

- `GET /api/v1/books`: 단어장 목록 조회
- `POST /api/v1/books`: 단어와 함께 단어장 일괄 생성
- `GET /api/v1/books/{bookId}`: 단어장 메타데이터 조회
- `GET /api/v1/books/{bookId}/entries`: 단어 목록 조회

요청·응답 예시, 페이지네이션, 멱등 재시도와 오류 형식은 [외부 API 안내](docs/EXTERNAL_API.md)에 정리되어 있습니다. 기계 판독용 명세는 실행 서버의 `/external-api.openapi.json`에서 제공합니다.

## ChatGPT OAuth와 Responses API

로컬 오픈소스 실행에서는 API 키 대신 ChatGPT Plus/Pro 계정을 OAuth로 연결할 수 있습니다. `http://127.0.0.1:3100/settings`의 **Continue with ChatGPT**를 누르면 Authorization Code + PKCE 흐름을 시작합니다. 공식 오픈소스 흐름은 loopback callback만 허용하므로 `localhost`나 공개 HTTPS 주소가 아닌 `127.0.0.1`로 앱을 열어야 합니다.

연결 후 사용할 수 있는 서버 API는 다음과 같습니다.

- `GET /api/openai/status`: 연결 상태
- `GET /api/openai/models`: 연결 계정에서 사용 가능한 모델
- `POST /api/openai/responses`: Responses API SSE 스트림 프록시
- `POST /api/openai/disconnect`: 갱신 세션 폐기 및 로컬 토큰 제거

Responses 프록시는 공식 ChatGPT 요금제 사용 계약에 맞춰 `store: false`, `stream: true`를 항상 강제합니다. OAuth 토큰은 `var/openai-auth.json` 또는 `JLPT_OPENAI_AUTH_PATH`의 서버 전용 파일에만 저장되며 브라우저 저장소·SQLite·JSON 백업에는 포함되지 않습니다.

```bash
curl --no-buffer http://127.0.0.1:3100/api/openai/responses \
  -H 'Origin: http://127.0.0.1:3100' \
  -H 'Content-Type: application/json' \
  -d '{"model":"<GET /api/openai/models에서 받은 slug>","input":"こんにちは"}'
```

구현 계약은 OpenAI의 [Sign in with ChatGPT 등록 안내](https://developers.openai.com/siwc/token-sharing-open-source/sign-in)와 [Models and inference](https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference)를 따릅니다. 공개 웹 서비스용 Sign in with ChatGPT는 별도 파트너 등록과 발급된 OAuth client가 필요한 다른 흐름입니다.

검증 명령:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm --prefix dataset test
npm run benchmark
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

컨테이너 시작 시 migration과 해시 기반 seed를 실행합니다. 동일 seed 재실행은 no-op이고 사용자 편집을 덮어쓰지 않습니다. DB는 `/app/var/jlpt.sqlite`, 음원은 `/app/var/listening/audio`, 백업은 별도 `/app/backup` mount에 있습니다. `worker` 서비스는 같은 WAL DB와 음원 볼륨을 사용하며 전사·교정 작업을 lease 기반으로 이어받습니다. 이미지에는 FFmpeg/ffprobe와 번들된 worker 진입점이 들어 있고, 두 컨테이너의 코드와 루트 파일시스템은 읽기 전용입니다.

## 백업과 복원

온라인 SQLite backup API를 사용하므로 실행 중인 WAL 파일을 복사하지 않습니다. 각 스냅샷 디렉터리에는 같은 기준의 `database.sqlite`, DB가 참조하는 음원, SHA-256 `manifest.json`이 함께 들어갑니다. 복제 DB에서 `integrity_check`를 실행하고 파일 크기·해시가 맞지 않으면 완성된 백업으로 승격하지 않습니다. OAuth 토큰과 API/접근 키는 포함하지 않습니다.

```bash
docker compose exec -T web node /app/ops/backup.mjs --prune
docker compose exec -T web node /app/ops/restore.mjs --snapshot /app/backup/jlpt-... --verify-only
```

`--prune`은 최신 7개와 추가 주간 백업 4개를 유지합니다. macOS/Linux host scheduler 예시(매일 03:20):

```cron
20 3 * * * cd /path/to/jlpt && docker compose exec -T web node /app/ops/backup.mjs --prune >>/var/log/jlpt-backup.log 2>&1
```

복원은 먼저 `--verify-only`를 통과시킨 뒤 `web`과 `worker`를 모두 중단하고 `--force`로 실행합니다. 도구는 새 DB·음원을 스테이징한 뒤 기존 대상을 `.pre-restore-*`로 보존하고 교체합니다. 복구 후 `listening-fsck.mjs`로 누락 파일과 고아 파일을 점검하며, `--quarantine`은 고아 파일을 삭제하지 않고 격리합니다. 설정 화면의 JSON 백업은 보조 수단이며 운영 스냅샷을 대체하지 않습니다. 전체 절차와 프록시 설정은 [운영 안내](docs/OPERATIONS.md)를 따릅니다.

## main 배포와 롤백

배포는 추적 변경이 없는 로컬 `main`에서만 실행됩니다. 스크립트가 `origin/main`을 fetch한 뒤 로컬 `main`을 최신 원격 커밋으로 fast-forward하며, 이력이 갈라져 있거나 Docker 빌드 입력에 커밋되지 않은 파일이 있으면 중단합니다.

```bash
./src/front/scripts/deploy-main.sh
```

스크립트는 fetch 시점의 `origin/main` SHA를 Docker 이미지 태그와 OCI revision label로 고정합니다. 기존 동적 컨테이너의 DB를 먼저 백업하고 이전 이미지를 `jlpt-vocabulary-web:rollback`으로 태그한 뒤, 새 이미지의 health, 실행 revision, 비인증 `/api/books`의 401, 구 `/data/collections.json` 비노출을 확인합니다. 검증 실패 시 이전 이미지를 다시 시작합니다. migration 이후 새 서버 쓰기가 있었다면 이미지 롤백만으로 DB schema를 되돌리지 말고, 중단 공지 후 배포 직전 DB 백업 복원이 필요한지 판단해야 합니다.

macOS 운영 호스트에서는 사용자 LaunchAgent가 5분마다 `origin/main`과 실행 중인 web/worker 상태를 확인하도록 설치할 수 있습니다. revision과 두 health가 모두 정상이면 빌드하지 않습니다. 런타임 배포가 실패한 revision은 `.git/jlpt-main-deploy/failed-revision`에 기록해 같은 결함을 반복 배포하지 않고, 다음 `main` 커밋부터 다시 시도합니다. 환경 문제를 고친 뒤 같은 revision을 수동 재시도하려면 `deploy-main.sh`를 직접 실행하면 됩니다.

```bash
./src/front/scripts/install-main-deploy-launch-agent.sh
launchctl print gui/$(id -u)/net.mangagaki.jlpt.deploy-main
tail -f ~/Library/Logs/jlpt-deploy-main.log
```

Caddy upstream은 Docker network alias `jlpt-vocabulary-web:3000`입니다. host port는 계속 `127.0.0.1:8081`에만 바인딩하며 Docker socket은 mount하지 않습니다.

## 운영 주의

- `JLPT_ACCESS_TOKEN`은 16자 이상의 무작위 값으로 설정하고, 공개 주소 앞단에도 VPN·SSO·Basic Auth 같은 별도 접근 경계를 두는 것을 권장합니다.
- 교재·기출·신문 등 원자료의 재배포 권한은 별도 확인해야 합니다.
- 로그에 백업 본문이나 단어 원문 전체를 남기지 않습니다.
- 구 앱 localStorage 키 `jlpt-vocab:progress:v1`, `jlpt-vocab:session:v1`은 설정에서 미리보기 후 병합하며 자동 삭제하지 않습니다.
- 정적 앱으로 롤백해도 새 서버의 학습 이벤트가 구 localStorage로 자동 복사되지는 않습니다.
