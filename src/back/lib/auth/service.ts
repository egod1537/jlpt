import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import argon2 from "argon2";
import type { AppDatabase } from "@back/lib/db/database";

const OWNER_ID = "owner";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1_000;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1_000;
const MAX_FAILURES = 5;

export interface Owner {
  id: typeof OWNER_ID;
  username: string;
  createdAt: string;
  passwordChangedAt: string;
}

export interface Session {
  tokenHash: string;
  csrfTokenHash: string;
  owner: Owner;
  createdAt: string;
  expiresAt: string;
}

function iso(date = new Date()) {
  return date.toISOString();
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function safeHashEqual(value: string, expectedHex: string) {
  const actual = Buffer.from(sha256(value), "hex");
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function sessionTtlMs() {
  const configured = Number(process.env.JLPT_SESSION_TTL_DAYS);
  return Number.isFinite(configured) && configured > 0
    ? Math.min(configured, 365) * 24 * 60 * 60 * 1_000
    : SESSION_TTL_MS;
}

export function validatePassword(password: string) {
  if (password.length < 12 || password.length > 256) {
    throw new Error("비밀번호는 12자 이상 256자 이하여야 합니다.");
  }
}

export async function hashPassword(password: string) {
  validatePassword(password);
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65_536,
    timeCost: 3,
    parallelism: 1,
  });
}

export async function initializeOwner(db: AppDatabase, username: string, password: string) {
  const normalized = username.trim();
  if (normalized.length < 2 || normalized.length > 64) throw new Error("사용자 이름은 2~64자여야 합니다.");
  if (db.prepare("SELECT 1 FROM owner_account WHERE id = ?").get(OWNER_ID)) throw new Error("owner 계정이 이미 초기화되었습니다.");
  const passwordHash = await hashPassword(password);
  const now = iso();
  db.prepare("INSERT INTO owner_account(id,username,password_hash,created_at,password_changed_at) VALUES (?,?,?,?,?)")
    .run(OWNER_ID, normalized, passwordHash, now, now);
}

export async function changeOwnerPassword(db: AppDatabase, password: string, revokeSessions = true) {
  if (!db.prepare("SELECT 1 FROM owner_account WHERE id = ?").get(OWNER_ID)) throw new Error("owner 계정이 초기화되지 않았습니다.");
  const passwordHash = await hashPassword(password);
  const now = iso();
  db.transaction(() => {
    db.prepare("UPDATE owner_account SET password_hash = ?, password_changed_at = ? WHERE id = ?")
      .run(passwordHash, now, OWNER_ID);
    if (revokeSessions) db.prepare("UPDATE auth_sessions SET revoked_at = ? WHERE owner_id = ? AND revoked_at IS NULL")
      .run(now, OWNER_ID);
  })();
}

let dummyPasswordHash: Promise<string> | undefined;

export async function verifyOwnerCredentials(db: AppDatabase, username: string, password: string): Promise<Owner | null> {
  const row = db.prepare("SELECT id,username,password_hash,created_at,password_changed_at FROM owner_account WHERE id = ?").get(OWNER_ID) as {
    id: typeof OWNER_ID;
    username: string;
    password_hash: string;
    created_at: string;
    password_changed_at: string;
  } | undefined;
  dummyPasswordHash ??= argon2.hash(randomBytes(32), { type: argon2.argon2id });
  const passwordHash = row?.password_hash ?? await dummyPasswordHash;
  let valid = false;
  try {
    valid = await argon2.verify(passwordHash, password);
  } catch {
    valid = false;
  }
  if (!row || row.username !== username.trim() || !valid) return null;
  return { id: row.id, username: row.username, createdAt: row.created_at, passwordChangedAt: row.password_changed_at };
}

export function createSession(db: AppDatabase, owner: Owner, now = new Date()) {
  const token = randomBytes(32).toString("base64url");
  const csrfToken = randomBytes(32).toString("base64url");
  const createdAt = iso(now);
  const expiresAt = iso(new Date(now.getTime() + sessionTtlMs()));
  db.prepare("INSERT INTO auth_sessions(token_hash,csrf_token_hash,owner_id,created_at,expires_at,last_used_at,revoked_at) VALUES (?,?,?,?,?,?,NULL)")
    .run(sha256(token), sha256(csrfToken), owner.id, createdAt, expiresAt, createdAt);
  return { token, csrfToken, expiresAt };
}

export function findSession(db: AppDatabase, token: string, now = new Date()): Session | null {
  if (!token || token.length > 256) return null;
  const tokenHash = sha256(token);
  const row = db.prepare(`SELECT s.token_hash,s.csrf_token_hash,s.created_at,s.expires_at,s.last_used_at,
    o.id,o.username,o.created_at owner_created_at,o.password_changed_at
    FROM auth_sessions s JOIN owner_account o ON o.id=s.owner_id
    WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>?`).get(tokenHash, iso(now)) as {
      token_hash: string;
      csrf_token_hash: string;
      created_at: string;
      expires_at: string;
      last_used_at: string;
      id: typeof OWNER_ID;
      username: string;
      owner_created_at: string;
      password_changed_at: string;
    } | undefined;
  if (!row) return null;
  if (now.getTime() - new Date(row.last_used_at).getTime() > 5 * 60 * 1_000) {
    db.prepare("UPDATE auth_sessions SET last_used_at=? WHERE token_hash=?").run(iso(now), tokenHash);
  }
  return {
    tokenHash: row.token_hash,
    csrfTokenHash: row.csrf_token_hash,
    owner: { id: row.id, username: row.username, createdAt: row.owner_created_at, passwordChangedAt: row.password_changed_at },
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

export function revokeSession(db: AppDatabase, token: string, now = new Date()) {
  db.prepare("UPDATE auth_sessions SET revoked_at=? WHERE token_hash=? AND revoked_at IS NULL").run(iso(now), sha256(token));
}

export function assertLoginAllowed(db: AppDatabase, attemptKey: string, now = new Date()) {
  const row = db.prepare("SELECT blocked_until FROM login_attempts WHERE attempt_key=?").get(attemptKey) as { blocked_until: string | null } | undefined;
  if (row?.blocked_until && new Date(row.blocked_until) > now) {
    const retryAfter = Math.max(1, Math.ceil((new Date(row.blocked_until).getTime() - now.getTime()) / 1_000));
    return { allowed: false as const, retryAfter };
  }
  return { allowed: true as const };
}

export function recordLoginFailure(db: AppDatabase, attemptKey: string, now = new Date()) {
  const row = db.prepare("SELECT failures,window_started_at FROM login_attempts WHERE attempt_key=?").get(attemptKey) as { failures: number; window_started_at: string } | undefined;
  const windowExpired = !row || now.getTime() - new Date(row.window_started_at).getTime() > ATTEMPT_WINDOW_MS;
  const failures = windowExpired ? 1 : row.failures + 1;
  const windowStartedAt = windowExpired ? iso(now) : row.window_started_at;
  const blockedUntil = failures >= MAX_FAILURES ? iso(new Date(now.getTime() + ATTEMPT_WINDOW_MS)) : null;
  db.prepare(`INSERT INTO login_attempts(attempt_key,failures,window_started_at,blocked_until,updated_at) VALUES (?,?,?,?,?)
    ON CONFLICT(attempt_key) DO UPDATE SET failures=excluded.failures,window_started_at=excluded.window_started_at,blocked_until=excluded.blocked_until,updated_at=excluded.updated_at`)
    .run(attemptKey, failures, windowStartedAt, blockedUntil, iso(now));
  return { failures, blockedUntil };
}

export function clearLoginFailures(db: AppDatabase, attemptKey: string) {
  db.prepare("DELETE FROM login_attempts WHERE attempt_key=?").run(attemptKey);
}
