import { z } from "zod";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { apiError, apiJson, PayloadTooLargeError, readLimitedJson } from "@/lib/server/api";
import { getDatabase } from "@back/lib/db/database";
import { assertLoginAllowed, clearLoginFailures, createSession, recordLoginFailure, verifyOwnerCredentials } from "@back/lib/auth/service";
import { hasValidOrigin, loginAttemptKey } from "@back/lib/http/security";
import { attachSessionCookies } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const credentialsSchema = z.object({
  username: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(256),
}).strict();

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) return apiError(403, "FORBIDDEN", "요청을 확인할 수 없습니다.");
  try {
    const formSubmit = request.headers.get("content-type")?.includes("application/x-www-form-urlencoded") === true;
    const declared = Number(request.headers.get("content-length"));
    if (formSubmit && Number.isFinite(declared) && declared > 4_096) throw new PayloadTooLargeError();
    const raw = formSubmit
      ? await request.formData().then((form) => ({ username: form.get("username"), password: form.get("password") }))
      : await readLimitedJson(request, 4_096);
    const parsed = credentialsSchema.safeParse(raw);
    if (!parsed.success) return apiError(400, "VALIDATION", "입력값을 확인해 주세요.");
    const db = getDatabase();
    const attemptKey = loginAttemptKey(request, parsed.data.username);
    const limit = assertLoginAllowed(db, attemptKey);
    if (!limit.allowed) {
      const response = apiError(429, "RATE_LIMITED", "잠시 후 다시 시도해 주세요.");
      response.headers.set("Retry-After", String(limit.retryAfter));
      return response;
    }
    const owner = await verifyOwnerCredentials(db, parsed.data.username, parsed.data.password);
    if (!owner) {
      recordLoginFailure(db, attemptKey);
      return apiError(401, "UNAUTHENTICATED", "사용자 이름 또는 비밀번호가 올바르지 않습니다.");
    }
    clearLoginFailures(db, attemptKey);
    const session = createSession(db, owner);
    const response = formSubmit
      ? NextResponse.redirect(new URL("/books", request.url), 303)
      : apiJson({ owner: { username: owner.username }, csrfToken: session.csrfToken });
    attachSessionCookies(response, session);
    return response;
  } catch (error) {
    if (error instanceof PayloadTooLargeError) return apiError(413, "TOO_LARGE", "요청이 너무 큽니다.");
    if (error instanceof SyntaxError) return apiError(400, "VALIDATION", "JSON 형식이 올바르지 않습니다.");
    return apiError(500, "INTERNAL", "로그인 처리 중 오류가 발생했습니다.");
  }
}
