import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { exportBookCsv, exportBookJson } from "@back/lib/exports/book";
import { apiError } from "@/lib/server/api";
import { authorize } from "@/lib/server/authorize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function filename(value: string) {
  return value.replace(/[^\p{L}\p{N}._-]+/gu, "-").slice(0, 80) || "jlpt-book";
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = authorize(request);
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const format = request.nextUrl.searchParams.get("format") || "json";
  if (format !== "json" && format !== "csv") return apiError(400, "VALIDATION", "내보내기 형식을 확인해 주세요.");
  const db = getDatabase();
  const json = exportBookJson(db, id);
  if (!json) return apiError(404, "NOT_FOUND", "세트를 찾을 수 없습니다.");
  const body = format === "json" ? JSON.stringify(json, null, 2) : exportBookCsv(db, id)!;
  const title = json.book.title;
  return new Response(body, {
    headers: {
      "Content-Type": format === "json" ? "application/json; charset=utf-8" : "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`${filename(title)}.${format}`)}`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
