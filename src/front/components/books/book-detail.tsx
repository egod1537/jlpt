"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, Sparkles } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { ErrorState, LoadingState } from "@/components/data-state";
import { WordDetail } from "@/components/books/word-detail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAsync } from "@/hooks/use-async";
import { getBook, wordMatches } from "@/lib/data";
import { formatNumber } from "@/lib/utils";

const PAGE_SIZE = 50;

export function BookDetail({ collectionId }: { collectionId: string }) {
  const loader = useCallback(() => getBook(collectionId), [collectionId]);
  const { data: book, loading, error, retry } = useAsync(loader);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [level, setLevel] = useState("");
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => book?.words.filter((word) => wordMatches(word, query) && (status === "all" || word.status === status) && (!level || (level === "unmarked" ? word.jlptLevels.length === 0 : word.jlptLevels.includes(level)))) ?? [], [book, level, query, status]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  if (loading) return <LoadingState label="단어장을 불러오는 중입니다" />;
  if (error || !book) return <ErrorState error={error} retry={retry} />;
  return <>
    <div className="mb-8"><div className="flex flex-wrap gap-2"><Badge>{book.category}</Badge><Badge variant="muted">{book.id}</Badge></div><h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">{book.title}</h1><p className="mt-3 text-app-muted">원본 순서의 단어 {formatNumber(book.total)}개</p><div className="mt-5 flex flex-wrap gap-3"><Button asChild><Link href={`/study?books=${book.id}&start=1`}><Sparkles aria-hidden="true" className="h-4 w-4" />바로 학습</Link></Button><Button asChild variant="outline"><Link href="/books">목록으로</Link></Button></div></div>
    <div className="grid gap-3 rounded-2xl border border-app-border bg-app-surface p-4 md:grid-cols-[1fr_auto_auto]">
      <label className="relative"><span className="sr-only">단어장 안에서 검색</span><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-app-muted" /><Input className="pl-9" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="표제어, 읽기, 뜻 검색" /></label>
      <label><span className="sr-only">데이터 상태</span><Select className="w-full" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="all">모든 상태</option><option value="ready">학습 가능</option><option value="needs-review">검수 필요</option></Select></label>
      <label><span className="sr-only">JLPT 급수</span><Select className="w-full" value={level} onChange={(event) => { setLevel(event.target.value); setPage(1); }}><option value="">모든 급수</option>{["N1", "N2", "N3", "N4", "N5"].map((item) => <option key={item}>{item}</option>)}<option value="unmarked">급수 미표기</option></Select></label>
    </div>
    <p className="my-5 text-sm text-app-muted">전체 {formatNumber(book.total)}개 중 {formatNumber(filtered.length)}개 · {page}/{pages}쪽</p>
    <ol className="space-y-3" start={(page - 1) * PAGE_SIZE + 1}>{visible.map((word, index) => <li key={`${word.id}-${(page - 1) * PAGE_SIZE + index}`} id={word.id}><Dialog><DialogTrigger asChild><button className="flex min-h-24 w-full items-center justify-between gap-4 rounded-2xl border border-app-border bg-app-surface p-4 text-left shadow-sm transition-colors hover:border-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 sm:p-5"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="jp text-xl font-bold sm:text-2xl">{word.term}</span>{word.nuance && <span className="text-sm font-semibold text-app-accent">· {word.nuance}</span>}</div><p className="jp mt-1 text-sm text-app-muted">{word.reading ?? "읽기 미확인"}</p><p className="mt-2 break-words text-app-muted">{word.primaryMeaning ?? "뜻 미확인"}</p></div><div className="flex shrink-0 flex-col items-end gap-2">{word.status === "needs-review" && <Badge variant="warning">검수 필요</Badge>}<div className="flex gap-1">{word.jlptLevels.map((item) => <Badge key={item} variant="muted">{item}</Badge>)}</div></div></button></DialogTrigger><WordDetail word={word} book={book} /></Dialog></li>)}</ol>
    {!visible.length && <div className="rounded-2xl border border-dashed border-app-border p-10 text-center text-app-muted">조건에 맞는 단어가 없습니다.</div>}
    {pages > 1 && <nav aria-label="단어 목록 페이지" className="mt-6 flex items-center justify-center gap-3"><Button variant="outline" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft aria-hidden="true" className="h-4 w-4" />이전</Button><span className="text-sm font-semibold tabular-nums">{page} / {pages}</span><Button variant="outline" disabled={page === pages} onClick={() => setPage((value) => Math.min(pages, value + 1))}>다음<ChevronRight aria-hidden="true" className="h-4 w-4" /></Button></nav>}
  </>;
}
