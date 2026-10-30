import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { accessTokenMock } = vi.hoisted(() => ({ accessTokenMock: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/server/openai-oauth", () => ({
  getOpenAiAccessToken: accessTokenMock,
  OpenAiAuthError: class OpenAiAuthError extends Error { constructor(public status = 401) { super(); } },
  OpenAiUpstreamError: class OpenAiUpstreamError extends Error { constructor(public status = 502, message = "", public requestId?: string) { super(message); } },
}));

import { POST } from "@/app/api/openai/responses/route";

describe("Responses API proxy", () => {
  beforeEach(() => {
    process.env.JLPT_APP_ORIGIN = "http://127.0.0.1:3100";
    accessTokenMock.mockReset().mockResolvedValue("oauth-access-token");
    vi.restoreAllMocks();
  });

  it("forces streaming and disables response storage", async () => {
    const upstream = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("data: {\"type\":\"response.completed\"}\n\n", {
      status: 200,
      headers: { "Content-Type": "text/event-stream", "openai-request-id": "req_test" },
    }));
    const request = new NextRequest("http://127.0.0.1:3100/api/openai/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://127.0.0.1:3100" },
      body: JSON.stringify({ model: "account-model", input: "こんにちは", store: true, stream: false }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    expect(response.headers.get("openai-request-id")).toBe("req_test");
    const [, init] = upstream.mock.calls[0];
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer oauth-access-token");
    expect(JSON.parse(String(init?.body))).toMatchObject({ model: "account-model", input: "こんにちは", store: false, stream: true });
  });

  it("rejects cross-origin and malformed requests before inference", async () => {
    const crossOrigin = await POST(new NextRequest("http://127.0.0.1:3100/api/openai/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://attacker.example" },
      body: JSON.stringify({ model: "account-model", input: "test" }),
    }));
    expect(crossOrigin.status).toBe(403);

    const malformed = await POST(new NextRequest("http://127.0.0.1:3100/api/openai/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://127.0.0.1:3100" },
      body: JSON.stringify({ model: "account-model" }),
    }));
    expect(malformed.status).toBe(400);
    expect(accessTokenMock).not.toHaveBeenCalled();
  });
});
