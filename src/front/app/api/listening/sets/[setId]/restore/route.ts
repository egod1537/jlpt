import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { restoreListeningSet } from "@back/lib/listening/repository";
import { apiJson, readLimitedJson } from "@/lib/server/api";
import { authorize } from "@/lib/server/authorize";
import { audioDto, listeningErrorResponse } from "@/lib/server/listening-api";

export const runtime = "nodejs";
export async function POST(request: NextRequest, context: RouteContext<"/api/listening/sets/[setId]/restore">) {
  const auth = authorize(request, true); if (!auth.ok) return auth.response;
  try { const { setId } = await context.params; const input = await readLimitedJson(request) as { revision?: number; folderId?: string | null }; const set = restoreListeningSet(getDatabase(), setId, { revision: Number(input.revision), folderId: input.folderId }); return apiJson({ set: { ...set, audio: set.audio.map(audioDto) } }); }
  catch (error) { return listeningErrorResponse(error); }
}
