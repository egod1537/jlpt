import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { getActiveTranscript } from "@back/lib/listening/repository";
import { editListeningScript, type ScriptEditOperation } from "@back/lib/listening/script";
import { apiJson, readLimitedJson } from "@/lib/server/api";
import { authorize } from "@/lib/server/authorize";
import { audioDto, listeningErrorResponse } from "@/lib/server/listening-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: RouteContext<"/api/listening/audio/[audioId]/script">) {
  const auth = authorize(request);
  if (!auth.ok) return auth.response;
  try {
    const { audioId } = await context.params;
    const result = getActiveTranscript(getDatabase(), audioId);
    return apiJson({ audio: audioDto(result.audio), script: result.script }, { headers: { ETag: `W/"${result.audio.revision}"` } });
  } catch (error) {
    return listeningErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext<"/api/listening/audio/[audioId]/script">) {
  const auth = authorize(request, true);
  if (!auth.ok) return auth.response;
  try {
    const { audioId } = await context.params;
    const input = await readLimitedJson(request, 2 * 1024 * 1024) as { revision?: number; operations?: ScriptEditOperation[] };
    const result = editListeningScript(getDatabase(), audioId, { revision: Number(input.revision), operations: input.operations || [] });
    return apiJson({ audio: audioDto(result.audio), script: result.script }, { headers: { ETag: `W/"${result.audio.revision}"` } });
  } catch (error) {
    return listeningErrorResponse(error);
  }
}

