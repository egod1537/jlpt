# JLPT 통합 단어 웹 앱

기존 `jlpt-vocabulary-dataset/data/`의 27개 단어장 JSON을 수정하거나 합치지 않고 탐색·검색·플래시카드 학습에 사용하는 한국어 정적 웹 앱입니다. 같은 `word.id`는 전체 검색과 학습 진도에서 공유하지만, 개별 단어장의 원본 순서·뜻·문맥·출처는 그대로 유지합니다.

## 실행 환경

- Node.js 20.9 이상(Node.js 20 LTS 이상 권장)
- npm과 커밋된 `package-lock.json`
- Next.js App Router, TypeScript strict, Tailwind CSS, shadcn/ui 방식의 Radix 기반 UI

```bash
cd src/front
npm ci
npm run dev
```

개발 서버를 시작하기 전에 `predev`가 정적 데이터를 자동으로 동기화합니다.

## 화면

| 경로 | 기능 |
|---|---|
| `/` | 데이터 통계, 분류, 학습·복습 빠른 이동 |
| `/books` | 분류별 전체 단어장, 제목 검색과 정렬 |
| `/books/[id]` | 원본 순서 단어 목록, 필터, 전체 상세 정보 |
| `/search` | 표제어·읽기·한국어 뜻 통합 검색, ID별 그룹과 출처 |
| `/study` | 단일·복수·전체 단어장 플래시카드와 세션 재개 |
| `/due` | 현재 시각까지 복습 예정인 고유 단어 |
| `/data-quality` | `review.json`의 읽기 전용 데이터 검수 목록 |
| `/settings` | 로컬 진도 내보내기·가져오기·초기화 |

## 데이터 생성

원본은 다음 파일입니다.

- `../../jlpt-vocabulary-dataset/data/collections.json`, `stats.json`, `review.json`
- `../../jlpt-vocabulary-dataset/data/wordbooks/session-XXX.json`
- `../../jlpt-vocabulary-dataset/schema/word.schema.json`

```bash
npm run sync:data
```

`../back/scripts/sync-data.mjs`는 참조된 JSON만 검증해 `public/data/`에 복사하고, 원본 배열 위치가 포함된 `search-index.json`을 생성합니다. 컬렉션 ID 중복, 경로 이탈, 메타데이터·단어 수 불일치, 잘못된 상태·ID, 통계 불일치가 있으면 실패합니다. `public/data/`는 빌드 산출물이므로 Git에서 제외되며 직접 수정하면 안 됩니다. 소스 데이터가 바뀌면 다음 순서로 갱신합니다.

```bash
cd jlpt-vocabulary-dataset && npm test
cd ../src/front && npm run sync:data && npm test && npm run build
```

## 검사와 빌드

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

`npm run build`도 `prebuild`에서 데이터를 다시 동기화하며 완전한 정적 사이트를 `out/`에 생성합니다. E2E 검사는 Chromium 설치가 필요합니다(`npx playwright install chromium`).

## 로컬 진도와 복습

- 진도 키: `jlpt-vocab:progress:v1`
- 중단 세션 키: `jlpt-vocab:session:v1`
- 진도는 배열 위치가 아니라 전역 `word.id`로 저장됩니다.
- 카드를 공개하는 것만으로는 진도가 생기지 않고, 평가를 누를 때만 일정이 갱신됩니다.
- 복습 계산의 하루는 이 MVP에서 정확히 `86,400,000ms`입니다. 구현은 명세에 고정된 단순 SM-2 영감 규칙이며 과학적으로 검증된 SM-2라고 주장하지 않습니다.
- 브라우저 저장소가 비활성화되거나 용량을 초과하면 현재 탭의 학습은 계속할 수 있지만 지속 저장 실패를 알립니다.

설정 화면의 백업 JSON에는 원문 단어를 중복 저장하지 않습니다. 가져오기는 5MB 이하 파일만 허용하며 버전·단어 ID·수치·날짜를 검증한 후 확인을 거쳐 기존 진도를 교체합니다. 초기화는 위 두 키만 삭제합니다.

## 정적 배포

공개 배포 전 아래 저작권 주의를 먼저 확인하세요. 이 저장소에서 자동 배포하거나 게시하지 않습니다.

### Docker + Nginx

저장소 루트에서 멀티스테이지 이미지를 빌드하고 로컬 포트에 실행합니다. 빌드 단계만 Node.js를 사용하며 최종 이미지는 비루트 Nginx와 정적 `out/` 파일만 포함합니다.

```bash
cd /path/to/jlpt
docker compose up -d --build
curl http://127.0.0.1:8081/healthz
```

기본 공개 주소는 `http://127.0.0.1:8081`입니다. 포트를 바꾸려면 `JLPT_WEB_PORT=18081 docker compose up -d --build`처럼 실행합니다. 상태와 로그는 `docker compose ps`, `docker compose logs -f web`으로 확인하고 중지는 `docker compose down`으로 수행합니다.

운영 환경에서는 컨테이너가 외부 Docker 네트워크 `jjs-edge`에도 연결되고, `src/front/jlpt.caddy`와 동일한 Caddy 라우트를 통해 `https://jlpt.mangagaki.net`으로 전달됩니다. Cloudflare Tunnel이 TLS와 공개 DNS를 담당하며 컨테이너 포트 자체는 로컬 인터페이스에만 바인딩됩니다.

운영 재배포는 저장소 루트의 `main`이 `origin/main`과 정확히 일치하고 추적 파일 변경이 없을 때만 다음 스크립트로 실행합니다. 이미지와 컨테이너에는 배포한 Git 커밋이 OCI 리비전 라벨로 기록됩니다.

```bash
./src/front/scripts/deploy-main.sh
```

### Vercel

- 저장소: `egod1537/jlpt`
- Root Directory: `src/front`
- Install Command: `npm ci`
- Build Command: `npm run build`
- Framework: Next.js

### Cloudflare Pages

- Root Directory: `src/front`
- Build Command: `npm ci && npm run build`
- Output Directory: `out`
- Node.js: 20.9 이상

두 서비스 모두 `/books/session-027/` 같은 직접 접근 경로와 `/data/` 자산을 실제 배포 환경에서 확인해야 합니다. 서버 API, 라우트 핸들러, 데이터베이스는 필요하지 않습니다.

## 제한과 이용 조건

- 사용자 계정, 서버 저장, 여러 기기 동기화, 백그라운드 알림은 없습니다.
- 읽기나 뜻이 확인되지 않은 1,912개 스냅샷 항목은 `needs-review`로 그대로 표시됩니다. 앱은 누락값을 번역하거나 추측하지 않습니다.
- 데이터에는 교재·강의·신문 사설·시험 관련 원자료가 섞여 있습니다. 이 앱과 저장소는 원자료의 재배포 권리를 새로 부여하지 않으므로 공개 게시 전에 각 자료의 이용 조건과 권한을 운영자가 확인해야 합니다.
- 정적 호스팅 서비스마다 없는 경로 처리 방식이 다를 수 있으므로 배포 후 404와 깊은 링크를 확인해야 합니다.
