import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { AppDatabase } from "@back/lib/db/database";
import { openDatabase } from "@back/lib/db/database";
import { createListeningSet, registerListeningAudio, updateListeningAudio } from "@back/lib/listening/repository";
import { ExternalListeningFailure, externalAudioDto, rememberExternalMutation, replayExternalMutation } from "@back/lib/external-api/listening";

describe("external listening API contract", () => {
  let db: AppDatabase | undefined;
  afterEach(() => db?.close());

  it("replays the same idempotent response and rejects a different payload", () => {
    db = openDatabase(":memory:");
    const response = { status: 201, body: { data: { id: "ls-1" } }, location: "/api/v1/listening/sets/ls-1" };
    rememberExternalMutation(db, "POST:sets", "same-key", { title: "같음" }, response);
    expect(replayExternalMutation(db, "POST:sets", "same-key", { title: "같음" })).toEqual(response);
    expect(() => replayExternalMutation(db!, "POST:sets", "same-key", { title: "다름" })).toThrow(ExternalListeningFailure);
  });

  it("moves and renames audio without exposing its private stored key", () => {
    db = openDatabase(":memory:");
    const source = createListeningSet(db, { title: "원본" });
    const target = createListeningSet(db, { title: "이동" });
    const audio = registerListeningAudio(db, { setId: source.id, originalName: "before.wav", storedKey: "private/secret.wav", mimeType: "audio/wav", sizeBytes: 44, sha256: "f".repeat(64) });
    const updated = updateListeningAudio(db, audio.id, { revision: audio.revision, setId: target.id, originalName: "after.wav", favorite: true });
    expect(updated).toMatchObject({ setId: target.id, originalName: "after.wav", favorite: true, revision: 2 });
    expect(externalAudioDto(updated)).not.toHaveProperty("storedKey");
    expect(JSON.stringify(externalAudioDto(updated))).not.toContain("secret.wav");
  });

  it("publishes every listening route with bearer, multipart, Range, jobs, and scripts", () => {
    const document = JSON.parse(readFileSync(path.resolve(process.cwd(), "public", "external-api.openapi.json"), "utf8")) as { openapi: string; security: unknown[]; paths: Record<string, unknown>; components: { securitySchemes: Record<string, unknown> } };
    expect(document.openapi).toBe("3.1.0");
    expect(document.security).toEqual([{ httpBearer: [] }]);
    expect(document.components.securitySchemes).toHaveProperty("httpBearer");
    for (const path of [
      "/api/v1/listening/folders", "/api/v1/listening/sets", "/api/v1/listening/sets/{setId}/audio",
      "/api/v1/listening/audio/{audioId}", "/api/v1/listening/audio/{audioId}/stream",
      "/api/v1/listening/audio/{audioId}/transcribe", "/api/v1/listening/audio/{audioId}/reprocess",
      "/api/v1/listening/jobs/{jobId}", "/api/v1/listening/audio/{audioId}/script",
      "/api/v1/listening/audio/{audioId}/versions", "/api/v1/listening/audio/{audioId}/activate",
      "/api/v1/listening/audio/{audioId}/export",
    ]) expect(document.paths).toHaveProperty(path);
    const serialized = JSON.stringify(document);
    expect(serialized).toContain("multipart/form-data");
    expect(serialized).toContain("Range");
    expect(serialized).not.toMatch(/refresh[_ -]?token|storedKey|WHISPER_BASE_URL/i);
  });
});
