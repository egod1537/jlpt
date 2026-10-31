import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { countRetryableFailedListeningAudio, retryFailedListeningAudio } from "@back/lib/listening/repository";
import { apiJson } from "@/lib/server/api";
import { authorize } from "@/lib/server/authorize";
import { listeningErrorResponse } from "@/lib/server/listening-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const auth = authorize(request);
  if (!auth.ok) return auth.response;
  try {
    return apiJson({ failedCount: countRetryableFailedListeningAudio(getDatabase()) });
  } catch (error) {
    return listeningErrorResponse(error);
  }
}

export function POST(request: NextRequest) {
  const auth = authorize(request, true);
  if (!auth.ok) return auth.response;
  try {
    return apiJson(retryFailedListeningAudio(getDatabase()), { status: 202 });
  } catch (error) {
    return listeningErrorResponse(error);
  }
}
