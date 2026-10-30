# 외부 단어장·청해 API v1

외부 프로그램에서 단어장을 조회하거나 단어와 함께 새 단어장을 생성하는 서버 간 JSON API입니다. 기본 URL은 앱 주소 뒤의 `/api/v1`입니다.

## 인증과 공통 규칙

`.env` 또는 로컬 개발용 `src/front/.env.local`에 16자 이상의 임의 키를 설정하고 서버를 다시 시작합니다.

```dotenv
JLPT_EXTERNAL_API_KEY=충분히-긴-임의의-비밀값
```

모든 `/api/v1` 요청에 다음 헤더를 보냅니다.

```http
Authorization: Bearer <JLPT_EXTERNAL_API_KEY>
Accept: application/json
```

생성 요청에는 `Content-Type: application/json`이 필요합니다. API 키는 URL이나 요청 본문에 넣지 않습니다. 이 API는 서버 간 호출용이며 브라우저 교차 출처 호출을 위한 CORS는 열지 않습니다.

성공 응답은 `data`, 목록 응답은 추가로 `pagination`을 가집니다. 오류는 항상 다음 형식입니다.

```json
{
  "error": {
    "code": "VALIDATION",
    "message": "단어장 형식을 확인해 주세요.",
    "details": {
      "issues": [{ "path": "words.0.meanings", "message": "..." }]
    }
  }
}
```

주요 상태 코드는 `400` 입력 오류, `401` 인증 실패, `404` 리소스 없음, `409` ID/멱등 키 충돌, `413` 5MB 초과, `503` API 키 미설정입니다.

## 단어장 목록

```bash
curl -fsS "http://127.0.0.1:3100/api/v1/books?limit=50&sort=updated" \
  -H "Authorization: Bearer $JLPT_EXTERNAL_API_KEY"
```

지원 쿼리:

| 이름 | 기본값 | 설명 |
| --- | --- | --- |
| `limit` | `50` | 1~100 |
| `cursor` | `0` | 이전 응답의 `pagination.nextCursor` |
| `q` | 없음 | 제목·카테고리·ID 검색 |
| `sort` | `updated` | `updated`, `name`, `created`, `studied`, `custom` |
| `folderId` | 없음 | 폴더 ID, 미분류는 `unfiled` |
| `favorite` | 없음 | `true`이면 즐겨찾기만 조회 |

```json
{
  "data": [{ "id": "book-api-sample", "title": "API 예제", "entryCount": 2 }],
  "pagination": { "limit": 50, "nextCursor": null }
}
```

## 단어장과 단어 일괄 생성

단어장과 `words` 전체는 하나의 트랜잭션으로 저장됩니다. 한 단어라도 유효하지 않으면 아무것도 생성되지 않습니다. `id`, `entryId`, `wordId`는 생략하면 서버가 생성합니다.

```bash
curl -fsS -X POST "http://127.0.0.1:3100/api/v1/books" \
  -H "Authorization: Bearer $JLPT_EXTERNAL_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: import-2026-10-29-001" \
  --data-binary @- <<'JSON'
{
  "id": "book-api-sample",
  "title": "API 예제 단어장",
  "category": "외부 연동",
  "folderId": null,
  "words": [
    {
      "term": "気配",
      "reading": "けはい",
      "meanings": ["기척", "낌새"],
      "primaryMeaning": "기척",
      "nuance": "눈에 보이지 않지만 느껴지는 조짐",
      "partOfSpeech": ["명사"],
      "jlptLevels": ["N1"],
      "examples": [
        { "ja": "人の【気配】を感じる。", "ko": "사람의 기척을 느끼다." }
      ],
      "tags": ["api"]
    }
  ]
}
JSON
```

새 생성은 `201 Created`와 `Location` 헤더를 반환합니다. 같은 `Idempotency-Key`와 같은 본문을 재전송하면 중복 생성 없이 `200 OK`, `Idempotency-Replayed: true`를 반환합니다. 같은 키에 다른 본문을 사용하면 `409`입니다. 네트워크 재시도가 가능한 클라이언트는 고유한 멱등 키를 항상 보내는 것을 권장합니다.

단어 필드:

| 필드 | 필수 | 설명 |
| --- | --- | --- |
| `term` | 예 | 일본어 표제어, 최대 200자 |
| `meanings` | `ready`일 때 예 | 한국어 뜻 배열 |
| `reading`, `primaryMeaning`, `nuance` | 아니요 | 문자열 또는 `null` |
| `partOfSpeech`, `jlptLevels`, `years`, `categories`, `relatedTerms`, `tags` | 아니요 | 배열 |
| `examples` | 아니요 | 최대 1개, `{ "ja": "...", "ko": "..." }` |
| `sources` | 아니요 | 출처 메타데이터 객체 배열 |
| `status` | 아니요 | `ready`(기본값) 또는 `needs-review` |
| `entryId`, `wordId` | 아니요 | 외부에서 ID를 관리할 때만 지정 |

## 단어장 및 단어 조회

메타데이터:

```bash
curl -fsS "http://127.0.0.1:3100/api/v1/books/book-api-sample" \
  -H "Authorization: Bearer $JLPT_EXTERNAL_API_KEY"
```

단어 목록은 위치 기반 커서로 페이지를 넘깁니다. `limit`은 1~200, 첫 `cursor`는 생략합니다.

```bash
curl -fsS "http://127.0.0.1:3100/api/v1/books/book-api-sample/entries?limit=100" \
  -H "Authorization: Bearer $JLPT_EXTERNAL_API_KEY"
```

다음 페이지가 있으면 응답의 `pagination.nextCursor`를 다음 요청의 `cursor`로 그대로 전달합니다.

### GPT 의미 구분 미리보기

새 단어장을 저장하기 전에 `POST /api/v1/books/sense-preview`에 기존 생성 요청과 같은 `words` 배열을 보내면, 서로 다른 실제 의미별 카드 후보를 받을 수 있습니다. 단순 번역 동의어는 합치고, 각 결과는 원본 record/예문만 참조하도록 서버가 검증합니다. 결과의 `words`를 확인·수정한 뒤 일반 `POST /api/v1/books`에 보내 저장합니다.

이 분석 API는 선택 사항입니다. ChatGPT 연결이 없거나 분류가 실패해도 기존 단어장 생성 API는 막히지 않으며 원본 `words`를 그대로 저장할 수 있습니다. 이미 저장된 단어와 학습 기록은 이 API로 자동 재분류하지 않습니다. 동일 입력·모델·프롬프트 결과는 서버에서 캐시합니다.

## 기계 판독 명세

OpenAPI 3.1 명세는 `/external-api.openapi.json`에서 인증 없이 조회할 수 있습니다. API 탐색 정보는 인증 후 `GET /api/v1`에서 확인할 수 있습니다.

## 청해 라이브러리 API

청해 API의 기본 경로는 `/api/v1/listening`입니다. 위와 같은 Bearer 키가 모든 요청에 필요하며, 브라우저 URL·query·localStorage에 API 키를 넣지 마세요. 서버 간 HTTPS 호출, VPN 또는 별도 접근 경계 안에서 사용하는 것을 권장합니다. CORS wildcard는 제공하지 않습니다.

폴더와 세트 목록은 안정적인 offset cursor를 사용합니다. `limit` 기본값은 50, 최댓값은 100이며, 다음 요청에는 응답의 `pagination.nextCursor`를 그대로 전달합니다. 세트는 `q`, `folderId`(`unfiled` 포함), `sort=updated|name|created|custom`을 지원합니다.

```bash
curl -fsS "http://127.0.0.1:3100/api/v1/listening/sets?limit=50&sort=updated" \
  -H "Authorization: Bearer $JLPT_EXTERNAL_API_KEY"
```

폴더·세트 생성과 수정:

```bash
curl -fsS -X POST "http://127.0.0.1:3100/api/v1/listening/sets" \
  -H "Authorization: Bearer $JLPT_EXTERNAL_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: listening-set-001" \
  -d '{"title":"N1 실전 청해","folderId":null}'

curl -fsS -X PATCH "http://127.0.0.1:3100/api/v1/listening/sets/ls-..." \
  -H "Authorization: Bearer $JLPT_EXTERNAL_API_KEY" \
  -H "Content-Type: application/json" \
  -H 'If-Match: W/"1"' \
  -d '{"title":"N1 실전 청해 1"}'
```

PATCH는 본문의 `expectedRevision` 또는 `If-Match`가 필요합니다. DELETE는 `?expectedRevision=1`을 사용합니다. 버전이 다르면 `409 CONFLICT`이며 기존 데이터는 바뀌지 않습니다. 폴더를 삭제하면 그 폴더의 직계 하위 폴더와 세트는 루트/미분류로 이동하고, 세트·음원 삭제는 soft delete입니다.

soft delete 복구는 `POST .../folders/{id}/restore`, `POST .../sets/{id}/restore`, `POST .../audio/{id}/restore`에 현재 삭제 레코드의 `expectedRevision`을 보냅니다. 세트 복구는 그 세트 삭제와 같은 시각에 삭제된 소속 음원도 함께 복구하며, 상위 폴더가 남아 있지 않으면 미분류에 둡니다. 음원 파일이 실제로 누락된 경우 운영 `listening-fsck.mjs`로 식별해야 합니다.

### 음원 업로드와 비동기 처리

한 요청에 음원 하나를 `file` 필드로 보냅니다. MP3, M4A, WAV, OGG, WEBM을 지원하며 서버의 `JLPT_MAX_AUDIO_BYTES` 제한을 적용합니다. 업로드는 메모리에 전체 파일을 올리지 않고 검증·저장하며, 성공하면 Whisper 전사 작업을 자동으로 큐에 넣습니다.

```bash
curl -fsS -X POST "http://127.0.0.1:3100/api/v1/listening/sets/ls-.../audio" \
  -H "Authorization: Bearer $JLPT_EXTERNAL_API_KEY" \
  -H "Idempotency-Key: audio-upload-001" \
  -F "file=@./lesson.mp3;type=audio/mpeg"
```

`201` 응답의 `data.audio.id`와 `data.jobId`를 보관합니다. `autoTranscribe`는 항상 `true`입니다. 같은 멱등 키와 같은 파일을 다시 보내면 파일이나 작업을 중복 생성하지 않고 `Idempotency-Replayed: true`를 반환합니다. 같은 키를 다른 파일에 사용하면 `409`입니다.

```bash
curl -fsS "http://127.0.0.1:3100/api/v1/listening/jobs/lj-..." \
  -H "Authorization: Bearer $JLPT_EXTERNAL_API_KEY"
```

작업 상태는 `queued`, `running`, `waiting_auth`, `completed`, `failed`, `canceled` 중 하나입니다. `stage`, 0~1 범위의 `progress`, 실패 시 `error`가 함께 옵니다. 전사나 GPT 교정 요청은 외부 AI 완료까지 HTTP 연결을 유지하지 않고 항상 `202` 작업을 반환합니다. `POST .../jobs/{jobId}/retry`는 실패·인증대기·취소된 단계만 재시도합니다.

### 스크립트, 버전과 스트리밍

```bash
curl -fsS "http://127.0.0.1:3100/api/v1/listening/audio/la-.../script" \
  -H "Authorization: Bearer $JLPT_EXTERNAL_API_KEY"

curl -fsS "http://127.0.0.1:3100/api/v1/listening/audio/la-.../stream" \
  -H "Authorization: Bearer $JLPT_EXTERNAL_API_KEY" \
  -H "Range: bytes=0-65535" -o first-part.bin
```

스트림은 `200`, 단일 byte range에는 `206`, 잘못된 range에는 `416`을 반환하며 파일 전체를 서버 메모리에 버퍼링하지 않습니다. URL에 API 키를 넣지 마세요.

`GET .../versions`는 raw/GPT/manual 버전을, `POST .../activate`는 `{ "versionId":"...", "expectedRevision":3 }`로 활성 버전을 바꿉니다. `PATCH .../script`는 같은 revision 규칙 아래 `update`, `split`, `merge` 작업 배열을 받아 원본을 덮어쓰지 않고 새 manual 버전을 만듭니다.

내보내기는 다음과 같습니다.

```bash
curl -fsS "http://127.0.0.1:3100/api/v1/listening/audio/la-.../export?format=srt&lang=bilingual" \
  -H "Authorization: Bearer $JLPT_EXTERNAL_API_KEY" -OJ
```

`format=json|txt|srt`, `lang=ja|ko|bilingual`을 지원합니다. 외부 응답에는 서버 파일 경로, Whisper 설정·토큰, ChatGPT OAuth access/refresh token이 포함되지 않습니다.

청해 API의 주요 상태 코드는 `400` 입력 오류, `401` 인증 실패, `404` 없음, `409` revision/멱등 충돌, `413` 크기 제한, `415` 미지원 미디어, `503` API 키 또는 필수 백엔드 미설정입니다.
