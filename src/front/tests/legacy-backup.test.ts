// @vitest-environment node

import { describe, expect, it } from "vitest";
import { openDatabase } from "@back/lib/db/database";
import { importLegacy, previewLegacy } from "@back/lib/legacy/import";
import { createBackup, restoreBackup, validateBackup } from "@back/lib/backup/service";

function record(wordId: string, reviewedAt: string) {
  return { wordId, repetitions: 2, intervalDays: 3, easeFactor: 2.5, dueAt: "2026-11-01T00:00:00.000Z", lastReviewedAt: reviewedAt, lastRating: "good" as const, lapses: 0 };
}

describe("legacy migration and private backup", () => {
  it("previews unknown IDs, merges newer snapshots once, and creates no fake events", () => {
    const db = openDatabase(":memory:");
    try {
      for (const id of ["word-111111111111", "word-222222222222"]) db.prepare("INSERT INTO word_keys(word_id,created_at,retired_at) VALUES (?,?,NULL)").run(id, "2026-10-01T00:00:00.000Z");
      db.prepare("INSERT INTO review_states(word_id,scheduler_version,serialized_state_json,due_at,last_reviewed_at,last_rating,lapses,repetitions,known_flag) VALUES (?,'sm2-v1','{}',NULL,?,'hard',1,1,NULL)").run("word-111111111111", "2026-10-20T00:00:00.000Z");
      const payload = { progress: { schemaVersion: 1 as const, updatedAt: "2026-10-28T00:00:00.000Z", records: {
        "word-111111111111": record("word-111111111111", "2026-10-27T00:00:00.000Z"),
        "word-222222222222": record("word-222222222222", "2026-10-26T00:00:00.000Z"),
        "word-ffffffffffff": record("word-ffffffffffff", "2026-10-25T00:00:00.000Z"),
      } }, session: null };
      expect(previewLegacy(db, payload)).toMatchObject({ localRecords: 3, validRecords: 2, overlap: 1, newerLocal: 1, invalidWordIds: ["word-ffffffffffff"] });
      expect(importLegacy(db, payload, "merge")).toMatchObject({ status: "imported", imported: 2, invalid: 1 });
      expect(importLegacy(db, payload, "merge")).toMatchObject({ status: "duplicate", imported: 2 });
      expect(db.prepare("SELECT COUNT(*) count FROM review_events").get()).toEqual({ count: 0 });
      expect(db.prepare("SELECT COUNT(*) count FROM review_states WHERE scheduler_version='legacy-v1'").get()).toEqual({ count: 2 });
    } finally { db.close(); }
  });

  it("checksums full and progress backups and restores atomically", () => {
    const db = openDatabase(":memory:");
    try {
      const timestamp = "2026-10-28T00:00:00.000Z";
      db.prepare("INSERT INTO word_keys(word_id,created_at,retired_at) VALUES ('word-111111111111',?,NULL)").run(timestamp);
      db.prepare("INSERT INTO review_states(word_id,scheduler_version,serialized_state_json,due_at,last_reviewed_at,last_rating,lapses,repetitions,known_flag) VALUES ('word-111111111111','legacy-v1','{}',NULL,NULL,NULL,0,0,NULL)").run();
      const backup = createBackup(db, "progress");
      expect(validateBackup(backup).scope).toBe("progress");
      expect(() => validateBackup({ ...backup, checksum: "bad" })).toThrow("체크섬");
      const originalRow = backup.data.review_states[0] as Record<string, unknown>;
      const malformed = { ...backup, data: { ...backup.data, review_states: [{ ...originalRow, "revision); DROP TABLE books;--": 1 }] } };
      expect(() => validateBackup(malformed)).toThrow("열 구성");
      db.prepare("INSERT INTO word_keys(word_id,created_at,retired_at) VALUES ('word-222222222222',?,NULL)").run(timestamp);
      db.prepare("INSERT INTO review_states(word_id,scheduler_version,serialized_state_json,due_at,last_reviewed_at,last_rating,lapses,repetitions,known_flag) VALUES ('word-222222222222','legacy-v1','{}',NULL,NULL,NULL,0,0,NULL)").run();
      db.prepare("DELETE FROM review_states").run();
      expect(restoreBackup(db, backup, "merge")).toMatchObject({ status: "restored", scope: "progress" });
      expect(db.prepare("SELECT COUNT(*) count FROM review_states").get()).toEqual({ count: 1 });
      db.prepare("INSERT INTO review_states(word_id,scheduler_version,serialized_state_json,due_at,last_reviewed_at,last_rating,lapses,repetitions,known_flag) VALUES ('word-222222222222','legacy-v1','{}',NULL,NULL,NULL,0,0,NULL)").run();
      expect(restoreBackup(db, backup, "replace")).toMatchObject({ status: "restored", scope: "progress", strategy: "replace" });
      expect(db.prepare("SELECT COUNT(*) count FROM review_states").get()).toEqual({ count: 1 });
      expect(db.prepare("SELECT action FROM sync_changes WHERE entity_type='reviewState' AND entity_id='word-222222222222' ORDER BY seq DESC LIMIT 1").get()).toEqual({ action: "delete" });
    } finally { db.close(); }
  });
});
