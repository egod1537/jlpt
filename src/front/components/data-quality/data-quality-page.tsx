"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useAsync } from "@/hooks/use-async";
import { getCollections, getReviewIndex } from "@/lib/data";
import { formatNumber } from "@/lib/utils";

const PAGE_SIZE = 50;
const loadQualityData = async () => Promise.all([getCollections(), getReviewIndex()]);
const issueLabels: Record<string, string> = { "missing-reading": "읽기 미확인", "missing-meaning": "뜻 미확인" };

export function DataQualityPage() {
  const { data, loading, error, retry } = useAsync(loadQualityData);
  const [bookId, setBookId] = useState("");
  const [issue, setIssue] = useState("");
  const [page, setPage] = useState(1);
  const issues = useMemo(() => [...new Set(data?.[1].items.flatMap((item) => item.issues) ?? [])], [data]);
  const filtered = useMemo(() => data?.[1].items.filter((item) => (!bookId || item.collectionId === bookId) && (!issue || item.issues.includes(issue))) ?? [], [bookId, data, issue]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const books = useMemo(() => new Map(data?.[0].collections.map((book) => [book.id, book]) ?? []), [data]);
  const updateBook = (value: string) => { setBookId(value); setPage(1); };
  const updateIssue = (value: string) => { setIssue(value); setPage(1); };
  if (loading) return <LoadingState label="검수 목록을 불러오는 중입니다" />;
  if (error || !data) return <ErrorState error={error} retry={retry} />;
  return <>
    <div className="rounded-2xl border border-amber-200 bg-amber-950 p-5"><p className="font-bold text-amber-950">이 화면은 원본 데이터 품질 검수 목록입니다.</p><p className="mt-2 text-sm leading-6 text-amber-200">플래시카드 복습 일정과는 별개이며, 여기서 원본 JSON을 수정하지 않습니다. 전체 검수 필요 항목은 {formatNumber(data[1].total)}개입니다.</p></div>
    <div className="mt-5 grid gap-3 rounded-2xl border border-app-border bg-app-surface p-4 sm:grid-cols-2"><label className="text-sm font-bold">단어장<Select className="mt-2 w-full font-normal" value={bookId} onChange={(event) => updateBook(event.target.value)}><option value="">모든 단어장</option>{data[0].collections.map((book) => <option key={book.id} value={book.id}>{book.title}</option>)}</Select></label><label className="text-sm font-bold">문제 유형<Select className="mt-2 w-full font-normal" value={issue} onChange={(event) => updateIssue(event.target.value)}><option value="">모든 유형</option>{issues.map((item) => <option key={item} value={item}>{issueLabels[item] ?? item}</option>)}</Select></label></div>
    <p className="my-5 text-sm text-app-muted">{formatNumber(filtered.length)}개 표시 · {page}/{pages}쪽</p>
    {visible.length ? <div className="space-y-3">{visible.map((item, index) => <div key={`${item.collectionId}-${item.id}-${index}`} className="rounded-2xl border border-app-border bg-app-surface p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="jp text-xl font-black">{item.term}</h2><p className="jp mt-1 text-sm text-app-muted">{item.reading ?? "읽기 미확인"}</p><p className="mt-2 text-app-muted">{item.primaryMeaning ?? "뜻 미확인"}</p></div><div className="flex flex-wrap gap-2">{item.issues.map((entry) => <Badge key={entry} variant="warning">{issueLabels[entry] ?? entry}</Badge>)}</div></div><Link href={`/books/${item.collectionId}#${item.id}`} className="mt-4 inline-block text-sm font-bold text-app-accent hover:underline">{books.get(item.collectionId)?.title ?? item.collectionId}에서 보기 →</Link></div>)}</div> : <EmptyState title="조건에 맞는 검수 항목이 없습니다" description="단어장이나 문제 유형 필터를 바꿔 보세요." />}
    {pages > 1 && <nav aria-label="검수 목록 페이지" className="mt-6 flex items-center justify-center gap-3"><Button variant="outline" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft aria-hidden="true" className="h-4 w-4" />이전</Button><span className="text-sm font-semibold">{page} / {pages}</span><Button variant="outline" disabled={page === pages} onClick={() => setPage((value) => Math.min(pages, value + 1))}>다음<ChevronRight aria-hidden="true" className="h-4 w-4" /></Button></nav>}
  </>;
}
