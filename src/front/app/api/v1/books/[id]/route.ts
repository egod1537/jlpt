import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { getBook } from "@back/lib/catalog/queries";
import { authorizeExternalApi, externalApiError, externalApiHeaders } from "@back/lib/external-api/auth";
import { apiJson } from "@/lib/server/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const unauthorized = authorizeExternalApi(request);
  if (unauthorized) return unauthorized;
  const { id } = await context.params;
  const book = getBook(getDatabase(), id);
  return book
    ? apiJson({ data: book }, { headers: externalApiHeaders() })
    : externalApiError(404, "NOT_FOUND", "단어장을 찾을 수 없습니다.");
}
