import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { restoreListeningFolder } from "@back/lib/listening/repository";
import { apiJson, readLimitedJson } from "@/lib/server/api";
import { authorize } from "@/lib/server/authorize";
import { listeningErrorResponse } from "@/lib/server/listening-api";

export const runtime = "nodejs";
export async function POST(request: NextRequest, context: RouteContext<"/api/listening/folders/[folderId]/restore">) {
  const auth = authorize(request, true); if (!auth.ok) return auth.response;
  try { const { folderId } = await context.params; const input = await readLimitedJson(request) as { revision?: number; parentId?: string | null }; return apiJson({ folder: restoreListeningFolder(getDatabase(), folderId, { revision: Number(input.revision), parentId: input.parentId }) }); }
  catch (error) { return listeningErrorResponse(error); }
}
