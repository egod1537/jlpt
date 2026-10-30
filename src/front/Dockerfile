FROM node:24.14.0-bookworm-slim AS builder

WORKDIR /workspace
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY src/front/package.json ./src/front/package.json
RUN npm ci \
  && case "$(dpkg --print-architecture)" in \
    arm64) npm install --no-save lightningcss-linux-arm64-gnu@1.30.2 @tailwindcss/oxide-linux-arm64-gnu@4.1.17 ;; \
    amd64) npm install --no-save lightningcss-linux-x64-gnu@1.30.2 @tailwindcss/oxide-linux-x64-gnu@4.1.17 ;; \
    *) echo "unsupported build architecture" >&2; exit 1 ;; \
  esac

COPY src/front/ ./src/front/
COPY src/back/ ./src/back/
COPY dataset/data/ ./dataset/data/

RUN npm run build \
  && ./src/front/node_modules/.bin/esbuild src/back/scripts/listening-worker.ts --bundle --platform=node --target=node24 --format=esm --conditions=react-server --tsconfig=src/front/tsconfig.json --external:better-sqlite3 --outfile=src/front/.next/listening-worker.mjs \
  && test -f src/front/.next/standalone/src/front/server.js \
  && test -f src/front/.next/listening-worker.mjs \
  && test -d src/front/.next/standalone/node_modules/better-sqlite3 \
  && test ! -d src/front/public/data

FROM node:24.14.0-bookworm-slim AS runtime

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg \
  && rm -rf /var/lib/apt/lists/*

ARG VCS_REF=unknown
LABEL org.opencontainers.image.revision="${VCS_REF}" \
  org.opencontainers.image.source="https://github.com/egod1537/jlpt"

ENV NODE_ENV=production \
  NEXT_TELEMETRY_DISABLED=1 \
  PORT=3000 \
  HOSTNAME=0.0.0.0 \
  JLPT_DB_PATH=/app/var/jlpt.sqlite \
  JLPT_SEED_DATA=/app/seed-data \
  JLPT_MIGRATIONS_DIR=/app/migrations \
  JLPT_BACKUP_DIR=/app/backup \
  JLPT_AUDIO_DIR=/app/var/listening/audio \
  JLPT_AUDIO_TMP_DIR=/app/var/listening/tmp

WORKDIR /app
COPY --chown=node:node --from=builder /workspace/src/front/.next/standalone/ ./
COPY --chown=node:node --from=builder /workspace/src/front/.next/static/ ./src/front/.next/static/
COPY --chown=node:node --from=builder /workspace/src/front/public/ ./src/front/public/
COPY --chown=node:node --from=builder /workspace/src/back/db/migrations/ ./migrations/
COPY --chown=node:node --from=builder /workspace/dataset/data/ ./seed-data/
COPY --chown=node:node --from=builder /workspace/src/back/scripts/backup.mjs ./ops/backup.mjs
COPY --chown=node:node --from=builder /workspace/src/back/scripts/restore.mjs ./ops/restore.mjs
COPY --chown=node:node --from=builder /workspace/src/back/scripts/listening-fsck.mjs ./ops/listening-fsck.mjs
COPY --chown=node:node --from=builder /workspace/src/front/.next/listening-worker.mjs ./ops/listening-worker.mjs

USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/healthz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]

CMD ["node", "src/front/server.js"]
