import { performance } from "node:perf_hooks";
import path from "node:path";
import { openDatabase } from "@back/lib/db/database";
import { listBooks, searchCatalog } from "@back/lib/catalog/queries";
import { normalizeSearch } from "@back/lib/catalog/normalize";
import { seedDatabase } from "@back/lib/seed/seed";

const db = openDatabase(":memory:");
seedDatabase(db, path.resolve(process.cwd(), "..", "..", "dataset", "data"));

function measure(run: () => unknown) {
  for (let index = 0; index < 5; index += 1) run();
  const times: number[] = [];
  let result: unknown;
  for (let index = 0; index < 20; index += 1) {
    const started = performance.now();
    result = run();
    times.push(performance.now() - started);
  }
  times.sort((a, b) => a - b);
  return { medianMs: Number(times[9].toFixed(3)), p95Ms: Number(times[18].toFixed(3)), payloadBytes: Buffer.byteLength(JSON.stringify(result)) };
}

const legacyBookSql = `SELECT b.*,
  (SELECT COUNT(*) FROM book_entries e WHERE e.book_id=b.id AND e.deleted_at IS NULL) entry_count,
  (SELECT COUNT(DISTINCT e.word_id) FROM book_entries e JOIN review_states r ON r.word_id=e.word_id WHERE e.book_id=b.id AND e.deleted_at IS NULL AND r.last_reviewed_at IS NOT NULL) studied_count,
  (SELECT MAX(r.last_reviewed_at) FROM book_entries e JOIN review_states r ON r.word_id=e.word_id WHERE e.book_id=b.id AND e.deleted_at IS NULL) last_studied_at
  FROM books b WHERE b.deleted_at IS NULL ORDER BY b.order_index,b.title COLLATE NOCASE,b.id LIMIT 500`;
const legacyBookStatement = db.prepare(legacyBookSql);

const legacySearchStatement = db.prepare("SELECT e.*,b.title book_title FROM book_entries e JOIN books b ON b.id=e.book_id WHERE e.deleted_at IS NULL AND b.deleted_at IS NULL ORDER BY e.updated_at DESC LIMIT 10000");
const searchNeedle = normalizeSearch("시험");

const legacyStudyStatement = db.prepare(`SELECT e.*,b.title book_title,r.due_at,r.last_reviewed_at,r.last_rating
  FROM book_entries e JOIN books b ON b.id=e.book_id LEFT JOIN review_states r ON r.word_id=e.word_id
  WHERE e.deleted_at IS NULL AND b.deleted_at IS NULL ORDER BY b.order_index,e.position,e.entry_id`);
const optimizedStudyStatement = db.prepare(`WITH eligible AS (
    SELECT e.word_id,MIN(b.order_index) book_order,MIN(e.position) entry_order
    FROM book_entries e JOIN books b ON b.id=e.book_id
    WHERE e.deleted_at IS NULL AND b.deleted_at IS NULL AND e.status='ready'
    GROUP BY e.word_id ORDER BY book_order,entry_order,e.word_id LIMIT 20
  ) SELECT e.entry_id,e.word_id,e.term,e.reading,e.meanings_json,b.title book_title
    FROM eligible q JOIN book_entries e ON e.word_id=q.word_id JOIN books b ON b.id=e.book_id
    WHERE e.deleted_at IS NULL AND b.deleted_at IS NULL ORDER BY q.book_order,q.entry_order,e.entry_id`);

const report = {
  environment: { node: process.version, sqlite: (db.prepare("SELECT sqlite_version() version").get() as { version: string }).version, runs: 20, warmups: 5, rows: Number((db.prepare("SELECT COUNT(*) count FROM book_entries").get() as { count: number }).count) },
  books: {
    before: measure(() => legacyBookStatement.all()),
    after: measure(() => listBooks(db, { sort: "custom", limit: 500 })),
    legacyPlan: db.prepare("EXPLAIN QUERY PLAN " + legacyBookSql).all(),
  },
  wordSearch: {
    before: measure(() => (legacySearchStatement.all() as Array<Record<string, unknown>>).filter((row) => normalizeSearch(String(row.term) + " " + String(row.reading || "") + " " + String(row.meanings_json) + " " + String(row.tags_json)).includes(searchNeedle)).slice(0, 50)),
    after: measure(() => searchCatalog(db, "시험", "words", 50)),
  },
  studyCards20: {
    before: measure(() => legacyStudyStatement.all()),
    after: measure(() => optimizedStudyStatement.all()),
    optimizedPlan: db.prepare("EXPLAIN QUERY PLAN " + optimizedStudyStatement.source).all(),
  },
};

console.log(JSON.stringify(report, null, 2));
db.close();
