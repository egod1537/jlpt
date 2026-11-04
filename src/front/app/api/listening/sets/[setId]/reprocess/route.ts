import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { reprocessListeningSet } from "@back/lib/listening/repository";
import { apiJson } from "@/lib/server/api";
import { authorize } from "@/lib/server/authorize";
import { listeningErrorResponse } from "@/lib/server/listening-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: RouteContext<"/api/listening/sets/[setId]/reprocess">) {
  const auth = authorize(request, true);
  if (!auth.ok) return auth.response;
  try {
    const { setId } = await context.params;
    const result = reprocessListeningSet(getDatabase(), setId, request.headers.get("idempotency-key") || undefined);
    return apiJson(result, { status: 202 });
  } catch (error) {
    return listeningErrorResponse(error);
  }
}
