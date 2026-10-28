"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Database, RotateCcw, Search, ShieldAlert, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { ErrorState, LoadingState } from "@/components/data-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAsync } from "@/hooks/use-async";
import { useProgress } from "@/hooks/use-progress";
import { getCollections, getStats } from "@/lib/data";
import { dueRecords } from "@/lib/progress";
import { formatNumber } from "@/lib/utils";

const loadDashboard = async () => Promise.all([getCollections(), getStats()]);

export function Dashboard() {
  const { data, loading, error, retry } = useAsync(loadDashboard);
  const { progress } = useProgress();
  const dueCount = useMemo(() => dueRecords(progress).length, [progress]);
  if (loading) return <LoadingState label="학습 현황을 불러오는 중입니다" />;
  if (error || !data) return <ErrorState error={error} retry={retry} />;
  const [index, stats] = data;
  const metrics = [
    ["원본 단어장", stats.wordbookFiles, BookOpen], ["전체 출현", stats.wordEntries, Database], ["고유 단어", stats.uniqueAcrossWordbooks, Sparkles], ["학습 가능", stats.readyEntries, Sparkles], ["검수 필요", stats.needsReviewEntries, ShieldAlert],
  ] as const;
  const categories = Object.entries(stats.byCategory);
  return <>
    <section className="overflow-hidden rounded-3xl bg-emerald-950 px-6 py-10 text-white sm:px-10 sm:py-14">
      <Badge className="bg-white/15 text-emerald-50">브라우저에만 저장되는 학습 도구</Badge>
      <h1 className="mt-5 max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-5xl">흩어진 JLPT 단어장을<br className="hidden sm:block" /> 한곳에서 공부하세요.</h1>
      <p className="mt-5 max-w-2xl leading-7 text-emerald-100">원본 단어장과 순서는 그대로 보존합니다. 여러 단어장에 반복된 단어는 검색에서 묶이고 학습 진도는 같은 단어 ID로 공유됩니다.</p>
      <div className="mt-8 flex flex-wrap gap-3"><Button asChild size="lg" className="bg-white text-emerald-950 hover:bg-emerald-50"><Link href="/books">단어장 보기<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></Button><Button asChild size="lg" className="border border-white/30 bg-transparent hover:bg-white/10"><Link href="/search"><Search aria-hidden="true" className="h-4 w-4" />전체 검색</Link></Button></div>
    </section>
    <section aria-label="데이터 현황" className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
      {metrics.map(([label, value, Icon]) => <Card key={label}><CardContent className="p-4"><Icon aria-hidden="true" className="h-5 w-5 text-emerald-700" /><p className="mt-3 text-2xl font-black tabular-nums">{formatNumber(value)}</p><p className="mt-1 text-sm text-slate-600">{label}</p></CardContent></Card>)}
    </section>
    <section className="mt-10 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <Card><CardHeader><CardTitle>빠른 학습</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">
        <Button asChild variant="secondary" className="h-auto justify-between p-4"><Link href="/study"><span className="text-left"><span className="block">이어서 학습</span><span className="mt-1 block text-xs font-normal text-emerald-800">저장된 세션이 없으면 새 학습 설정</span></span><Sparkles aria-hidden="true" className="h-5 w-5" /></Link></Button>
        <Button asChild variant="outline" className="h-auto justify-between p-4"><Link href="/due"><span className="text-left"><span className="block">오늘 복습</span><span className="mt-1 block text-xs font-normal text-slate-600">현재 {formatNumber(dueCount)}개 복습 예정</span></span><RotateCcw aria-hidden="true" className="h-5 w-5" /></Link></Button>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>출처 분류</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{categories.map(([category, count]) => <Badge key={category} variant="muted">{category} · {formatNumber(count)}</Badge>)}</CardContent></Card>
    </section>
    <section className="mt-10"><div className="mb-4 flex items-end justify-between"><div><h2 className="text-xl font-black">단어장 둘러보기</h2><p className="mt-1 text-sm text-slate-600">원본 목록 앞부분의 단어장입니다.</p></div><Link className="rounded-lg text-sm font-bold text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600" href="/books">전체 보기</Link></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{index.collections.slice(0, 6).map((book) => <Link key={book.id} href={`/books/${book.id}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"><Badge variant="muted">{book.category}</Badge><h3 className="mt-3 font-bold leading-6 text-slate-950">{book.title}</h3><p className="mt-2 text-sm text-slate-600">{formatNumber(book.wordCount)}개 · {book.id}</p></Link>)}</div></section>
  </>;
}
