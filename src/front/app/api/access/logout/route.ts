import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { expectedOrigin, hasValidOrigin } from "@back/lib/http/security";
import { accessCookieName, secureAccessCookie } from "@/lib/server/access";
import { apiError } from "@/lib/server/api";

export const runtime = "nodejs";

export function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) return apiError(403, "FORBIDDEN", "요청 출처를 확인할 수 없습니다.");
  const response = NextResponse.redirect(new URL("/login", expectedOrigin(request)), { status: 303, headers: { "Cache-Control": "private, no-store" } });
  response.cookies.set(accessCookieName, "", { httpOnly: true, sameSite: "lax", secure: secureAccessCookie(request), path: "/", maxAge: 0 });
  return response;
}
