import type { NextRequest } from "next/server";
import { apiError, apiJson } from "@/lib/server/api";
import { CSRF_COOKIE, requestSession } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const authenticated = requestSession(request);
  if (!authenticated) return apiError(401, "UNAUTHENTICATED", "로그인이 필요합니다.");
  const csrfToken = request.cookies.get(CSRF_COOKIE)?.value;
  if (!csrfToken) return apiError(401, "UNAUTHENTICATED", "세션을 다시 시작해 주세요.");
  return apiJson({ owner: { username: authenticated.session.owner.username }, csrfToken, expiresAt: authenticated.session.expiresAt });
}
