"use client";

import { useState } from "react";
import { AudioLines, ChevronDown, ChevronRight, Clock3, Folder, Search, Star } from "lucide-react";
import { Input } from "@/components/ui/input";

type ListeningSet = {
  id: string;
  title: string;
  audioCount: number;
  questionCount: number;
  duration: string;
  favorite?: boolean;
  recent?: boolean;
};

type ListeningFolder = {
  id: string;
  name: string;
  sets: ListeningSet[];
};

const folders: ListeningFolder[] = [
  {
    id: "n1-mock",
    name: "JLPT N1 실전",
    sets: [
      { id: "mock-01", title: "실전 모의고사 1회", audioCount: 5, questionCount: 24, duration: "28분", favorite: true, recent: true },
      { id: "mock-02", title: "실전 모의고사 2회", audioCount: 5, questionCount: 24, duration: "31분" },
    ],
  },
  {
    id: "question-types",
    name: "유형별 연습",
    sets: [
      { id: "task", title: "과제 이해", audioCount: 8, questionCount: 8, duration: "16분", recent: true },
      { id: "point", title: "포인트 이해", audioCount: 10, questionCount: 10, duration: "18분", favorite: true },
      { id: "overview", title: "개요 이해", audioCount: 6, questionCount: 6, duration: "12분" },
    ],
  },
  {
    id: "daily",
    name: "일상 회화",
    sets: [
      { id: "office", title: "회사에서 자주 듣는 표현", audioCount: 12, questionCount: 0, duration: "14분", recent: true },
    ],
  },
];

const unfiledSets: ListeningSet[] = [
  { id: "quick-note", title: "빠르게 다시 들을 표현", audioCount: 4, questionCount: 0, duration: "5분" },
];

const filters = [
  ["all", "전체"],
  ["recent", "최근"],
  ["favorites", "즐겨찾기"],
  ["unfiled", "미분류"],
] as const;

type Filter = typeof filters[number][0];

function normalize(value: string) { return value.normalize("NFKC").toLocaleLowerCase(); }

export function ListeningLibraryPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState(() => new Set(folders.map((folder) => folder.id)));
  const needle = normalize(query.trim());

  const matchesSet = (set: ListeningSet) => {
    if (filter === "recent" && !set.recent) return false;
    if (filter === "favorites" && !set.favorite) return false;
    return !needle || normalize(set.title).includes(needle);
  };

  const visibleFolders = filter === "unfiled" ? [] : folders.map((folder) => {
    const folderMatch = needle && normalize(folder.name).includes(needle);
    const sets = folder.sets.filter((set) => {
      if (filter === "recent" && !set.recent) return false;
      if (filter === "favorites" && !set.favorite) return false;
      return !needle || folderMatch || normalize(set.title).includes(needle);
    });
    return { ...folder, sets };
  }).filter((folder) => folder.sets.length || (filter === "all" && needle && normalize(folder.name).includes(needle)));

  const visibleUnfiled = (filter === "unfiled" || filter === "all" ? unfiledSets : []).filter(matchesSet);
  const totalSets = folders.reduce((total, folder) => total + folder.sets.length, 0) + unfiledSets.length;
  const hasResults = visibleFolders.length > 0 || visibleUnfiled.length > 0;

  const toggleFolder = (id: string) => setExpanded((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return <div className="mx-auto max-w-3xl">
    <div className="flex items-end justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black tracking-tight">청해</h1>
          <span className="rounded-full bg-app-accent-surface px-2 py-1 text-[10px] font-black text-app-text">레이아웃 샘플</span>
        </div>
        <p className="mt-1 text-sm text-app-muted">{folders.length}개 폴더 · {totalSets}개 세트</p>
      </div>
    </div>

    <div className="relative mt-5">
      <label htmlFor="listening-search" className="sr-only">청해 폴더·세트 검색</label>
      <Search aria-hidden="true" className="absolute left-3 top-3.5 h-4 w-4 text-app-muted" />
      <Input id="listening-search" className="pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="폴더·세트 검색..." />
    </div>

    <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1" aria-label="청해 빠른 필터">
      {filters.map(([value, label]) => <button key={value} type="button" onClick={() => setFilter(value)} aria-pressed={filter === value} className={"min-h-11 shrink-0 rounded-full px-4 text-sm font-bold " + (filter === value ? "bg-app-accent-surface text-app-text" : "bg-app-surface text-app-muted ring-1 ring-app-border")}>{label}</button>)}
    </div>

    <section className="mt-6 rounded-xl border border-app-border bg-app-surface p-2" aria-labelledby="listening-tree-heading">
      <div className="flex items-center justify-between px-2 py-2">
        <h2 id="listening-tree-heading" className="text-xs font-black uppercase tracking-wider text-app-muted">모든 청해</h2>
        <span className="text-[11px] font-bold text-app-accent">샘플 구조</span>
      </div>

      {hasResults ? <div>
        {visibleFolders.map((folder) => {
          const open = expanded.has(folder.id) || Boolean(needle);
          return <div key={folder.id}>
            <button type="button" onClick={() => toggleFolder(folder.id)} aria-expanded={open} className="flex min-h-12 w-full items-center gap-2 rounded-lg px-2 text-left hover:bg-app-raised">
              {open ? <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-app-muted" /> : <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-app-muted" />}
              <Folder aria-hidden="true" className="h-4 w-4 shrink-0 text-app-accent" />
              <span className="truncate text-sm font-bold">{folder.name}</span>
              <span className="ml-auto text-[11px] text-app-muted">{folder.sets.length}</span>
            </button>
            {open ? <div>{folder.sets.map((set) => <ListeningSetRow key={set.id} set={set} />)}</div> : null}
          </div>;
        })}

        {visibleUnfiled.length ? <div className="mt-1 border-t border-app-border pt-1">
          <div className="flex min-h-11 items-center gap-2 px-2 text-sm font-bold text-app-muted">
            <Folder aria-hidden="true" className="h-4 w-4" />미분류<span className="ml-auto text-xs">{visibleUnfiled.length}</span>
          </div>
          {visibleUnfiled.map((set) => <ListeningSetRow key={set.id} set={set} />)}
        </div> : null}
      </div> : <p className="px-4 py-10 text-center text-sm text-app-muted">조건에 맞는 청해 폴더나 세트가 없습니다.</p>}
    </section>

    <p className="mt-4 text-center text-xs leading-5 text-app-muted">현재 항목은 폴더와 세트 구조를 확인하기 위한 샘플이며 저장된 데이터가 아닙니다.</p>
  </div>;
}

function ListeningSetRow({ set }: { set: ListeningSet }) {
  return <div className="ml-6 flex min-h-16 items-center gap-3 rounded-lg px-2 py-2 hover:bg-app-raised">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-app-raised text-app-accent">
      <AudioLines aria-hidden="true" className="h-5 w-5" />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-semibold">{set.title}</span>
      <span className="mt-1 flex items-center gap-1 text-[11px] text-app-muted">
        음원 {set.audioCount}개{set.questionCount ? ` · 문제 ${set.questionCount}개` : ""}<span aria-hidden="true">·</span><Clock3 aria-hidden="true" className="h-3 w-3" />{set.duration}
      </span>
    </span>
    {set.favorite ? <Star aria-label="즐겨찾기" className="h-4 w-4 shrink-0 fill-app-warning text-app-warning" /> : null}
  </div>;
}
