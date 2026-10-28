import { describe, expect, it } from "vitest";
import { nextStudyQueue } from "@/lib/study-queue";

describe("bounded loop study queue", () => {
  it("requeues again/hard cards without growing beyond the original round", () => {
    expect(nextStudyQueue(["a", "b", "c"], "a", "again", true)).toEqual(["b", "c", "a"]);
    expect(nextStudyQueue(["b", "c", "a"], "b", "hard", true)).toEqual(["c", "a", "b"]);
    expect(nextStudyQueue(["a", "b", "a"], "a", "again", true)).toEqual(["b", "a"]);
  });

  it("removes known cards and disables requeue outside loop mode", () => {
    expect(nextStudyQueue(["a", "b"], "a", "good", true)).toEqual(["b"]);
    expect(nextStudyQueue(["a", "b"], "a", "easy", true)).toEqual(["b"]);
    expect(nextStudyQueue(["a", "b"], "a", "again", false)).toEqual(["b"]);
  });
});
