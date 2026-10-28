import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { apiError, apiJson } from "@/lib/server/api";
import { authorize } from "@/lib/server/authorize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const auth = authorize(request);
  if (!auth.ok) return auth.response;
  const after = Number(request.nextUrl.searchParams.get("after") || 0);
  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") || 200), 500);
  if (!Number.isInteger(after) || after < 0 || !Number.isInteger(limit) || limit < 1) return apiError(400, "VALIDATION", "동기화 커서를 확인해 주세요.");
  const rows = getDatabase().prepare("SELECT * FROM sync_changes WHERE seq>? ORDER BY seq LIMIT ?").all(after, limit + 1) as Array<Record<string, unknown>>;
  const page = rows.slice(0, limit).map((row) => ({
    seq: Number(row.seq), entityType: row.entity_type, entityId: row.entity_id, revision: Number(row.revision), action: row.action,
    payload: JSON.parse(String(row.payload_json)), changedAt: row.changed_at,
  }));
  return apiJson({ changes: page, nextCursor: page.at(-1)?.seq ?? after, hasMore: rows.length > limit });
}
