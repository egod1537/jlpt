import type { AppDatabase } from "@back/lib/db/database";

const KST_OFFSET_MS = 9 * 60 * 60 * 1_000;
const DAY_MS = 24 * 60 * 60 * 1_000;

export interface StatsPeriod { from: string; to: string; fromUtc: string; toExclusiveUtc: string; timeZone: "Asia/Seoul" }

function kstDate(date: Date) { return new Date(date.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10); }
function dateUtc(value: string) { return new Date(`${value}T00:00:00+09:00`); }

export function parseStatsPeriod(from?: string | null, to?: string | null): StatsPeriod {
  const today = kstDate(new Date());
  const end = to || today;
  const start = from || kstDate(new Date(dateUtc(end).getTime() - 6 * DAY_MS));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || kstDate(dateUtc(start)) !== start || kstDate(dateUtc(end)) !== end) throw new Error("날짜 형식이 올바르지 않습니다.");
  const fromDate = dateUtc(start); const toDate = dateUtc(end);
  if (fromDate > toDate || end > today) throw new Error("조회 기간이 올바르지 않습니다.");
  if (toDate.getTime() - fromDate.getTime() > 10 * 365 * DAY_MS) throw new Error("조회 기간은 최대 10년입니다.");
  return { from: start, to: end, fromUtc: fromDate.toISOString(), toExclusiveUtc: new Date(toDate.getTime() + DAY_MS).toISOString(), timeZone: "Asia/Seoul" };
}

function descendantFolderIds(db: AppDatabase, folderId: string) {
  return (db.prepare(`WITH RECURSIVE tree(id) AS (SELECT id FROM folders WHERE id=? AND deleted_at IS NULL UNION ALL SELECT f.id FROM folders f JOIN tree t ON f.parent_id=t.id WHERE f.deleted_at IS NULL) SELECT id FROM tree`).all(folderId) as Array<{ id: string }>).map((row) => row.id);
}

function activeWordIds(db: AppDatabase, folderId?: string | null, bookId?: string | null) {
  let sql = "SELECT DISTINCT e.word_id FROM book_entries e JOIN books b ON b.id=e.book_id WHERE e.deleted_at IS NULL AND b.deleted_at IS NULL";
  const params: unknown[] = [];
  if (bookId) { sql += " AND b.id=?"; params.push(bookId); }
  if (folderId) {
    const folders = descendantFolderIds(db, folderId);
    if (!folders.length) return new Set<string>();
    sql += ` AND b.folder_id IN (${folders.map(() => "?").join(",")})`; params.push(...folders);
  }
  return new Set((db.prepare(sql).all(...params) as Array<{ word_id: string }>).map((row) => row.word_id));
}

type EventRow = { word_id: string; rating: "again" | "hard" | "good" | "easy"; occurred_at: string; accepted_at: string };
type StateRow = { word_id: string; scheduler_version: string; last_rating: string | null; lapses: number; repetitions: number; due_at: string | null };

function periodEvents(db: AppDatabase, period: StatsPeriod, words: Set<string>) {
  return (db.prepare("SELECT word_id,rating,occurred_at,accepted_at FROM review_events WHERE occurred_at>=? AND occurred_at<? ORDER BY occurred_at").all(period.fromUtc, period.toExclusiveUtc) as EventRow[]).filter((event) => words.has(event.word_id));
}

function states(db: AppDatabase, words: Set<string>) {
  return (db.prepare("SELECT word_id,scheduler_version,last_rating,lapses,repetitions,due_at FROM review_states").all() as StateRow[]).filter((state) => words.has(state.word_id));
}

function mastered(state: StateRow) { return state.repetitions >= 3 && (state.last_rating === "good" || state.last_rating === "easy"); }

function streakDays(db: AppDatabase, words: Set<string>) {
  const dates = new Set((db.prepare("SELECT word_id,occurred_at FROM review_events").all() as Array<{ word_id: string; occurred_at: string }>).filter((event) => words.has(event.word_id)).map((event) => kstDate(new Date(event.occurred_at))));
  let cursor = dateUtc(kstDate(new Date()));
  if (!dates.has(kstDate(cursor))) cursor = new Date(cursor.getTime() - DAY_MS);
  let streak = 0;
  while (dates.has(kstDate(cursor))) { streak += 1; cursor = new Date(cursor.getTime() - DAY_MS); }
  return streak;
}

export function statsOverview(db: AppDatabase, period: StatsPeriod, folderId?: string | null, bookId?: string | null) {
  const words = activeWordIds(db, folderId, bookId); const events = periodEvents(db, period, words); const currentStates = states(db, words);
  const studiedUnique = new Set(events.map((event) => event.word_id)).size; const good = events.filter((event) => event.rating === "good" || event.rating === "easy").length;
  const masteredUnique = currentStates.filter(mastered).length; const dueNow = currentStates.filter((state) => state.due_at && Date.parse(state.due_at) <= Date.now()).length;
  return { period: { from: period.from, to: period.to }, timeZone: period.timeZone, studiedUnique, totalReviewEvents: events.length, reviewGoodRate: events.length ? good / events.length : 0, cumulativeStudiedUnique: currentStates.length, masteredUnique, masteryRate: currentStates.length ? masteredUnique / currentStates.length : 0, dueNow, streakDays: streakDays(db, words), legacyImportedCount: currentStates.filter((state) => state.scheduler_version === "legacy-v1").length };
}

function datesInPeriod(period: StatsPeriod) {
  const dates: string[] = []; let cursor = dateUtc(period.from); const end = dateUtc(period.to);
  while (cursor <= end) { dates.push(kstDate(cursor)); cursor = new Date(cursor.getTime() + DAY_MS); }
  return dates;
}

export function statsDaily(db: AppDatabase, period: StatsPeriod, folderId?: string | null, bookId?: string | null) {
  const words = activeWordIds(db, folderId, bookId); const events = periodEvents(db, period, words);
  const firstDates = new Map((db.prepare("SELECT word_id,MIN(occurred_at) first_at FROM review_events GROUP BY word_id").all() as Array<{ word_id: string; first_at: string }>).map((row) => [row.word_id, kstDate(new Date(row.first_at))]));
  return datesInPeriod(period).map((date) => {
    const daily = events.filter((event) => kstDate(new Date(event.occurred_at)) === date); const unique = new Set(daily.map((event) => event.word_id));
    return { date, uniqueWords: unique.size, attempts: daily.length, newWords: [...unique].filter((wordId) => firstDates.get(wordId) === date).length, againCount: daily.filter((event) => event.rating === "again").length };
  });
}

function progressForWords(db: AppDatabase, words: Set<string>) {
  const currentStates = states(db, words); const studied = currentStates.length; const masteredCount = currentStates.filter(mastered).length;
  return { uniqueTotal: words.size, studied, mastered: masteredCount, progressRate: words.size ? masteredCount / words.size : 0 };
}

export function statsFolders(db: AppDatabase, period: StatsPeriod, folderId?: string | null, bookId?: string | null) {
  let folders = db.prepare("SELECT id,name FROM folders WHERE deleted_at IS NULL ORDER BY order_index,name").all() as Array<{ id: string; name: string }>;
  if (folderId) { const included = new Set(descendantFolderIds(db, folderId)); folders = folders.filter((folder) => included.has(folder.id)); }
  if (bookId) { const row = db.prepare("SELECT folder_id FROM books WHERE id=? AND deleted_at IS NULL").get(bookId) as { folder_id: string | null } | undefined; folders = row?.folder_id ? folders.filter((folder) => folder.id === row.folder_id) : []; }
  return folders.map((folder) => { const words = activeWordIds(db, folder.id, null); return { folderId: folder.id, name: folder.name, ...progressForWords(db, words), reviewAttempts: periodEvents(db, period, words).length }; });
}

export function statsBooks(db: AppDatabase, folderId?: string | null, bookId?: string | null) {
  let books = db.prepare("SELECT id,title,folder_id FROM books WHERE deleted_at IS NULL ORDER BY updated_at DESC").all() as Array<{ id: string; title: string; folder_id: string | null }>;
  if (folderId) { const included = new Set(descendantFolderIds(db, folderId)); books = books.filter((book) => Boolean(book.folder_id && included.has(book.folder_id))); }
  if (bookId) books = books.filter((book) => book.id === bookId);
  return books.map((book) => ({ bookId: book.id, title: book.title, ...progressForWords(db, activeWordIds(db, null, book.id)) }));
}

export function weakWords(db: AppDatabase, period: StatsPeriod, limit: number, folderId?: string | null, bookId?: string | null) {
  const words = activeWordIds(db, folderId, bookId); const events = periodEvents(db, period, words); const currentStates = new Map(states(db, words).map((state) => [state.word_id, state]));
  const grouped = new Map<string, EventRow[]>(); events.forEach((event) => grouped.set(event.word_id, [...(grouped.get(event.word_id) || []), event]));
  return [...grouped.entries()].filter(([, attempts]) => attempts.length >= 2).map(([wordId, attempts]) => {
    const entry = db.prepare("SELECT e.term,e.reading FROM book_entries e JOIN books b ON b.id=e.book_id WHERE e.word_id=? AND e.deleted_at IS NULL AND b.deleted_at IS NULL ORDER BY CASE e.status WHEN 'ready' THEN 0 ELSE 1 END,e.position LIMIT 1").get(wordId) as { term: string; reading: string | null };
    const bookIds = (db.prepare("SELECT DISTINCT e.book_id FROM book_entries e JOIN books b ON b.id=e.book_id WHERE e.word_id=? AND e.deleted_at IS NULL AND b.deleted_at IS NULL").all(wordId) as Array<{ book_id: string }>).map((row) => row.book_id);
    const againCount = attempts.filter((event) => event.rating === "again").length; const state = currentStates.get(wordId);
    return { wordId, term: entry.term, reading: entry.reading, reviewAttempts: attempts.length, againCount, lapses: state?.lapses || 0, latestRating: attempts.at(-1)?.rating || state?.last_rating || null, bookIds, score: againCount / attempts.length + (state?.lapses || 0) * 0.05 };
  }).sort((a, b) => b.score - a.score || b.againCount - a.againCount).slice(0, limit).map(({ score: _, ...item }) => item);
}
