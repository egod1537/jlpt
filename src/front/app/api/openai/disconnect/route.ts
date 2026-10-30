import type { NextRequest } from "next/server";
import { apiError, apiJson } from "@/lib/server/api";
import { authorize } from "@/lib/server/authorize";
import { disconnectOpenAi } from "@/lib/server/openai-oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = authorize(request, true);
  if (!auth.ok) return auth.response;
  try { return apiJson(await disconnectOpenAi()); }
  catch { return apiError(500, "INTERNAL", "ChatGPT 연결을 해제하지 못했습니다."); }
}
