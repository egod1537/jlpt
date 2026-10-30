import type { NextRequest } from "next/server";
import { Readable } from "node:stream";
import { getDatabase } from "@back/lib/db/database";
import {
  createListeningFolder, createListeningSet, deleteListeningAudio, deleteListeningFolder, deleteListeningSet,
  enqueueListeningJob, getActiveTranscript, getListeningAudio, getListeningJob, getListeningSet,
  listListeningLibrary, listTranscriptVersions, ListeningFailure, registerListeningAudio, retryListeningJob, updateListeningAudio,
  updateListeningFolder, updateListeningSet,
} from "@back/lib/listening/repository";
import { activateScriptVersion, editListeningScript, exportListeningScript, type ScriptEditOperation } from "@back/lib/listening/script";
import { parseByteRange } from "@back/lib/listening/range";
import { AudioStorageFailure, createAudioReadStream, openStoredAudio, receiveAudioMultipart, removeStoredAudio } from "@back/lib/listening/storage";
import { authorizeExternalApi, externalApiError, externalApiHeaders } from "@back/lib/external-api/auth";
import {
  ExternalListeningFailure, externalAudioDto, externalJobDto, externalScriptDto, listExternalListeningFolders,
  rememberExternalMutation, replayExternalMutation, validateListeningIdempotencyKey,
} from "@back/lib/external-api/listening";
import { apiJson, PayloadTooLargeError, readLimitedJson } from "@/lib/server/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = RouteContext<"/api/v1/listening/[...path]">;
type MutationResult = { data: unknown; status?: number; location?: string | null };

export async function GET(request: NextRequest, context: Context) { return dispatch(request, context, "GET"); }
export async function HEAD(request: NextRequest, context: Context) { return dispatch(request, context, "HEAD"); }
export async function POST(request: NextRequest, context: Context) { return dispatch(request, context, "POST"); }
export async function PATCH(request: NextRequest, context: Context) { return dispatch(request, context, "PATCH"); }
export async function DELETE(request: NextRequest, context: Context) { return dispatch(request, context, "DELETE"); }

async function dispatch(request: NextRequest, context: Context, method: string) {
  const unauthorized = authorizeExternalApi(request);
  if (unauthorized) return unauthorized;
  const { path } = await context.params;
  try {
    if (method === "GET" || method === "HEAD") return await readRoute(request, path, method === "HEAD");
    return await mutationRoute(request, path, method);
  } catch (error) { return externalListeningError(error); }
}

async function readRoute(request: NextRequest, path: string[], head: boolean) {
  const db = getDatabase();
  const query = request.nextUrl.searchParams;
  if (path.length === 1 && path[0] === "folders") {
    const paging = parsePaging(query.get("limit"), query.get("cursor"));
    const folders = listExternalListeningFolders(db, { q: query.get("q") || undefined, ...paging });
    return externalJson({ data: folders, pagination: { limit: paging.limit, nextCursor: folders.length === paging.limit ? String(paging.offset + paging.limit) : null } });
  }
  if (path.length === 1 && path[0] === "sets") {
    const paging = parsePaging(query.get("limit"), query.get("cursor"));
    const sort = query.get("sort") || "updated";
    if (!new Set(["updated", "name", "created", "custom"]).has(sort)) throw new ExternalListeningFailure(400, "VALIDATION", "sort 값을 확인해 주세요.");
    const rawFolder = query.get("folderId");
    const result = listListeningLibrary(db, { q: query.get("q") || undefined, folderId: rawFolder === null ? undefined : rawFolder === "unfiled" ? null : rawFolder, sort: sort as "updated", limit: paging.limit, offset: paging.offset });
    return externalJson({ data: result.sets, pagination: { limit: paging.limit, nextCursor: result.page.hasMore ? String(paging.offset + paging.limit) : null } });
  }
  if (path.length === 2 && path[0] === "sets") {
    const set = getListeningSet(db, path[1]);
    return externalJson({ data: { ...set, audio: set.audio.map(externalAudioDto) } });
  }
  if (path.length >= 2 && path[0] === "audio") {
    const audioId = path[1];
    if (path.length === 2) {
      const active = getActiveTranscript(db, audioId);
      return externalJson({ data: { ...externalAudioDto(active.audio), script: { versionId: active.script?.id ?? null, versionNo: active.script?.versionNo ?? null, kind: active.script?.kind ?? null, segmentCount: active.script?.segments.length ?? 0 } } });
    }
    if (path.length === 3 && path[2] === "stream") return streamAudio(request, audioId, head);
    if (path.length === 3 && path[2] === "script") { const active = getActiveTranscript(db, audioId); return externalJson({ data: externalScriptDto(active.audio, active.script) }, { ETag: `W/\"${active.audio.revision}\"` }); }
    if (path.length === 3 && path[2] === "versions") return externalJson({ data: listTranscriptVersions(db, audioId).map((version) => ({ ...version, rawPayload: undefined })) });
    if (path.length === 3 && path[2] === "export") {
      const format = query.get("format") || "json"; const lang = query.get("lang") || "bilingual";
      if (!new Set(["json", "txt", "srt"]).has(format) || !new Set(["ja", "ko", "bilingual"]).has(lang)) throw new ExternalListeningFailure(400, "VALIDATION", "내보내기 format 또는 lang을 확인해 주세요.");
      const exported = exportListeningScript(db, audioId, format as "json" | "txt" | "srt", lang as "ja" | "ko" | "bilingual");
      return new Response(head ? null : exported.body, { headers: externalApiHeaders({ "Content-Type": exported.contentType, "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(exported.filename)}`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" }) });
    }
  }
  if (path.length === 2 && path[0] === "jobs") return externalJson({ data: externalJobDto(getListeningJob(db, path[1])) });
  return externalApiError(404, "NOT_FOUND", "외부 청해 API 경로를 찾을 수 없습니다.");
}

async function mutationRoute(request: NextRequest, path: string[], method: string) {
  const db = getDatabase();
  if (method === "POST" && path.length === 3 && path[0] === "sets" && path[2] === "audio") return uploadAudio(request, path[1]);
  const bodyOptional = method === "POST" && ((path[0] === "audio" && new Set(["transcribe", "reprocess"]).has(path[2])) || (path[0] === "jobs" && path[2] === "retry"));
  const payload = method === "DELETE" ? { expectedRevision: expectedRevision(request, undefined) } : bodyOptional ? {} : await readLimitedJson(request, 2 * 1_024 * 1_024) as Record<string, unknown>;
  const scope = `${method}:${path.map((part, index) => index % 2 ? "{id}" : part).join("/")}`;
  return idempotentJsonMutation(request, scope, payload, (): MutationResult => {
    if (method === "POST" && path.length === 1 && path[0] === "folders") return { data: createListeningFolder(db, { name: String(payload.name || ""), parentId: optionalString(payload.parentId), sortIndex: optionalNumber(payload.sortIndex), favorite: optionalBoolean(payload.favorite) }), status: 201 };
    if (method === "POST" && path.length === 1 && path[0] === "sets") { const set = createListeningSet(db, { title: String(payload.title || ""), description: optionalString(payload.description) || undefined, folderId: optionalString(payload.folderId), sortIndex: optionalNumber(payload.sortIndex), favorite: optionalBoolean(payload.favorite) }); return { data: set, status: 201, location: `/api/v1/listening/sets/${encodeURIComponent(set.id)}` }; }
    if (path.length === 2 && path[0] === "folders" && method === "PATCH") return { data: updateListeningFolder(db, path[1], { revision: expectedRevision(request, payload), name: optionalString(payload.name) || undefined, parentId: optionalString(payload.parentId), sortIndex: optionalNumber(payload.sortIndex), favorite: optionalBoolean(payload.favorite) }) };
    if (path.length === 2 && path[0] === "folders" && method === "DELETE") { deleteListeningFolder(db, path[1], expectedRevision(request, payload)); return { data: { deleted: true, policy: "child folders and sets moved to root" } }; }
    if (path.length === 2 && path[0] === "sets" && method === "PATCH") { const set = updateListeningSet(db, path[1], { revision: expectedRevision(request, payload), title: optionalString(payload.title) || undefined, description: optionalString(payload.description) ?? undefined, folderId: optionalString(payload.folderId), sortIndex: optionalNumber(payload.sortIndex), favorite: optionalBoolean(payload.favorite) }); return { data: { ...set, audio: set.audio.map(externalAudioDto) } }; }
    if (path.length === 2 && path[0] === "sets" && method === "DELETE") { deleteListeningSet(db, path[1], expectedRevision(request, payload)); return { data: { deleted: true } }; }
    if (path.length === 2 && path[0] === "audio" && method === "PATCH") return { data: externalAudioDto(updateListeningAudio(db, path[1], { revision: expectedRevision(request, payload), originalName: optionalString(payload.originalName) || undefined, setId: optionalString(payload.setId) || undefined, favorite: optionalBoolean(payload.favorite) })) };
    if (path.length === 2 && path[0] === "audio" && method === "DELETE") { deleteListeningAudio(db, path[1], expectedRevision(request, payload)); return { data: { deleted: true } }; }
    if (path.length === 3 && path[0] === "audio" && path[2] === "transcribe" && method === "POST") { const result = enqueueListeningJob(db, path[1], "transcribe", jobKey(request, path[1], "transcribe")); return { data: externalJobDto(result.job), status: 202 }; }
    if (path.length === 3 && path[0] === "audio" && path[2] === "reprocess" && method === "POST") { if (!getActiveTranscript(db, path[1]).script) throw new ListeningFailure(409, "CONFLICT", "먼저 Whisper 전사를 완료해 주세요."); const result = enqueueListeningJob(db, path[1], "gpt_process", jobKey(request, path[1], "reprocess")); return { data: externalJobDto(result.job), status: 202 }; }
    if (path.length === 3 && path[0] === "jobs" && path[2] === "retry" && method === "POST") return { data: externalJobDto(retryListeningJob(db, path[1])), status: 202 };
    if (path.length === 3 && path[0] === "audio" && path[2] === "script" && method === "PATCH") { const result = editListeningScript(db, path[1], { revision: expectedRevision(request, payload), operations: (payload.operations || []) as ScriptEditOperation[] }); return { data: externalScriptDto(result.audio, result.script) }; }
    if (path.length === 3 && path[0] === "audio" && path[2] === "activate" && method === "POST") { const result = activateScriptVersion(db, path[1], String(payload.versionId || ""), expectedRevision(request, payload)); return { data: { audio: externalAudioDto(result.audio), activated: result.activated } }; }
    throw new ExternalListeningFailure(404, "NOT_FOUND", "외부 청해 API 경로를 찾을 수 없습니다.");
  });
}

function idempotentJsonMutation(request: NextRequest, scope: string, payload: unknown, action: () => MutationResult) {
  const db = getDatabase(); const key = validateListeningIdempotencyKey(request.headers.get("idempotency-key"));
  const outcome = db.transaction(() => {
    const replay = replayExternalMutation(db, scope, key, payload);
    if (replay) return { replay } as const;
    const result = action(); const body = { data: result.data }; const status = result.status || 200; const location = result.location || null;
    rememberExternalMutation(db, scope, key, payload, { body, status, location });
    return { result: { body, status, location } } as const;
  })();
  if ("replay" in outcome && outcome.replay) { const replay = outcome.replay; return externalJson(replay.body, { ...(replay.location ? { Location: replay.location } : {}), "Idempotency-Replayed": "true" }, replay.status === 201 ? 200 : replay.status); }
  const { body, status, location } = outcome.result;
  return externalJson(body, location ? { Location: location } : {}, status);
}

async function uploadAudio(request: NextRequest, setId: string) {
  const db = getDatabase(); getListeningSet(db, setId);
  const key = validateListeningIdempotencyKey(request.headers.get("idempotency-key"));
  const files = await receiveAudioMultipart(request, { maxFiles: 1 });
  const payload = { setId, files: files.map((file) => ({ originalName: file.originalName, sizeBytes: file.sizeBytes, sha256: file.sha256 })) };
  const scope = "POST:sets/{id}/audio";
  let stored = false;
  try {
    const outcome = db.transaction(() => {
      const replay = replayExternalMutation(db, scope, key, payload);
      if (replay) return { replay } as const;
      const file = files[0];
      const audio = registerListeningAudio(db, { setId, originalName: file.originalName, storedKey: file.storedKey, mimeType: file.mimeType, sizeBytes: file.sizeBytes, sha256: file.sha256, durationMs: file.durationMs, sampleRate: file.sampleRate, channels: file.channels, codecName: file.codecName });
      const job = enqueueListeningJob(db, audio.id, "transcribe", key ? `external-upload:${key}` : undefined).job;
      const body = { data: { audio: externalAudioDto(getListeningAudio(db, audio.id)), jobId: job.id, autoTranscribe: true } };
      const location = `/api/v1/listening/audio/${encodeURIComponent(audio.id)}`;
      rememberExternalMutation(db, scope, key, payload, { body, status: 201, location });
      return { result: { body, location } } as const;
    })();
    if ("replay" in outcome && outcome.replay) { await Promise.all(files.map((file) => removeStoredAudio(file.storedKey))); return externalJson(outcome.replay.body, { ...(outcome.replay.location ? { Location: outcome.replay.location } : {}), "Idempotency-Replayed": "true" }, 200); }
    stored = true;
    const { body, location } = outcome.result;
    return externalJson(body, { Location: location }, 201);
  } catch (error) { if (!stored) await Promise.all(files.map((file) => removeStoredAudio(file.storedKey))); throw error; }
}

async function streamAudio(request: NextRequest, audioId: string, head: boolean) {
  const audio = getListeningAudio(getDatabase(), audioId); const file = await openStoredAudio(audio.storedKey);
  const range = parseByteRange(request.headers.get("range"), file.size);
  const common = externalApiHeaders({ "Accept-Ranges": "bytes", "Cache-Control": "private, no-store", "Content-Type": audio.mimeType, ETag: `\"${audio.sha256}\"`, "X-Content-Type-Options": "nosniff" });
  if (range === "invalid") return new Response(null, { status: 416, headers: { ...common, "Content-Range": `bytes */${file.size}` } });
  const headers = range ? { ...common, "Content-Length": String(range.end - range.start + 1), "Content-Range": `bytes ${range.start}-${range.end}/${file.size}` } : { ...common, "Content-Length": String(file.size) };
  if (head) return new Response(null, { status: range ? 206 : 200, headers });
  return new Response(Readable.toWeb(createAudioReadStream(file.absolutePath, range || undefined)) as ReadableStream<Uint8Array>, { status: range ? 206 : 200, headers });
}

function parsePaging(limitValue: string | null, cursorValue: string | null) { const limit = limitValue === null ? 50 : Number(limitValue); const offset = cursorValue === null ? 0 : Number(cursorValue); if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0) throw new ExternalListeningFailure(400, "VALIDATION", "limit 또는 cursor를 확인해 주세요."); return { limit, offset }; }
function expectedRevision(request: NextRequest, payload: Record<string, unknown> | undefined) { const bodyValue = payload?.expectedRevision ?? payload?.revision; if (Number.isInteger(bodyValue) && Number(bodyValue) > 0) return Number(bodyValue); const match = /^(?:W\/)?\"?([0-9]+)\"?$/.exec(request.headers.get("if-match") || ""); if (match) return Number(match[1]); if (payload === undefined && request.nextUrl.searchParams.has("expectedRevision")) { const value = Number(request.nextUrl.searchParams.get("expectedRevision")); if (Number.isInteger(value) && value > 0) return value; } throw new ExternalListeningFailure(400, "VALIDATION", "expectedRevision 또는 If-Match가 필요합니다."); }
function optionalString(value: unknown) { return value === null ? null : typeof value === "string" ? value : undefined; }
function optionalNumber(value: unknown) { return Number.isInteger(value) ? Number(value) : undefined; }
function optionalBoolean(value: unknown) { return typeof value === "boolean" ? value : undefined; }
function jobKey(request: NextRequest, audioId: string, action: string) { const key = validateListeningIdempotencyKey(request.headers.get("idempotency-key")); return key ? `external:${action}:${key}` : `${action}:${audioId}:${crypto.randomUUID()}`; }
function externalJson(body: unknown, headers: HeadersInit = {}, status = 200) { return apiJson(body, { status, headers: externalApiHeaders(headers) }); }
function externalListeningError(error: unknown) { if (error instanceof ExternalListeningFailure) return externalApiError(error.status, error.code, error.message, error.details); if (error instanceof ListeningFailure) return externalApiError(error.status, error.code, error.message); if (error instanceof AudioStorageFailure) return externalApiError(error.status, error.code, error.message); if (error instanceof PayloadTooLargeError) return externalApiError(413, "TOO_LARGE", "요청 본문이 너무 큽니다."); if (error instanceof SyntaxError) return externalApiError(400, "VALIDATION", "JSON 형식이 올바르지 않습니다."); return externalApiError(500, "INTERNAL", "청해 API 요청을 처리하지 못했습니다."); }
