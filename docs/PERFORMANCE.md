# Performance report

Measured on 2026-10-28 with Node 24.14.0, SQLite 3.53.4, macOS arm64, an in-memory database, 28 books and 6,661 entries. Each SQL case used five warm-ups followed by 20 measured runs. Re-run with `npm run benchmark`.

| Path | Before median / p95 | After median / p95 | Response payload |
| --- | ---: | ---: | ---: |
| Book list with progress counts | 1.168 / 1.196 ms | 0.662 / 0.706 ms | 14,222 → 13,690 B |
| Normalized word search (`시험`) | 23.416 / 29.233 ms | 12.415 / 12.955 ms | 4,460 → 4,033 B |
| First 20 study cards | 14.507 / 15.643 ms | 2.177 / 2.206 ms | 6,597,381 → 6,241 B |

The book query now aggregates entry/review counts once instead of running three correlated subqueries for every book. Search filtering runs inside SQLite through a deterministic normalization function, so at most the requested page crosses into JavaScript. Study selection obtains eligible word IDs in SQL first and loads occurrences only for the selected page. The added partial indexes cover due-state scans, active entry status/book/word selection, pinned folders and bookmark recency.

Frontend interaction marks are exposed as `library-expand`, `study-hint-meaning`, `study-hint-reading`, and `study-card-transition`. The Playwright suite asserts warmed tree expansion and hint display below 100 ms and the post-durable-write card transition below 200 ms. Sync focus/visibility triggers are coalesced to 20 seconds, no-op pulls no longer invalidate screens, list screens render IndexedDB data before background refresh, searches debounce for 200 ms, and stale list fetches are ignored.

These are local reproducible measurements, not production latency guarantees. Network, filesystem and device conditions still affect end-to-end time.
