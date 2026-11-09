"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GrammarSetTypeIcon } from "@/components/grammar/set-type-icon";
import { grammarSets, type GrammarSetType } from "@/lib/grammar";

type TypeFilter = "all" | GrammarSetType;

const typeLabels: Record<GrammarSetType, string> = {
  flashcard: "플래시카드",
  book: "책",
};

export function GrammarPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<TypeFilter>("all");
  const normalized = query.trim().toLocaleLowerCase();
  const visible = useMemo(() => grammarSets.filter((set) => {
    if (type !== "all" && set.type !== type) return false;
    return !normalized || [set.title, set.description, set.level, typeLabels[set.type]].join(" ").toLocaleLowerCase().includes(normalized);
  }), [normalized, type]);

  return <div className="mx-auto max-w-4xl">
    <header>
      <Badge variant="muted">JLPT 문법 라이브러리</Badge>
      <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">문법 세트</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-app-muted">플래시카드 세트는 한 문형씩 외우고, 책 세트는 목차를 따라 이어서 읽습니다.</p>
    </header>

    <section className="mt-7 rounded-2xl border border-app-border bg-app-surface p-4" aria-label="문법 세트 찾기">
      <label className="relative block">
        <span className="sr-only">문법 세트 검색</span>
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-app-muted" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-11 w-full rounded-xl border border-app-border bg-app-bg pl-10 pr-4 text-sm outline-none placeholder:text-app-muted focus:border-app-accent" placeholder="세트 제목이나 설명 검색" />
      </label>
      <div className="mt-3 grid grid-cols-3 rounded-xl bg-app-raised p-1" aria-label="세트 타입 필터">{([
        ["all", "전체"],
        ["flashcard", "카드"],
        ["book", "책"],
      ] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={type === value} onClick={() => setType(value)} className={`flex min-h-10 items-center justify-center gap-2 rounded-lg px-2 text-xs font-bold transition-colors sm:text-sm ${type === value ? "bg-app-surface text-app-accent shadow-sm" : "text-app-muted hover:text-app-text"}`}>{value !== "all" ? <GrammarSetTypeIcon type={value} size="sm" /> : null}{label}</button>)}</div>
    </section>

    <div className="mt-5 flex items-center justify-between gap-3">
      <p className="text-sm font-bold">전체 세트 <span className="text-app-accent">{visible.length}</span></p>
      <p className="text-xs text-app-muted">카드 {grammarSets.filter((set) => set.type === "flashcard").length} · 책 {grammarSets.filter((set) => set.type === "book").length}</p>
    </div>

    {visible.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{visible.map((set) => {
      return <Link key={set.id} href={`/grammar/${set.id}`} className="group flex min-h-44 flex-col rounded-2xl border border-app-border bg-app-surface p-5 shadow-sm transition-colors hover:border-app-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-2"><Badge>{set.level}</Badge><Badge variant="muted">{typeLabels[set.type]}</Badge></div>
          <GrammarSetTypeIcon type={set.type} />
        </div>
        <h2 className="mt-5 text-lg font-black group-hover:text-app-accent">{set.title}</h2>
        <p className="mt-2 flex-1 text-sm leading-6 text-app-muted">{set.description}</p>
        <div className="mt-4 flex items-center justify-between text-xs font-bold text-app-muted"><span>{set.pointIds.length}개 문형</span><span className="inline-flex items-center text-app-accent">열기<ChevronRight aria-hidden="true" className="h-4 w-4" /></span></div>
      </Link>;
    })}</div> : <div className="mt-4 rounded-2xl border border-dashed border-app-border px-5 py-14 text-center">
      <p className="font-bold">조건에 맞는 문법 세트가 없습니다.</p>
      <button type="button" onClick={() => { setQuery(""); setType("all"); }} className="mt-3 min-h-11 rounded-lg px-4 text-sm font-bold text-app-accent hover:bg-app-raised">필터 초기화</button>
    </div>}
  </div>;
}
