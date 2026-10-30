import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { AppDatabase } from "@back/lib/db/database";
import { openDatabase } from "@back/lib/db/database";
import {
  activateTranscriptVersion,
  createListeningSet,
  createTranscriptVersion,
  getActiveTranscript,
  listTranscriptVersions,
  registerListeningAudio,
} from "@back/lib/listening/repository";
import { activateScriptVersion, editListeningScript, exportListeningScript } from "@back/lib/listening/script";

describe("versioned listening scripts", () => {
  let db: AppDatabase | undefined;
  afterEach(() => db?.close());

  it("creates manual versions for update, split, merge, conflict, and undo", () => {
    db = openDatabase(":memory:");
    const set = createListeningSet(db, { title: "편집" });
    const audio = registerListeningAudio(db, { setId: set.id, originalName: "lesson.wav", storedKey: "aa/lesson.wav", mimeType: "audio/wav", sizeBytes: 44, sha256: "d".repeat(64), durationMs: 4_000 });
    const raw = createTranscriptVersion(db, {
      audioId: audio.id, kind: "whisper_raw", rawPayload: { fixture: true },
      segments: [
        { startMs: 0, endMs: 2_000, speaker: "A", ja: "一つ二つ", ko: "하나 둘", needsReview: false, reviewNote: null, sourceSegmentIds: ["whisper:0"] },
        { startMs: 2_000, endMs: 4_000, speaker: "B", ja: "三つ", ko: null, needsReview: true, reviewNote: "확인", sourceSegmentIds: ["whisper:1"] },
      ],
    });
    const active = activateTranscriptVersion(db, audio.id, raw.id, audio.revision).audio;

    expect(() => editListeningScript(db!, audio.id, { revision: audio.revision, operations: [{ type: "update", segmentId: raw.segments[0].id, ja: "충돌" }] })).toThrow(/변경/);
    const split = editListeningScript(db, audio.id, {
      revision: active.revision,
      operations: [{ type: "split", segmentId: raw.segments[0].id, atMs: 1_000, ja: ["一つ", "二つ"], ko: ["하나", "둘"] }],
    });
    expect(split.script.kind).toBe("manual_edit");
    expect(split.script.segments).toMatchObject([
      { startMs: 0, endMs: 1_000, ja: "一つ" },
      { startMs: 1_000, endMs: 2_000, ja: "二つ" },
      { startMs: 2_000, endMs: 4_000, ja: "三つ" },
    ]);

    const timed = editListeningScript(db, audio.id, {
      revision: split.audio.revision,
      operations: [{ type: "update", segmentId: split.script.segments[0].id, startMs: 100, endMs: 900, speaker: "화자 1" }],
    });
    expect(timed.script.segments[0]).toMatchObject({ startMs: 100, endMs: 900, speaker: "화자 1" });
    expect(() => editListeningScript(db!, audio.id, {
      revision: timed.audio.revision,
      operations: [{ type: "update", segmentId: timed.script.segments[2].id, endMs: 8_000 }],
    })).toThrow(/음원 길이/);

    const merged = editListeningScript(db, audio.id, {
      revision: timed.audio.revision,
      operations: [{ type: "merge", segmentIds: timed.script.segments.slice(0, 2).map((segment) => segment.id), ja: "一つ、二つ", ko: "하나, 둘" }],
    });
    expect(merged.script.segments).toHaveLength(2);
    expect(merged.script.segments[0]).toMatchObject({ startMs: 100, endMs: 2_000, ja: "一つ、二つ", ko: "하나, 둘" });
    expect(listTranscriptVersions(db, audio.id).map((version) => version.kind)).toEqual(["manual_edit", "manual_edit", "manual_edit", "whisper_raw"]);

    const undone = activateScriptVersion(db, audio.id, raw.id, merged.audio.revision);
    expect(undone.activated).toBe(true);
    expect(getActiveTranscript(db, audio.id).script?.id).toBe(raw.id);
  });

  it("exports exact millisecond timing in JSON, TXT, and SRT without rendering null", () => {
    db = openDatabase(":memory:");
    const set = createListeningSet(db, { title: "export" });
    const audio = registerListeningAudio(db, { setId: set.id, originalName: "../안전:이름.wav", storedKey: "aa/export.wav", mimeType: "audio/wav", sizeBytes: 44, sha256: "e".repeat(64) });
    const raw = createTranscriptVersion(db, {
      audioId: audio.id, kind: "whisper_raw", rawPayload: {},
      segments: [{ startMs: 61_234, endMs: 3_661_005, speaker: null, ja: "長い文", ko: null, needsReview: false, reviewNote: null, sourceSegmentIds: ["0"] }],
    });
    activateTranscriptVersion(db, audio.id, raw.id, audio.revision);

    const srt = exportListeningScript(db, audio.id, "srt");
    expect(srt.body).toContain("00:01:01,234 --> 01:01:01,005");
    expect(srt.body).not.toContain("null");
    expect(srt.filename).not.toMatch(/[\\/:*?"<>|]/);
    expect(exportListeningScript(db, audio.id, "txt").body).toContain("[01:01.234] 長い文");
    expect(exportListeningScript(db, audio.id, "txt", "ko").body).not.toContain("長い文");
    expect(exportListeningScript(db, audio.id, "srt", "ja").body).not.toContain("null");
    expect(JSON.parse(exportListeningScript(db, audio.id, "json").body).segments[0]).toMatchObject({ startMs: 61_234, endMs: 3_661_005, ko: null });
  });
});
