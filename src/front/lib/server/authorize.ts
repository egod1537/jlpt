import type { NextRequest } from "next/server";
import { apiError } from "@/lib/server/api";
import { hasValidOrigin } from "@back/lib/http/security";
import { requestAccess } from "@/lib/server/access";

export function authorize(request: NextRequest, mutation = false) {
  const access = requestAccess(request);
  if (!access.allowed) {
    return { ok: false as const, response: apiError(access.status, access.status === 401 ? "UNAUTHORIZED" : "INTERNAL", access.status === 401 ? "접근 세션이 필요합니다." : "JLPT_ACCESS_TOKEN이 설정되지 않아 외부 접근이 비활성화되었습니다.") };
  }
  if (mutation && !hasValidOrigin(request)) {
    return { ok: false as const, response: apiError(403, "FORBIDDEN", "요청을 확인할 수 없습니다.") };
  }
  return { ok: true as const };
}
