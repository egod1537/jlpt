import type { NextRequest } from "next/server";
import { getDatabase } from "@back/lib/db/database";
import { getBook } from "@back/lib/catalog/queries";
import { apiError, apiJson } from "@/lib/server/api";
import { authorize } from "@/lib/server/authorize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = authorize(request);
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const book = getBook(getDatabase(), id);
  return book ? apiJson({ book }) : apiError(404, "NOT_FOUND", "세트를 찾을 수 없습니다.");
}
