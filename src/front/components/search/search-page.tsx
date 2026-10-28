"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAsync } from "@/hooks/use-async";
import { getCollections, getSearchIndex } from "@/lib/data";
import { searchGroups } from "@/lib/search";
import { formatNumber } from "@/lib/utils";

const PAGE_SIZE = 40;
const loadSearchData = async () => Promise.all([getCollections(), getSearchIndex()]);

export function SearchPage() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { data, loading, error, retry } = useAsync(loadSearchData);
  const [query, setQuery] = useState(() => params.get("q") ?? "");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = new URLSearchParams();
      if (query.trim()) next.set("q", query.trim());
      router.replace(next.size ? `${pathname}?${next}` : pathname, { scroll: false });
    }, 200);
    return () => window.clearTimeout(timer);
  }, [pathname, query, router]);
  const groups = useMemo(() => data ? searchGroups(data[1].occurrences, query, { category, jlptLevel: level, status: status as "all" | "ready" | "needs-review", collectionIds: selectedBooks }, data[0].collections) : [], [category, data, level, query, selectedBooks, status]);
  const occurrenceCount = groups.reduce((sum, group) => sum + group.occurrences.length, 0);
  const pages = Math.max(1, Math.ceil(groups.length / PAGE_SIZE));
  const visible = groups.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const booksById = useMemo(() => new Map(data?.[0].collections.map((item) => [item.id, item]) ?? []), [data]);
  const categories = useMemo(() => [...new Set(data?.[0].collections.map((item) => item.category) ?? [])], [data]);
  const toggleBook = (id: string) => { setSelectedBooks((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; }); setPage(1); };
  const clearFilters = () => { setCategory(""); setLevel(""); setStatus("all"); setSelectedBooks(new Set()); setPage(1); };
  if (loading) return <LoadingState label="전체 검색 인덱스를 불러오는 중입니다" />;
  if (error || !data) return <ErrorState error={error} retry={retry} />;
  return <>
    <div className="rounded-2xl border border-app-border bg-app-surface p-4 shadow-sm">
      <label className="relative block"><span className="sr-only">전체 단어 검색</span><Search aria-hidden="true" className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-app-muted" /><Input autoFocus className="h-13 pl-12 text-lg" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="일본어, 읽기, 한국어 뜻으로 검색" />{query && <button aria-label="검색어 지우기" onClick={() => { setQuery(""); setPage(1); }} className="absolute right-2 top-2 rounded-lg p-3 text-app-muted hover:bg-app-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"><X aria-hidden="true" className="h-4 w-4" /></button>}</label>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <label><span className="sr-only">출처 분류</span><Select className="w-full" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}><option value="">모든 분류</option>{categories.map((item) => <option key={item}>{item}</option>)}</Select></label>
        <label><span className="sr-only">JLPT 급수</span><Select className="w-full" value={level} onChange={(event) => { setLevel(event.target.value); setPage(1); }}><option value="">모든 급수</option>{["N1", "N2", "N3", "N4", "N5"].map((item) => <option key={item}>{item}</option>)}<option value="unmarked">급수 미표기</option></Select></label>
        <label><span className="sr-only">데이터 상태</span><Select className="w-full" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="all">모든 상태</option><option value="ready">학습 가능</option><option value="needs-review">검수 필요</option></Select></label>
      </div>
      <details className="mt-3 rounded-xl border border-app-border p-3"><summary className="flex min-h-8 cursor-pointer list-none items-center gap-2 text-sm font-bold"><SlidersHorizontal aria-hidden="true" className="h-4 w-4" />단어장 선택 {selectedBooks.size > 0 && <Badge>{selectedBooks.size}개</Badge>}</summary><div className="mt-3 grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">{data[0].collections.map((book) => <label key={book.id} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm hover:bg-app-raised"><input type="checkbox" checked={selectedBooks.has(book.id)} onChange={() => toggleBook(book.id)} className="h-4 w-4 accent-emerald-700" /><span className="min-w-0 truncate">{book.title} <span className="text-app-muted">({book.id})</span></span></label>)}</div></details>
    </div>
    {query.trim() ? <>
      <div className="my-5 flex flex-wrap items-center justify-between gap-3"><p className="font-semibold"><strong className="text-app-accent">{formatNumber(groups.length)}개 고유 단어</strong> / {formatNumber(occurrenceCount)}개 단어장 출현</p>{(category || level || status !== "all" || selectedBooks.size > 0) && <Button variant="ghost" size="sm" onClick={clearFilters}>필터 초기화</Button>}</div>
      {visible.length ? <div className="space-y-4">{visible.map((group) => <Card key={group.wordId}><CardContent className="p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="jp text-2xl font-black">{group.representative.term}</h2>{group.representative.nuance && <p className="mt-1 text-sm font-semibold text-app-accent">문맥: {group.representative.nuance}</p>}<p className="jp mt-1 text-sm text-app-muted">{group.representative.reading ?? "읽기 미확인"}</p></div><div className="flex flex-wrap gap-2"><Badge variant="muted">{group.occurrences.length}개 단어장에 등장</Badge>{group.occurrences.some((item) => item.status === "needs-review") && <Badge variant="warning">일부 검수 필요</Badge>}</div></div><div className="mt-5 space-y-3 border-t border-app-border pt-4">{group.occurrences.map((occurrence) => { const book = booksById.get(occurrence.collectionId); return <div key={`${occurrence.collectionId}-${occurrence.position}`} className="rounded-xl bg-app-raised p-3"><div className="flex flex-wrap items-center justify-between gap-2"><Link href={`/books/${occurrence.collectionId}#${occurrence.wordId}`} className="font-bold text-app-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">{book?.title ?? occurrence.collectionId}</Link>{occurrence.status === "needs-review" && <Badge variant="warning">검수 필요</Badge>}</div><p className="mt-2 text-sm leading-6 text-app-muted">{occurrence.meanings.length ? occurrence.meanings.join(" · ") : "뜻 미확인"}</p></div>; })}</div></CardContent></Card>)}</div> : <EmptyState title="검색 결과가 없습니다" description="검색어나 필터를 바꾸거나 필터를 초기화해 보세요." />}
      {pages > 1 && <nav aria-label="검색 결과 페이지" className="mt-6 flex items-center justify-center gap-3"><Button variant="outline" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft aria-hidden="true" className="h-4 w-4" />이전</Button><span className="text-sm font-semibold tabular-nums">{page} / {pages}</span><Button variant="outline" disabled={page === pages} onClick={() => setPage((value) => Math.min(pages, value + 1))}>다음<ChevronRight aria-hidden="true" className="h-4 w-4" /></Button></nav>}
    </> : <div className="mt-8 grid gap-4 sm:grid-cols-2"><EmptyState title="검색어를 입력하세요" description="한자·가나·한국어 뜻을 검색할 수 있습니다. 빈 검색은 전체 5천여 단어를 펼치지 않습니다." /><div className="rounded-2xl bg-app-accent-surface p-6"><h2 className="font-bold text-app-accent">검색 방식</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-app-accent"><li>정확한 표제어와 읽기가 먼저 표시됩니다.</li><li>히라가나와 가타카나는 같은 발음으로 찾습니다.</li><li>같은 단어 ID는 묶되 단어장별 뜻은 따로 보존합니다.</li></ul><Link href="/books" className="mt-5 inline-block rounded-lg font-bold text-app-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">단어장에서 찾아보기 →</Link></div></div>}
  </>;
}
