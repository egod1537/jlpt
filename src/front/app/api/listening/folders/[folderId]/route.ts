import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { deleteListeningFolder, updateListeningFolder } from "@back/lib/listening/repository";
import { apiJson, readLimitedJson } from "@/lib/server/api";
import { authorize } from "@/lib/server/authorize";
import { listeningErrorResponse } from "@/lib/server/listening-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, context: RouteContext<"/api/listening/folders/[folderId]">) {
  const auth = authorize(request, true);
  if (!auth.ok) return auth.response;
  try {
    const { folderId } = await context.params;
    const input = await readLimitedJson(request) as { revision?: number; name?: string; parentId?: string | null; sortIndex?: number; favorite?: boolean };
    const folder = updateListeningFolder(getDatabase(), folderId, { ...input, revision: Number(input.revision) });
    return apiJson({ folder });
  } catch (error) {
    return listeningErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext<"/api/listening/folders/[folderId]">) {
  const auth = authorize(request, true);
  if (!auth.ok) return auth.response;
  try {
    const { folderId } = await context.params;
    deleteListeningFolder(getDatabase(), folderId, Number(request.nextUrl.searchParams.get("revision")));
    return new Response(null, { status: 204 });
  } catch (error) {
    return listeningErrorResponse(error);
  }
}

