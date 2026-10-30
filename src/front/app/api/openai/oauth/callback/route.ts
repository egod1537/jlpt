import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { finishOpenAiAuthorization, OpenAiAuthError, OpenAiUpstreamError } from "@/lib/server/openai-oauth";
import { authorize } from "@/lib/server/authorize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = authorize(request);
  if (!auth.ok) return auth.response;
  const params = request.nextUrl.searchParams;
  try {
    await finishOpenAiAuthorization({
      code: params.get("code") || undefined,
      state: params.get("state") || undefined,
      clientId: params.get("client_id") || undefined,
      error: params.get("error") || undefined,
    });
    return redirectToSettings(request, "connected");
  } catch (error) {
    const code = error instanceof OpenAiAuthError ? error.code : error instanceof OpenAiUpstreamError ? "UPSTREAM" : "INTERNAL";
    return redirectToSettings(request, undefined, code);
  }
}

function redirectToSettings(request: NextRequest, status?: string, error?: string) {
  const url = new URL("/settings", request.url);
  if (status) url.searchParams.set("openai", status);
  if (error) url.searchParams.set("openai_error", error);
  return NextResponse.redirect(url, { headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
}
