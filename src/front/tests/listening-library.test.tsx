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
});
