# 외부 단어장 API v1

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

## 기계 판독 명세

OpenAPI 3.1 명세는 `/external-api.openapi.json`에서 인증 없이 조회할 수 있습니다. API 탐색 정보는 인증 후 `GET /api/v1`에서 확인할 수 있습니다.
