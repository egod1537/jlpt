import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { listBooks } from "@back/lib/catalog/queries";
import { apiError, apiJson } from "@/lib/server/api";
import { authorize } from "@/lib/server/authorize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sorts = new Set(["updated", "name", "created", "studied", "custom"] as const);

export function GET(request: NextRequest) {
  const auth = authorize(request);
  if (!auth.ok) return auth.response;
  const query = request.nextUrl.searchParams;
  const rawSort = query.get("sort") || "updated";
  if (!sorts.has(rawSort as "updated")) return apiError(400, "VALIDATION", "정렬 방식이 올바르지 않습니다.");
  const rawFolder = query.get("folderId");
  const folderId = rawFolder === null ? undefined : rawFolder === "unfiled" ? null : rawFolder;
  const limit = Number(query.get("limit") || 50);
  const offset = Number(query.get("offset") || 0);
  if (!Number.isInteger(limit) || !Number.isInteger(offset)) return apiError(400, "VALIDATION", "페이지 값이 올바르지 않습니다.");
  return apiJson(listBooks(getDatabase(), {
    folderId,
    q: query.get("q")?.slice(0, 200),
    sort: rawSort as "updated" | "name" | "created" | "studied" | "custom",
    favorite: query.get("favorite") === "true",
    limit,
    offset,
  }));
}
