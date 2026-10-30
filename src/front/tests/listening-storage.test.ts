import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { AppDatabase } from "@back/lib/db/database";
import { openDatabase } from "@back/lib/db/database";
import { createListeningSet } from "@back/lib/listening/repository";
import { parseByteRange } from "@back/lib/listening/range";
import { detectAudioKind, receiveAudioMultipart, storeUploadedAudio } from "@back/lib/listening/storage";

describe("listening audio storage", () => {
  let temporary = "";
  let db: AppDatabase | undefined;

  beforeEach(async () => {
    temporary = await mkdtemp(path.join(os.tmpdir(), "jlpt-listening-test-"));
    process.env.JLPT_AUDIO_DIR = path.join(temporary, "audio");
    process.env.JLPT_AUDIO_TMP_DIR = path.join(temporary, "tmp");
    process.env.JLPT_MAX_AUDIO_BYTES = "1024";
  });

  afterEach(async () => {
    db?.close();
    db = undefined;
    delete process.env.JLPT_AUDIO_DIR;
    delete process.env.JLPT_AUDIO_TMP_DIR;
    delete process.env.JLPT_MAX_AUDIO_BYTES;
    if (temporary) await rm(temporary, { recursive: true, force: true });
  });

  it("recognizes supported file signatures rather than trusting the extension", () => {
    expect(detectAudioKind(Buffer.from("RIFF0000WAVEfmt "))).toBe("wav");
    expect(detectAudioKind(Buffer.from("ID3fake"))).toBe("mp3");
    expect(detectAudioKind(Buffer.from([0, 0, 0, 20, ...Buffer.from("ftypM4A ")]))).toBe("m4a");
    expect(detectAudioKind(Buffer.from("OggSfake"))).toBe("ogg");
    expect(detectAudioKind(Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 1]))).toBe("webm");
    expect(detectAudioKind(Buffer.from("not audio"))).toBeNull();
  });

  it("streams multipart data to private storage and registers only metadata in SQLite", async () => {
    db = openDatabase(":memory:");
    const set = createListeningSet(db, { title: "업로드" });
    const wav = Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WAVEfmt "), Buffer.alloc(32)]);
    const request = multipartRequest(wav, "../../sample.mp3", "audio/mpeg");
    const staged = await receiveAudioMultipart(request, {
      probe: async (_filePath, kind) => ({ kind, mimeType: "audio/wav", durationMs: 1_250, sampleRate: 16_000, channels: 1, codecName: "pcm_s16le" }),
    });
    const created = await storeUploadedAudio(db, set.id, staged);

    expect(created[0]).toMatchObject({ originalName: "sample.mp3", mimeType: "audio/wav", sizeBytes: wav.length, durationMs: 1_250 });
    expect(staged[0].absolutePath.startsWith(path.join(temporary, "audio"))).toBe(true);
    expect(await readFile(staged[0].absolutePath)).toEqual(wav);
    expect(db.prepare("SELECT typeof(raw_payload_json) type FROM listening_transcript_versions").all()).toEqual([]);
  });

  it("rejects spoofed, empty, and oversized files without leaving a final file", async () => {
    await expect(receiveAudioMultipart(multipartRequest(Buffer.from("plain text"), "fake.mp3", "audio/mpeg"), {
      probe: async () => { throw new Error("probe should not run"); },
    })).rejects.toMatchObject({ status: 415 });

    await expect(receiveAudioMultipart(multipartRequest(Buffer.alloc(0), "empty.wav", "audio/wav"))).rejects.toMatchObject({ status: 400 });

    process.env.JLPT_MAX_AUDIO_BYTES = "16";
    await expect(receiveAudioMultipart(multipartRequest(Buffer.concat([Buffer.from("RIFF0000WAVE"), Buffer.alloc(64)]), "large.wav", "audio/wav"))).rejects.toMatchObject({ status: 413 });
  });
});

function multipartRequest(body: Buffer, filename: string, mimeType: string) {
  const boundary = "jlpt-listening-test-boundary";
  const payload = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`),
    body,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  return new Request("http://local/upload", {
    method: "POST",
    headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
    body: payload,
  });
}

describe("HTTP byte ranges", () => {
  it("supports full, bounded, open, and suffix ranges", () => {
    expect(parseByteRange(null, 100)).toBeNull();
    expect(parseByteRange("bytes=0-9", 100)).toEqual({ start: 0, end: 9 });
    expect(parseByteRange("bytes=90-", 100)).toEqual({ start: 90, end: 99 });
    expect(parseByteRange("bytes=-10", 100)).toEqual({ start: 90, end: 99 });
    expect(parseByteRange("bytes=90-200", 100)).toEqual({ start: 90, end: 99 });
  });

  it("rejects unsatisfiable and multiple ranges", () => {
    expect(parseByteRange("bytes=100-101", 100)).toBe("invalid");
    expect(parseByteRange("bytes=9-2", 100)).toBe("invalid");
    expect(parseByteRange("bytes=0-1,4-5", 100)).toBe("invalid");
    expect(parseByteRange("items=0-1", 100)).toBe("invalid");
    expect(parseByteRange("bytes=-0", 100)).toBe("invalid");
  });
});
