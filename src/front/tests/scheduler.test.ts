import { describe, expect, it } from "vitest";
import { initialRecord, schedule } from "@/lib/review-scheduler";

const now = new Date("2026-10-28T00:00:00.000Z");

describe("review scheduler", () => {
  it("schedules again after ten minutes with lapse and lower ease", () => {
    const result = schedule({ ...initialRecord("word-000000000001"), repetitions: 4, intervalDays: 10 }, "again", now);
    expect(result).toMatchObject({ repetitions: 0, intervalDays: 0, easeFactor: 2.3, lapses: 1, dueAt: "2026-10-28T00:10:00.000Z" });
  });

  it("implements fixed hard, good and easy date math", () => {
    expect(schedule(initialRecord("word-000000000001"), "hard", now)).toMatchObject({ repetitions: 1, intervalDays: 2, easeFactor: 2.35, dueAt: "2026-10-30T00:00:00.000Z" });
    const firstGood = schedule(initialRecord("word-000000000001"), "good", now);
    expect(firstGood).toMatchObject({ repetitions: 1, intervalDays: 1, dueAt: "2026-10-29T00:00:00.000Z" });
    expect(schedule(firstGood, "good", now)).toMatchObject({ repetitions: 2, intervalDays: 3, dueAt: "2026-10-31T00:00:00.000Z" });
    expect(schedule(initialRecord("word-000000000001"), "easy", now)).toMatchObject({ repetitions: 1, intervalDays: 3, easeFactor: 2.6, dueAt: "2026-10-31T00:00:00.000Z" });
  });

  it("clamps ease factor to its defined bounds", () => {
    const low = { ...initialRecord("word-000000000001"), easeFactor: 1.3 };
    const high = { ...initialRecord("word-000000000001"), easeFactor: 3 };
    expect(schedule(low, "again", now).easeFactor).toBe(1.3);
    expect(schedule(high, "easy", now).easeFactor).toBe(3);
  });
});
