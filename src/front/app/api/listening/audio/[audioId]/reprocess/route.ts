import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { enqueueListeningJob, getActiveTranscript } from "@back/lib/listening/repository";
import { apiError, apiJson } from "@/lib/server/api";
import { authorize } from "@/lib/server/authorize";
import { listeningErrorResponse } from "@/lib/server/listening-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: RouteContext<"/api/listening/audio/[audioId]/reprocess">) {
  const auth = authorize(request, true);
  if (!auth.ok) return auth.response;
  try {
    const { audioId } = await context.params;
    const db = getDatabase();
    const active = getActiveTranscript(db, audioId);
    if (!active.script) return apiError(409, "CONFLICT", "먼저 Whisper 전사를 완료해 주세요.");
    const result = enqueueListeningJob(db, audioId, "gpt_process", request.headers.get("idempotency-key") || undefined);
    return apiJson({ job: result.job, replayed: result.replayed }, { status: 202 });
  } catch (error) {
    return listeningErrorResponse(error);
  }
}
