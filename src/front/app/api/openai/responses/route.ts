import type { NextRequest } from "next/server";
import { apiError, PayloadTooLargeError, readLimitedJson } from "@/lib/server/api";
import { authorize } from "@/lib/server/authorize";
import { getOpenAiAccessToken, OpenAiAuthError, OpenAiUpstreamError } from "@/lib/server/openai-oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = authorize(request, true);
  if (!auth.ok) return auth.response;
  try {
    const input = await readLimitedJson(request, 512 * 1_024);
    if (!input || typeof input !== "object" || Array.isArray(input)) return apiError(400, "VALIDATION", "Responses 요청 본문을 확인해 주세요.");
    const body = input as Record<string, unknown>;
    if (typeof body.model !== "string" || !body.model.trim() || body.model.length > 100 || body.input === undefined) {
      return apiError(400, "VALIDATION", "model과 input이 필요합니다.");
    }
    const token = await getOpenAiAccessToken();
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, store: false, stream: true }),
      cache: "no-store",
    });
    const requestId = response.headers.get("openai-request-id") || response.headers.get("x-request-id") || undefined;
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 8_192);
      return new Response(detail || JSON.stringify({ error: { code: "UPSTREAM", message: "OpenAI Responses 요청에 실패했습니다." } }), {
        status: response.status,
        headers: {
          "Content-Type": response.headers.get("content-type") || "application/json",
          "Cache-Control": "private, no-store",
          ...(requestId ? { "OpenAI-Request-Id": requestId } : {}),
        },
      });
    }
    if (!response.body) throw new OpenAiUpstreamError(502, "OpenAI 스트림이 비어 있습니다.", requestId);
    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") || "text/event-stream; charset=utf-8",
        "Cache-Control": "private, no-store",
        "X-Accel-Buffering": "no",
        ...(requestId ? { "OpenAI-Request-Id": requestId } : {}),
      },
    });
  } catch (error) {
    if (error instanceof PayloadTooLargeError) return apiError(413, "TOO_LARGE", "Responses 요청이 너무 큽니다.");
    if (error instanceof SyntaxError) return apiError(400, "VALIDATION", "JSON 형식을 확인해 주세요.");
    if (error instanceof OpenAiAuthError) return apiError(error.status, "UNAUTHORIZED", error.message);
    if (error instanceof OpenAiUpstreamError) return apiError(error.status, "UPSTREAM", error.message, { requestId: error.requestId });
    return apiError(500, "INTERNAL", "OpenAI Responses 요청을 처리하지 못했습니다.");
  }
}
