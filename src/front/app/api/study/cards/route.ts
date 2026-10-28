import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { entryFromRow } from "@back/lib/catalog/rows";
import { apiError, apiJson } from "@/lib/server/api";
import { authorize } from "@/lib/server/authorize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function shuffled<T>(items: T[], seed: number) {
  const result = [...items]; let state = seed >>> 0;
  for (let index = result.length - 1; index > 0; index -= 1) { state = (state * 1664525 + 1013904223) >>> 0; const target = state % (index + 1); [result[index], result[target]] = [result[target], result[index]]; }
  return result;
}

export function GET(request: NextRequest) {
  const auth = authorize(request);
  if (!auth.ok) return auth.response;
  const query = request.nextUrl.searchParams;
  const bookIds = (query.get("books") || "").split(",").filter(Boolean).slice(0, 500);
  const mode = query.get("mode") || "all";
  const includeReview = query.get("includeReview") === "true";
  const bookmarkOnly = query.get("bookmarks") === "true";
  const limit = Math.min(Math.max(Number(query.get("limit") || 20), 1), 10_000);
  const seed = Number(query.get("seed") || 0);
  const minStar = Number(query.get("minStar") || 0);
  const chunk = query.get("chunk") ? Number(query.get("chunk")) : null;
  const pos = query.get("pos")?.trim() || null;
  const validId = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
  if (!new Set(["all", "unseen", "due", "weak"]).has(mode) || !Number.isInteger(limit) || !Number.isFinite(seed) || !Number.isInteger(minStar) || minStar < 0 || minStar > 3 || (chunk !== null && (!Number.isInteger(chunk) || chunk < 1 || chunk > 6)) || (pos && pos.length > 100) || bookIds.some((id) => !validId.test(id))) return apiError(400, "VALIDATION", "학습 조건을 확인해 주세요.");

  const db = getDatabase();
  const clauses = ["e.deleted_at IS NULL", "b.deleted_at IS NULL"];
  const parameters: unknown[] = [];
  if (!includeReview) clauses.push("e.status='ready'");
  if (bookIds.length) { clauses.push(`e.book_id IN (${bookIds.map(() => "?").join(",")})`); parameters.push(...bookIds); }
  if (mode === "unseen") clauses.push("r.last_reviewed_at IS NULL");
  if (mode === "due") { clauses.push("r.due_at IS NOT NULL AND r.due_at<=?"); parameters.push(new Date().toISOString()); }
  if (mode === "weak") clauses.push("r.last_rating IN ('again','hard')");
  if (bookmarkOnly) clauses.push("bm.entry_id IS NOT NULL");
  if (minStar > 0) { clauses.push("EXISTS (SELECT 1 FROM json_each(e.tags_json) WHERE value IN (" + Array.from({ length: 4 - minStar }, () => "?").join(",") + "))"); for (let star = minStar; star <= 3; star += 1) parameters.push(`source-star:${star}`); }
  if (pos) { clauses.push("EXISTS (SELECT 1 FROM json_each(e.part_of_speech_json) WHERE value=?)"); parameters.push(pos); }
  if (chunk !== null) { clauses.push("CAST(json_extract(e.sources_json,'$[0].sourceIndex') AS INTEGER) BETWEEN ? AND ?"); parameters.push((chunk - 1) * 50 + 1, Math.min(chunk * 50, 268)); }
  const where = clauses.join(" AND ");
  const from = "FROM book_entries e JOIN books b ON b.id=e.book_id LEFT JOIN review_states r ON r.word_id=e.word_id LEFT JOIN bookmarks bm ON bm.entry_id=e.entry_id";
  const totalMatches = Number((db.prepare(`SELECT COUNT(DISTINCT e.word_id) count ${from} WHERE ${where}`).get(...parameters) as { count: number }).count);
  const dueCount = Number((db.prepare(`SELECT COUNT(DISTINCT r.word_id) count FROM review_states r JOIN book_entries e ON e.word_id=r.word_id JOIN books b ON b.id=e.book_id WHERE r.due_at IS NOT NULL AND r.due_at<=? AND e.deleted_at IS NULL AND e.status='ready' AND b.deleted_at IS NULL`).get(new Date().toISOString()) as { count: number }).count);
  if (query.get("countOnly") === "true") return apiJson({ cards: [], totalMatches, dueCount, serverTime: new Date().toISOString() });

  const eligibleLimit = seed ? 10_000 : limit;
  const eligible = db.prepare(`SELECT e.word_id,MIN(b.order_index) book_order,MIN(e.position) entry_order ${from} WHERE ${where} GROUP BY e.word_id ORDER BY book_order,entry_order,e.word_id LIMIT ?`)
    .all(...parameters, eligibleLimit) as Array<{ word_id: string }>;
  let wordIds = eligible.map((row) => String(row.word_id));
  if (seed) wordIds = shuffled(wordIds, seed).slice(0, limit);
  if (!wordIds.length) return apiJson({ cards: [], totalMatches, dueCount, serverTime: new Date().toISOString() });
  const rows = db.prepare(`SELECT e.*,b.title book_title,r.due_at,r.last_reviewed_at,r.last_rating,CASE WHEN bm.entry_id IS NULL THEN 0 ELSE 1 END bookmarked,COALESCE(bm.revision,0) bookmark_revision
    ${from} WHERE e.word_id IN (${wordIds.map(() => "?").join(",")}) AND e.deleted_at IS NULL AND b.deleted_at IS NULL ORDER BY b.order_index,e.position,e.entry_id`).all(...wordIds) as Array<Record<string, unknown>>;
  const grouped = new Map<string, Array<Record<string, unknown>>>();
  for (const row of rows) grouped.set(String(row.word_id), [...(grouped.get(String(row.word_id)) || []), row]);
  const byId = new Map(wordIds.map((id, index) => [id, index]));
  const cards = [...grouped.entries()].map(([wordId, occurrences]) => {
    const representative = occurrences.find((row) => row.status === "ready") || occurrences[0];
    const occurrence = (row: Record<string, unknown>) => ({ ...entryFromRow(row), bookTitle: String(row.book_title), bookmarked: Boolean(row.bookmarked), bookmarkRevision: Number(row.bookmark_revision) });
    return { wordId, representative: occurrence(representative), occurrences: occurrences.map(occurrence), review: { dueAt: representative.due_at, lastReviewedAt: representative.last_reviewed_at, lastRating: representative.last_rating } };
  }).sort((a, b) => (byId.get(a.wordId) || 0) - (byId.get(b.wordId) || 0));
  return apiJson({ cards, totalMatches, dueCount, serverTime: new Date().toISOString() });
}
