import type { NextRequest } from "next/server";
import { apiError } from "@/lib/server/api";
import { requestSession, validMutationRequest } from "@/lib/server/session";

export function authorize(request: NextRequest, mutation = false) {
  const authenticated = requestSession(request);
  if (!authenticated) return { ok: false as const, response: apiError(401, "UNAUTHENTICATED", "로그인이 필요합니다.") };
  if (mutation && !validMutationRequest(request, authenticated.session)) {
    return { ok: false as const, response: apiError(403, "FORBIDDEN", "요청을 확인할 수 없습니다.") };
  }
  return { ok: true as const, ...authenticated };
}
