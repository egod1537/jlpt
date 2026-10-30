import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { activateScriptVersion } from "@back/lib/listening/script";
import { apiJson, readLimitedJson } from "@/lib/server/api";
import { authorize } from "@/lib/server/authorize";
import { audioDto, listeningErrorResponse } from "@/lib/server/listening-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: RouteContext<"/api/listening/audio/[audioId]/script/versions/[versionId]/activate">) {
  const auth = authorize(request, true);
  if (!auth.ok) return auth.response;
  try {
    const { audioId, versionId } = await context.params;
    const input = await readLimitedJson(request) as { revision?: number };
    const result = activateScriptVersion(getDatabase(), audioId, versionId, Number(input.revision));
    return apiJson({ audio: audioDto(result.audio), activated: result.activated });
  } catch (error) {
    return listeningErrorResponse(error);
  }
}

