# JLPT Vocabulary Dataset

Claude에서 만들었던 JLPT 단어장 자료를 원래 단어장별 파일로 복구한 저장소입니다. 원본 대화 전체나 계정 정보는 포함하지 않고, 단어 데이터와 최소한의 출처 정보만 보존합니다.

## 바로 쓰기

- `data/collections.json`: 단어장 목록과 각 데이터 파일 경로
- `data/wordbooks/session-XXX.json`: 단어장별 JSON 데이터
- `data/wordbooks/session-XXX.csv`: 단어장별 스프레드시트·DB용 데이터
- `data/stats.json`: 수집·정리 결과 통계
- `data/review.json`: 읽기나 뜻을 추가 확인해야 하는 항목
- `schema/word.schema.json`: 단어 객체의 JSON Schema
- `docs/IMPORT_REPORT.md`: 이번 수집 결과와 단어장별 수량

```js
import index from './data/collections.json' with { type: 'json' };
import wordbook from './data/wordbooks/session-008.json' with { type: 'json' };

const readyForStudy = wordbook.words.filter((word) => word.status === 'ready');
```

원래 단어장 하나가 JSON 파일 하나와 CSV 파일 하나에 대응합니다. 서로 다른 단어장에 같은 표현이 있어도 합치지 않으며, 각 파일에는 해당 단어장에서 회수한 뜻과 출처만 들어 있습니다. 파일 안의 단어 순서는 원문에서 처음 발견된 순서를 유지합니다.

## 데이터 원칙

- 단어장 사이의 항목은 병합하지 않습니다.
- 한 단어장 안에서 완전히 같은 일본어 표제어 + 읽기 + 맥락 라벨만 중복 정리합니다.
- 같은 단어장 안의 서로 다른 한국어 뜻은 지우지 않고 `meanings`에 함께 보존합니다.
- 가나만으로 된 표제어는 표제어 자체를 읽기로 사용합니다.
- 읽기 또는 뜻이 확실하지 않은 항목은 버리지 않고 `needs-review`로 표시합니다.
- `sources`에는 원본 아카이브 내부의 상대 경로와 줄 번호만 기록합니다.
- Claude 대화 원문, 사용자 계정 정보, 로그인 기록은 이 저장소에 복사하지 않습니다.

자세한 필드 설명은 [데이터 사전](docs/DATA_DICTIONARY.md), 현재 수집 범위는 [가져오기 보고서](docs/IMPORT_REPORT.md)를 참고하세요.

## 검증

Node.js 20 이상에서 외부 패키지 없이 검증할 수 있습니다.

```bash
npm test
```

검증기는 모든 단어장 JSON·CSV 파일, 단어장 간 출처 격리, ID, 통계, 검수 목록을 확인합니다.

## 원본 아카이브에서 다시 가져오기

현재 저장소에는 생성된 데이터가 이미 포함되어 있습니다. 같은 상위 폴더에 `jlpt-wordbook-archive`가 있을 때 아래 명령으로 다시 만들 수 있습니다.

```bash
npm run import
```

다른 위치의 아카이브를 쓰려면 직접 경로를 넘깁니다.

```bash
node scripts/import-from-archive.mjs /path/to/jlpt-wordbook-archive
```

가져오기 스크립트는 세션별 첨부 파일, 보존된 최종 HTML의 단어 배열, 대화 기록에 남은 업로드 파일 읽기 결과를 회수합니다. 결과는 세션별 파일로 생성되며, 다른 세션의 단어와 합쳐지지 않습니다.

## GitHub에 올리기 전

이 폴더만 별도 저장소로 올릴 수 있습니다. 다만 교재·강의·기출 자료에서 정리된 항목이 섞여 있으므로 공개 저장소로 게시할 때는 각 원자료의 이용 조건을 먼저 확인하세요. 이 저장소는 원자료의 저작권 상태를 새로 부여하지 않습니다.
