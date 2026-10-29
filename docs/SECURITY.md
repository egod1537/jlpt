# Deployment access boundary

The application intentionally has no in-app login. Its same-origin checks reduce accidental cross-site mutation requests, but `Origin` is not authentication and does not make a publicly reachable deployment private.

Before a production rollout, protect the entire host—including API routes—with an external access boundary such as Cloudflare Access, a VPN, or reverse-proxy basic authentication over TLS. Verify in a private browser that an unauthenticated request to both `/books` and `/api/bootstrap` is rejected by that boundary, then verify an authorized session can use sync, backup and restore.

The versioned server-to-server routes under `/api/v1` additionally require `JLPT_EXTERNAL_API_KEY` as a Bearer token. Generate a high-entropy value, transmit it only over HTTPS, keep it out of URLs and logs, and rotate it if exposed. An empty or shorter-than-16-character value keeps these routes disabled. Configure the external access boundary to admit only the intended service identity; the API key is not a replacement for TLS or the host-level access boundary.

Database migration 003 is forward-only and keeps existing books, entries, progress, sessions and preferences. Take a SQLite backup before deployment. The v2 JSON backup includes folder pins, bookmarks and loop queues; restore still accepts v1 backups and supplies safe defaults for the new fields.

This repository change does not deploy automatically. A deployment must not be described as private or complete until the external access-control check above passes.
