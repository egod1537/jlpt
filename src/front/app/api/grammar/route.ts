import type { NextRequest } from "next/server";
import { authorize } from "@/lib/server/authorize";
import { apiJson } from "@/lib/server/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const auth = authorize(request);
  if (!auth.ok) return auth.response;
  return apiJson({ resource: "grammar", books: "/api/grammar/books", book: "/api/grammar/books/{bookId}", notes: "/api/grammar/books/{bookId}/notes" });
}
