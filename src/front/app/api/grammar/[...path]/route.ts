import type { NextRequest } from "next/server";
import { authorize } from "@/lib/server/authorize";
import { apiError, apiJson } from "@/lib/server/api";
import { dispatchGrammarApi, grammarApiFailure } from "@/lib/server/grammar-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = RouteContext<"/api/grammar/[...path]">;

export async function GET(request: NextRequest, context: Context) { return handle(request, context); }
export async function POST(request: NextRequest, context: Context) { return handle(request, context); }
export async function PATCH(request: NextRequest, context: Context) { return handle(request, context); }
export async function DELETE(request: NextRequest, context: Context) { return handle(request, context); }

async function handle(request: NextRequest, context: Context) {
  const auth = authorize(request, request.method !== "GET");
  if (!auth.ok) return auth.response;
  try {
    const result = await dispatchGrammarApi(request, (await context.params).path);
    return apiJson(result.body, { status: result.status ?? 200, headers: result.headers });
  } catch (error) {
    const failure = grammarApiFailure(error);
    return apiError(failure.status, failure.code, failure.message);
  }
}
