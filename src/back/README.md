# Backend

SQLite migration, typed SQL 서비스, 원본 seed, 동기화·통계 로직과 운영 CLI가 있습니다. 런타임 코드는 Next standalone 서버에 포함되며 DB와 백업은 web root 밖에 저장됩니다.

주요 명령은 저장소 루트에서 실행합니다.

```bash
npm run db:migrate
npm run db:seed
npm run db:backup
```

원본 `jlpt-vocabulary-dataset/data`는 수정하지 않습니다.
