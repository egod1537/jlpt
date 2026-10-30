import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/server/api";
import { beginOpenAiAuthorization, OpenAiAuthError, resolveOpenAiRedirectUri } from "@/lib/server/openai-oauth";
import { authorize } from "@/lib/server/authorize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = authorize(request);
  if (!auth.ok) return auth.response;
  try {
    const redirectUri = resolveOpenAiRedirectUri(request.url, request.headers.get("host"));
    const authorizationUrl = await beginOpenAiAuthorization(redirectUri, request.nextUrl.searchParams.get("new") === "1");
    return NextResponse.redirect(authorizationUrl, { headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
  } catch (error) {
    if (error instanceof OpenAiAuthError) return apiError(error.status, error.status === 401 ? "UNAUTHORIZED" : "VALIDATION", error.message);
    return apiError(500, "INTERNAL", "ChatGPT 연결을 시작하지 못했습니다.");
  }
}
