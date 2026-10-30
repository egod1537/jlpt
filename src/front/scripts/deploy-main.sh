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
deployment_remote_revision=$(git rev-parse origin/main)
if ! git merge --ff-only "$deployment_remote_revision"; then
  echo "배포 중단: 로컬 main을 origin/main 최신 커밋으로 fast-forward할 수 없습니다." >&2
  exit 1
fi
deployment_revision=$(git rev-parse HEAD)
if [ "$deployment_revision" != "$deployment_remote_revision" ]; then
  echo "배포 중단: 배포 커밋과 origin/main 최신 커밋이 일치하지 않습니다." >&2
  exit 1
fi

if [ -n "$(git status --porcelain --untracked-files=all -- package.json package-lock.json docker-compose.yml src/front src/back dataset/data)" ]; then
  echo "배포 중단: Docker 빌드 입력에 커밋되지 않은 파일이 있습니다." >&2
  exit 1
fi

deployment_previous_legacy=false
rollback_deployment() {
  if ! docker image inspect jlpt-vocabulary-web:rollback >/dev/null 2>&1; then
    echo "롤백 이미지가 없어 자동 복구할 수 없습니다." >&2
    return
  fi
  echo "이전 이미지로 컨테이너를 되돌립니다. DB migration 이후 쓰기는 별도 복구 판단이 필요합니다." >&2
  if [ "$deployment_previous_legacy" = "true" ]; then
    docker rm -f jlpt-vocabulary-web >/dev/null 2>&1 || true
    docker run -d --name jlpt-vocabulary-web --restart unless-stopped \
      --network jjs-edge --network-alias jlpt-vocabulary-web \
      -p "127.0.0.1:${JLPT_WEB_PORT:-8081}:8080" \
      --label net.mangagaki.deployment.branch=main \
      jlpt-vocabulary-web:rollback >/dev/null
  else
    JLPT_IMAGE_TAG=rollback docker compose up -d --no-build web worker
  fi
}

if docker inspect jlpt-vocabulary-web >/dev/null 2>&1; then
  deployment_previous_image=$(docker inspect --format '{{.Image}}' jlpt-vocabulary-web)
  docker image tag "$deployment_previous_image" jlpt-vocabulary-web:rollback
  if docker compose exec -T web test -f /app/ops/backup.mjs >/dev/null 2>&1; then
    docker compose exec -T web node /app/ops/backup.mjs --prune
  else
    deployment_previous_legacy=true
    echo "안내: 현재 컨테이너는 구 정적 버전이므로 SQLite 백업을 건너뜁니다."
  fi
fi

JLPT_GIT_BRANCH="$deployment_branch" JLPT_GIT_REVISION="$deployment_revision" JLPT_IMAGE_TAG="$deployment_revision" docker compose up -d --build

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
  rollback_deployment
  exit 1
fi

if ! curl -fsS "http://127.0.0.1:${JLPT_WEB_PORT:-8081}/healthz" >/dev/null; then
  echo "배포 실패: localhost health 확인에 실패했습니다." >&2
  rollback_deployment
  exit 1
fi
deployment_api_status=$(curl -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:${JLPT_WEB_PORT:-8081}/api/books")
if [ "$deployment_api_status" != "401" ]; then
  echo "배포 실패: 비인증 데이터 API가 401을 반환하지 않았습니다 ($deployment_api_status)." >&2
  rollback_deployment
  exit 1
fi
deployment_data_status=$(curl -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:${JLPT_WEB_PORT:-8081}/data/collections.json")
if [ "$deployment_data_status" != "404" ]; then
  echo "배포 실패: 구 정적 데이터 URL이 404가 아닙니다 ($deployment_data_status)." >&2
  rollback_deployment
  exit 1
fi
deployment_running_revision=$(docker inspect --format '{{ index .Config.Labels "org.opencontainers.image.revision" }}' jlpt-vocabulary-web)
if [ "$deployment_running_revision" != "$deployment_revision" ]; then
  echo "배포 실패: 실행 중인 컨테이너 revision이 배포 커밋과 다릅니다 ($deployment_running_revision)." >&2
  rollback_deployment
  exit 1
fi
deployment_worker_attempt=0
deployment_worker_health=""
while [ "$deployment_worker_attempt" -lt 30 ]; do
  deployment_worker_health=$(docker inspect --format '{{.State.Health.Status}}' jlpt-vocabulary-worker 2>/dev/null || true)
  if [ "$deployment_worker_health" = "healthy" ]; then
    break
  fi
  deployment_worker_attempt=$((deployment_worker_attempt + 1))
  sleep 1
done
if [ "$deployment_worker_health" != "healthy" ]; then
  echo "배포 실패: listening worker 헬스체크가 통과하지 못했습니다 ($deployment_worker_health)." >&2
  docker compose logs --tail=100 worker >&2
  rollback_deployment
  exit 1
fi

echo "main 최신 커밋 배포 완료: $deployment_revision"
