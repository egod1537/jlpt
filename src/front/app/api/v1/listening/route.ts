import type { NextRequest } from "next/server";
import { apiJson } from "@/lib/server/api";
import { authorizeExternalApi, externalApiHeaders } from "@back/lib/external-api/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const unauthorized = authorizeExternalApi(request);
  if (unauthorized) return unauthorized;
  return apiJson({ data: {
    resource: "listening",
    folders: "/api/v1/listening/folders",
    sets: "/api/v1/listening/sets",
    audio: "/api/v1/listening/audio/{audioId}",
    jobs: "/api/v1/listening/jobs/{jobId}",
    openapi: "/external-api.openapi.json",
  } }, { headers: externalApiHeaders() });
}
