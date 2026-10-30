import type { NextRequest } from "next/server";
import { apiError, apiJson } from "@/lib/server/api";
import { authorize } from "@/lib/server/authorize";
import { OpenAiAuthError, OpenAiUpstreamError, verifyOpenAiConnection } from "@/lib/server/openai-oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  const auth = authorize(request, true); if (!auth.ok) return auth.response;
  try { return apiJson(await verifyOpenAiConnection()); }
  catch (error) {
    if (error instanceof OpenAiAuthError) return apiError(error.status, error.status === 401 ? "UNAUTHORIZED" : error.status === 403 ? "FORBIDDEN" : "CONFLICT", error.message, { reason: error.code });
    if (error instanceof OpenAiUpstreamError) return apiError(error.status, "UPSTREAM", error.message, { requestId: error.requestId });
    return apiError(500, "INTERNAL", "OpenAI 연결을 검증하지 못했습니다.");
  }
}
