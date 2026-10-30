import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { restoreListeningAudio } from "@back/lib/listening/repository";
import { apiJson, readLimitedJson } from "@/lib/server/api";
import { authorize } from "@/lib/server/authorize";
import { audioDto, listeningErrorResponse } from "@/lib/server/listening-api";

export const runtime = "nodejs";
export async function POST(request: NextRequest, context: RouteContext<"/api/listening/audio/[audioId]/restore">) {
  const auth = authorize(request, true); if (!auth.ok) return auth.response;
  try { const { audioId } = await context.params; const input = await readLimitedJson(request) as { revision?: number; setId?: string }; return apiJson({ audio: audioDto(restoreListeningAudio(getDatabase(), audioId, { revision: Number(input.revision), setId: input.setId })) }); }
  catch (error) { return listeningErrorResponse(error); }
}
