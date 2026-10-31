import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { AppDatabase } from "@back/lib/db/database";
import { openDatabase } from "@back/lib/db/database";
import {
  activateTranscriptVersion,
  countRetryableFailedListeningAudio,
  createListeningFolder,
  createListeningSet,
  createTranscriptVersion,
  deleteListeningAudio,
  deleteListeningFolder,
  deleteListeningSet,
  enqueueListeningJob,
  getActiveTranscript,
  getListeningAudio,
  getListeningSet,
  listListeningLibrary,
  registerListeningAudio,
  restoreListeningAudio,
  restoreListeningFolder,
  restoreListeningSet,
  retryFailedListeningAudio,
  updateListeningFolder,
} from "@back/lib/listening/repository";

describe("listening repository", () => {
  let db: AppDatabase | undefined;
  afterEach(() => db?.close());

  it("applies migration 005 without changing existing vocabulary records", () => {
    db = openDatabase(":memory:");
    const createdAt = new Date().toISOString();
    db.prepare("INSERT INTO word_keys(word_id,created_at) VALUES (?,?)").run("word-preserved", createdAt);
    db.prepare(`INSERT INTO books(id,title,origin,revision,created_at,updated_at) VALUES ('book-preserved','기존','manual',1,?,?)`).run(createdAt, createdAt);
    db.prepare(`INSERT INTO book_entries(entry_id,book_id,word_id,position,term,meanings_json,part_of_speech_json,jlpt_levels_json,years_json,categories_json,related_terms_json,examples_json,sources_json,status,tags_json,revision,created_at,updated_at)
      VALUES ('entry-preserved','book-preserved','word-preserved',0,'既存','["기존"]','[]','[]','[]','[]','[]','[]','[]','ready','[]',1,?,?)`).run(createdAt, createdAt);

    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'listening_%' ORDER BY name").all() as Array<{ name: string }>;
    expect(tables.map((row) => row.name)).toEqual(expect.arrayContaining([
      "listening_folders", "listening_sets", "listening_audio", "listening_transcript_versions",
      "listening_script_segments", "listening_jobs", "listening_audio_progress", "listening_audit_log",
    ]));
    expect(db.prepare("SELECT term FROM book_entries WHERE entry_id='entry-preserved'").get()).toEqual({ term: "既存" });
    expect(db.pragma("foreign_key_check")).toEqual([]);
  });

  it("creates folders, sets, audio metadata, and versioned scripts", () => {
    db = openDatabase(":memory:");
    const folder = createListeningFolder(db, { name: "JLPT N1" });
    const set = createListeningSet(db, { folderId: folder.id, title: "모의고사 1" });
    const audio = registerListeningAudio(db, {
      setId: set.id,
      originalName: "sample.wav",
      storedKey: "ab/cd/sample.wav",
      mimeType: "audio/wav",
      sizeBytes: 44,
      sha256: "a".repeat(64),
      durationMs: 2_000,
      sampleRate: 16_000,
      channels: 1,
      codecName: "pcm_s16le",
    });
    const raw = createTranscriptVersion(db, {
      audioId: audio.id,
      kind: "whisper_raw",
      rawPayload: { provider: "fixture" },
      segments: [{ startMs: 0, endMs: 1_000, speaker: null, ja: "今日は。", ko: null, needsReview: false, reviewNote: null, sourceSegmentIds: ["0"] }],
    });
    const activated = activateTranscriptVersion(db, audio.id, raw.id, audio.revision);

    expect(getListeningSet(db, set.id)).toMatchObject({ audioCount: 1, durationMs: 2_000 });
    expect(listListeningLibrary(db, { q: "모의" }).sets).toHaveLength(1);
    expect(activated.activated).toBe(true);
    expect(getActiveTranscript(db, audio.id).script?.segments[0]).toMatchObject({ ja: "今日は。", startMs: 0, endMs: 1_000 });
    expect(() => db!.prepare("UPDATE listening_transcript_versions SET language='en' WHERE id=?").run(raw.id)).toThrow(/immutable/);
  });

  it("uses revisions and preserves a manually activated version from automatic replacement", () => {
    db = openDatabase(":memory:");
    const folder = createListeningFolder(db, { name: "연습" });
    expect(() => updateListeningFolder(db!, folder.id, { revision: 99, name: "충돌" })).toThrow(/다른 곳/);
    const updated = updateListeningFolder(db, folder.id, { revision: folder.revision, name: "수정됨" });
    expect(updated.revision).toBe(2);

    const set = createListeningSet(db, { folderId: folder.id, title: "세트" });
    const audio = registerListeningAudio(db, { setId: set.id, originalName: "a.wav", storedKey: "a.wav", mimeType: "audio/wav", sizeBytes: 44, sha256: "b".repeat(64) });
    const manual = createTranscriptVersion(db, {
      audioId: audio.id, kind: "manual_edit", rawPayload: {},
      segments: [{ startMs: 0, endMs: 1, speaker: null, ja: "수동", ko: null, needsReview: false, reviewNote: null, sourceSegmentIds: [] }],
    });
    const withManual = activateTranscriptVersion(db, audio.id, manual.id, audio.revision).audio;
    const processed = createTranscriptVersion(db, {
      audioId: audio.id, kind: "gpt_processed", basedOnId: manual.id, rawPayload: {},
      segments: [{ startMs: 0, endMs: 1, speaker: null, ja: "자동", ko: "자동", needsReview: false, reviewNote: null, sourceSegmentIds: [] }],
    });
    expect(activateTranscriptVersion(db, audio.id, processed.id, withManual.revision, false).activated).toBe(false);
    expect(getActiveTranscript(db, audio.id).script?.kind).toBe("manual_edit");

    deleteListeningFolder(db, folder.id, updated.revision);
    expect(getListeningSet(db, set.id).folderId).toBeNull();
  });

  it("restores soft-deleted folders, sets, and audio without losing their records", () => {
    db = openDatabase(":memory:");
    const folder = createListeningFolder(db, { name: "복구" });
    const set = createListeningSet(db, { folderId: folder.id, title: "복구 세트" });
    const audio = registerListeningAudio(db, { setId: set.id, originalName: "restore.wav", storedKey: "restore.wav", mimeType: "audio/wav", sizeBytes: 44, sha256: "f".repeat(64) });

    deleteListeningAudio(db, audio.id, audio.revision);
    const restoredAudio = restoreListeningAudio(db, audio.id, { revision: getListeningAudio(db, audio.id, true).revision });
    expect(restoredAudio).toMatchObject({ id: audio.id, setId: set.id });

    deleteListeningSet(db, set.id, set.revision);
    const deletedSetRevision = Number((db.prepare("SELECT revision FROM listening_sets WHERE id=?").get(set.id) as { revision: number }).revision);
    const restoredSet = restoreListeningSet(db, set.id, { revision: deletedSetRevision });
    expect(restoredSet.audio.map((item) => item.id)).toContain(audio.id);

    deleteListeningFolder(db, folder.id, folder.revision);
    const deletedFolderRevision = Number((db.prepare("SELECT revision FROM listening_folders WHERE id=?").get(folder.id) as { revision: number }).revision);
    expect(restoreListeningFolder(db, folder.id, { revision: deletedFolderRevision })).toMatchObject({ id: folder.id, parentId: null });
  });

  it("queues one fresh job for every currently failed audio item", () => {
    db = openDatabase(":memory:");
    const set = createListeningSet(db, { title: "실패 재시도" });
    const whisperAudio = registerListeningAudio(db, { setId: set.id, originalName: "whisper.wav", storedKey: "whisper.wav", mimeType: "audio/wav", sizeBytes: 44, sha256: "c".repeat(64) });
    const whisperFailure = enqueueListeningJob(db, whisperAudio.id, "transcribe", "failed-whisper").job;
    markFailed(db, whisperFailure.id, whisperAudio.id);

    const gptAudio = registerListeningAudio(db, { setId: set.id, originalName: "gpt.wav", storedKey: "gpt.wav", mimeType: "audio/wav", sizeBytes: 44, sha256: "d".repeat(64) });
    const raw = createTranscriptVersion(db, {
      audioId: gptAudio.id, kind: "whisper_raw", rawPayload: {},
      segments: [{ startMs: 0, endMs: 1_000, speaker: null, ja: "原文", ko: null, needsReview: false, reviewNote: null, sourceSegmentIds: ["whisper:0"] }],
    });
    activateTranscriptVersion(db, gptAudio.id, raw.id, gptAudio.revision);
    const gptFailure = enqueueListeningJob(db, gptAudio.id, "gpt_process", "failed-gpt").job;
    markFailed(db, gptFailure.id, gptAudio.id);

    const readyAudio = registerListeningAudio(db, { setId: set.id, originalName: "ready.wav", storedKey: "ready.wav", mimeType: "audio/wav", sizeBytes: 44, sha256: "e".repeat(64) });
    const historicalFailure = enqueueListeningJob(db, readyAudio.id, "transcribe", "historical-failure").job;
    markFailed(db, historicalFailure.id, readyAudio.id);
    db.prepare("UPDATE listening_audio SET status='ready' WHERE id=?").run(readyAudio.id);

    expect(countRetryableFailedListeningAudio(db)).toBe(2);
    expect(retryFailedListeningAudio(db)).toEqual({ failedCount: 2, queuedCount: 2, remainingFailedCount: 0 });

    const queued = db.prepare("SELECT audio_id,type,state,attempt,provider_job_id,input_version_id FROM listening_jobs WHERE state='queued' ORDER BY audio_id").all() as Array<Record<string, unknown>>;
    expect(queued).toHaveLength(2);
    expect(queued).toEqual(expect.arrayContaining([
      expect.objectContaining({ audio_id: whisperAudio.id, type: "transcribe", state: "queued", attempt: 0, provider_job_id: null, input_version_id: null }),
      expect.objectContaining({ audio_id: gptAudio.id, type: "gpt_process", state: "queued", attempt: 0, provider_job_id: null, input_version_id: raw.id }),
    ]));
    expect(db.prepare("SELECT COUNT(*) count FROM listening_jobs WHERE state='failed'").get()).toEqual({ count: 3 });
    expect(retryFailedListeningAudio(db)).toEqual({ failedCount: 0, queuedCount: 0, remainingFailedCount: 0 });
  });
});

function markFailed(db: AppDatabase, jobId: string, audioId: string) {
  const timestamp = new Date().toISOString();
  db.prepare("UPDATE listening_jobs SET state='failed',stage='failed',error_code='TEST_FAILURE',completed_at=?,updated_at=? WHERE id=?").run(timestamp, timestamp, jobId);
  db.prepare("UPDATE listening_audio SET status='failed',updated_at=? WHERE id=?").run(timestamp, audioId);
}
