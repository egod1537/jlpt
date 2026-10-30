import type { NextRequest } from "next/server";
import { apiError, apiJson } from "@/lib/server/api";
import { getOpenAiAuthStatus } from "@/lib/server/openai-oauth";
import { authorize } from "@/lib/server/authorize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = authorize(request);
  if (!auth.ok) return auth.response;
  try { return apiJson(await getOpenAiAuthStatus()); }
  catch { return apiError(500, "INTERNAL", "ChatGPT 연결 상태를 확인하지 못했습니다."); }
}
