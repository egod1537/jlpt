import { describe, expect, it } from "vitest";
import { dueRecords, emptyProgress, exportProgress, parseProgress, parseSession, PROGRESS_KEY, resetAppStorage, saveProgress, SESSION_KEY } from "@/lib/progress";
import type { ProgressState } from "@/lib/types";

class MemoryStorage {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

describe("progress storage", () => {
  const wordId = "word-000000000001";
  const state = (): ProgressState => ({ schemaVersion: 1, updatedAt: "2026-10-28T00:00:00.000Z", records: { [wordId]: { wordId, repetitions: 1, intervalDays: 1, easeFactor: 2.5, dueAt: "2026-10-28T00:00:00.000Z", lastReviewedAt: "2026-10-27T00:00:00.000Z", lastRating: "good", lapses: 0 } } });

  it("round-trips exports without changing study fields", () => {
    const parsed = parseProgress(JSON.parse(exportProgress(state())) as unknown);
    expect(parsed).toEqual(state());
  });

  it("rejects corrupt, future and invalid numeric backups", () => {
    expect(() => parseProgress(null)).toThrow();
    expect(() => parseProgress({ ...state(), schemaVersion: 2 })).toThrow("지원하지 않는");
    expect(() => parseProgress({ ...state(), records: { [wordId]: { ...state().records[wordId], easeFactor: 99 } } })).toThrow();
  });

  it("returns each due word identity only once and excludes future dates", () => {
    const current = state();
    current.records["word-000000000002"] = { ...current.records[wordId], wordId: "word-000000000002", dueAt: "2026-10-29T00:00:00.000Z" };
    expect(dueRecords(current, new Date("2026-10-28T00:00:00.000Z")).map((item) => item.wordId)).toEqual([wordId]);
  });

  it("clears only app keys and reports storage failures", () => {
    const storage = new MemoryStorage(); storage.setItem(PROGRESS_KEY, "a"); storage.setItem(SESSION_KEY, "b"); storage.setItem("other-app", "keep");
    resetAppStorage(storage);
    expect(storage.getItem(PROGRESS_KEY)).toBeNull(); expect(storage.getItem(SESSION_KEY)).toBeNull(); expect(storage.getItem("other-app")).toBe("keep");
    expect(saveProgress(emptyProgress(), { setItem: () => { throw new Error("quota"); } })).toBe(false);
  });

  it("validates paused sessions and preserves ordered IDs", () => {
    const ids = [wordId, "word-000000000002"];
    const session = parseSession({ schemaVersion: 1, updatedAt: "2026-10-28T00:00:00.000Z", books: ["session-001"], mode: "all", includeReview: false, wordIds: ids, position: 1, revealed: true, ratings: { [wordId]: "good" } });
    expect(session.wordIds).toEqual(ids);
    expect(() => parseSession({ ...session, wordIds: ["bad"] })).toThrow();
  });
});
