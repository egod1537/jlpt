import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { getListeningProgress, updateListeningProgress } from "@back/lib/listening/repository";
import { apiJson, readLimitedJson } from "@/lib/server/api";
import { authorize } from "@/lib/server/authorize";
import { listeningErrorResponse } from "@/lib/server/listening-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: RouteContext<"/api/listening/audio/[audioId]/progress">) {
  const auth = authorize(request);
  if (!auth.ok) return auth.response;
  try {
    const { audioId } = await context.params;
    return apiJson({ progress: getListeningProgress(getDatabase(), audioId) });
  } catch (error) {
    return listeningErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext<"/api/listening/audio/[audioId]/progress">) {
  const auth = authorize(request, true);
  if (!auth.ok) return auth.response;
  try {
    const { audioId } = await context.params;
    const input = await readLimitedJson(request) as { positionMs?: number; playbackRate?: number; completed?: boolean; revision?: number };
    const progress = updateListeningProgress(getDatabase(), audioId, {
      positionMs: Number(input.positionMs), playbackRate: Number(input.playbackRate), completed: Boolean(input.completed), revision: Number(input.revision),
    });
    return apiJson({ progress });
  } catch (error) {
    return listeningErrorResponse(error);
  }
}
