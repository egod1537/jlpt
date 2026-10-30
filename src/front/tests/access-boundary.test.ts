import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

import { createAccessSessionToken, decideRequestAccess, requestAccess } from "@/lib/server/access";
import { authorize } from "@/lib/server/authorize";

describe("host access boundary", () => {
  afterEach(() => {
    delete process.env.JLPT_ACCESS_TOKEN;
    delete process.env.JLPT_ALLOW_INSECURE_LOOPBACK;
    delete process.env.JLPT_APP_ORIGIN;
  });

  it("rejects unauthenticated private requests and accepts only the HttpOnly session value", () => {
    process.env.JLPT_ACCESS_TOKEN = "a-secure-access-secret-123";
    const denied = authorize(new NextRequest("https://jlpt.example/api/bootstrap", { headers: { Host: "jlpt.example" } }));
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.response.status).toBe(401);

    const cookie = createAccessSessionToken(process.env.JLPT_ACCESS_TOKEN);
    const allowed = authorize(new NextRequest("https://jlpt.example/api/bootstrap", { headers: { Host: "jlpt.example", Cookie: `jlpt_access=${cookie}` } }));
    expect(allowed.ok).toBe(true);
    expect(requestAccess(new Request("https://jlpt.example/listening", { headers: { Host: "jlpt.example", Cookie: "jlpt_access=wrong" } })).allowed).toBe(false);
  });

  it("still rejects cross-site mutations after session authentication", () => {
    process.env.JLPT_ACCESS_TOKEN = "a-secure-access-secret-123";
    process.env.JLPT_APP_ORIGIN = "https://jlpt.example";
    const cookie = createAccessSessionToken(process.env.JLPT_ACCESS_TOKEN);
    const result = authorize(new NextRequest("https://jlpt.example/api/listening/sets", { method: "POST", headers: { Host: "jlpt.example", Cookie: `jlpt_access=${cookie}`, Origin: "https://evil.example" } }), true);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
  });

  it("fails closed off loopback when no access secret is configured", () => {
    expect(decideRequestAccess({ host: "jlpt.example", cookie: null })).toEqual({ allowed: false, status: 503, reason: "not-configured" });
    process.env.JLPT_ALLOW_INSECURE_LOOPBACK = "true";
    expect(decideRequestAccess({ host: "127.0.0.1:3100", cookie: null })).toEqual({ allowed: true, mode: "loopback" });
  });
});
