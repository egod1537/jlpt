# Deployment access boundary

The app has an in-process access boundary for all private pages and `/api/*` routes. Set a high-entropy value of at least 16 characters before any non-development deployment:

```dotenv
JLPT_ACCESS_TOKEN=replace-with-a-long-random-secret
```

Open `/login` and enter that value. The server compares it in constant time and stores only a derived, `HttpOnly`, `SameSite=Lax` session cookie. The secret is never placed in a URL or localStorage. HTTPS requests receive a Secure cookie. Rotating `JLPT_ACCESS_TOKEN` immediately invalidates old sessions.

Development mode permits an unconfigured loopback host (`127.0.0.1`, `localhost`, or `[::1]`) so `npm run dev:local` stays convenient. A production process fails closed with `503` when the secret is missing and returns `401` when the session is missing. `JLPT_ALLOW_INSECURE_LOOPBACK=true` is only for isolated automated tests; do not set it on a deployment.

Keep a second outer boundary such as Cloudflare Access, a VPN, or an authenticated reverse proxy over TLS. The app-level session is defense in depth, not a replacement for network access control. The proxy must preserve cookies, upload limits, and `Range`/`206` responses. Before release, verify in a private browser and curl that unauthenticated requests to `/listening`, `/api/bootstrap`, `/api/openai/status`, and an audio stream are rejected, while an authenticated session can upload and stream audio.

The versioned server-to-server routes under `/api/v1` use `JLPT_EXTERNAL_API_KEY` as their Bearer service credential. Generate a separate high-entropy value, transmit it only over HTTPS, keep it out of URLs and logs, and rotate it if exposed. Missing or short values disable those routes. Configure the outer access boundary to admit the intended service identity.

Audio lives outside `public/`; the browser stream and all transcript routes require an authenticated session. OAuth access/refresh tokens, Whisper credentials, internal URLs and filesystem paths are never included in external API responses or ordinary backups. Logs contain identifiers/stages/error codes, not credentials, audio contents, or transcript payloads.

Take a SQLite and audio backup before deployment or destructive maintenance. This repository change does not deploy automatically, and a release must not be described as private or complete until the unauthenticated deployment checks pass.
