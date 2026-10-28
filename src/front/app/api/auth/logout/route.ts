import type { NextRequest } from "next/server";
import { apiError, apiJson } from "@/lib/server/api";
import { getDatabase } from "@back/lib/db/database";
import { revokeSession } from "@back/lib/auth/service";
import { clearSessionCookies, requestSession, validMutationRequest } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function POST(request: NextRequest) {
  const authenticated = requestSession(request);
  if (!authenticated) return apiError(401, "UNAUTHENTICATED", "로그인이 필요합니다.");
  if (!validMutationRequest(request, authenticated.session)) return apiError(403, "FORBIDDEN", "요청을 확인할 수 없습니다.");
  revokeSession(getDatabase(), authenticated.token);
  const response = apiJson({ ok: true });
  clearSessionCookies(response);
  return response;
}
