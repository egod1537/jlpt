import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { createListeningFolder, listListeningLibrary } from "@back/lib/listening/repository";
import { apiJson, readLimitedJson } from "@/lib/server/api";
import { authorize } from "@/lib/server/authorize";
import { listeningErrorResponse } from "@/lib/server/listening-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const auth = authorize(request);
  if (!auth.ok) return auth.response;
  try {
    const query = request.nextUrl.searchParams;
    const result = listListeningLibrary(getDatabase(), { q: query.get("q") || undefined, limit: Number(query.get("limit") || 50), offset: Number(query.get("offset") || 0) });
    return apiJson({ folders: result.folders, page: result.page });
  } catch (error) {
    return listeningErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = authorize(request, true);
  if (!auth.ok) return auth.response;
  try {
    const input = await readLimitedJson(request) as { name?: string; parentId?: string | null; sortIndex?: number; favorite?: boolean };
    const folder = createListeningFolder(getDatabase(), { name: String(input.name || ""), parentId: input.parentId, sortIndex: input.sortIndex, favorite: input.favorite });
    return apiJson({ folder }, { status: 201 });
  } catch (error) {
    return listeningErrorResponse(error);
  }
}

