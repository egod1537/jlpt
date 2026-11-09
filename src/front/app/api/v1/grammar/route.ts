import type { NextRequest } from "next/server";
import { authorizeExternalApi, externalApiHeaders } from "@back/lib/external-api/auth";
import { apiJson } from "@/lib/server/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const unauthorized = authorizeExternalApi(request);
  if (unauthorized) return unauthorized;
  return apiJson({ data: { resource: "grammar", books: "/api/v1/grammar/books", book: "/api/v1/grammar/books/{bookId}", notes: "/api/v1/grammar/books/{bookId}/notes", openapi: "/external-api.openapi.json" } }, { headers: externalApiHeaders() });
}
