import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { countRetryableFailedListeningAudio, createListeningSet, listListeningLibrary } from "@back/lib/listening/repository";
import { apiError, apiJson, readLimitedJson } from "@/lib/server/api";
import { authorize } from "@/lib/server/authorize";
import { listeningErrorResponse } from "@/lib/server/listening-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const auth = authorize(request);
  if (!auth.ok) return auth.response;
  try {
    const query = request.nextUrl.searchParams;
    const filter = query.get("filter") || "all";
    if (!new Set(["all", "recent", "favorites", "unfiled"]).has(filter)) return apiError(400, "VALIDATION", "필터를 확인해 주세요.");
    const limit = Number(query.get("limit") || 50);
    const offset = Number(query.get("offset") || 0);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0) return apiError(400, "VALIDATION", "페이지 값을 확인해 주세요.");
    const result = listListeningLibrary(getDatabase(), { q: query.get("q") || undefined, filter: filter as "all" | "recent" | "favorites" | "unfiled", limit, offset });
    return apiJson({ folders: result.folders, sets: result.sets, page: result.page, failedCount: countRetryableFailedListeningAudio(getDatabase()) });
  } catch (error) {
    return listeningErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = authorize(request, true);
  if (!auth.ok) return auth.response;
  try {
    const input = await readLimitedJson(request) as { title?: string; description?: string; folderId?: string | null; sortIndex?: number; favorite?: boolean };
    const set = createListeningSet(getDatabase(), { title: String(input.title || ""), description: input.description, folderId: input.folderId, sortIndex: input.sortIndex, favorite: input.favorite });
    return apiJson({ set: setDto(set) }, { status: 201 });
  } catch (error) {
    return listeningErrorResponse(error);
  }
}

function setDto(set: ReturnType<typeof createListeningSet>) {
  return {
    id: set.id, folderId: set.folderId, title: set.title, description: set.description,
    sortIndex: set.sortIndex, favorite: set.favorite, revision: set.revision,
    audioCount: set.audioCount, durationMs: set.durationMs, lastPlayedAt: set.lastPlayedAt,
    createdAt: set.createdAt, updatedAt: set.updatedAt,
  };
}

