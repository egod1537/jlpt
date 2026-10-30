# Whisper integration

Verified on 2026-10-30 against `https://whisper.mangagaki.net`. The similarly named `whisper.managagki.net` does not resolve in DNS.

## Verified contract

- `GET /api/v1/system/status` reports provider reachability and the `large-v3` model.
- `POST /api/v1/jobs` accepts multipart fields `file`, `language=ja`, and `formats=json`. `Idempotency-Key` is supported.
- The submission response contains an asynchronous job `id`.
- `GET /api/v1/jobs/{id}` returns `queued`, `processing`, `completed`, `failed`, or `canceled` state.
- `GET /api/v1/jobs/{id}/results/json` returns `text`, `languageDetected`, and `segments[]` with integer `startMs`, `endMs`, and `text`.
- The browser client also exposes resumable `/uploads` endpoints, but the JLPT adapter uses the simpler streaming multipart job endpoint.
- Bearer auth is supported by the client contract and is sent only when `WHISPER_AUTH_TOKEN` is configured.

The probe used a generated 0.4-second silent WAV containing no user data. It completed successfully, but returned a segment ending at 29.98 seconds. The JLPT worker therefore rejects negative, unordered, empty-duration, or audio-duration-exceeding timestamps instead of trusting the provider.

## Important provider limitation

The JSON response includes `postProcessingMetadata.provider=chatgpt_plan`; the public API does not expose the pre-GPT Whisper segments even though it says raw files are preserved inside the provider. Consequently, this adapter preserves the exact provider response as an immutable `whisper_raw` version, but a strictly pre-GPT Whisper transcript is **not verified and not obtainable through the observed API**. Deployments that require a true raw Whisper layer must configure a compatible provider contract or extend this provider.

## Configuration

The application does not send private audio to any remote host until `WHISPER_BASE_URL` is explicitly set.

```dotenv
WHISPER_BASE_URL=https://whisper.mangagaki.net
WHISPER_TRANSCRIBE_PATH=/api/v1/jobs
WHISPER_AUTH_TOKEN=
WHISPER_TIMEOUT_MS=600000
WHISPER_ALLOWED_HOSTS=whisper.mangagaki.net
```

The base URL comes only from server configuration. Requests cannot supply a provider URL. `WHISPER_ALLOWED_HOSTS` additionally constrains the configured host and prevents per-request SSRF.
