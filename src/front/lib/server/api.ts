import { NextResponse } from "next/server";

export type ApiErrorCode = "VALIDATION" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "TOO_LARGE" | "INTERNAL";

const noStoreHeaders = { "Cache-Control": "private, no-store, max-age=0" };

export function apiJson(body: unknown, init: ResponseInit = {}) {
  return NextResponse.json(body, { ...init, headers: { ...noStoreHeaders, ...init.headers } });
}

export function apiError(status: number, code: ApiErrorCode, message: string, details?: Record<string, unknown>) {
  return apiJson({ error: { code, message, ...(details ? { details } : {}) } }, { status });
}

export async function readLimitedJson(request: Request, maxBytes = 16_384) {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) throw new PayloadTooLargeError();
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > maxBytes) throw new PayloadTooLargeError();
  return JSON.parse(text) as unknown;
}

export class PayloadTooLargeError extends Error {}
