import { afterEach, describe, expect, it } from "vitest";
import { hasValidOrigin } from "@back/lib/http/security";

describe("write-request origin checks", () => {
  afterEach(() => { delete process.env.JLPT_APP_ORIGIN; });

  it("accepts equivalent loopback hostnames on the configured local port", () => {
    process.env.JLPT_APP_ORIGIN = "http://127.0.0.1:3100";
    expect(hasValidOrigin(requestFrom("http://127.0.0.1:3100"))).toBe(true);
    expect(hasValidOrigin(requestFrom("http://localhost:3100"))).toBe(true);
  });

  it("rejects another port, a missing origin, and non-loopback origins", () => {
    process.env.JLPT_APP_ORIGIN = "http://127.0.0.1:3100";
    expect(hasValidOrigin(requestFrom("http://localhost:3000"))).toBe(false);
    expect(hasValidOrigin(new Request("http://127.0.0.1:3100/api/test", { method: "POST" }))).toBe(false);
    expect(hasValidOrigin(requestFrom("https://attacker.example"))).toBe(false);
  });

  it("keeps production origins exact", () => {
    process.env.JLPT_APP_ORIGIN = "https://jlpt.example.com";
    expect(hasValidOrigin(requestFrom("https://jlpt.example.com"))).toBe(true);
    expect(hasValidOrigin(requestFrom("https://other.example.com"))).toBe(false);
  });
});

function requestFrom(origin: string) {
  return new Request("http://127.0.0.1:3100/api/test", { method: "POST", headers: { Origin: origin } });
}
