import { apiError, apiJson } from "@/lib/server/api";
import { getOpenAiAccessToken, OpenAiAuthError, OpenAiUpstreamError } from "@/lib/server/openai-oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const token = await getOpenAiAccessToken();
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const requestId = response.headers.get("openai-request-id") || response.headers.get("x-request-id") || undefined;
    if (!response.ok) throw new OpenAiUpstreamError(response.status, "OpenAI 모델 목록을 불러오지 못했습니다.", requestId);
    const body = await response.json() as { models?: Array<{ slug?: unknown; display_name?: unknown; visibility?: unknown }> };
    const models = Array.isArray(body.models) ? body.models
      .filter((model) => model.visibility === "list" && typeof model.slug === "string" && typeof model.display_name === "string")
      .map((model) => ({ slug: model.slug as string, displayName: model.display_name as string })) : [];
    return apiJson({ models });
  } catch (error) {
    if (error instanceof OpenAiAuthError) return apiError(error.status, "UNAUTHORIZED", error.message);
    if (error instanceof OpenAiUpstreamError) return apiError(error.status, "UPSTREAM", error.message, { requestId: error.requestId });
    return apiError(500, "INTERNAL", "OpenAI 모델 목록을 불러오지 못했습니다.");
  }
}
