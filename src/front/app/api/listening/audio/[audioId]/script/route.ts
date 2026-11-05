import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { getActiveTranscript, ListeningFailure } from "@back/lib/listening/repository";
import {
  detectScriptUploadFormat,
  editListeningScript,
  importListeningScript,
  MAX_SCRIPT_UPLOAD_BYTES,
  type ScriptEditOperation,
} from "@back/lib/listening/script";
import { apiJson, readLimitedJson } from "@/lib/server/api";
import { authorize } from "@/lib/server/authorize";
import { audioDto, listeningErrorResponse } from "@/lib/server/listening-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: RouteContext<"/api/listening/audio/[audioId]/script">) {
  const auth = authorize(request);
  if (!auth.ok) return auth.response;
  try {
    const { audioId } = await context.params;
    const result = getActiveTranscript(getDatabase(), audioId);
    return apiJson({ audio: audioDto(result.audio), script: result.script }, { headers: { ETag: `W/"${result.audio.revision}"` } });
  } catch (error) {
    return listeningErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext<"/api/listening/audio/[audioId]/script">) {
  const auth = authorize(request, true);
  if (!auth.ok) return auth.response;
  try {
    const { audioId } = await context.params;
    const input = await readLimitedJson(request, 2 * 1024 * 1024) as { revision?: number; operations?: ScriptEditOperation[] };
    const result = editListeningScript(getDatabase(), audioId, { revision: Number(input.revision), operations: input.operations || [] });
    return apiJson({ audio: audioDto(result.audio), script: result.script }, { headers: { ETag: `W/"${result.audio.revision}"` } });
  } catch (error) {
    return listeningErrorResponse(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext<"/api/listening/audio/[audioId]/script">) {
  const auth = authorize(request, true);
  if (!auth.ok) return auth.response;
  try {
    const declared = Number(request.headers.get("content-length"));
    if (Number.isFinite(declared) && declared > MAX_SCRIPT_UPLOAD_BYTES + 128 * 1024) throw new ListeningFailure(413, "TOO_LARGE", "스크립트 파일은 2MB까지 업로드할 수 있습니다.");
    const { audioId } = await context.params;
    let form: FormData;
    try { form = await request.formData(); }
    catch { throw new ListeningFailure(400, "VALIDATION", "multipart/form-data 요청을 확인해 주세요."); }
    const file = form.get("file");
    if (!(file instanceof File) || file.size < 1) throw new ListeningFailure(400, "VALIDATION", "업로드할 스크립트 파일을 선택해 주세요.");
    if (file.size > MAX_SCRIPT_UPLOAD_BYTES) throw new ListeningFailure(413, "TOO_LARGE", "스크립트 파일은 2MB까지 업로드할 수 있습니다.");
    const content = await file.text();
    const result = importListeningScript(getDatabase(), audioId, {
      revision: Number(form.get("revision")),
      content,
      format: detectScriptUploadFormat(file.name, content),
      filename: file.name,
      source: "ui_upload",
    });
    return apiJson({ audio: audioDto(result.audio), script: result.script }, { status: 201, headers: { ETag: `W/"${result.audio.revision}"` } });
  } catch (error) {
    return listeningErrorResponse(error);
  }
}

