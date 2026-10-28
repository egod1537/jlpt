import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { getBook, listEntries } from "@back/lib/catalog/queries";
import { apiError, apiJson } from "@/lib/server/api";
import { authorize } from "@/lib/server/authorize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = authorize(request);
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const db = getDatabase();
  if (!getBook(db, id)) return apiError(404, "NOT_FOUND", "세트를 찾을 수 없습니다.");
  const cursor = Number(request.nextUrl.searchParams.get("cursor") || -1);
  const limit = Number(request.nextUrl.searchParams.get("limit") || 100);
  if (!Number.isInteger(cursor) || !Number.isInteger(limit)) return apiError(400, "VALIDATION", "페이지 값이 올바르지 않습니다.");
  return apiJson(listEntries(db, id, cursor, limit));
}
