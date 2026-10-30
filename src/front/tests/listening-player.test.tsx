import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { findActiveSegment, ListeningPlayerPage } from "@/components/listening/listening-player-page";

const ja = "日本語の文です。";
const ko = "한국어 문장입니다.";

describe("listening player", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/metadata")) return Promise.resolve(Response.json({ audio: { id: "a1", originalName: "test.mp3", durationMs: 2_000, status: "ready", revision: 1, streamUrl: "/stream" } }));
      if (url.endsWith("/script")) return Promise.resolve(Response.json({ script: { id: "v1", versionNo: 1, kind: "gpt_processed", segments: [{ id: "s1", ordinal: 0, startMs: 0, endMs: 2_000, speaker: null, ja, ko, needsReview: true }] } }));
      if (url.endsWith("/progress")) return Promise.resolve(Response.json({ progress: { positionMs: 0, playbackRate: 1, completed: false, revision: 0 } }));
      return Promise.resolve(new Response(null, { status: 404 }));
    }));
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it("finds only the segment containing the current millisecond", () => {
    const segments = [{ startMs: 100, endMs: 200 }, { startMs: 250, endMs: 400 }];
    expect(findActiveSegment(segments, 99)).toBe(-1);
    expect(findActiveSegment(segments, 100)).toBe(0);
    expect(findActiveSegment(segments, 200)).toBe(-1);
    expect(findActiveSegment(segments, 399)).toBe(1);
  });

  it("supports all four independent Japanese and Korean display combinations", async () => {
    const user = userEvent.setup();
    render(<ListeningPlayerPage audioId="a1" />);
    await screen.findByText(ja);
    expect(screen.queryByText(ko)).toBeNull();
    expect(screen.queryByText("검토 필요")).toBeNull();

    await user.click(screen.getByRole("button", { name: "한" }));
    expect(screen.getByText(ja)).toBeVisible();
    expect(screen.getByText(ko)).toBeVisible();

    await user.click(screen.getByRole("button", { name: "日" }));
    expect(screen.queryByText(ja)).toBeNull();
    expect(screen.getByText(ko)).toBeVisible();

    await user.click(screen.getByRole("button", { name: "한" }));
    expect(screen.queryByText(ja)).toBeNull();
    expect(screen.queryByText(ko)).toBeNull();
    expect(screen.getByText("문장 1")).toBeVisible();
    await waitFor(() => expect(JSON.parse(localStorage.getItem("jlpt:listening-language") || "{}")).toEqual({ ja: false, ko: false }));
  });
});
