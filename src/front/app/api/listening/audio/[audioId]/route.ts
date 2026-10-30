import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { deleteListeningAudio, updateListeningAudio } from "@back/lib/listening/repository";
import { apiJson, readLimitedJson } from "@/lib/server/api";
import { authorize } from "@/lib/server/authorize";
import { audioDto, listeningErrorResponse } from "@/lib/server/listening-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, context: RouteContext<"/api/listening/audio/[audioId]">) {
  const auth = authorize(request, true);
  if (!auth.ok) return auth.response;
  try {
    const { audioId } = await context.params;
    const input = await readLimitedJson(request) as { revision?: number; originalName?: string; setId?: string; favorite?: boolean; lastPlayedAt?: string | null };
    const audio = updateListeningAudio(getDatabase(), audioId, {
      revision: Number(input.revision),
      originalName: typeof input.originalName === "string" ? input.originalName : undefined,
      setId: typeof input.setId === "string" ? input.setId : undefined,
      favorite: typeof input.favorite === "boolean" ? input.favorite : undefined,
      lastPlayedAt: input.lastPlayedAt === null || typeof input.lastPlayedAt === "string" ? input.lastPlayedAt : undefined,
    });
    return apiJson({ audio: audioDto(audio) });
  } catch (error) {
    return listeningErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext<"/api/listening/audio/[audioId]">) {
  const auth = authorize(request, true);
  if (!auth.ok) return auth.response;
  try {
    const { audioId } = await context.params;
    const revision = Number(request.nextUrl.searchParams.get("revision"));
    deleteListeningAudio(getDatabase(), audioId, revision);
    return new Response(null, { status: 204 });
  } catch (error) {
    return listeningErrorResponse(error);
  }
}
