# Public deployment boundary

The browser app and its internal `/api/*` routes are intentionally public on this personal server. They have no app login, password, access-token gate, or session cookie. Do not add or enable one unless the user explicitly requests it in the current task.

State-changing browser requests still require a same-origin request matching `JLPT_APP_ORIGIN`. This is CSRF protection, not user authentication. The reverse proxy must preserve upload limits and `Range`/`206` responses, and the application port stays bound to loopback or a private Docker network.

The versioned server-to-server routes under `/api/v1` may use `JLPT_EXTERNAL_API_KEY` as an optional Bearer service credential. This does not gate the browser app. Missing or short values disable those service routes.

The optional ChatGPT OAuth flow connects an external provider only when the user starts it from settings. It is not an app-access login. OAuth tokens, Whisper credentials, internal URLs, and filesystem paths are never included in ordinary API responses or backups.

Audio lives outside `public/`, but its browser routes remain publicly reachable through the app. Logs contain identifiers, stages, and error codes rather than credentials, audio contents, or transcript payloads.

Before release, verify that `/login`, `/api/access/login`, and `/api/access/logout` return 404, while `/books`, `/listening`, `/api/bootstrap`, and `/api/books` open without a session. Also verify that cross-origin mutations remain rejected.
