import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { findActiveSegment, ListeningPlayerPage } from "@/components/listening/listening-player-page";

const ja = "日本語の文です。";
const ko = "한국어 문장입니다.";

describe("listening player", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/metadata")) return Promise.resolve(Response.json({ audio: { id: "a1", originalName: "test.mp3", durationMs: 2_000, status: "ready", revision: 1, streamUrl: "/stream" } }));
      if (url.endsWith("/script") && init?.method === "POST") return Promise.resolve(Response.json({ audio: { id: "a1", revision: 2 }, script: { id: "v2" } }, { status: 201 }));
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

  it("uploads a script file with the current audio revision", async () => {
    const user = userEvent.setup();
    render(<ListeningPlayerPage audioId="a1" />);
    await screen.findByText(ja);
    const file = new File(["1\n00:00:00,000 --> 00:00:02,000\n日本語の文です。\n"], "script.srt", { type: "application/x-subrip" });
    await user.upload(screen.getByLabelText("청해 스크립트 파일 선택"), file);
    expect(await screen.findByText("스크립트를 새 버전으로 업로드했습니다.")).toBeVisible();
    const uploadCall = vi.mocked(fetch).mock.calls.find(([input, init]) => String(input).endsWith("/script") && init?.method === "POST");
    expect(uploadCall).toBeDefined();
    const form = uploadCall?.[1]?.body as FormData;
    expect(form.get("revision")).toBe("1");
    expect((form.get("file") as File).name).toBe("script.srt");
  });

  it("preloads audio and reconnects a stalled stream at the same position", async () => {
    vi.useFakeTimers();
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    try {
      const { container } = render(<ListeningPlayerPage audioId="a1" />);
      await act(async () => { await Promise.resolve(); });
      const element = container.querySelector("audio");
      expect(element).not.toBeNull();
      if (!element) return;
      expect(element).toHaveAttribute("preload", "auto");
      Object.defineProperty(element, "readyState", { configurable: true, value: 0 });
      Object.defineProperty(element, "duration", { configurable: true, value: 2 });
      element.currentTime = 0.75;
      fireEvent.play(element);
      fireEvent.waiting(element);

      await act(async () => { vi.advanceTimersByTime(8_000); });
      expect(element.getAttribute("src")).toBe("/stream?playback_retry=1");

      element.currentTime = 0;
      fireEvent.loadedMetadata(element);
      expect(element.currentTime).toBe(0.75);
      expect(play).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
