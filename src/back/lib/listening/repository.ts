import "server-only";

import { createHash, randomUUID } from "node:crypto";
import type { AppDatabase } from "@back/lib/db/database";
import type {
  ListeningAudio,
  ListeningFolder,
  ListeningJob,
  ListeningScriptVersion,
  ListeningSegment,
  ListeningSetSummary,
} from "@back/lib/listening/types";

type Row = Record<string, unknown>;

export class ListeningFailure extends Error {
  constructor(
    readonly status: number,
    readonly code: "VALIDATION" | "NOT_FOUND" | "CONFLICT" | "INTERNAL",
    message: string,
  ) {
    super(message);
    this.name = "ListeningFailure";
  }
}

function now() { return new Date().toISOString(); }
function id(prefix: string) { return `${prefix}-${randomUUID()}`; }
function bool(value: unknown) { return Number(value) === 1; }
function text(value: unknown) { return String(value ?? ""); }
function nullableText(value: unknown) { return value === null || value === undefined ? null : String(value); }
function nullableNumber(value: unknown) { return value === null || value === undefined ? null : Number(value); }

function requiredLabel(value: unknown, label: string, max: number) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) {
    throw new ListeningFailure(400, "VALIDATION", `${label}을(를) 확인해 주세요.`);
  }
  return value.trim();
}

function expectedRevision(value: unknown) {
  if (!Number.isInteger(value) || Number(value) < 1) {
    throw new ListeningFailure(400, "VALIDATION", "revision을 확인해 주세요.");
  }
  return Number(value);
}

function folderFrom(row: Row): ListeningFolder {
  return {
    id: text(row.id), parentId: nullableText(row.parent_id), name: text(row.name),
    sortIndex: Number(row.sort_index), favorite: bool(row.favorite), revision: Number(row.revision),
    createdAt: text(row.created_at), updatedAt: text(row.updated_at),
  };
}

function setFrom(row: Row): ListeningSetSummary {
  return {
    id: text(row.id), folderId: nullableText(row.folder_id), title: text(row.title),
    description: text(row.description), sortIndex: Number(row.sort_index), favorite: bool(row.favorite),
    revision: Number(row.revision), audioCount: Number(row.audio_count ?? 0),
    durationMs: Number(row.duration_ms ?? 0), lastPlayedAt: nullableText(row.last_played_at),
    createdAt: text(row.created_at), updatedAt: text(row.updated_at),
  };
}

function audioFrom(row: Row): ListeningAudio {
  return {
    id: text(row.id), setId: text(row.set_id), originalName: text(row.original_name),
    storedKey: text(row.stored_key), mimeType: text(row.mime_type), sizeBytes: Number(row.size_bytes),
    sha256: text(row.sha256), durationMs: nullableNumber(row.duration_ms), sampleRate: nullableNumber(row.sample_rate),
    channels: nullableNumber(row.channels), codecName: nullableText(row.codec_name), status: text(row.status),
    scriptVersionId: nullableText(row.script_version_id), favorite: bool(row.favorite),
    lastPlayedAt: nullableText(row.last_played_at), revision: Number(row.revision),
    createdAt: text(row.created_at), updatedAt: text(row.updated_at),
  };
}

function jobFrom(row: Row): ListeningJob {
  return {
    id: text(row.id), audioId: text(row.audio_id), type: text(row.type) as ListeningJob["type"],
    state: text(row.state) as ListeningJob["state"], stage: text(row.stage), attempt: Number(row.attempt),
    maxAttempts: Number(row.max_attempts), progress: Number(row.progress),
    inputVersionId: nullableText(row.input_version_id), outputVersionId: nullableText(row.output_version_id),
    errorCode: nullableText(row.error_code), errorMessage: nullableText(row.error_message),
    createdAt: text(row.created_at), updatedAt: text(row.updated_at),
  };
}

const setSummarySql = `
  SELECT s.*,
    COUNT(a.id) AS audio_count,
    COALESCE(SUM(a.duration_ms), 0) AS duration_ms,
    MAX(a.last_played_at) AS last_played_at
  FROM listening_sets s
  LEFT JOIN listening_audio a ON a.set_id=s.id AND a.deleted_at IS NULL
`;

export function listListeningLibrary(db: AppDatabase, options: {
  q?: string;
  filter?: "all" | "recent" | "favorites" | "unfiled";
  limit?: number;
  offset?: number;
} = {}) {
  const limit = Math.min(100, Math.max(1, options.limit ?? 50));
  const offset = Math.max(0, options.offset ?? 0);
  const q = options.q?.trim().slice(0, 200) || "";
  const like = `%${q.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
  const folders = db.prepare(`
    SELECT * FROM listening_folders
    WHERE deleted_at IS NULL AND (?='' OR name LIKE ? ESCAPE '\\')
    ORDER BY sort_index, name, id LIMIT ? OFFSET ?
  `).all(q, like, limit, offset).map((row) => folderFrom(row as Row));

  const where = ["s.deleted_at IS NULL"];
  const params: unknown[] = [];
  if (q) { where.push("(s.title LIKE ? ESCAPE '\\' OR s.description LIKE ? ESCAPE '\\' OR EXISTS (SELECT 1 FROM listening_folders f WHERE f.id=s.folder_id AND f.name LIKE ? ESCAPE '\\'))"); params.push(like, like, like); }
  if (options.filter === "favorites") where.push("s.favorite=1");
  if (options.filter === "unfiled") where.push("s.folder_id IS NULL");
  if (options.filter === "recent") where.push("(s.updated_at >= datetime('now','-30 days') OR EXISTS (SELECT 1 FROM listening_audio recent_audio WHERE recent_audio.set_id=s.id AND recent_audio.last_played_at >= datetime('now','-30 days')))");
  const sets = db.prepare(`${setSummarySql} WHERE ${where.join(" AND ")} GROUP BY s.id ORDER BY s.sort_index, s.updated_at DESC, s.id LIMIT ? OFFSET ?`)
    .all(...params, limit, offset).map((row) => setFrom(row as Row));
  return { folders, sets, page: { limit, offset, hasMore: sets.length === limit } };
}

export function createListeningFolder(db: AppDatabase, input: { name: string; parentId?: string | null; sortIndex?: number; favorite?: boolean }) {
  const timestamp = now();
  const folder: ListeningFolder = {
    id: id("lf"), parentId: input.parentId ?? null, name: requiredLabel(input.name, "폴더 이름", 120),
    sortIndex: Number.isInteger(input.sortIndex) ? Number(input.sortIndex) : 0,
    favorite: Boolean(input.favorite), revision: 1, createdAt: timestamp, updatedAt: timestamp,
  };
  if (folder.parentId && !db.prepare("SELECT 1 FROM listening_folders WHERE id=? AND deleted_at IS NULL").get(folder.parentId)) {
    throw new ListeningFailure(404, "NOT_FOUND", "상위 폴더를 찾을 수 없습니다.");
  }
  db.prepare(`INSERT INTO listening_folders(id,parent_id,name,sort_index,favorite,revision,created_at,updated_at)
    VALUES (@id,@parentId,@name,@sortIndex,@favorite,1,@createdAt,@updatedAt)`).run({ ...folder, favorite: Number(folder.favorite) });
  return folder;
}

export function updateListeningFolder(db: AppDatabase, folderId: string, input: Partial<{ name: string; parentId: string | null; sortIndex: number; favorite: boolean }> & { revision: number }) {
  const currentRow = db.prepare("SELECT * FROM listening_folders WHERE id=? AND deleted_at IS NULL").get(folderId) as Row | undefined;
  if (!currentRow) throw new ListeningFailure(404, "NOT_FOUND", "폴더를 찾을 수 없습니다.");
  const current = folderFrom(currentRow);
  const revision = expectedRevision(input.revision);
  if (current.revision !== revision) throw new ListeningFailure(409, "CONFLICT", "폴더가 다른 곳에서 수정되었습니다.");
  const next = {
    name: input.name === undefined ? current.name : requiredLabel(input.name, "폴더 이름", 120),
    parentId: input.parentId === undefined ? current.parentId : input.parentId,
    sortIndex: Number.isInteger(input.sortIndex) ? Number(input.sortIndex) : current.sortIndex,
    favorite: input.favorite === undefined ? current.favorite : Boolean(input.favorite),
  };
  if (next.parentId === folderId) throw new ListeningFailure(400, "VALIDATION", "폴더 자신을 상위 폴더로 지정할 수 없습니다.");
  const timestamp = now();
  const result = db.prepare(`UPDATE listening_folders SET parent_id=?,name=?,sort_index=?,favorite=?,revision=revision+1,updated_at=? WHERE id=? AND revision=? AND deleted_at IS NULL`)
    .run(next.parentId, next.name, next.sortIndex, Number(next.favorite), timestamp, folderId, revision);
  if (!result.changes) throw new ListeningFailure(409, "CONFLICT", "폴더가 다른 곳에서 수정되었습니다.");
  return folderFrom(db.prepare("SELECT * FROM listening_folders WHERE id=?").get(folderId) as Row);
}

export function deleteListeningFolder(db: AppDatabase, folderId: string, revision: number) {
  const timestamp = now();
  const result = db.prepare("UPDATE listening_folders SET deleted_at=?,updated_at=?,revision=revision+1 WHERE id=? AND revision=? AND deleted_at IS NULL")
    .run(timestamp, timestamp, folderId, expectedRevision(revision));
  if (!result.changes) throw new ListeningFailure(409, "CONFLICT", "폴더를 찾을 수 없거나 revision이 다릅니다.");
  db.prepare("UPDATE listening_sets SET folder_id=NULL,updated_at=?,revision=revision+1 WHERE folder_id=? AND deleted_at IS NULL").run(timestamp, folderId);
}

export function createListeningSet(db: AppDatabase, input: { title: string; description?: string; folderId?: string | null; sortIndex?: number; favorite?: boolean }) {
  if (input.folderId && !db.prepare("SELECT 1 FROM listening_folders WHERE id=? AND deleted_at IS NULL").get(input.folderId)) {
    throw new ListeningFailure(404, "NOT_FOUND", "폴더를 찾을 수 없습니다.");
  }
  const timestamp = now();
  const setId = id("ls");
  db.prepare(`INSERT INTO listening_sets(id,folder_id,title,description,sort_index,favorite,revision,created_at,updated_at)
    VALUES (?,?,?,?,?,?,1,?,?)`).run(setId, input.folderId ?? null, requiredLabel(input.title, "세트 제목", 200), (input.description ?? "").trim().slice(0, 2000), Number.isInteger(input.sortIndex) ? input.sortIndex : 0, Number(Boolean(input.favorite)), timestamp, timestamp);
  return getListeningSet(db, setId);
}

export function getListeningSet(db: AppDatabase, setId: string) {
  const row = db.prepare(`${setSummarySql} WHERE s.id=? AND s.deleted_at IS NULL GROUP BY s.id`).get(setId) as Row | undefined;
  if (!row) throw new ListeningFailure(404, "NOT_FOUND", "세트를 찾을 수 없습니다.");
  const audio = db.prepare("SELECT * FROM listening_audio WHERE set_id=? AND deleted_at IS NULL ORDER BY created_at,id").all(setId).map((item) => audioFrom(item as Row));
  return { ...setFrom(row), audio };
}

export function updateListeningSet(db: AppDatabase, setId: string, input: Partial<{ title: string; description: string; folderId: string | null; sortIndex: number; favorite: boolean }> & { revision: number }) {
  const current = getListeningSet(db, setId);
  const revision = expectedRevision(input.revision);
  if (current.revision !== revision) throw new ListeningFailure(409, "CONFLICT", "세트가 다른 곳에서 수정되었습니다.");
  if (input.folderId && !db.prepare("SELECT 1 FROM listening_folders WHERE id=? AND deleted_at IS NULL").get(input.folderId)) throw new ListeningFailure(404, "NOT_FOUND", "폴더를 찾을 수 없습니다.");
  const timestamp = now();
  const result = db.prepare(`UPDATE listening_sets SET folder_id=?,title=?,description=?,sort_index=?,favorite=?,revision=revision+1,updated_at=? WHERE id=? AND revision=? AND deleted_at IS NULL`).run(
    input.folderId === undefined ? current.folderId : input.folderId,
    input.title === undefined ? current.title : requiredLabel(input.title, "세트 제목", 200),
    input.description === undefined ? current.description : input.description.trim().slice(0, 2000),
    Number.isInteger(input.sortIndex) ? input.sortIndex : current.sortIndex,
    Number(input.favorite === undefined ? current.favorite : input.favorite), timestamp, setId, revision,
  );
  if (!result.changes) throw new ListeningFailure(409, "CONFLICT", "세트가 다른 곳에서 수정되었습니다.");
  return getListeningSet(db, setId);
}

export function deleteListeningSet(db: AppDatabase, setId: string, revision: number) {
  const timestamp = now();
  const transaction = db.transaction(() => {
    const result = db.prepare("UPDATE listening_sets SET deleted_at=?,updated_at=?,revision=revision+1 WHERE id=? AND revision=? AND deleted_at IS NULL").run(timestamp, timestamp, setId, expectedRevision(revision));
    if (!result.changes) throw new ListeningFailure(409, "CONFLICT", "세트를 찾을 수 없거나 revision이 다릅니다.");
    db.prepare("UPDATE listening_audio SET deleted_at=?,updated_at=?,revision=revision+1 WHERE set_id=? AND deleted_at IS NULL").run(timestamp, timestamp, setId);
  });
  transaction();
}

export function registerListeningAudio(db: AppDatabase, input: {
  setId: string; originalName: string; storedKey: string; mimeType: string; sizeBytes: number; sha256: string;
  durationMs?: number | null; sampleRate?: number | null; channels?: number | null; codecName?: string | null;
}) {
  if (!db.prepare("SELECT 1 FROM listening_sets WHERE id=? AND deleted_at IS NULL").get(input.setId)) throw new ListeningFailure(404, "NOT_FOUND", "세트를 찾을 수 없습니다.");
  if (!Number.isSafeInteger(input.sizeBytes) || input.sizeBytes < 1 || !/^[a-f0-9]{64}$/i.test(input.sha256)) throw new ListeningFailure(400, "VALIDATION", "음원 메타데이터가 올바르지 않습니다.");
  const timestamp = now();
  const audioId = id("la");
  db.prepare(`INSERT INTO listening_audio(id,set_id,original_name,stored_key,mime_type,size_bytes,sha256,duration_ms,sample_rate,channels,codec_name,status,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,'uploaded',?,?)`).run(audioId, input.setId, requiredLabel(input.originalName, "파일 이름", 255), input.storedKey, input.mimeType, input.sizeBytes, input.sha256.toLowerCase(), input.durationMs ?? null, input.sampleRate ?? null, input.channels ?? null, input.codecName ?? null, timestamp, timestamp);
  return getListeningAudio(db, audioId);
}

export function getListeningAudio(db: AppDatabase, audioId: string, includeDeleted = false) {
  const row = db.prepare(`SELECT * FROM listening_audio WHERE id=?${includeDeleted ? "" : " AND deleted_at IS NULL"}`).get(audioId) as Row | undefined;
  if (!row) throw new ListeningFailure(404, "NOT_FOUND", "음원을 찾을 수 없습니다.");
  return audioFrom(row);
}

export function updateListeningAudio(db: AppDatabase, audioId: string, input: Partial<{ favorite: boolean; lastPlayedAt: string | null; status: string }> & { revision: number }) {
  const current = getListeningAudio(db, audioId);
  const revision = expectedRevision(input.revision);
  if (current.revision !== revision) throw new ListeningFailure(409, "CONFLICT", "음원이 다른 곳에서 수정되었습니다.");
  const status = input.status ?? current.status;
  if (!new Set(["uploaded","queued","transcribing","transcribed","correcting","ready","failed","missing"]).has(status)) throw new ListeningFailure(400, "VALIDATION", "음원 상태가 올바르지 않습니다.");
  const timestamp = now();
  const result = db.prepare("UPDATE listening_audio SET favorite=?,last_played_at=?,status=?,revision=revision+1,updated_at=? WHERE id=? AND revision=? AND deleted_at IS NULL")
    .run(Number(input.favorite ?? current.favorite), input.lastPlayedAt === undefined ? current.lastPlayedAt : input.lastPlayedAt, status, timestamp, audioId, revision);
  if (!result.changes) throw new ListeningFailure(409, "CONFLICT", "음원이 다른 곳에서 수정되었습니다.");
  return getListeningAudio(db, audioId);
}

export function deleteListeningAudio(db: AppDatabase, audioId: string, revision: number) {
  const timestamp = now();
  const result = db.prepare("UPDATE listening_audio SET deleted_at=?,updated_at=?,revision=revision+1 WHERE id=? AND revision=? AND deleted_at IS NULL")
    .run(timestamp, timestamp, audioId, expectedRevision(revision));
  if (!result.changes) throw new ListeningFailure(409, "CONFLICT", "음원을 찾을 수 없거나 revision이 다릅니다.");
  db.prepare("UPDATE listening_jobs SET state='canceled',stage='canceled',canceled_at=?,updated_at=? WHERE audio_id=? AND state IN ('queued','running','waiting_auth')").run(timestamp, timestamp, audioId);
  recordListeningAudit(db, "audio.delete", { audioId });
}

export function enqueueListeningJob(db: AppDatabase, audioId: string, type: ListeningJob["type"], idempotencyKey?: string) {
  getListeningAudio(db, audioId);
  const key = idempotencyKey?.trim() || `${type}:${audioId}:${randomUUID()}`;
  if (key.length > 200) throw new ListeningFailure(400, "VALIDATION", "Idempotency-Key가 너무 깁니다.");
  const replay = db.prepare("SELECT * FROM listening_jobs WHERE idempotency_key=?").get(key) as Row | undefined;
  if (replay) return { job: jobFrom(replay), replayed: true };
  const active = db.prepare("SELECT * FROM listening_jobs WHERE audio_id=? AND type=? AND state IN ('queued','running','waiting_auth') ORDER BY created_at DESC LIMIT 1").get(audioId, type) as Row | undefined;
  if (active) return { job: jobFrom(active), replayed: true };
  const timestamp = now();
  const jobId = id("lj");
  const inputVersionId = type === "gpt_process" ? getListeningAudio(db, audioId).scriptVersionId : null;
  db.prepare(`INSERT INTO listening_jobs(id,audio_id,type,state,stage,next_run_at,idempotency_key,input_version_id,created_at,updated_at)
    VALUES (?, ?, ?, 'queued', ?, ?, ?, ?, ?, ?)`)
    .run(jobId, audioId, type, type === "transcribe" ? "queued" : "correcting", timestamp, key, inputVersionId, timestamp, timestamp);
  db.prepare("UPDATE listening_audio SET status=?,updated_at=?,revision=revision+1 WHERE id=?").run(type === "transcribe" ? "queued" : "correcting", timestamp, audioId);
  recordListeningAudit(db, "job.enqueue", { audioId, jobId, detailCode: type });
  return { job: getListeningJob(db, jobId), replayed: false };
}

export function getListeningJob(db: AppDatabase, jobId: string) {
  const row = db.prepare("SELECT * FROM listening_jobs WHERE id=?").get(jobId) as Row | undefined;
  if (!row) throw new ListeningFailure(404, "NOT_FOUND", "작업을 찾을 수 없습니다.");
  return jobFrom(row);
}

export function retryListeningJob(db: AppDatabase, jobId: string) {
  const current = getListeningJob(db, jobId);
  if (!new Set(["failed", "waiting_auth", "canceled"]).has(current.state)) throw new ListeningFailure(409, "CONFLICT", "현재 상태에서는 재시도할 수 없습니다.");
  const timestamp = now();
  db.prepare(`UPDATE listening_jobs SET state='queued',stage=?,next_run_at=?,lease_owner=NULL,lease_expires_at=NULL,error_code=NULL,error_message=NULL,canceled_at=NULL,updated_at=? WHERE id=?`)
    .run(current.type === "transcribe" ? "queued" : "correcting", timestamp, timestamp, jobId);
  db.prepare("UPDATE listening_audio SET status=?,updated_at=?,revision=revision+1 WHERE id=?").run(current.type === "transcribe" ? "queued" : "correcting", timestamp, current.audioId);
  recordListeningAudit(db, "job.retry", { audioId: current.audioId, jobId });
  return getListeningJob(db, jobId);
}

export function createTranscriptVersion(db: AppDatabase, input: {
  audioId: string;
  kind: ListeningScriptVersion["kind"];
  basedOnId?: string | null;
  language?: string;
  rawPayload: unknown;
  modelName?: string | null;
  promptVersion?: string | null;
  segments: Array<Omit<ListeningSegment, "id" | "ordinal"> & { id?: string; ordinal?: number }>;
}) {
  getListeningAudio(db, input.audioId);
  validateSegments(input.segments);
  const transaction = db.transaction(() => {
    const versionNo = Number((db.prepare("SELECT COALESCE(MAX(version_no),0)+1 AS next FROM listening_transcript_versions WHERE audio_id=?").get(input.audioId) as { next: number }).next);
    const versionId = id("lv");
    const timestamp = now();
    db.prepare(`INSERT INTO listening_transcript_versions(id,audio_id,version_no,kind,based_on_id,language,raw_payload_json,model_name,prompt_version,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)`).run(versionId, input.audioId, versionNo, input.kind, input.basedOnId ?? null, input.language ?? "ja", JSON.stringify(input.rawPayload), input.modelName ?? null, input.promptVersion ?? null, timestamp);
    const insert = db.prepare(`INSERT INTO listening_script_segments(id,version_id,ordinal,start_ms,end_ms,speaker,ja,ko,needs_review,review_note,source_segment_ids_json,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    input.segments.forEach((segment, ordinal) => insert.run(segment.id || id("lseg"), versionId, ordinal, segment.startMs, segment.endMs, segment.speaker, segment.ja, segment.ko, Number(segment.needsReview), segment.reviewNote, JSON.stringify(segment.sourceSegmentIds), timestamp, timestamp));
    return versionId;
  });
  return getTranscriptVersion(db, transaction());
}

export function getTranscriptVersion(db: AppDatabase, versionId: string) {
  const row = db.prepare("SELECT * FROM listening_transcript_versions WHERE id=?").get(versionId) as Row | undefined;
  if (!row) throw new ListeningFailure(404, "NOT_FOUND", "스크립트 버전을 찾을 수 없습니다.");
  const segments = db.prepare("SELECT * FROM listening_script_segments WHERE version_id=? ORDER BY ordinal").all(versionId).map((item) => segmentFrom(item as Row));
  return {
    id: text(row.id), audioId: text(row.audio_id), versionNo: Number(row.version_no), kind: text(row.kind) as ListeningScriptVersion["kind"],
    basedOnId: nullableText(row.based_on_id), language: text(row.language), modelName: nullableText(row.model_name),
    promptVersion: nullableText(row.prompt_version), createdAt: text(row.created_at), segments,
  } satisfies ListeningScriptVersion;
}

export function listTranscriptVersions(db: AppDatabase, audioId: string) {
  getListeningAudio(db, audioId);
  return db.prepare("SELECT id FROM listening_transcript_versions WHERE audio_id=? ORDER BY version_no DESC").all(audioId)
    .map((row) => getTranscriptVersion(db, text((row as Row).id)));
}

export function activateTranscriptVersion(db: AppDatabase, audioId: string, versionId: string, revision: number, allowReplaceManual = true) {
  const audio = getListeningAudio(db, audioId);
  if (audio.revision !== expectedRevision(revision)) throw new ListeningFailure(409, "CONFLICT", "음원 스크립트가 다른 곳에서 변경되었습니다.");
  const version = getTranscriptVersion(db, versionId);
  if (version.audioId !== audioId) throw new ListeningFailure(400, "VALIDATION", "다른 음원의 스크립트 버전입니다.");
  if (!allowReplaceManual && audio.scriptVersionId) {
    const active = getTranscriptVersion(db, audio.scriptVersionId);
    if (active.kind === "manual_edit") return { audio, activated: false };
  }
  const timestamp = now();
  const result = db.prepare("UPDATE listening_audio SET script_version_id=?,status='ready',revision=revision+1,updated_at=? WHERE id=? AND revision=? AND deleted_at IS NULL")
    .run(versionId, timestamp, audioId, revision);
  if (!result.changes) throw new ListeningFailure(409, "CONFLICT", "음원 스크립트가 다른 곳에서 변경되었습니다.");
  recordListeningAudit(db, "script.activate", { audioId, versionId });
  return { audio: getListeningAudio(db, audioId), activated: true };
}

export function getActiveTranscript(db: AppDatabase, audioId: string) {
  const audio = getListeningAudio(db, audioId);
  return { audio, script: audio.scriptVersionId ? getTranscriptVersion(db, audio.scriptVersionId) : null };
}

export function requestFingerprint(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function recordListeningAudit(db: AppDatabase, action: string, input: { audioId?: string; jobId?: string; versionId?: string; detailCode?: string } = {}) {
  db.prepare("INSERT INTO listening_audit_log(action,audio_id,job_id,version_id,detail_code,occurred_at) VALUES (?,?,?,?,?,?)")
    .run(action, input.audioId ?? null, input.jobId ?? null, input.versionId ?? null, input.detailCode ?? null, now());
}

function segmentFrom(row: Row): ListeningSegment {
  let sourceSegmentIds: string[] = [];
  try {
    const parsed = JSON.parse(text(row.source_segment_ids_json));
    if (Array.isArray(parsed)) sourceSegmentIds = parsed.filter((value): value is string => typeof value === "string");
  } catch { /* the database constraint prevents invalid JSON */ }
  return {
    id: text(row.id), ordinal: Number(row.ordinal), startMs: Number(row.start_ms), endMs: Number(row.end_ms),
    speaker: nullableText(row.speaker), ja: text(row.ja), ko: nullableText(row.ko), needsReview: bool(row.needs_review),
    reviewNote: nullableText(row.review_note), sourceSegmentIds,
  };
}

function validateSegments(segments: Array<{ startMs: number; endMs: number; ja: string; ko: string | null; sourceSegmentIds: string[] }>) {
  if (!Array.isArray(segments) || segments.length > 10_000) throw new ListeningFailure(400, "VALIDATION", "스크립트 문장 수가 올바르지 않습니다.");
  let previousStart = -1;
  for (const segment of segments) {
    if (!Number.isInteger(segment.startMs) || !Number.isInteger(segment.endMs) || segment.startMs < 0 || segment.endMs <= segment.startMs || segment.startMs < previousStart) {
      throw new ListeningFailure(400, "VALIDATION", "스크립트 시간 정보가 올바르지 않습니다.");
    }
    if (typeof segment.ja !== "string" || segment.ja.length > 10_000 || (segment.ko !== null && (typeof segment.ko !== "string" || segment.ko.length > 10_000))) {
      throw new ListeningFailure(400, "VALIDATION", "스크립트 텍스트가 올바르지 않습니다.");
    }
    if (!Array.isArray(segment.sourceSegmentIds) || segment.sourceSegmentIds.some((value) => typeof value !== "string")) {
      throw new ListeningFailure(400, "VALIDATION", "스크립트 출처 정보가 올바르지 않습니다.");
    }
    previousStart = segment.startMs;
  }
}
