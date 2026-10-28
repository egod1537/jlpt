import type { NextRequest } from "next/server";
import { apiError } from "@/lib/server/api";
import { hasValidOrigin } from "@back/lib/http/security";

export function authorize(request: NextRequest, mutation = false) {
  if (mutation && !hasValidOrigin(request)) {
    return { ok: false as const, response: apiError(403, "FORBIDDEN", "요청을 확인할 수 없습니다.") };
  }
  return { ok: true as const };
}
