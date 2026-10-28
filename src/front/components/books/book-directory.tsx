"use client";

import Link from "next/link";
import { BookOpen, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { ErrorState, LoadingState } from "@/components/data-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAsync } from "@/hooks/use-async";
import { getCollections } from "@/lib/data";
import { formatDate, formatNumber } from "@/lib/utils";

export function BookDirectory() {
  const { data, loading, error, retry } = useAsync(getCollections);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("original");
  const categories = useMemo(() => [...new Set(data?.collections.map((item) => item.category) ?? [])], [data]);
  const books = useMemo(() => {
    const normalized = query.normalize("NFKC").toLocaleLowerCase("ko-KR");
    const filtered = (data?.collections ?? []).filter((item) => (!category || item.category === category) && (!normalized || `${item.title} ${item.id} ${item.category}`.normalize("NFKC").toLocaleLowerCase("ko-KR").includes(normalized)));
    if (sort === "newest") return [...filtered].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    if (sort === "title") return [...filtered].sort((a, b) => a.title.localeCompare(b.title, "ko"));
    return filtered;
  }, [category, data, query, sort]);
  if (loading) return <LoadingState label="단어장 목록을 불러오는 중입니다" />;
  if (error || !data) return <ErrorState error={error} retry={retry} />;
  const grouped = books.reduce((result, item) => {
    const current = result.get(item.category) ?? [];
    current.push(item);
    result.set(item.category, current);
    return result;
  }, new Map<string, typeof books>());
  return <>
    <div className="grid gap-3 rounded-2xl border border-app-border bg-app-surface p-4 sm:grid-cols-[1fr_auto]">
      <label className="relative"><span className="sr-only">단어장 검색</span><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-app-muted" /><Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="제목, 분류, 세션 ID 검색" /></label>
      <label className="flex items-center gap-2 text-sm font-semibold"><span>정렬</span><Select value={sort} onChange={(event) => setSort(event.target.value)}><option value="original">원본 순서</option><option value="newest">최신순</option><option value="title">제목순</option></Select></label>
      <div className="flex flex-wrap gap-2 sm:col-span-2"><button onClick={() => setCategory("")} aria-pressed={!category} className={`min-h-10 rounded-full px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${!category ? "bg-emerald-700 text-white" : "bg-app-raised text-app-muted"}`}>전체</button>{categories.map((item) => <button key={item} onClick={() => setCategory(item)} aria-pressed={category === item} className={`min-h-10 rounded-full px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${category === item ? "bg-emerald-700 text-white" : "bg-app-raised text-app-muted"}`}>{item}</button>)}</div>
    </div>
    <p className="mt-5 text-sm text-app-muted">{formatNumber(data.total)}개 중 {formatNumber(books.length)}개 표시</p>
    {books.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-app-border p-10 text-center text-app-muted">조건에 맞는 단어장이 없습니다.</div> : <div className="mt-8 space-y-10">{[...grouped.entries()].map(([group, items]) => <section key={group}><h2 className="mb-4 text-xl font-black">{group} <span className="text-sm font-normal text-app-muted">{items.length}개</span></h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((book) => <Link key={book.id} href={`/books/${book.id}`} className="group rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"><Card className="h-full transition-colors group-hover:border-emerald-300"><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><Badge variant="muted">{book.id}</Badge><BookOpen aria-hidden="true" className="h-5 w-5 text-app-accent" /></div><h3 className="mt-4 font-bold leading-6">{book.title}</h3><p className="mt-3 text-sm text-app-muted">{formatNumber(book.wordCount)}개 단어 · {formatDate(book.createdAt)}</p></CardContent></Card></Link>)}</div></section>)}</div>}
  </>;
}
