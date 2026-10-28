# 데이터 사전

## `data/collections.json`

원래 단어장 목록과 개별 파일 경로를 담은 인덱스입니다.

| 필드 | 설명 |
|---|---|
| `id` | 단어장 ID (`session-001` 형식) |
| `title` | 원래 대화/단어장 제목 |
| `category` | 아카이브 분류 |
| `createdAt` | 원본 세션 생성일 |
| `dataFile` | 해당 단어장 JSON 경로 |
| `csvFile` | 해당 단어장 CSV 경로 |
| `wordCount` | 파일 안의 단어 수 |
| `sourceRecordCount` | 단어장 내부 중복 정리 전 회수 레코드 수 |

## `data/wordbooks/session-XXX.json`

단어장 하나의 메타데이터와 단어 배열을 담습니다. 서로 다른 단어장 데이터는 섞이지 않습니다.

최상위 필드:

| 필드 | 설명 |
|---|---|
| `schemaVersion` | 데이터 구조 버전 |
| `generatedAt` | 데이터 생성 시각 |
| `id`, `title`, `category` | 단어장 식별 정보 |
| `createdAt` | 원본 세션 생성일 |
| `sourceSession` | 아카이브의 세션 폴더명 |
| `sourceFiles` | 사용된 입력 파일의 유형·해시·상대 경로 |
| `sourceRecordCount` | 중복 정리 전 회수 레코드 수 |
| `total` | 파일 안의 단어 수 |
| `words` | 해당 단어장의 단어 객체 배열 |

단어 객체:

| 필드 | 형식 | 설명 |
|---|---|---|
| `id` | string | 내용 기반의 안정적인 ID |
| `term` | string | 일본어 표제어 또는 표현 |
| `reading` | string/null | 히라가나·가타카나 읽기 |
| `meanings` | string[] | 이 단어장에서 회수한 한국어 뜻 목록 |
| `primaryMeaning` | string/null | 사이트 기본 표시에 쓸 첫 번째 뜻 |
| `nuance` | string/null | 다의어 카드의 문맥 라벨 |
| `partOfSpeech` | string[] | 원문에 명시된 품사 |
| `jlptLevels` | string[] | 원문에 명시되거나 단어장에서 확실한 급수 |
| `years` | number[] | 기출 자료에 표시된 연도 |
| `categories` | string[] | 원본 아카이브의 분류 |
| `collectionIds` | string[] | 현재 단어장 ID 하나만 포함 |
| `relatedTerms` | string[] | 원문에서 `≒`로 연결된 유의 표현 |
| `examples` | object[] | 회수 가능한 경우의 일본어·한국어 예문 |
| `sources` | object[] | 현재 단어장에 속한 출처 파일·줄·세션 정보 |
| `status` | string | `ready` 또는 `needs-review` |

`status`가 `ready`가 되려면 뜻이 하나 이상 있어야 하며, 한자가 들어간 표제어에는 읽기도 있어야 합니다. 가나 표제어는 자동으로 자체 읽기를 사용합니다.

## 사이트 적용 권장 방식

- 단어장 메뉴: `collections.json`을 읽어 `dataFile`별로 표시
- 단어장 학습: 선택한 `dataFile`의 `words` 사용
- 검수 화면: `review.json`의 `collectionId`와 `id`로 해당 파일의 단어 조회
- 다의어 표시: `nuance`가 있으면 표제어 아래에 항상 표시
