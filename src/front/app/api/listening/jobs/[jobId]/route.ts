import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { getListeningJob } from "@back/lib/listening/repository";
import { apiJson } from "@/lib/server/api";
import { authorize } from "@/lib/server/authorize";
import { listeningErrorResponse } from "@/lib/server/listening-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: RouteContext<"/api/listening/jobs/[jobId]">) {
  const auth = authorize(request);
  if (!auth.ok) return auth.response;
  try {
    const { jobId } = await context.params;
    return apiJson({ job: getListeningJob(getDatabase(), jobId) });
  } catch (error) {
    return listeningErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext<"/api/listening/jobs/[jobId]">) {
  const auth = authorize(request, true);
  if (!auth.ok) return auth.response;
  try {
    const { jobId } = await context.params;
    const db = getDatabase();
    const job = getListeningJob(db, jobId);
    if (!new Set(["queued", "running", "waiting_auth"]).has(job.state)) return apiJson({ job });
    const timestamp = new Date().toISOString();
    db.prepare("UPDATE listening_jobs SET state='canceled',stage='canceled',canceled_at=?,lease_owner=NULL,lease_expires_at=NULL,updated_at=? WHERE id=?")
      .run(timestamp, timestamp, jobId);
    db.prepare("UPDATE listening_audio SET status=?,updated_at=?,revision=revision+1 WHERE id=?").run(job.outputVersionId ? "ready" : "uploaded", timestamp, job.audioId);
    return apiJson({ job: getListeningJob(db, jobId) });
  } catch (error) {
    return listeningErrorResponse(error);
  }
}

