import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const { jwtVerifyMock } = vi.hoisted(() => ({ jwtVerifyMock: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("jose", () => ({
  createRemoteJWKSet: vi.fn(() => ({ type: "mock-jwks" })),
  jwtVerify: jwtVerifyMock,
}));

import {
  beginOpenAiAuthorization,
  finishOpenAiAuthorization,
  getOpenAiAccessToken,
  getOpenAiAuthStatus,
  OpenAiAuthError,
  resolveOpenAiRedirectUri,
  verifyOpenAiConnection,
} from "@/lib/server/openai-oauth";

describe("ChatGPT OAuth service", () => {
  let temporaryDirectory = "";

  beforeEach(async () => {
    temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "jlpt-openai-oauth-"));
    process.env.JLPT_OPENAI_AUTH_PATH = path.join(temporaryDirectory, "auth.json");
    jwtVerifyMock.mockReset();
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    delete process.env.JLPT_OPENAI_AUTH_PATH;
    await rm(temporaryDirectory, { recursive: true, force: true });
  });

  it("creates a dynamic-client PKCE request and persists a stable host", async () => {
    const redirectUri = resolveOpenAiRedirectUri("http://localhost:3100/settings", "127.0.0.1:3100");
    const authorization = await beginOpenAiAuthorization(redirectUri);

    expect(authorization.origin + authorization.pathname).toBe("https://auth.openai.com/api/accounts/authorize");
    expect(authorization.searchParams.get("client_id")).toBe("dynamic_agent_client");
    expect(authorization.searchParams.get("redirect_uri")).toBe("http://127.0.0.1:3100/api/openai/oauth/callback");
    expect(authorization.searchParams.get("scope")).toContain("chatgpt.tokens.use.direct");
    expect(authorization.searchParams.get("code_challenge_method")).toBe("S256");
    expect(authorization.searchParams.get("code_challenge")).toMatch(/^[A-Za-z0-9_-]{43}$/);

    const saved = JSON.parse(await readFile(process.env.JLPT_OPENAI_AUTH_PATH!, "utf8"));
    expect(saved.hostId).toMatch(/^urn:uuid:/);
    expect(saved.pending.state).toBe(authorization.searchParams.get("state"));
    expect(saved.pending.codeVerifier).not.toBe(authorization.searchParams.get("code_challenge"));
  });

  it("validates the callback identity and stores a usable access token", async () => {
    const authorization = await beginOpenAiAuthorization("http://127.0.0.1:3100/api/openai/oauth/callback");
    jwtVerifyMock.mockResolvedValue({ payload: {
      sub: "account-subject",
      email: "learner@example.com",
      name: "JLPT Learner",
      nonce: authorization.searchParams.get("nonce"),
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    } });
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      access_token: "access-token",
      refresh_token: "refresh-token",
      id_token: "id-token",
      expires_in: 3600,
      scope: "openid profile email offline_access resource.invoke chatgpt.tokens.use.direct",
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    await finishOpenAiAuthorization({
      code: "authorization-code",
      state: authorization.searchParams.get("state")!,
      clientId: "oaiapp_test",
    });

    await expect(getOpenAiAuthStatus()).resolves.toMatchObject({
      connected: true,
      canUseResponses: true,
      account: { email: "learner@example.com", name: "JLPT Learner" },
    });
    await expect(getOpenAiAccessToken()).resolves.toBe("access-token");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fetchMock.mockReset()
      .mockResolvedValueOnce(Response.json({ models: [{ slug: "gpt-test", visibility: "list" }] }))
      .mockResolvedValueOnce(new Response('data: {"type":"response.completed"}\n\n', { headers: { "Content-Type": "text/event-stream" } }));
    await expect(verifyOpenAiConnection()).resolves.toMatchObject({ ready: true, model: "gpt-test" });
    await expect(getOpenAiAuthStatus()).resolves.toMatchObject({ ready: true, verifiedModel: "gpt-test" });
  });

  it("rejects non-loopback callbacks and callback state replay", async () => {
    expect(() => resolveOpenAiRedirectUri("https://jlpt.example.com/settings")).toThrowError(OpenAiAuthError);
    const authorization = await beginOpenAiAuthorization("http://127.0.0.1:3100/api/openai/oauth/callback");
    await expect(finishOpenAiAuthorization({ code: "code", state: "wrong" })).rejects.toMatchObject({ code: "INVALID_STATE" });
    expect(authorization.searchParams.get("state")).toBeTruthy();
  });
});
