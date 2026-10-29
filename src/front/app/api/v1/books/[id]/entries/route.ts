import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { getBook, listEntries } from "@back/lib/catalog/queries";
import { authorizeExternalApi, externalApiError, externalApiHeaders } from "@back/lib/external-api/auth";
import { apiJson } from "@/lib/server/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function integer(value: string | null, fallback: number, minimum: number, maximum: number) {
  if (value === null) return fallback;
  if (!/^-?\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= minimum && parsed <= maximum ? parsed : null;
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const unauthorized = authorizeExternalApi(request);
  if (unauthorized) return unauthorized;
  const { id } = await context.params;
  const db = getDatabase();
  if (!getBook(db, id)) return externalApiError(404, "NOT_FOUND", "단어장을 찾을 수 없습니다.");
  const limit = integer(request.nextUrl.searchParams.get("limit"), 100, 1, 200);
  const cursor = integer(request.nextUrl.searchParams.get("cursor"), -1, -1, 1_000_000_000);
  if (limit === null || cursor === null) return externalApiError(400, "VALIDATION", "페이지 값을 확인해 주세요.");
  const result = listEntries(db, id, cursor, limit);
  return apiJson({
    data: result.entries,
    pagination: { limit, nextCursor: result.nextCursor === null ? null : String(result.nextCursor) },
  }, { headers: externalApiHeaders() });
}
