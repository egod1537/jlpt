"use client";

import Link from "next/link";
import { Clock, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useAsync } from "@/hooks/use-async";
import { useProgress } from "@/hooks/use-progress";
import { getCollections, getSearchIndex } from "@/lib/data";
import { dueRecords } from "@/lib/progress";
import { groupAllOccurrences } from "@/lib/search";
import { formatDateTime, formatNumber } from "@/lib/utils";

const loadDueData = async () => Promise.all([getCollections(), getSearchIndex()]);

export function DuePage() {
  const { data, loading, error, retry } = useAsync(loadDueData);
  const { progress } = useProgress();
  const [bookId, setBookId] = useState("");
  const groups = useMemo(() => new Map(groupAllOccurrences(data?.[1].occurrences ?? []).map((group) => [group.wordId, group])), [data]);
  const due = useMemo(() => dueRecords(progress).filter((record) => !bookId || groups.get(record.wordId)?.occurrences.some((item) => item.collectionId === bookId)), [bookId, groups, progress]);
  const books = useMemo(() => new Map(data?.[0].collections.map((book) => [book.id, book]) ?? []), [data]);
  if (loading) return <LoadingState label="복습 일정을 불러오는 중입니다" />;
  if (error || !data) return <ErrorState error={error} retry={retry} />;
  return <>
    <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-3xl font-black text-emerald-800">{formatNumber(due.length)}</p><p className="mt-1 text-sm text-slate-600">지금 복습할 고유 단어</p></div><div className="flex flex-col gap-2 sm:flex-row"><label><span className="sr-only">단어장으로 복습 필터</span><Select className="w-full sm:max-w-64" value={bookId} onChange={(event) => setBookId(event.target.value)}><option value="">모든 단어장</option>{data[0].collections.map((book) => <option key={book.id} value={book.id}>{book.title}</option>)}</Select></label><Button asChild disabled={!due.length}><Link href={`${bookId ? `/study?books=${bookId}&mode=due` : "/study?mode=due"}`}><RotateCcw aria-hidden="true" className="h-4 w-4" />복습 시작</Link></Button></div></div>
    {due.length ? <div className="space-y-3">{due.map((record) => { const group = groups.get(record.wordId); if (!group) return null; const occurrence = group.representative; return <Card key={record.wordId}><CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="jp text-xl font-black">{occurrence.term}</h2>{group.occurrences.some((item) => item.status === "needs-review") && <Badge variant="warning">일부 검수 필요</Badge>}</div><p className="jp mt-1 text-sm text-slate-500">{occurrence.reading ?? "읽기 미확인"}</p><p className="mt-2 text-sm text-slate-700">{occurrence.primaryMeaning ?? occurrence.meanings[0] ?? "뜻 미확인"}</p></div><div className="shrink-0 text-sm text-slate-600"><p className="flex items-center gap-2"><Clock aria-hidden="true" className="h-4 w-4" />{formatDateTime(record.dueAt!)}</p><p className="mt-2">출처 {group.occurrences.length}개 · 반복 {record.repetitions}회</p><Link href={`/books/${occurrence.collectionId}#${record.wordId}`} className="mt-2 inline-block font-bold text-emerald-800 hover:underline">{books.get(occurrence.collectionId)?.title ?? occurrence.collectionId}</Link></div></CardContent></Card>; })}</div> : <EmptyState title="지금 복습할 단어가 없습니다" description="미학습 단어는 복습 목록에 자동으로 들어오지 않습니다. 플래시카드에서 평가하면 다음 일정이 생깁니다." />}
  </>;
}
