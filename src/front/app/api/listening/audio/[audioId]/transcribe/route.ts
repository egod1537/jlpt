import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { enqueueListeningJob } from "@back/lib/listening/repository";
import { apiJson } from "@/lib/server/api";
import { authorize } from "@/lib/server/authorize";
import { listeningErrorResponse } from "@/lib/server/listening-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: RouteContext<"/api/listening/audio/[audioId]/transcribe">) {
  const auth = authorize(request, true);
  if (!auth.ok) return auth.response;
  try {
    const { audioId } = await context.params;
    const result = enqueueListeningJob(getDatabase(), audioId, "transcribe", request.headers.get("idempotency-key") || undefined);
    return apiJson({ job: result.job, replayed: result.replayed }, { status: 202 });
  } catch (error) {
    return listeningErrorResponse(error);
  }
}

