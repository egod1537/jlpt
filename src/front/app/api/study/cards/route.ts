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
  const limit = Math.min(Math.max(Number(query.get("limit") || 20), 1), 10_000);
  const seed = Number(query.get("seed") || 0);
  if (!new Set(["all", "unseen", "due", "weak"]).has(mode) || !Number.isInteger(limit) || !Number.isFinite(seed) || bookIds.some((id) => !/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(id))) return apiError(400, "VALIDATION", "학습 조건을 확인해 주세요.");
  const db = getDatabase();
  const whereBooks = bookIds.length ? ` AND e.book_id IN (${bookIds.map(() => "?").join(",")})` : "";
  const rows = db.prepare(`SELECT e.*,b.title book_title,r.due_at,r.last_reviewed_at,r.last_rating
    FROM book_entries e JOIN books b ON b.id=e.book_id LEFT JOIN review_states r ON r.word_id=e.word_id
    WHERE e.deleted_at IS NULL AND b.deleted_at IS NULL${whereBooks} ORDER BY b.order_index,e.position,e.entry_id`).all(...bookIds) as Array<Record<string, unknown>>;
  const grouped = new Map<string, Array<Record<string, unknown>>>();
  for (const row of rows) grouped.set(String(row.word_id), [...(grouped.get(String(row.word_id)) || []), row]);
  const currentTime = Date.now();
  let cards = [...grouped.entries()].flatMap(([wordId, occurrences]) => {
    const ready = occurrences.find((row) => row.status === "ready");
    if (!ready && !includeReview) return [];
    const representative = ready || occurrences[0];
    const reviewed = representative.last_reviewed_at !== null;
    if (mode === "unseen" && reviewed) return [];
    if (mode === "due" && (!representative.due_at || Date.parse(String(representative.due_at)) > currentTime)) return [];
    if (mode === "weak" && !new Set(["again", "hard"]).has(String(representative.last_rating))) return [];
    return [{
      wordId,
      representative: { ...entryFromRow(representative), bookTitle: representative.book_title },
      occurrences: occurrences.map((row) => ({ ...entryFromRow(row), bookTitle: row.book_title })),
      review: { dueAt: representative.due_at, lastReviewedAt: representative.last_reviewed_at, lastRating: representative.last_rating },
    }];
  });
  if (seed) cards = shuffled(cards, seed);
  const dueCount = Number((db.prepare(`SELECT COUNT(DISTINCT r.word_id) count
    FROM review_states r JOIN book_entries e ON e.word_id=r.word_id JOIN books b ON b.id=e.book_id
    WHERE r.due_at IS NOT NULL AND r.due_at<=? AND e.deleted_at IS NULL AND e.status='ready' AND b.deleted_at IS NULL`).get(new Date().toISOString()) as { count: number }).count);
  return apiJson({ cards: cards.slice(0, limit), totalMatches: cards.length, dueCount, serverTime: new Date().toISOString() });
}
