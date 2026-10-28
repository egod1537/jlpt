// @vitest-environment node

import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { openDatabase } from "@back/lib/db/database";
import { parseStatsPeriod, statsDaily, statsFolders, statsOverview, weakWords } from "@back/lib/stats/service";

describe("learning statistics", () => {
  it("uses Asia/Seoul day boundaries and distinct shared word identities", () => {
    const db = openDatabase(":memory:");
    try {
      const timestamp = "2026-10-28T00:00:00.000Z";
      db.prepare("INSERT INTO folders(id,name,name_normalized,parent_id,order_index,revision,created_at,updated_at,deleted_at) VALUES ('folder-a','폴더','폴더',NULL,0,1,?,?,NULL)").run(timestamp, timestamp);
      for (const id of ["book-a", "book-b"]) db.prepare("INSERT INTO books(id,title,category,folder_id,favorite,order_index,origin,origin_ref,revision,created_at,updated_at,deleted_at) VALUES (?,?,NULL,'folder-a',0,0,'manual',NULL,1,?,?,NULL)").run(id, id, timestamp, timestamp);
      db.prepare("INSERT INTO word_keys(word_id,created_at,retired_at) VALUES ('word-123456abcdef',?,NULL)").run(timestamp);
      for (const [index, book] of ["book-a", "book-b"].entries()) db.prepare("INSERT INTO book_entries(entry_id,book_id,word_id,position,term,reading,meanings_json,status,revision,created_at,updated_at,deleted_at) VALUES (?,?,?,?,?,?,?,'ready',1,?,?,NULL)").run(`entry-${index}`, book, "word-123456abcdef", 0, "学ぶ", "まなぶ", '["배우다"]', timestamp, timestamp);
      const insert = db.prepare("INSERT INTO review_events(event_id,operation_id,word_id,rating,occurred_at,accepted_at,session_id,review_context,scheduler_version) VALUES (?,?,?,?,?,?,NULL,'manual','sm2-v1')");
      insert.run(randomUUID(), randomUUID(), "word-123456abcdef", "again", "2026-10-27T14:59:00.000Z", timestamp);
      insert.run(randomUUID(), randomUUID(), "word-123456abcdef", "good", "2026-10-27T15:01:00.000Z", timestamp);
      db.prepare("INSERT INTO review_states(word_id,scheduler_version,serialized_state_json,due_at,last_reviewed_at,last_rating,lapses,repetitions,known_flag) VALUES ('word-123456abcdef','sm2-v1','{}','2026-10-28T00:00:00.000Z',?,'good',1,3,NULL)").run(timestamp);
      const period = parseStatsPeriod("2026-10-27", "2026-10-28");
      expect(statsDaily(db, period)).toEqual([
        { date: "2026-10-27", uniqueWords: 1, attempts: 1, newWords: 1, againCount: 1 },
        { date: "2026-10-28", uniqueWords: 1, attempts: 1, newWords: 0, againCount: 0 },
      ]);
      expect(statsOverview(db, period)).toMatchObject({ studiedUnique: 1, totalReviewEvents: 2, masteredUnique: 1, masteryRate: 1 });
      expect(statsFolders(db, period).find((folder) => folder.folderId === "folder-a")).toMatchObject({ uniqueTotal: 1, studied: 1, mastered: 1, reviewAttempts: 2 });
      expect(weakWords(db, period, 20)[0]).toMatchObject({ wordId: "word-123456abcdef", reviewAttempts: 2, againCount: 1 });
    } finally { db.close(); }
  });

  it("rejects invalid, future, reversed, and oversized ranges", () => {
    expect(() => parseStatsPeriod("2026-02-30", "2026-03-01")).toThrow();
    expect(() => parseStatsPeriod("2026-10-28", "2026-10-27")).toThrow();
    expect(() => parseStatsPeriod("2026-10-28", "2026-10-29")).toThrow();
    expect(() => parseStatsPeriod("2000-01-01", "2026-10-28")).toThrow();
  });
});
