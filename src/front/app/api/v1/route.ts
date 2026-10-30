import type { NextRequest } from "next/server";
import { apiJson } from "@/lib/server/api";
import { authorizeExternalApi, externalApiHeaders } from "@back/lib/external-api/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const unauthorized = authorizeExternalApi(request);
  if (unauthorized) return unauthorized;
  return apiJson({
    data: {
      version: "v1",
      resources: {
        books: "/api/v1/books",
        bookSensePreview: "/api/v1/books/sense-preview",
        book: "/api/v1/books/{bookId}",
        entries: "/api/v1/books/{bookId}/entries",
        listening: "/api/v1/listening",
      },
      openapi: "/external-api.openapi.json",
    },
  }, { headers: externalApiHeaders() });
}
