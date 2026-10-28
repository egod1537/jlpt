import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { searchCatalog } from "@back/lib/catalog/queries";
import { apiError, apiJson } from "@/lib/server/api";
import { authorize } from "@/lib/server/authorize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const auth = authorize(request);
  if (!auth.ok) return auth.response;
  const q = request.nextUrl.searchParams.get("q")?.trim() || "";
  const scope = request.nextUrl.searchParams.get("scope") || "books";
  const status = request.nextUrl.searchParams.get("status");
  if ((!q && !(scope === "words" && status === "needs-review")) || q.length > 200 || !new Set(["books", "words"]).has(scope) || (status && (scope !== "words" || status !== "needs-review"))) return apiError(400, "VALIDATION", "검색 조건을 확인해 주세요.");
  return apiJson({ scope, status, results: searchCatalog(getDatabase(), q, scope as "books" | "words", 50, status === "needs-review" ? status : undefined) });
}
