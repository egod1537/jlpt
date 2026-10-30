#!/bin/sh
set -eu

deployment_root=$(git rev-parse --show-toplevel)
cd "$deployment_root"

deployment_state_dir=${JLPT_DEPLOY_STATE_DIR:-"$deployment_root/.git/jlpt-main-deploy"}
deployment_failed_revision_file="$deployment_state_dir/failed-revision"
mkdir -p "$deployment_state_dir"

log_deployment() {
  printf '%s %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$*"
}

git fetch --quiet origin main
deployment_remote_revision=$(git rev-parse --verify refs/remotes/origin/main)

if [ -f "$deployment_failed_revision_file" ] \
  && [ "$(sed -n '1p' "$deployment_failed_revision_file")" = "$deployment_remote_revision" ]; then
  exit 0
fi

deployment_web_revision=$(docker inspect --format '{{ index .Config.Labels "org.opencontainers.image.revision" }}' jlpt-vocabulary-web 2>/dev/null || true)
deployment_web_health=$(docker inspect --format '{{ if .State.Health }}{{ .State.Health.Status }}{{ end }}' jlpt-vocabulary-web 2>/dev/null || true)
deployment_worker_health=$(docker inspect --format '{{ if .State.Health }}{{ .State.Health.Status }}{{ end }}' jlpt-vocabulary-worker 2>/dev/null || true)
deployment_worker_image=$(docker inspect --format '{{ .Config.Image }}' jlpt-vocabulary-worker 2>/dev/null || true)

if [ "$deployment_web_revision" = "$deployment_remote_revision" ] \
  && [ "$deployment_web_health" = "healthy" ] \
  && [ "$deployment_worker_health" = "healthy" ] \
  && [ "$deployment_worker_image" = "jlpt-vocabulary-web:$deployment_remote_revision" ]; then
  exit 0
fi

deployment_branch=$(git branch --show-current)
if [ "$deployment_branch" != "main" ]; then
  log_deployment "자동 배포 보류: 현재 브랜치가 main이 아닙니다 ($deployment_branch)."
  exit 0
fi

if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  log_deployment "자동 배포 보류: 추적 파일에 커밋되지 않은 변경이 있습니다."
  exit 0
fi

deployment_local_revision=$(git rev-parse HEAD)
if ! git merge-base --is-ancestor "$deployment_local_revision" "$deployment_remote_revision"; then
  log_deployment "자동 배포 보류: 로컬 main을 origin/main으로 fast-forward할 수 없습니다."
  exit 0
fi

if [ -n "$(git status --porcelain --untracked-files=all -- package.json package-lock.json docker-compose.yml src/front src/back dataset/data)" ]; then
  log_deployment "자동 배포 보류: Docker 빌드 입력에 커밋되지 않은 파일이 있습니다."
  exit 0
fi

if ! docker info >/dev/null 2>&1; then
  log_deployment "자동 배포 보류: Docker daemon에 연결할 수 없습니다."
  exit 0
fi

log_deployment "origin/main 변경 또는 비정상 컨테이너 감지: $deployment_remote_revision"
if "$deployment_root/src/front/scripts/deploy-main.sh"; then
  rm -f "$deployment_failed_revision_file"
  log_deployment "자동 배포 완료: $deployment_remote_revision"
else
  umask 077
  printf '%s\n' "$deployment_remote_revision" > "$deployment_failed_revision_file"
  log_deployment "자동 배포 실패: 같은 revision은 main이 갱신될 때까지 재시도하지 않습니다 ($deployment_remote_revision)."
  exit 1
fi
