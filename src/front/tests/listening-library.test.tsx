import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ListeningLibraryPage } from "@/components/listening/listening-library-page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("listening library failed-job actions", () => {
  beforeEach(() => {
    let failedCount = 2;
    vi.stubGlobal("confirm", vi.fn(() => true));
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/listening/jobs/retry-failed" && init?.method === "POST") {
        failedCount = 0;
        return Promise.resolve(Response.json({ failedCount: 2, queuedCount: 2, remainingFailedCount: 0 }, { status: 202 }));
      }
      if (url === "/api/listening/jobs/retry-failed") return Promise.resolve(Response.json({ failedCount }));
      if (url.startsWith("/api/listening/sets?")) return Promise.resolve(Response.json({ folders: [], sets: [], page: { hasMore: false }, failedCount }));
      return Promise.resolve(new Response(null, { status: 404 }));
    }));
  });

  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it("confirms and retries every currently failed audio item", async () => {
    const user = userEvent.setup();
    render(<ListeningLibraryPage />);

    const retryButton = await screen.findByRole("button", { name: "모두 다시 시도" });
    await waitFor(() => expect(retryButton).toBeEnabled());
    expect(screen.getByText("처리 실패 2개")).toBeVisible();

    await user.click(retryButton);

    expect(confirm).toHaveBeenCalledWith("처리 실패한 2개 음원을 모두 다시 시도할까요?");
    expect(await screen.findByText("2개 작업을 다시 처리합니다.")).toBeVisible();
    expect(screen.getByText("처리 실패 없음")).toBeVisible();
    expect(retryButton).toBeDisabled();
  });

  it("regenerates scripts for every audio item in an expanded set", async () => {
    const user = userEvent.setup();
    const set = { id: "set-1", folderId: null, title: "청해 1회", description: "", favorite: false, revision: 1, audioCount: 2, durationMs: 3_000, lastPlayedAt: null };
    const audio = [
      { id: "audio-1", setId: set.id, originalName: "1.mp3", mimeType: "audio/mpeg", sizeBytes: 10, durationMs: 1_000, status: "ready", scriptVersionId: "version-1", favorite: false, revision: 1, streamUrl: "/stream/1" },
      { id: "audio-2", setId: set.id, originalName: "2.mp3", mimeType: "audio/mpeg", sizeBytes: 10, durationMs: 2_000, status: "uploaded", scriptVersionId: null, favorite: false, revision: 1, streamUrl: "/stream/2" },
    ];
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/listening/jobs/retry-failed") return Promise.resolve(Response.json({ failedCount: 0 }));
      if (url.startsWith("/api/listening/sets?")) return Promise.resolve(Response.json({ folders: [], sets: [set], page: { hasMore: false }, failedCount: 0 }));
      if (url === "/api/listening/sets/set-1/reprocess" && init?.method === "POST") return Promise.resolve(Response.json({ totalCount: 2, queuedCount: 2, activeCount: 0, skippedCount: 0, replayedCount: 0 }, { status: 202 }));
      if (url === "/api/listening/sets/set-1") return Promise.resolve(Response.json({ set: { ...set, audio } }));
      return Promise.resolve(new Response(null, { status: 404 }));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<ListeningLibraryPage />);

    await user.click(await screen.findByRole("button", { name: "청해 1회 펼치기" }));
    const regenerate = await screen.findByRole("button", { name: "청해 1회 스크립트 다시 생성" });
    await user.click(regenerate);

    expect(confirm).toHaveBeenCalledWith("'청해 1회' 세트의 음원 2개 스크립트를 다시 생성할까요?\n기존 스크립트 버전은 보존됩니다.");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/listening/sets/set-1/reprocess", expect.objectContaining({ method: "POST" })));
    expect(await screen.findByText("청해 1회: 2개 재생성 시작")).toBeVisible();
  });
});
