import type { NextRequest } from "next/server";
import { authorizeExternalApi, externalApiError, externalApiHeaders } from "@back/lib/external-api/auth";
import { apiJson } from "@/lib/server/api";
import { dispatchGrammarApi, grammarApiFailure } from "@/lib/server/grammar-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = RouteContext<"/api/v1/grammar/[...path]">;

export async function GET(request: NextRequest, context: Context) { return handle(request, context); }
export async function POST(request: NextRequest, context: Context) { return handle(request, context); }
export async function PATCH(request: NextRequest, context: Context) { return handle(request, context); }
export async function DELETE(request: NextRequest, context: Context) { return handle(request, context); }

async function handle(request: NextRequest, context: Context) {
  const unauthorized = authorizeExternalApi(request);
  if (unauthorized) return unauthorized;
  try {
    const result = await dispatchGrammarApi(request, (await context.params).path);
    const headers = Object.fromEntries(new Headers(result.headers));
    const location = headers.location;
    if (location?.startsWith("/api/grammar")) {
      headers.location = location.replace("/api/grammar", "/api/v1/grammar");
    }
    return apiJson({ data: result.body }, { status: result.status ?? 200, headers: externalApiHeaders(headers) });
  } catch (error) {
    const failure = grammarApiFailure(error);
    return externalApiError(failure.status, failure.code, failure.message);
  }
}
