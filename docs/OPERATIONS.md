# Listening operations and recovery

## Production configuration

Set `JLPT_ACCESS_TOKEN`, `JLPT_APP_ORIGIN`, the durable DB/audio paths, and provider secrets in `.env`. The web service never starts the job loop in Compose; the separate `worker` service runs the bundled `/app/ops/listening-worker.mjs` from the same image. Both services share `/app/var`, while only web mounts `/app/backup`.

The reverse proxy must preserve `Range`, `If-Range`, `Content-Range`, `ETag`, and `Accept-Ranges` headers, allow request bodies slightly above `JLPT_MAX_AUDIO_BYTES` (recommended 210 MB), disable request buffering for the upload route, and use an upload timeout longer than the slowest expected client. Keep the application port bound to loopback or a private Docker network.

Before promotion:

```sh
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
docker compose config
docker compose build
```

After startup, require healthy states for both containers, verify an unauthenticated `/api/books` request returns 401, then test login, a small owned WAV upload, 206 byte range playback, mock/real provider processing, script export, and the Bearer API. A missing Whisper or ChatGPT connection is a soft provider error: existing audio and raw versions remain playable.

## Consistent snapshots

Create a snapshot while services are running:

```sh
docker compose exec -T web node /app/ops/backup.mjs --prune
```

The online SQLite snapshot is taken first. Only audio keys referenced by that immutable snapshot are copied, so an upload committed later cannot create a half-record in the backup. Every DB and audio file is hashed; a missing or changed file aborts the snapshot. The manifest excludes OAuth tokens and all configured secrets. `--prune` keeps seven recent snapshots plus four additional weekly snapshots.

Verify a snapshot before relying on it:

```sh
docker compose exec -T web node /app/ops/restore.mjs \
  --snapshot /app/backup/jlpt-YYYY-MM-DDTHH-MM-SS-sssZ --verify-only
```

Store backup directories on access-controlled encrypted storage. They contain personal audio and transcripts in plaintext. Back up `openai-auth.json` only through a separate secrets process or reconnect OAuth after recovery.

## Restore drill

Stop writers and verify there are no live WAL sidecars before replacement:

```sh
docker compose stop worker web
docker compose run --rm --no-deps web node /app/ops/restore.mjs \
  --snapshot /app/backup/jlpt-YYYY-MM-DDTHH-MM-SS-sssZ --force
docker compose up -d web worker
docker compose exec -T web node /app/ops/listening-fsck.mjs
```

The restore preserves prior DB/audio paths as `.pre-restore-*`; keep them until browser, Range, counts, scripts, and progress are checked. A non-zero fsck result means a DB audio record has no file. Orphans are only reported by default. `--quarantine` moves them to `/app/var/listening/orphan-quarantine/<timestamp>` so cleanup remains recoverable.

## Rollout and rollback

1. Back up the current DB and audio snapshot.
2. Apply migrations by starting the new web image.
3. Start the worker with concurrency 1 and verify its heartbeat health.
4. Run the small fixture workflow and inspect structured worker errors without logging transcript or secret bodies.
5. Observe disk growth, queued/running/failed jobs, provider latency, and memory during a maximum-size streaming upload.
6. Keep the worker alive for at least 24 hours in staging; restart it during a leased mock job and confirm the job returns to queued after lease expiry.

Image rollback alone is not a data rollback after new writes. Stop both services and restore the matching DB+audio snapshot. The deployment script tags the prior image, checks the access boundary, web health, worker heartbeat, image revision, and legacy public-data removal.

## Verification status

Automated tests cover migration, multipart limits, Range/HEAD/416, job retry and lease recovery, GPT validation, script edits and exports, external Bearer auth, access sessions, vocabulary sense splitting, and browser layouts. The mock provider end-to-end path is reproducible locally. Real Whisper quality, OAuth refresh against a live account, proxy behavior on mobile Safari, a 200 MB production upload, 24-hour worker survival, and an operator restore drill remain environment-specific checks and must be recorded as `NOT VERIFIED` until run on the target host.
