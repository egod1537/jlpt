// @vitest-environment node

import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { openDatabase } from "@back/lib/db/database";
import { applyMutation } from "@back/lib/sync/mutations";
import { initialRecord, schedule } from "@back/lib/study/scheduler";
import { bootstrap } from "@back/lib/catalog/queries";

describe("server review events and sessions", () => {
  it("keeps the established scheduling rules", () => {
    const accepted = new Date("2026-10-28T00:00:00.000Z");
    expect(schedule(initialRecord("word-a"), "again", accepted)).toMatchObject({ dueAt: "2026-10-28T00:10:00.000Z", repetitions: 0, lapses: 1, easeFactor: 2.3 });
    expect(schedule(initialRecord("word-a"), "hard", accepted)).toMatchObject({ dueAt: "2026-10-30T00:00:00.000Z", intervalDays: 2 });
    expect(schedule(initialRecord("word-a"), "good", accepted)).toMatchObject({ dueAt: "2026-10-29T00:00:00.000Z", intervalDays: 1 });
    expect(schedule(initialRecord("word-a"), "easy", accepted)).toMatchObject({ dueAt: "2026-10-31T00:00:00.000Z", intervalDays: 3 });
  });

  it("applies one event and one schedule update for a duplicated operation", () => {
    const db = openDatabase(":memory:");
    try {
      db.prepare("INSERT INTO word_keys(word_id,created_at,retired_at) VALUES (?,?,NULL)").run("word-123456abcdef", new Date().toISOString());
      const mutation = { operationId: randomUUID(), type: "review.rate", occurredAt: "2026-10-27T12:00:00.000Z", payload: { wordId: "word-123456abcdef", rating: "again", sessionId: null, context: "manual" } };
      expect(applyMutation(db, "offline-phone", mutation)).toMatchObject({ status: "applied", entity: { reviewState: { lastRating: "again", lapses: 1 } } });
      expect(applyMutation(db, "offline-phone", mutation)).toMatchObject({ status: "duplicate" });
      expect(db.prepare("SELECT COUNT(*) count FROM review_events").get()).toEqual({ count: 1 });
      expect(db.prepare("SELECT repetitions,lapses,last_rating FROM review_states").get()).toEqual({ repetitions: 0, lapses: 1, last_rating: "again" });
    } finally { db.close(); }
  });

  it("persists resumable sessions with revision conflicts", () => {
    const db = openDatabase(":memory:");
    try {
      const sessionId = `study-${randomUUID()}`;
      expect(applyMutation(db, "phone", { operationId: randomUUID(), type: "session.create", payload: { id: sessionId, bookIds: [], mode: "all", includeReview: false, wordIds: ["word-123456abcdef"], queue: ["word-123456abcdef"], loopMode: true, results: [], position: 0, revealed: false, ratings: {}, status: "active" } })).toMatchObject({ status: "applied", serverRevision: 1, entity: { queue: ["word-123456abcdef"], loopMode: true } });
      expect(applyMutation(db, "phone", { operationId: randomUUID(), type: "session.update", targetId: sessionId, expectedRevision: 1, payload: { queue: ["word-123456abcdef"], results: [{ wordId: "word-123456abcdef", rating: "again", occurredAt: "2026-10-28T00:00:00.000Z" }], revealed: false } })).toMatchObject({ status: "applied", serverRevision: 2, entity: { queue: ["word-123456abcdef"], results: [{ rating: "again" }] } });
      expect(applyMutation(db, "laptop", { operationId: randomUUID(), type: "session.update", targetId: sessionId, expectedRevision: 1, payload: { position: 1 } })).toMatchObject({ status: "conflict", serverRevision: 2 });
      const nextSessionId = `study-${randomUUID()}`;
      const restart = { operationId: randomUUID(), type: "session.restart", targetId: sessionId, expectedRevision: 2, payload: { id: nextSessionId, bookIds: [], mode: "all", includeReview: false, wordIds: ["word-123456abcdef"], queue: ["word-123456abcdef"], loopMode: false, results: [], position: 0, revealed: false, ratings: {}, status: "active" } };
      expect(applyMutation(db, "phone", restart)).toMatchObject({ status: "applied", serverRevision: 1, entity: { id: nextSessionId, status: "active", position: 0, results: [] } });
      expect(applyMutation(db, "phone", restart)).toMatchObject({ status: "duplicate", entity: { id: nextSessionId } });
      expect(db.prepare("SELECT id,status,revision FROM study_sessions ORDER BY created_at,id").all()).toEqual(expect.arrayContaining([
        { id: sessionId, status: "completed", revision: 3 },
        { id: nextSessionId, status: "active", revision: 1 },
      ]));
      expect(db.prepare("SELECT COUNT(*) count FROM study_sessions").get()).toEqual({ count: 2 });
      expect(bootstrap(db)).toMatchObject({
        activeSessions: [{ id: nextSessionId, status: "active" }],
        studySessions: expect.arrayContaining([
          expect.objectContaining({ id: sessionId, status: "completed" }),
          expect.objectContaining({ id: nextSessionId, status: "active" }),
        ]),
      });
    } finally { db.close(); }
  });
});
