import { createHash, timingSafeEqual } from "node:crypto";
import { apiJson } from "@/lib/server/api";

const apiHeaders = { "X-API-Version": "1" };

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

export function externalApiHeaders(headers: HeadersInit = {}) {
  return { ...apiHeaders, ...headers };
}

export function externalApiError(status: number, code: string, message: string, details?: Record<string, unknown>, headers: HeadersInit = {}) {
  return apiJson({ error: { code, message, ...(details ? { details } : {}) } }, {
    status,
    headers: externalApiHeaders(headers),
  });
}

export function authorizeExternalApi(request: Request) {
  const expected = process.env.JLPT_EXTERNAL_API_KEY;
  if (!expected || expected.length < 16) {
    return externalApiError(503, "API_DISABLED", "외부 API 키가 설정되지 않았습니다.");
  }

  const authorization = request.headers.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  const valid = Boolean(match && timingSafeEqual(digest(match[1]), digest(expected)));
  if (!valid) {
    return externalApiError(401, "UNAUTHORIZED", "유효한 Bearer API 키가 필요합니다.", undefined, { "WWW-Authenticate": 'Bearer realm="jlpt-external-api"' });
  }
  return null;
}
