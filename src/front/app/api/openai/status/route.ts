import { apiError, apiJson } from "@/lib/server/api";
import { getOpenAiAuthStatus } from "@/lib/server/openai-oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try { return apiJson(await getOpenAiAuthStatus()); }
  catch { return apiError(500, "INTERNAL", "ChatGPT 연결 상태를 확인하지 못했습니다."); }
}
