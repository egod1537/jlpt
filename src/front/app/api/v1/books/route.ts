import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { listBooks } from "@back/lib/catalog/queries";
import { authorizeExternalApi, externalApiError, externalApiHeaders } from "@back/lib/external-api/auth";
import { createExternalBook, ExternalApiFailure, validateIdempotencyKey } from "@back/lib/external-api/books";
import { apiJson, PayloadTooLargeError, readLimitedJson } from "@/lib/server/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sorts = new Set(["updated", "name", "created", "studied", "custom"] as const);

function integer(value: string | null, fallback: number, minimum: number, maximum: number) {
  if (value === null) return fallback;
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= minimum && parsed <= maximum ? parsed : null;
}

export function GET(request: NextRequest) {
  const unauthorized = authorizeExternalApi(request);
  if (unauthorized) return unauthorized;
  const query = request.nextUrl.searchParams;
  const limit = integer(query.get("limit"), 50, 1, 100);
  const offset = integer(query.get("cursor"), 0, 0, 1_000_000_000);
  const sort = query.get("sort") || "updated";
  const favorite = query.get("favorite");
  if (limit === null || offset === null || !sorts.has(sort as "updated") || (favorite !== null && favorite !== "true" && favorite !== "false")) {
    return externalApiError(400, "VALIDATION", "조회 조건을 확인해 주세요.");
  }
  const rawFolder = query.get("folderId");
  const result = listBooks(getDatabase(), {
    q: query.get("q")?.slice(0, 200),
    folderId: rawFolder === null ? undefined : rawFolder === "unfiled" ? null : rawFolder,
    favorite: favorite === "true",
    sort: sort as "updated" | "name" | "created" | "studied" | "custom",
    limit,
    offset,
  });
  return apiJson({
    data: result.books,
    pagination: { limit, nextCursor: result.nextOffset === null ? null : String(result.nextOffset) },
  }, { headers: externalApiHeaders() });
}

export async function POST(request: NextRequest) {
  const unauthorized = authorizeExternalApi(request);
  if (unauthorized) return unauthorized;
  try {
    const idempotencyKey = validateIdempotencyKey(request.headers.get("idempotency-key"));
    const result = createExternalBook(getDatabase(), await readLimitedJson(request, 5 * 1_024 * 1_024), idempotencyKey);
    return apiJson({ data: { book: result.book, entries: result.entries } }, {
      status: result.replayed ? 200 : 201,
      headers: externalApiHeaders({
        Location: `/api/v1/books/${encodeURIComponent(result.book.id)}`,
        ...(result.replayed ? { "Idempotency-Replayed": "true" } : {}),
      }),
    });
  } catch (error) {
    if (error instanceof ExternalApiFailure) return externalApiError(error.status, error.code, error.message, error.details);
    if (error instanceof PayloadTooLargeError) return externalApiError(413, "TOO_LARGE", "요청 본문은 최대 5MB까지 허용됩니다.");
    if (error instanceof SyntaxError) return externalApiError(400, "VALIDATION", "JSON 형식이 올바르지 않습니다.");
    return externalApiError(500, "INTERNAL", "단어장 생성 중 오류가 발생했습니다.");
  }
}
