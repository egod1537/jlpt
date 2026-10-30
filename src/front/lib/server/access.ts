import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";

export const accessCookieName = "jlpt_access";

export type AccessDecision = { allowed: true; mode: "session" | "loopback" } | { allowed: false; status: 401 | 503; reason: "unauthorized" | "not-configured" };

export function accessSecret() {
  const value = process.env.JLPT_ACCESS_TOKEN?.trim();
  return value && value.length >= 16 ? value : null;
}

export function createAccessSessionToken(secret: string) {
  return createHmac("sha256", secret).update("jlpt-access-session-v1").digest("base64url");
}

export function verifyAccessCredential(candidate: string) {
  const expected = accessSecret();
  return Boolean(expected && safeEqual(candidate, expected));
}

export function decideRequestAccess(input: { host: string | null; cookie: string | null }) : AccessDecision {
  const expected = accessSecret();
  if (expected) {
    const valid = Boolean(input.cookie && safeEqual(input.cookie, createAccessSessionToken(expected)));
    return valid ? { allowed: true, mode: "session" } : { allowed: false, status: 401, reason: "unauthorized" };
  }
  if (loopbackBypassAllowed(input.host)) return { allowed: true, mode: "loopback" };
  return { allowed: false, status: 503, reason: "not-configured" };
}

export function requestAccess(request: Request) {
  const cookie = parseCookie(request.headers.get("cookie"), accessCookieName);
  return decideRequestAccess({ host: request.headers.get("host") || new URL(request.url).host, cookie });
}

export async function pageAccess() {
  const [headerStore, cookieStore] = await Promise.all([headers(), cookies()]);
  return decideRequestAccess({ host: headerStore.get("host"), cookie: cookieStore.get(accessCookieName)?.value || null });
}

export function secureAccessCookie(request: Request) {
  const forwarded = request.headers.get("x-forwarded-proto")?.split(",")[0].trim();
  return forwarded === "https" || new URL(request.url).protocol === "https:";
}

function loopbackBypassAllowed(host: string | null) {
  if (!isLoopbackHost(host)) return false;
  return process.env.NODE_ENV !== "production" || process.env.JLPT_ALLOW_INSECURE_LOOPBACK === "true";
}

function isLoopbackHost(host: string | null) {
  if (!host) return false;
  try { return new Set(["127.0.0.1", "localhost", "[::1]"]).has(new URL(`http://${host}`).hostname); }
  catch { return false; }
}

function parseCookie(header: string | null, name: string) {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) { try { return decodeURIComponent(value.join("=")); } catch { return null; } }
  }
  return null;
}

function safeEqual(left: string, right: string) {
  const leftBytes = Buffer.from(left); const rightBytes = Buffer.from(right);
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}
