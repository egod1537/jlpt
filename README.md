# JLPT Vocabulary

## 저장소 구조

```text
src/
  front/  Next.js 정적 웹 앱, UI, 브라우저 학습 상태, 배포 설정
  back/   원본 JSON 검증·복사와 검색 인덱스 생성 파이프라인
jlpt-vocabulary-dataset/
  data/   원본 단어장 JSON·CSV
  schema/ 원본 데이터 스키마
  scripts/기존 데이터 가져오기·검증기
```

런타임 API 서버나 데이터베이스는 없습니다. `src/back/`은 빌드 시 원본 데이터 계약을 검증하고 `src/front/public/data/`를 생성하는 데이터 계층입니다. 사용자 진도는 브라우저에만 저장됩니다.

프런트엔드 개발:

```bash
cd src/front
npm ci
npm run dev
```

운영 배포:

```bash
./src/front/scripts/deploy-main.sh
```

자세한 내용은 [`src/front/README.md`](src/front/README.md)를 참고하세요.
