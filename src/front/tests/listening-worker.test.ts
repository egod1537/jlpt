import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { AppDatabase } from "@back/lib/db/database";
import { openDatabase } from "@back/lib/db/database";
import {
  createListeningSet,
  createTranscriptVersion,
  enqueueListeningJob,
  getActiveTranscript,
  getListeningAudio,
  getListeningJob,
  registerListeningAudio,
} from "@back/lib/listening/repository";
import type { WhisperAdapter, WhisperProviderResult } from "@back/lib/listening/whisper";
import { waitForWhisperResult, WhisperProviderFailure } from "@back/lib/listening/whisper";
import { normalizeWhisperResult, runListeningWorkerOnce } from "@back/lib/listening/worker";
import { OpenAiListeningFailure } from "@/lib/server/openai-listening";

describe("durable listening worker", () => {
  let db: AppDatabase;
  let temporary = "";
  let audioId = "";

  beforeEach(async () => {
    temporary = await mkdtemp(path.join(os.tmpdir(), "jlpt-worker-test-"));
    process.env.JLPT_AUDIO_DIR = path.join(temporary, "audio");
    process.env.JLPT_AUDIO_TMP_DIR = path.join(temporary, "tmp");
    const storedKey = "aa/bb/fixture.wav";
    const storedPath = path.join(process.env.JLPT_AUDIO_DIR, "aa", "bb", "fixture.wav");
    await mkdir(path.dirname(storedPath), { recursive: true });
    await writeFile(storedPath, Buffer.from("fixture audio bytes"));
    db = openDatabase(":memory:");
    const set = createListeningSet(db, { title: "worker" });
    audioId = registerListeningAudio(db, {
      setId: set.id, originalName: "fixture.wav", storedKey, mimeType: "audio/wav", sizeBytes: 19,
      sha256: "c".repeat(64), durationMs: 3_000, sampleRate: 16_000, channels: 1, codecName: "pcm_s16le",
    }).id;
  });

  afterEach(async () => {
    db.close();
    delete process.env.JLPT_AUDIO_DIR;
    delete process.env.JLPT_AUDIO_TMP_DIR;
    await rm(temporary, { recursive: true, force: true });
  });

  it("stores immutable provider output, converts seconds, and queues GPT processing", async () => {
    const queued = enqueueListeningJob(db, audioId, "transcribe", "worker-success").job;
    const adapter = fakeAdapter({
      text: "こんにちは。次です。",
      languageDetected: "japanese",
      segments: [
        { start: 0, end: 1.25, text: "こんにちは。", confidence: 0.9 },
        { start: 1.25, end: 2.8, text: "次です。", confidence: 0.5 },
      ],
      postProcessingMetadata: { provider: "chatgpt_plan" },
    });

    expect(await runListeningWorkerOnce(db, { adapter, workerId: "test-worker" })).toBe(true);

    expect(getListeningJob(db, queued.id)).toMatchObject({ state: "completed", stage: "transcribed", progress: 100 });
    const active = getActiveTranscript(db, audioId);
    expect(active.script?.kind).toBe("whisper_raw");
    expect(active.script?.segments).toMatchObject([
      { startMs: 0, endMs: 1_250, ja: "こんにちは。", needsReview: false },
      { startMs: 1_250, endMs: 2_800, ja: "次です。", needsReview: true },
    ]);
    expect(db.prepare("SELECT state FROM listening_jobs WHERE audio_id=? AND type='gpt_process'").get(audioId)).toEqual({ state: "queued" });
    expect(adapter.submittedKeys).toEqual(["worker-success"]);

    await runListeningWorkerOnce(db, {
      workerId: "test-gpt-worker",
      gptAdapter: {
        process: async (segments) => ({
          model: "gpt-test",
          promptVersion: "test-v1",
          rawPayload: { fixture: true },
          segments: segments.map((segment) => ({
            startMs: segment.startMs, endMs: segment.endMs, speaker: null, ja: segment.ja,
            ko: `번역: ${segment.ja}`, needsReview: false, reviewNote: null, sourceSegmentIds: segment.sourceSegmentIds,
          })),
        }),
      },
    });
    expect(getActiveTranscript(db, audioId).script).toMatchObject({ kind: "gpt_processed", modelName: "gpt-test", promptVersion: "test-v1" });
    expect(getListeningAudio(db, audioId).status).toBe("ready");
  });

  it("clamps a hallucinated final timestamp to the uploaded audio duration", async () => {
    const queued = enqueueListeningJob(db, audioId, "transcribe", "worker-out-of-bounds").job;
    const adapter = fakeAdapter({ segments: [{ startMs: 0, endMs: 29_980, text: "ご視聴ありがとうございました。" }] });

    await runListeningWorkerOnce(db, { adapter, workerId: "test-worker" });

    expect(getListeningJob(db, queued.id)).toMatchObject({ state: "completed", stage: "transcribed" });
    expect(getActiveTranscript(db, audioId).script?.segments[0]).toMatchObject({ startMs: 0, endMs: 3_000 });
  });

  it("backs off retryable failures and recovers an expired lease", async () => {
    const queued = enqueueListeningJob(db, audioId, "transcribe", "worker-retry").job;
    const failing: WhisperAdapter = {
      submit: async () => { throw new WhisperProviderFailure("WHISPER_HTTP_503", "일시 오류", true, 503); },
      getJob: async () => { throw new Error("not reached"); },
      getResult: async () => { throw new Error("not reached"); },
    };
    const firstAt = new Date("2030-01-01T00:00:00.000Z");
    await runListeningWorkerOnce(db, { adapter: failing, workerId: "worker-a", now: () => firstAt, random: () => 0 });
    expect(getListeningJob(db, queued.id)).toMatchObject({ state: "queued", attempt: 1, errorCode: "WHISPER_HTTP_503" });

    db.prepare("UPDATE listening_jobs SET state='running',lease_owner='dead-worker',lease_expires_at='2025-01-01T00:00:00.000Z',next_run_at='2025-01-01T00:00:00.000Z' WHERE id=?").run(queued.id);
    const recovered = fakeAdapter({ segments: [{ startMs: 0, endMs: 1_000, text: "復旧" }] });
    await runListeningWorkerOnce(db, { adapter: recovered, workerId: "worker-b", now: () => firstAt });
    expect(getListeningJob(db, queued.id).state).toBe("completed");
    expect(recovered.submittedKeys).toEqual(["worker-retry"]);
  });

  it("keeps the raw transcript and waits for reauthentication when OAuth expires", async () => {
    const audio = getListeningAudio(db, audioId);
    const raw = createTranscriptVersion(db, {
      audioId, kind: "whisper_raw", rawPayload: { fixture: true },
      segments: [{ startMs: 0, endMs: 1_000, speaker: null, ja: "原文", ko: null, needsReview: false, reviewNote: null, sourceSegmentIds: ["whisper:0"] }],
    });
    const { activateTranscriptVersion } = await import("@back/lib/listening/repository");
    activateTranscriptVersion(db, audioId, raw.id, audio.revision);
    const queued = enqueueListeningJob(db, audioId, "gpt_process", "gpt-auth-expired").job;
    await runListeningWorkerOnce(db, {
      workerId: "gpt-auth-worker",
      gptAdapter: { process: async () => { throw new OpenAiListeningFailure("OPENAI_REAUTH_REQUIRED", "다시 연결", false, true, 401); } },
    });

    expect(getListeningJob(db, queued.id)).toMatchObject({ state: "waiting_auth", errorCode: "OPENAI_REAUTH_REQUIRED" });
    expect(getActiveTranscript(db, audioId).script?.id).toBe(raw.id);
    expect(getListeningAudio(db, audioId).status).toBe("transcribed");
  });
});

it("normalizes both millisecond and second provider timestamps", () => {
  expect(normalizeWhisperResult({ segments: [{ start: 0.1, end: 0.9, text: "秒" }] }, 1_000)[0]).toMatchObject({ startMs: 100, endMs: 900 });
  expect(normalizeWhisperResult({ segments: [{ startMs: 100, endMs: 900, text: "ms" }] }, 1_000)[0]).toMatchObject({ startMs: 100, endMs: 900 });
});

it("drops zero-duration Whisper artifacts while preserving source indices", () => {
  expect(normalizeWhisperResult({ segments: [
    { startMs: 0, endMs: 100, text: "一" },
    { startMs: 100, endMs: 100, text: "artifact" },
    { startMs: 100, endMs: 200, text: "二" },
  ] }, 200)).toMatchObject([
    { startMs: 0, endMs: 100, ja: "一", sourceSegmentIds: ["whisper:0"] },
    { startMs: 100, endMs: 200, ja: "二", sourceSegmentIds: ["whisper:2"] },
  ]);
});

it("drops empty Whisper text artifacts while preserving valid segments", () => {
  expect(normalizeWhisperResult({ segments: [
    { startMs: 0, endMs: 100, text: "有効" },
    { startMs: 100, endMs: 200, text: "   " },
    { startMs: 200, endMs: 300, text: "文" },
  ] }, 300)).toMatchObject([
    { ja: "有効", sourceSegmentIds: ["whisper:0"] },
    { ja: "文", sourceSegmentIds: ["whisper:2"] },
  ]);
});

it("drops Whisper segments that begin after the audio ends", () => {
  expect(normalizeWhisperResult({ segments: [
    { startMs: 0, endMs: 100, text: "本編" },
    { startMs: 250, endMs: 500, text: "artifact" },
  ] }, 200)).toMatchObject([{ startMs: 0, endMs: 100, ja: "本編" }]);
});

it("keeps polling the same Whisper job after a transient rate limit", async () => {
  let statusCalls = 0;
  const waits: number[] = [];
  const result = await waitForWhisperResult({
    submit: async () => "provider-job-1",
    getJob: async () => {
      statusCalls += 1;
      if (statusCalls === 1) throw new WhisperProviderFailure("WHISPER_HTTP_429", "rate limited", true, 429);
      return { id: "provider-job-1", status: "completed", phase: null, error: null };
    },
    getResult: async () => ({ segments: [{ startMs: 0, endMs: 100, text: "完了" }] }),
  }, "provider-job-1", { pollMs: 10, wait: async (milliseconds) => { waits.push(milliseconds); } });

  expect(statusCalls).toBe(2);
  expect(waits).toEqual([5_000]);
  expect(result.segments[0].text).toBe("完了");
});

function fakeAdapter(result: WhisperProviderResult): WhisperAdapter & { submittedKeys: string[] } {
  const submittedKeys: string[] = [];
  return {
    submittedKeys,
    submit: async (input) => { submittedKeys.push(input.idempotencyKey); return "provider-job-1"; },
    getJob: async () => ({ id: "provider-job-1", status: "completed", phase: null, error: null }),
    getResult: async () => result,
  };
}
