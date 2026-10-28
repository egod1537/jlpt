#!/bin/sh
set -eu

deployment_root=$(git rev-parse --show-toplevel)
cd "$deployment_root"

deployment_branch=$(git branch --show-current)
if [ "$deployment_branch" != "main" ]; then
  echo "배포 중단: 현재 브랜치가 main이 아닙니다 ($deployment_branch)." >&2
  exit 1
fi

if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "배포 중단: 추적 파일에 커밋되지 않은 변경이 있습니다." >&2
  exit 1
fi

git fetch origin main
deployment_local_revision=$(git rev-parse HEAD)
deployment_remote_revision=$(git rev-parse origin/main)
if [ "$deployment_local_revision" != "$deployment_remote_revision" ]; then
  echo "배포 중단: 로컬 main과 origin/main이 일치하지 않습니다." >&2
  exit 1
fi

JLPT_GIT_REVISION="$deployment_local_revision" docker compose up -d --build

deployment_attempt=0
while [ "$deployment_attempt" -lt 30 ]; do
  deployment_health=$(docker inspect --format '{{.State.Health.Status}}' jlpt-vocabulary-web 2>/dev/null || true)
  if [ "$deployment_health" = "healthy" ]; then
    break
  fi
  deployment_attempt=$((deployment_attempt + 1))
  sleep 1
done

if [ "${deployment_health:-}" != "healthy" ]; then
  echo "배포 실패: 컨테이너 헬스체크가 통과하지 못했습니다." >&2
  docker compose logs --tail=100 web >&2
  exit 1
fi

curl -fsS http://127.0.0.1:${JLPT_WEB_PORT:-8081}/healthz >/dev/null
echo "main 배포 완료: $deployment_local_revision"
