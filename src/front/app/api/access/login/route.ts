import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { expectedOrigin, hasValidOrigin } from "@back/lib/http/security";
import { accessCookieName, accessSecret, createAccessSessionToken, secureAccessCookie, verifyAccessCredential } from "@/lib/server/access";
import { apiError } from "@/lib/server/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) return apiError(403, "FORBIDDEN", "요청 출처를 확인할 수 없습니다.");
  const expected = accessSecret();
  if (!expected) return apiError(503, "INTERNAL", "JLPT_ACCESS_TOKEN이 올바르게 설정되지 않았습니다.");
  const contentType = request.headers.get("content-type") || "";
  let candidate = ""; let next = "/books";
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => null) as { accessToken?: unknown; next?: unknown } | null;
    candidate = typeof body?.accessToken === "string" ? body.accessToken : ""; next = safeNext(body?.next);
  } else {
    const form = await request.formData(); candidate = String(form.get("accessToken") || ""); next = safeNext(form.get("next"));
  }
  if (!verifyAccessCredential(candidate)) {
    const url = new URL("/login", expectedOrigin(request)); url.searchParams.set("error", "invalid");
    return NextResponse.redirect(url, { status: 303, headers: { "Cache-Control": "private, no-store" } });
  }
  const response = NextResponse.redirect(new URL(next, expectedOrigin(request)), { status: 303, headers: { "Cache-Control": "private, no-store" } });
  response.cookies.set(accessCookieName, createAccessSessionToken(expected), { httpOnly: true, sameSite: "lax", secure: secureAccessCookie(request), path: "/", maxAge: 30 * 24 * 60 * 60 });
  return response;
}

function safeNext(value: unknown) { return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/books"; }
