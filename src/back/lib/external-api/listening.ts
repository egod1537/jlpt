import "server-only";

import { createHash } from "node:crypto";
import type { AppDatabase } from "@back/lib/db/database";
import type { ListeningAudio, ListeningJob, ListeningScriptVersion } from "@back/lib/listening/types";

type Row = Record<string, unknown>;

export class ExternalListeningFailure extends Error {
  constructor(readonly status: number, readonly code: string, message: string, readonly details?: Record<string, unknown>) {
    super(message);
    this.name = "ExternalListeningFailure";
  }
}

export function validateListeningIdempotencyKey(value: string | null) {
  if (value === null) return undefined;
  if (!value || value.length > 128 || /[\u0000-\u001f\u007f]/.test(value)) throw new ExternalListeningFailure(400, "VALIDATION", "Idempotency-Key는 1~128자의 인쇄 가능한 문자열이어야 합니다.");
  return value;
}

export function externalRequestHash(payload: unknown) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export type StoredExternalResponse = { status: number; body: unknown; location: string | null };

export function replayExternalMutation(db: AppDatabase, scope: string, key: string | undefined, payload: unknown): StoredExternalResponse | null {
  if (!key) return null;
  const row = db.prepare("SELECT * FROM external_listening_idempotency WHERE scope=? AND idempotency_key=?").get(scope, key) as Row | undefined;
  if (!row) return null;
  if (String(row.request_hash) !== externalRequestHash(payload)) throw new ExternalListeningFailure(409, "IDEMPOTENCY_CONFLICT", "같은 Idempotency-Key가 다른 요청에 이미 사용되었습니다.");
  return { status: Number(row.response_status), body: JSON.parse(String(row.response_json)), location: row.location === null ? null : String(row.location) };
}

export function rememberExternalMutation(db: AppDatabase, scope: string, key: string | undefined, payload: unknown, response: StoredExternalResponse) {
  if (!key) return;
  try {
    db.prepare(`INSERT INTO external_listening_idempotency(scope,idempotency_key,request_hash,response_status,response_json,location,created_at)
      VALUES (?,?,?,?,?,?,?)`).run(scope, key, externalRequestHash(payload), response.status, JSON.stringify(response.body), response.location, new Date().toISOString());
  } catch (error) {
    const replay = replayExternalMutation(db, scope, key, payload);
    if (!replay) throw error;
  }
}

export function listExternalListeningFolders(db: AppDatabase, input: { q?: string; limit: number; offset: number }) {
  const q = input.q?.trim().slice(0, 200) || "";
  const like = `%${q.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
  const rows = db.prepare(`SELECT id,parent_id,name,sort_index,favorite,revision,created_at,updated_at
    FROM listening_folders WHERE deleted_at IS NULL AND (?='' OR name LIKE ? ESCAPE '\\')
    ORDER BY sort_index,name,id LIMIT ? OFFSET ?`).all(q, like, input.limit, input.offset) as Row[];
  return rows.map((row) => ({
    id: String(row.id), parentId: row.parent_id === null ? null : String(row.parent_id), name: String(row.name),
    sortIndex: Number(row.sort_index), favorite: Number(row.favorite) === 1, revision: Number(row.revision),
    createdAt: String(row.created_at), updatedAt: String(row.updated_at),
  }));
}

export function externalAudioDto(audio: ListeningAudio) {
  return {
    id: audio.id, setId: audio.setId, originalName: audio.originalName, mimeType: audio.mimeType,
    sizeBytes: audio.sizeBytes, durationMs: audio.durationMs, sampleRate: audio.sampleRate, channels: audio.channels,
    codecName: audio.codecName, status: audio.status, versionId: audio.scriptVersionId, favorite: audio.favorite,
    revision: audio.revision, createdAt: audio.createdAt, updatedAt: audio.updatedAt,
    streamUrl: `/api/v1/listening/audio/${encodeURIComponent(audio.id)}/stream`,
  };
}

export function externalJobDto(job: ListeningJob) {
  return {
    jobId: job.id, audioId: job.audioId, type: job.type, state: job.state, stage: job.stage,
    attempt: job.attempt, maxAttempts: job.maxAttempts, progress: job.progress > 1 ? job.progress / 100 : job.progress,
    inputVersionId: job.inputVersionId, outputVersionId: job.outputVersionId,
    error: job.errorCode || job.errorMessage ? { code: job.errorCode, message: job.errorMessage } : null,
    createdAt: job.createdAt, updatedAt: job.updatedAt,
  };
}

export function externalScriptDto(audio: ListeningAudio, script: ListeningScriptVersion | null) {
  return {
    audioId: audio.id, versionId: script?.id ?? null, revision: audio.revision, durationMs: audio.durationMs,
    language: script?.language ?? "ja", kind: script?.kind ?? null, versionNo: script?.versionNo ?? null,
    segments: script?.segments.map((segment) => ({
      id: segment.id, ordinal: segment.ordinal, startMs: segment.startMs, endMs: segment.endMs,
      speaker: segment.speaker, ja: segment.ja, ko: segment.ko, needsReview: segment.needsReview,
      reviewNote: segment.reviewNote, sourceSegmentIds: segment.sourceSegmentIds,
    })) ?? [],
  };
}
