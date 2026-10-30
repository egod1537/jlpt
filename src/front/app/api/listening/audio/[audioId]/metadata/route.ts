import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { getListeningAudio } from "@back/lib/listening/repository";
import { apiJson } from "@/lib/server/api";
import { authorize } from "@/lib/server/authorize";
import { audioDto, listeningErrorResponse } from "@/lib/server/listening-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: RouteContext<"/api/listening/audio/[audioId]/metadata">) {
  const auth = authorize(request);
  if (!auth.ok) return auth.response;
  try {
    const { audioId } = await context.params;
    return apiJson({ audio: audioDto(getListeningAudio(getDatabase(), audioId)) });
  } catch (error) {
    return listeningErrorResponse(error);
  }
}

