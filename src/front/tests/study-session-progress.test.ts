import { describe, expect, it } from "vitest";
import { isResumableStudySession, studySessionProgress } from "@/lib/study-session-progress";

describe("study session range progress", () => {
  it("recovers interrupted sessions that legacy switching marked completed", () => {
    const session = { wordIds: ["a", "b", "c", "d"], queue: ["b", "c", "d"], position: 1 };
    expect(isResumableStudySession(session)).toBe(true);
    expect(studySessionProgress(session, 4)).toBe(1);
  });

  it("keeps truly finished sessions complete", () => {
    const session = { wordIds: ["a", "b"], queue: [], position: 2 };
    expect(isResumableStudySession(session)).toBe(false);
    expect(studySessionProgress(session, 2)).toBe(2);
  });

  it("falls back to the saved position for sessions from before queue storage", () => {
    const session = { wordIds: ["a", "b", "c"], position: 2 };
    expect(isResumableStudySession(session)).toBe(true);
    expect(studySessionProgress(session, 3)).toBe(2);
  });
});
