import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { enqueueListeningJob, getListeningSet } from "@back/lib/listening/repository";
import { receiveAudioMultipart, storeUploadedAudio } from "@back/lib/listening/storage";
import { apiJson } from "@/lib/server/api";
import { authorize } from "@/lib/server/authorize";
import { audioDto, listeningErrorResponse } from "@/lib/server/listening-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: RouteContext<"/api/listening/sets/[setId]/audio">) {
  const auth = authorize(request, true);
  if (!auth.ok) return auth.response;
  const { setId } = await context.params;
  const db = getDatabase();
  try {
    getListeningSet(db, setId);
    const staged = await receiveAudioMultipart(request);
    const audio = await storeUploadedAudio(db, setId, staged);
    const jobs = audio.map((item) => enqueueListeningJob(db, item.id, "transcribe", `upload:${item.id}`).job);
    return apiJson({ audio: audio.map(audioDto), jobs, autoTranscribe: true }, { status: 201 });
  } catch (error) {
    return listeningErrorResponse(error);
  }
}

