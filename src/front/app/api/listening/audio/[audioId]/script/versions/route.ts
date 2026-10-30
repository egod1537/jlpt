import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { listTranscriptVersions } from "@back/lib/listening/repository";
import { apiJson } from "@/lib/server/api";
import { authorize } from "@/lib/server/authorize";
import { listeningErrorResponse } from "@/lib/server/listening-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: RouteContext<"/api/listening/audio/[audioId]/script/versions">) {
  const auth = authorize(request);
  if (!auth.ok) return auth.response;
  try {
    const { audioId } = await context.params;
    return apiJson({ versions: listTranscriptVersions(getDatabase(), audioId) });
  } catch (error) {
    return listeningErrorResponse(error);
  }
}

