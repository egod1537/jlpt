// @vitest-environment node

import { describe, expect, it } from "vitest";
import { openDatabase } from "@back/lib/db/database";
import { assertLoginAllowed, createSession, findSession, initializeOwner, recordLoginFailure, revokeSession, sha256, verifyOwnerCredentials } from "@back/lib/auth/service";
import { loginAttemptKey } from "@back/lib/http/security";

describe("owner authentication", () => {
  it("stores only an Argon2id password hash and verifies generic credentials", async () => {
    const db = openDatabase(":memory:");
    try {
      await initializeOwner(db, "owner", "correct horse battery staple");
      const stored = db.prepare("SELECT password_hash FROM owner_account WHERE id='owner'").get() as { password_hash: string };
      expect(stored.password_hash).toMatch(/^\$argon2id\$/);
      expect(stored.password_hash).not.toContain("correct horse");
      expect(await verifyOwnerCredentials(db, "owner", "wrong password")).toBeNull();
      expect(await verifyOwnerCredentials(db, "owner", "correct horse battery staple")).toMatchObject({ id: "owner", username: "owner" });
    } finally {
      db.close();
    }
  }, 20_000);

  it("stores a SHA-256 session token, validates expiry, and revokes immediately", async () => {
    const db = openDatabase(":memory:");
    try {
      await initializeOwner(db, "owner", "correct horse battery staple");
      const owner = await verifyOwnerCredentials(db, "owner", "correct horse battery staple");
      expect(owner).not.toBeNull();
      const issued = createSession(db, owner!);
      expect(Buffer.from(issued.token, "base64url")).toHaveLength(32);
      const stored = db.prepare("SELECT token_hash,csrf_token_hash FROM auth_sessions").get() as { token_hash: string; csrf_token_hash: string };
      expect(stored.token_hash).toBe(sha256(issued.token));
      expect(stored.csrf_token_hash).toBe(sha256(issued.csrfToken));
      expect(JSON.stringify(stored)).not.toContain(issued.token);
      expect(findSession(db, issued.token)?.owner.username).toBe("owner");
      revokeSession(db, issued.token);
      expect(findSession(db, issued.token)).toBeNull();
    } finally {
      db.close();
    }
  }, 20_000);

  it("blocks a login key after five failures in one window", () => {
    const db = openDatabase(":memory:");
    try {
      const now = new Date("2026-10-28T00:00:00.000Z");
      for (let attempt = 0; attempt < 5; attempt += 1) recordLoginFailure(db, "key", now);
      expect(assertLoginAllowed(db, "key", now)).toMatchObject({ allowed: false, retryAfter: 900 });
      expect(assertLoginAllowed(db, "key", new Date("2026-10-28T00:16:00.000Z"))).toEqual({ allowed: true });
    } finally {
      db.close();
    }
  });

  it("ignores spoofed forwarding headers unless the trusted proxy mode is enabled", () => {
    const original = process.env.JLPT_TRUST_PROXY;
    try {
      process.env.JLPT_TRUST_PROXY = "false";
      const first = loginAttemptKey(new Request("https://jlpt.example/login", { headers: { "x-forwarded-for": "198.51.100.1", "x-real-ip": "198.51.100.2" } }), "owner");
      const second = loginAttemptKey(new Request("https://jlpt.example/login", { headers: { "x-forwarded-for": "203.0.113.1", "x-real-ip": "203.0.113.2" } }), "owner");
      expect(first).toBe(second);
      process.env.JLPT_TRUST_PROXY = "true";
      expect(loginAttemptKey(new Request("https://jlpt.example/login", { headers: { "x-forwarded-for": "198.51.100.1" } }), "owner")).not.toBe(loginAttemptKey(new Request("https://jlpt.example/login", { headers: { "x-forwarded-for": "203.0.113.1" } }), "owner"));
    } finally {
      if (original === undefined) delete process.env.JLPT_TRUST_PROXY; else process.env.JLPT_TRUST_PROXY = original;
    }
  });
});
