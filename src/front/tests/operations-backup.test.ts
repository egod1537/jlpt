import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { openDatabase } from "@back/lib/db/database";
import { createListeningSet, registerListeningAudio } from "@back/lib/listening/repository";

const execute = promisify(execFile);

describe("operator listening snapshots", () => {
  let temporary = "";
  afterEach(async () => { if (temporary) await rm(temporary, { recursive: true, force: true }); });

  it("backs up and verifies the SQLite snapshot with every referenced audio file", async () => {
    temporary = await mkdtemp(path.join(os.tmpdir(), "jlpt-snapshot-test-"));
    const dbPath = path.join(temporary, "var", "jlpt.sqlite");
    const audioDir = path.join(temporary, "var", "listening", "audio");
    const backupDir = path.join(temporary, "backups");
    const storedKey = "ab/cd/fixture.wav"; const bytes = Buffer.from("owned-backup-audio-fixture");
    await mkdir(path.join(audioDir, "ab", "cd"), { recursive: true });
    await writeFile(path.join(audioDir, ...storedKey.split("/")), bytes);
    const db = openDatabase(dbPath); const set = createListeningSet(db, { title: "snapshot" });
    registerListeningAudio(db, { setId: set.id, originalName: "fixture.wav", storedKey, mimeType: "audio/wav", sizeBytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") });
    db.close();

    const environment = { ...process.env, JLPT_DB_PATH: dbPath, JLPT_AUDIO_DIR: audioDir, JLPT_BACKUP_DIR: backupDir, JLPT_EXTERNAL_API_KEY: "must-not-appear" };
    await execute(process.execPath, [path.resolve(process.cwd(), "..", "back", "scripts", "backup.mjs")], { env: environment });
    const snapshot = path.join(backupDir, (await readdir(backupDir))[0]);
    const manifest = await readFile(path.join(snapshot, "manifest.json"), "utf8");
    expect(manifest).not.toContain("must-not-appear");
    expect(JSON.parse(manifest)).toMatchObject({ format: "jlpt-listening-snapshot", counts: { listeningAudio: 1 }, audio: { files: [{ storedKey, sizeBytes: bytes.length }] } });
    expect(await readFile(path.join(snapshot, "audio", ...storedKey.split("/")))).toEqual(bytes);

    const verified = await execute(process.execPath, [path.resolve(process.cwd(), "..", "back", "scripts", "restore.mjs"), "--snapshot", snapshot, "--verify-only"], { env: environment });
    expect(JSON.parse(verified.stdout)).toMatchObject({ verified: snapshot, audioFiles: 1, listeningAudio: 1 });
  });
});
