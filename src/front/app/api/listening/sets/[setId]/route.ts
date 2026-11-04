import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { deleteListeningSet, getListeningSet, listActiveListeningJobsForSet, updateListeningSet } from "@back/lib/listening/repository";
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
    const db = getDatabase();
    return apiJson({ set: setDetailDto(getListeningSet(db, setId), listActiveListeningJobsForSet(db, setId)) });
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
    const db = getDatabase();
    const set = updateListeningSet(db, setId, { ...input, revision: Number(input.revision) });
    return apiJson({ set: setDetailDto(set, listActiveListeningJobsForSet(db, setId)) });
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

function setDetailDto<T extends { audio: Parameters<typeof audioDto>[0][] }>(set: T, activeJobs: ReturnType<typeof listActiveListeningJobsForSet>) {
  const byAudio = new Map(activeJobs.map((job) => [job.audioId, job]));
  return { ...set, audio: set.audio.map((audio) => ({ ...audioDto(audio), activeJob: byAudio.get(audio.id) || null })) };
}
