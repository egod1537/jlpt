import "server-only";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { findSession, safeHashEqual, type Session } from "@back/lib/auth/service";
import { hasValidOrigin } from "@back/lib/http/security";

export const SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-jlpt_session" : "jlpt_session";
export const CSRF_COOKIE = process.env.NODE_ENV === "production" ? "__Host-jlpt_csrf" : "jlpt_csrf";

function secureCookies() {
  return process.env.NODE_ENV === "production" || process.env.JLPT_APP_ORIGIN?.startsWith("https://") === true;
}

export function attachSessionCookies(response: NextResponse, values: { token: string; csrfToken: string; expiresAt: string }) {
  const common = { secure: secureCookies(), sameSite: "lax" as const, path: "/", expires: new Date(values.expiresAt) };
  response.cookies.set(SESSION_COOKIE, values.token, { ...common, httpOnly: true });
  response.cookies.set(CSRF_COOKIE, values.csrfToken, { ...common, httpOnly: false });
}

export function clearSessionCookies(response: NextResponse) {
  const common = { secure: secureCookies(), sameSite: "lax" as const, path: "/", expires: new Date(0), maxAge: 0 };
  response.cookies.set(SESSION_COOKIE, "", { ...common, httpOnly: true });
  response.cookies.set(CSRF_COOKIE, "", { ...common, httpOnly: false });
}

export function requestSession(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = findSession(getDatabase(), token);
  return session ? { session, token } : null;
}

export function validMutationRequest(request: NextRequest, session: Session) {
  if (!hasValidOrigin(request)) return false;
  const csrfHeader = request.headers.get("x-csrf-token");
  const csrfCookie = request.cookies.get(CSRF_COOKIE)?.value;
  return Boolean(csrfHeader && csrfCookie && csrfHeader === csrfCookie && safeHashEqual(csrfHeader, session.csrfTokenHash));
}

export async function pageSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return token ? findSession(getDatabase(), token) : null;
}
