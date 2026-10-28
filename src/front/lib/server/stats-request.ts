import type { NextRequest } from "next/server";
import { parseStatsPeriod } from "@back/lib/stats/service";

export function statsRequest(request: NextRequest) {
  const query = request.nextUrl.searchParams;
  const folderId = query.get("folderId");
  const bookId = query.get("bookId");
  if (folderId && bookId) throw new Error("폴더와 세트 범위를 동시에 지정할 수 없습니다.");
  if ([folderId, bookId].some((id) => id && !/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(id))) throw new Error("통계 범위를 확인해 주세요.");
  return {
    period: parseStatsPeriod(query.get("from"), query.get("to")),
    folderId,
    bookId,
  };
}
