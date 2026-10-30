import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { retryListeningJob } from "@back/lib/listening/repository";
import { apiJson } from "@/lib/server/api";
import { authorize } from "@/lib/server/authorize";
import { listeningErrorResponse } from "@/lib/server/listening-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: RouteContext<"/api/listening/jobs/[jobId]/retry">) {
  const auth = authorize(request, true);
  if (!auth.ok) return auth.response;
  try {
    const { jobId } = await context.params;
    return apiJson({ job: retryListeningJob(getDatabase(), jobId) }, { status: 202 });
  } catch (error) {
    return listeningErrorResponse(error);
  }
}
