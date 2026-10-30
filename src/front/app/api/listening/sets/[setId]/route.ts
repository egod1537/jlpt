import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { deleteListeningSet, getListeningSet, updateListeningSet } from "@back/lib/listening/repository";
import { apiJson, readLimitedJson } from "@/lib/server/api";
import { authorize } from "@/lib/server/authorize";
import { audioDto, listeningErrorResponse } from "@/lib/server/listening-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: RouteContext<"/api/listening/sets/[setId]">) {
  const auth = authorize(request);
  if (!auth.ok) return auth.response;
  try {
    const { setId } = await context.params;
    return apiJson({ set: setDetailDto(getListeningSet(getDatabase(), setId)) });
  } catch (error) {
    return listeningErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext<"/api/listening/sets/[setId]">) {
  const auth = authorize(request, true);
  if (!auth.ok) return auth.response;
  try {
    const { setId } = await context.params;
    const input = await readLimitedJson(request) as { revision?: number; title?: string; description?: string; folderId?: string | null; sortIndex?: number; favorite?: boolean };
    const set = updateListeningSet(getDatabase(), setId, { ...input, revision: Number(input.revision) });
    return apiJson({ set: setDetailDto(set) });
  } catch (error) {
    return listeningErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext<"/api/listening/sets/[setId]">) {
  const auth = authorize(request, true);
  if (!auth.ok) return auth.response;
  try {
    const { setId } = await context.params;
    deleteListeningSet(getDatabase(), setId, Number(request.nextUrl.searchParams.get("revision")));
    return new Response(null, { status: 204 });
  } catch (error) {
    return listeningErrorResponse(error);
  }
}

function setDetailDto<T extends { audio: Parameters<typeof audioDto>[0][] }>(set: T) {
  return { ...set, audio: set.audio.map(audioDto) };
}
