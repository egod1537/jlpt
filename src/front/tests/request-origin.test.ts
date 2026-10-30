import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

import { authorize } from "@/lib/server/authorize";

describe("public browser API request checks", () => {
  afterEach(() => {
    delete process.env.JLPT_APP_ORIGIN;
  });

  it("allows public read requests without a session", () => {
    const result = authorize(new NextRequest("https://jlpt.example/api/bootstrap"));
    expect(result.ok).toBe(true);
  });

  it("rejects cross-site mutations", () => {
    process.env.JLPT_APP_ORIGIN = "https://jlpt.example";
    const result = authorize(new NextRequest("https://jlpt.example/api/listening/sets", {
      method: "POST",
      headers: { Origin: "https://evil.example" },
    }), true);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
  });

  it("allows same-origin mutations", () => {
    process.env.JLPT_APP_ORIGIN = "https://jlpt.example";
    const result = authorize(new NextRequest("https://jlpt.example/api/listening/sets", {
      method: "POST",
      headers: { Origin: "https://jlpt.example" },
    }), true);
    expect(result.ok).toBe(true);
  });
});
