# Back data pipeline

이 디렉터리는 런타임 웹 서버가 아니라 빌드 시 데이터 계층입니다. `scripts/sync-data.mjs`가 `jlpt-vocabulary-dataset/data/`의 원본 JSON을 검증하고 프런트엔드용 정적 데이터와 검색 인덱스를 `src/front/public/data/`에 생성합니다.

프런트엔드 디렉터리에서 다음 명령으로 실행합니다.

```bash
cd src/front
npm run sync:data
```
