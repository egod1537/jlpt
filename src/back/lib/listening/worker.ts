import "server-only";

import { hostname } from "node:os";
import { randomUUID } from "node:crypto";
import type { AppDatabase } from "@back/lib/db/database";
import { getDatabase } from "@back/lib/db/database";
import {
  activateTranscriptVersion,
  createTranscriptVersion,
  enqueueListeningJob,
  getListeningAudio,
  getListeningJob,
  getTranscriptVersion,
  recordListeningAudit,
} from "@back/lib/listening/repository";
import { openStoredAudio } from "@back/lib/listening/storage";
import {
  HttpWhisperAdapter,
  type WhisperAdapter,
  WhisperProviderFailure,
  type WhisperProviderResult,
  waitForWhisperResult,
} from "@back/lib/listening/whisper";
import {
  type GptListeningAdapter,
  OpenAiListeningFailure,
  ResponsesGptListeningAdapter,
} from "@/lib/server/openai-listening";

type ClaimedJob = {
  id: string;
  audioId: string;
  type: "transcribe" | "gpt_process";
  attempt: number;
  maxAttempts: number;
  idempotencyKey: string;
  providerJobId: string | null;
  inputVersionId: string | null;
};

type WorkerDependencies = {
  workerId?: string;
  adapter?: WhisperAdapter;
  gptAdapter?: GptListeningAdapter;
  now?: () => Date;
  random?: () => number;
  wait?: (ms: number, signal?: AbortSignal) => Promise<void>;
};

export class TranscriptValidationFailure extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = "TranscriptValidationFailure";
  }
}

export async function runListeningWorkerOnce(db: AppDatabase, dependencies: WorkerDependencies = {}) {
  const now = dependencies.now ?? (() => new Date());
  const workerId = dependencies.workerId ?? `${hostname()}:${process.pid}:${randomUUID()}`;
  const job = claimNextJob(db, workerId, now());
  if (!job) return false;
  if (job.type === "gpt_process") {
    try {
      await processGptJob(db, job, workerId, dependencies);
    } catch (error) {
      failOrRetry(db, job, error, now(), dependencies.random);
    }
    return true;
  }
  try {
    await processTranscriptionJob(db, job, workerId, dependencies);
  } catch (error) {
    failOrRetry(db, job, error, now(), dependencies.random);
  }
  return true;
}

async function processGptJob(db: AppDatabase, job: ClaimedJob, workerId: string, dependencies: WorkerDependencies) {
  if (!job.inputVersionId) throw new OpenAiListeningFailure("GPT_INPUT_MISSING", "GPT 처리할 원본 전사가 없습니다.", false);
  const inputVersion = getTranscriptVersion(db, job.inputVersionId);
  if (inputVersion.audioId !== job.audioId) throw new OpenAiListeningFailure("GPT_INPUT_MISMATCH", "GPT 원본 전사가 음원과 일치하지 않습니다.", false);
  const adapter = dependencies.gptAdapter ?? new ResponsesGptListeningAdapter();
  const result = await adapter.process(inputVersion.segments);
  const finalize = db.transaction(() => {
    const version = createTranscriptVersion(db, {
      audioId: job.audioId,
      kind: "gpt_processed",
      basedOnId: inputVersion.id,
      language: "ja-ko",
      rawPayload: result.rawPayload,
      modelName: result.model,
      promptVersion: result.promptVersion,
      segments: result.segments,
    });
    const currentAudio = getListeningAudio(db, job.audioId);
    activateTranscriptVersion(db, job.audioId, version.id, currentAudio.revision, false);
    const completedAt = (dependencies.now?.() ?? new Date()).toISOString();
    db.prepare(`UPDATE listening_jobs SET state='completed',stage='ready',progress=100,output_version_id=?,lease_owner=NULL,lease_expires_at=NULL,completed_at=?,updated_at=? WHERE id=? AND state='running' AND lease_owner=?`)
      .run(version.id, completedAt, completedAt, job.id, workerId);
    db.prepare("UPDATE listening_audio SET status='ready',updated_at=?,revision=revision+1 WHERE id=?").run(completedAt, job.audioId);
    recordListeningAudit(db, "transcript.gpt.created", { audioId: job.audioId, jobId: job.id, versionId: version.id });
  });
  finalize();
}

async function processTranscriptionJob(db: AppDatabase, job: ClaimedJob, workerId: string, dependencies: WorkerDependencies) {
  const adapter = dependencies.adapter ?? new HttpWhisperAdapter();
  const audio = getListeningAudio(db, job.audioId);
  const stored = await openStoredAudio(audio.storedKey);
  const timestamp = (dependencies.now?.() ?? new Date()).toISOString();
  db.prepare("UPDATE listening_audio SET status='transcribing',updated_at=?,revision=revision+1 WHERE id=? AND deleted_at IS NULL").run(timestamp, audio.id);
  let providerJobId = job.providerJobId;
  if (!providerJobId) {
    providerJobId = await adapter.submit({
      filePath: stored.absolutePath,
      originalName: audio.originalName,
      mimeType: audio.mimeType,
      idempotencyKey: job.idempotencyKey,
    });
    const updated = db.prepare("UPDATE listening_jobs SET provider_job_id=?,updated_at=? WHERE id=? AND state='running' AND lease_owner=?")
      .run(providerJobId, timestamp, job.id, workerId);
    if (!updated.changes) throw new WhisperProviderFailure("JOB_LEASE_LOST", "작업 lease가 만료되었습니다.", true);
  }
  const result = await waitForWhisperResult(adapter, providerJobId, {
    timeoutMs: Number(process.env.WHISPER_TIMEOUT_MS || 600_000),
    wait: dependencies.wait,
    onPoll: async (providerJob) => {
      const current = getListeningJob(db, job.id);
      if (current.state === "canceled") throw new WhisperProviderFailure("JOB_CANCELED", "작업이 취소되었습니다.", false);
      renewLease(db, job.id, workerId, dependencies.now?.() ?? new Date());
      const progress = providerJob.status === "queued" ? 10 : providerJob.phase === "transcribing" ? 55 : providerJob.phase === "exporting" ? 85 : 35;
      db.prepare("UPDATE listening_jobs SET progress=?,updated_at=? WHERE id=? AND state='running' AND lease_owner=?")
        .run(progress, (dependencies.now?.() ?? new Date()).toISOString(), job.id, workerId);
    },
  });
  const segments = normalizeWhisperResult(result, audio.durationMs);
  const finalize = db.transaction(() => {
    const version = createTranscriptVersion(db, {
      audioId: audio.id,
      kind: "whisper_raw",
      language: typeof result.languageDetected === "string" ? result.languageDetected : "ja",
      rawPayload: result,
      modelName: "large-v3",
      segments,
    });
    const currentAudio = getListeningAudio(db, audio.id);
    const activation = activateTranscriptVersion(db, audio.id, version.id, currentAudio.revision, false);
    const completedAt = (dependencies.now?.() ?? new Date()).toISOString();
    db.prepare(`UPDATE listening_jobs SET state='completed',stage='transcribed',progress=100,output_version_id=?,lease_owner=NULL,lease_expires_at=NULL,completed_at=?,updated_at=? WHERE id=? AND state='running' AND lease_owner=?`)
      .run(version.id, completedAt, completedAt, job.id, workerId);
    if (activation.activated) {
      enqueueListeningJob(db, audio.id, "gpt_process", `gpt:${version.id}`);
    } else {
      db.prepare("UPDATE listening_audio SET status='ready',updated_at=?,revision=revision+1 WHERE id=?").run(completedAt, audio.id);
    }
    recordListeningAudit(db, "transcript.raw.created", { audioId: audio.id, jobId: job.id, versionId: version.id });
    return version;
  });
  finalize();
}

export function normalizeWhisperResult(result: WhisperProviderResult, durationMs: number | null) {
  if (!Array.isArray(result.segments) || result.segments.length > 10_000) throw new TranscriptValidationFailure("WHISPER_SEGMENTS_INVALID", "Whisper 문장 수가 올바르지 않습니다.");
  let previousStart = -1;
  return result.segments.map((segment, index) => {
    const startMs = timestampMs(segment.startMs, segment.start);
    const endMs = timestampMs(segment.endMs, segment.end);
    if (!Number.isInteger(startMs) || !Number.isInteger(endMs) || startMs < 0 || endMs <= startMs || startMs < previousStart) {
      throw new TranscriptValidationFailure("WHISPER_TIMING_INVALID", "Whisper 타임스탬프가 올바르지 않습니다.");
    }
    if (durationMs !== null && endMs > durationMs + 1_500) {
      throw new TranscriptValidationFailure("WHISPER_TIMING_OUT_OF_BOUNDS", "Whisper 타임스탬프가 음원 길이를 벗어났습니다.");
    }
    if (typeof segment.text !== "string" || !segment.text.trim() || segment.text.length > 10_000) {
      throw new TranscriptValidationFailure("WHISPER_TEXT_INVALID", "Whisper 문장 텍스트가 올바르지 않습니다.");
    }
    previousStart = startMs;
    return {
      startMs,
      endMs,
      speaker: null,
      ja: segment.text.trim(),
      ko: null,
      needsReview: typeof segment.confidence === "number" && segment.confidence < 0.65,
      reviewNote: typeof segment.confidence === "number" && segment.confidence < 0.65 ? "Whisper confidence가 낮습니다." : null,
      sourceSegmentIds: [`whisper:${index}`],
    };
  });
}

function claimNextJob(db: AppDatabase, workerId: string, at: Date): ClaimedJob | null {
  const claimed = db.transaction(() => {
    const timestamp = at.toISOString();
    db.prepare(`UPDATE listening_jobs SET state='queued',lease_owner=NULL,lease_expires_at=NULL,next_run_at=?,updated_at=?,error_code='LEASE_EXPIRED',error_message='작업 lease가 만료되어 다시 대기 중입니다.' WHERE state='running' AND lease_expires_at IS NOT NULL AND lease_expires_at<=?`)
      .run(timestamp, timestamp, timestamp);
    const row = db.prepare(`SELECT id,audio_id,type,attempt,max_attempts,idempotency_key,provider_job_id,input_version_id FROM listening_jobs WHERE state='queued' AND next_run_at<=? ORDER BY created_at,id LIMIT 1`).get(timestamp) as Record<string, unknown> | undefined;
    if (!row) return null;
    const leaseExpiresAt = new Date(at.getTime() + 120_000).toISOString();
    const result = db.prepare(`UPDATE listening_jobs SET state='running',stage=?,attempt=attempt+1,lease_owner=?,lease_expires_at=?,started_at=COALESCE(started_at,?),updated_at=?,error_code=NULL,error_message=NULL WHERE id=? AND state='queued'`)
      .run(row.type === "transcribe" ? "transcribing" : "correcting", workerId, leaseExpiresAt, timestamp, timestamp, row.id);
    if (!result.changes) return null;
    return {
      id: String(row.id), audioId: String(row.audio_id), type: String(row.type) as ClaimedJob["type"],
      attempt: Number(row.attempt) + 1, maxAttempts: Number(row.max_attempts), idempotencyKey: String(row.idempotency_key),
      providerJobId: row.provider_job_id === null ? null : String(row.provider_job_id),
      inputVersionId: row.input_version_id === null ? null : String(row.input_version_id),
    } satisfies ClaimedJob;
  });
  return claimed();
}

function renewLease(db: AppDatabase, jobId: string, workerId: string, at: Date) {
  const timestamp = at.toISOString();
  const expires = new Date(at.getTime() + 120_000).toISOString();
  const result = db.prepare("UPDATE listening_jobs SET lease_expires_at=?,updated_at=? WHERE id=? AND state='running' AND lease_owner=?")
    .run(expires, timestamp, jobId, workerId);
  if (!result.changes) throw new WhisperProviderFailure("JOB_LEASE_LOST", "작업 lease가 만료되었습니다.", true);
}

function failOrRetry(db: AppDatabase, job: ClaimedJob, error: unknown, at: Date, random = Math.random) {
  const providerFailure = error instanceof WhisperProviderFailure ? error : null;
  const openAiFailure = error instanceof OpenAiListeningFailure ? error : null;
  const validationFailure = error instanceof TranscriptValidationFailure ? error : null;
  const retryable = providerFailure?.retryable ?? openAiFailure?.retryable ?? false;
  const code = providerFailure?.code || openAiFailure?.code || validationFailure?.code || "LISTENING_JOB_FAILED";
  const message = providerFailure?.message || openAiFailure?.message || validationFailure?.message || "작업을 처리하지 못했습니다.";
  const timestamp = at.toISOString();
  if (openAiFailure?.waitingAuth) {
    db.prepare(`UPDATE listening_jobs SET state='waiting_auth',stage='correcting',lease_owner=NULL,lease_expires_at=NULL,error_code=?,error_message=?,updated_at=? WHERE id=?`)
      .run(code, message, timestamp, job.id);
    const activeKind = db.prepare(`SELECT v.kind FROM listening_audio a LEFT JOIN listening_transcript_versions v ON v.id=a.script_version_id WHERE a.id=?`).get(job.audioId) as { kind?: string } | undefined;
    db.prepare("UPDATE listening_audio SET status=?,updated_at=?,revision=revision+1 WHERE id=?").run(activeKind?.kind === "gpt_processed" || activeKind?.kind === "manual_edit" ? "ready" : "transcribed", timestamp, job.audioId);
  } else if (retryable && job.attempt < job.maxAttempts) {
    const backoffMs = Math.min(300_000, 2_000 * 2 ** Math.max(0, job.attempt - 1)) + Math.floor(random() * 1_000);
    const nextRunAt = new Date(at.getTime() + backoffMs).toISOString();
    db.prepare(`UPDATE listening_jobs SET state='queued',stage='queued',next_run_at=?,lease_owner=NULL,lease_expires_at=NULL,error_code=?,error_message=?,updated_at=? WHERE id=?`)
      .run(nextRunAt, code, message, timestamp, job.id);
    db.prepare("UPDATE listening_audio SET status='queued',updated_at=?,revision=revision+1 WHERE id=?").run(timestamp, job.audioId);
  } else {
    db.prepare(`UPDATE listening_jobs SET state='failed',stage='failed',lease_owner=NULL,lease_expires_at=NULL,error_code=?,error_message=?,completed_at=?,updated_at=? WHERE id=?`)
      .run(code, message, timestamp, timestamp, job.id);
    db.prepare("UPDATE listening_audio SET status='failed',updated_at=?,revision=revision+1 WHERE id=?").run(timestamp, job.audioId);
  }
  recordListeningAudit(db, "job.failure", { audioId: job.audioId, jobId: job.id, detailCode: code });
}

function timestampMs(milliseconds: unknown, seconds: unknown) {
  if (typeof milliseconds === "number" && Number.isFinite(milliseconds)) return Math.round(milliseconds);
  if (typeof seconds === "number" && Number.isFinite(seconds)) return Math.round(seconds * 1_000);
  return Number.NaN;
}

const workerState = globalThis as typeof globalThis & { __jlptListeningWorkerStarted?: boolean };

export function startListeningWorker() {
  if (workerState.__jlptListeningWorkerStarted || process.env.JLPT_LISTENING_WORKER_ENABLED === "false") return;
  workerState.__jlptListeningWorkerStarted = true;
  const concurrency = Math.min(4, Math.max(1, Number(process.env.JLPT_LISTENING_WORKER_CONCURRENCY || 1)));
  let active = 0;
  const tick = async () => {
    while (active < concurrency) {
      active += 1;
      const worked = await runListeningWorkerOnce(getDatabase()).catch((error: unknown) => {
        const code = error instanceof Error ? error.name : "UNKNOWN";
        console.error(JSON.stringify({ component: "listening-worker", code }));
        return false;
      }).finally(() => { active -= 1; });
      if (!worked) break;
    }
  };
  void tick();
  const timer = setInterval(() => { void tick(); }, 1_000);
  timer.unref();
}
