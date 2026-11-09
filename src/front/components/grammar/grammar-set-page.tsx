"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type TouchEvent } from "react";
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, Infinity as InfinityIcon, RotateCcw, Search, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarkdownDocument } from "@/components/grammar/markdown-document";
import { GrammarSetTypeIcon } from "@/components/grammar/set-type-icon";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { FittedStudyDetails, FittedStudyTerm } from "@/components/study/fitted-study-term";
import { grammarChapters, grammarPointById, grammarSetById, type GrammarPoint, type GrammarSet } from "@/lib/grammar";

type GrammarRating = "again" | "good";
type GrammarResult = { pointId: string; rating: GrammarRating };

function formatElapsed(milliseconds: number) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(seconds % 60).padStart(2, "0");
}

export function GrammarSetPage({ setId }: { setId: string }) {
  const set = grammarSetById.get(setId);
  if (!set) return null;
  const points = set.pointIds.map((id) => grammarPointById.get(id)).filter((point): point is GrammarPoint => point !== undefined);

  return <div className="mx-auto max-w-5xl">
    <Link href="/grammar" className={`${set.type === "book" ? "hidden lg:inline-flex" : "inline-flex"} min-h-11 items-center gap-2 rounded-lg pr-3 text-sm font-bold text-app-muted hover:bg-app-raised hover:text-app-text`}><ArrowLeft aria-hidden="true" className="h-4 w-4" />문법 세트</Link>
    <header className={`${set.type === "book" ? "hidden lg:block" : ""} mt-4 mb-6`}>
      <div className="flex items-start gap-4"><GrammarSetTypeIcon type={set.type} size="lg" /><div className="min-w-0"><div className="flex flex-wrap gap-2"><Badge>{set.level}</Badge><Badge variant="muted">{set.type === "flashcard" ? "플래시카드" : "책"}</Badge></div><h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{set.title}</h1></div></div>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-app-muted">{set.description}</p>
    </header>
    {set.type === "flashcard" ? <FlashCardSet set={set} /> : <GrammarBookSet set={set} points={points} />}
  </div>;
}

type MobileBookPage = {
  id: string;
  kind: "explanation" | "examples";
  markdown: string;
  part: number;
  partCount: number;
  point: GrammarPoint;
};

function withoutExampleBlocks(markdown: string) {
  return markdown.replace(/\r\n/g, "\n").split(/\n\s*\n/).filter((block) => {
    const trimmed = block.trim();
    if (/^\*\*예문\*\*$/.test(trimmed)) return false;
    const lines = trimmed.split("\n");
    return !lines.length || !/^\d+\.\s+/.test(lines[0]) || !lines.every((line) => /^\d+\.\s+/.test(line) || /^\s+/.test(line));
  }).join("\n\n").trim();
}

function mobileBookExplanationMarkdown(point: GrammarPoint) {
  if (point.notesMarkdown) return withoutExampleBlocks(point.notesMarkdown);
  const lines = [
    ...point.connection.map((connection) => `- **접속:** ${connection}`),
    `- **의미:** ${point.meaning}`,
    "",
    point.explanation,
  ];
  if (point.caution) lines.push("", `**주의:** ${point.caution}`);
  return lines.join("\n");
}

function mobileBookExamplesMarkdown(point: GrammarPoint) {
  return ["**예문**", "", ...point.examples.map((example, index) => `${index + 1}. ${example.japanese}`)].join("\n");
}

function mobileBookPages(points: GrammarPoint[]) {
  return points.flatMap((point): MobileBookPage[] => [
    {
      id: `${point.id}-explanation`,
      kind: "explanation",
      markdown: mobileBookExplanationMarkdown(point),
      part: 1,
      partCount: 2,
      point,
    },
    {
      id: `${point.id}-examples`,
      kind: "examples",
      markdown: mobileBookExamplesMarkdown(point),
      part: 2,
      partCount: 2,
      point,
    },
  ]);
}

function FlashCardSet({ set }: { set: GrammarSet }) {
  const router = useRouter();
  const [queue, setQueue] = useState(() => [...set.pointIds]);
  const [showMeaning, setShowMeaning] = useState(false);
  const [showConnection, setShowConnection] = useState(false);
  const [loopMode, setLoopMode] = useState(false);
  const [results, setResults] = useState<GrammarResult[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set());
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [restartOpen, setRestartOpen] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const point = queue.length ? grammarPointById.get(queue[0]) : undefined;
  const completed = Math.max(0, set.pointIds.length - new Set(queue).size);
  const favorite = point ? favorites.has(point.id) : false;

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("jlpt-study-active", { detail: { active: true } }));
    return () => { window.dispatchEvent(new CustomEvent("jlpt-study-active", { detail: { active: false } })); };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setElapsed(Date.now() - startedAt), 1_000);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  useEffect(() => {
    const load = window.setTimeout(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(`jlpt-grammar-favorites:${set.id}`) || "[]") as string[];
        setFavorites(new Set(saved));
      } catch { /* malformed local state is ignored */ }
    }, 0);
    return () => window.clearTimeout(load);
  }, [set.id]);

  const rate = (rating: GrammarRating) => {
    if (!point) return;
    const pointId = point.id;
    setResults((current) => [...current.filter((item) => item.pointId !== pointId), { pointId, rating }]);
    setQueue((current) => {
      const rest = current.slice(1);
      return rating === "again" && loopMode ? [...rest, pointId] : rest;
    });
    setShowMeaning(false);
    setShowConnection(false);
  };

  const restart = (onlyWrong: boolean) => {
    const latest = new Map(results.map((result) => [result.pointId, result.rating]));
    const next = onlyWrong ? set.pointIds.filter((id) => latest.get(id) === "again") : [...set.pointIds];
    setQueue(next.length ? next : [...set.pointIds]);
    setResults([]);
    setShowMeaning(false);
    setShowConnection(false);
    setStartedAt(Date.now());
    setElapsed(0);
    setRestartOpen(false);
  };

  const toggleFavorite = () => {
    if (!point) return;
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(point.id)) next.delete(point.id); else next.add(point.id);
      localStorage.setItem(`jlpt-grammar-favorites:${set.id}`, JSON.stringify([...next]));
      return next;
    });
  };

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (!point || event.repeat || event.isComposing || event.ctrlKey || event.metaKey || event.altKey || target?.closest("input,select,textarea,[contenteditable=true]")) return;
      if (event.code === "KeyQ" || event.key === "1") setShowMeaning((value) => !value);
      else if (event.code === "KeyW" || event.key === "2") setShowConnection((value) => !value);
      else if (event.code === "KeyA" || event.key === "ArrowLeft") rate("again");
      else if (event.code === "KeyS" || event.key === "ArrowRight") rate("good");
      else if (event.code === "KeyB" || event.code === "KeyF") toggleFavorite();
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  const touchBegin = (event: TouchEvent) => {
    const touch = event.changedTouches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };
  const touchEnd = (event: TouchEvent) => {
    if (!touchStart.current) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < 40 || Math.abs(dx) <= Math.abs(dy)) return;
    rate(dx < 0 ? "again" : "good");
  };

  if (!queue.length) {
    const latest = new Map(results.map((result) => [result.pointId, result.rating]));
    const wrong = [...latest.values()].filter((rating) => rating === "again").length;
    const known = [...latest.values()].filter((rating) => rating === "good").length;
    return <section className="fixed inset-0 z-50 flex bg-app-bg px-4 text-app-text"><div className="m-auto w-full max-w-[480px] rounded-3xl border border-app-border bg-app-surface p-7 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-app-accent-surface text-2xl text-app-accent">✓</div><h1 className="mt-5 text-2xl font-black">학습을 마쳤습니다</h1><div className="mt-5 grid grid-cols-3 gap-3"><div><b className="block text-2xl text-app-accent">{known}</b><span className="text-xs text-app-muted">알고 있음</span></div><div><b className="block text-2xl text-app-warning">{wrong}</b><span className="text-xs text-app-muted">다시 학습</span></div><div><b className="block text-2xl">{formatElapsed(elapsed)}</b><span className="text-xs text-app-muted">소요 시간</span></div></div>{wrong ? <Button className="mt-7 w-full" onClick={() => restart(true)}><RotateCcw className="h-4 w-4" />모르는 것만 다시 ({wrong})</Button> : null}<Button variant="outline" className="mt-3 w-full" onClick={() => restart(false)}>처음부터 다시</Button><Button variant="ghost" className="mt-2 w-full" onClick={() => router.push("/grammar")}>문법 세트로</Button></div></section>;
  }
  if (!point) return null;

  return <><section className="fixed inset-0 z-50 bg-app-bg text-app-text">
    <div className="mx-auto flex h-[100dvh] max-w-[480px] flex-col overflow-hidden">
      <header className="flex shrink-0 items-center gap-2 px-3 pt-[max(8px,env(safe-area-inset-top))]">
        <button aria-label="학습 중단" onClick={() => router.push("/grammar")} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-app-muted"><ArrowLeft className="h-5 w-5" /></button>
        <strong aria-label="학습 범위" className="min-w-0 flex-1 truncate text-sm">{set.title}</strong>
        <span className="shrink-0 whitespace-nowrap text-xs tabular-nums text-app-muted">{completed + 1} / {set.pointIds.length}</span>
        <button aria-label="학습 처음부터 시작" onClick={() => setRestartOpen(true)} className="flex h-11 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs font-bold text-app-muted hover:bg-app-raised hover:text-app-text"><RotateCcw className="h-4 w-4" /><span>처음부터</span></button>
      </header>
      <div className="shrink-0 text-center text-xs tabular-nums text-app-muted" aria-label="경과 시간">{formatElapsed(elapsed)}</div>
      <div className="flex shrink-0 items-center justify-center gap-2 py-2">
        <button aria-pressed={favorite} aria-label={favorite ? "즐겨찾기 해제" : "즐겨찾기 추가"} onClick={toggleFavorite} className={`flex h-11 w-11 items-center justify-center rounded-full border transition-colors ${favorite ? "border-app-warning bg-app-warning/10 text-app-warning" : "border-app-border text-app-muted hover:border-app-warning hover:text-app-warning"}`}><Star className={`h-5 w-5 ${favorite ? "fill-current" : ""}`} /></button>
        <button aria-pressed={loopMode} aria-label="모르는 카드 반복" onClick={() => setLoopMode((value) => !value)} className={`flex h-11 w-11 items-center justify-center rounded-full border ${loopMode ? "border-app-accent text-app-accent" : "border-app-border text-app-muted"}`}><InfinityIcon className="h-5 w-5" /></button>
        <span className="flex h-11 min-w-11 items-center justify-center rounded-full border border-app-border px-3 text-xs font-bold" aria-label={`남은 카드 ${queue.length}개`}>{queue.length}</span>
      </div>
      <article onTouchStart={touchBegin} onTouchEnd={touchEnd} className="study-card flex min-h-0 flex-1 touch-pan-y flex-col items-center justify-start overflow-hidden px-5 py-1 text-center">
        <p className="h-5 shrink-0 overflow-hidden text-xs text-app-muted">{point.keywords.join(" · ")}</p>
        <FittedStudyTerm term={point.pattern} />
        <FittedStudyDetails>
          <p role="group" aria-label="한국어 뜻 텍스트 필드" aria-live="polite" aria-atomic="true" className="font-medium text-app-meaning"><span className={showMeaning ? "" : "invisible"}>{point.meaning}</span></p>
          <p role="group" aria-label="접속 텍스트 필드" aria-live="polite" aria-atomic="true" className="jp font-medium text-app-accent"><span className={showConnection ? "" : "invisible"}>{point.connection.join(" · ")}</span></p>
          <p className={showMeaning ? "text-app-muted" : "invisible"}>{point.explanation}</p>
          {point.caution ? <p className={showMeaning ? "text-app-warning" : "invisible"}>{point.caution}</p> : null}
        </FittedStudyDetails>
      </article>
      <div className="shrink-0 px-4"><div className="h-[5px] overflow-hidden rounded-full bg-app-raised"><div className="h-full bg-app-accent transition-[width] duration-200" style={{ width: `${set.pointIds.length ? completed / set.pointIds.length * 100 : 0}%` }} /></div><div className="mt-1 flex justify-between text-[11px] text-app-muted"><span>완료 {completed}</span><span>남음 {queue.length}</span></div></div>
      <footer className="study-controls shrink-0 space-y-2 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-2">
        <div className="grid grid-cols-2 gap-2"><button aria-pressed={showMeaning} onClick={() => setShowMeaning((value) => !value)} className={`min-h-14 rounded-xl border px-2 font-medium ${showMeaning ? "border-app-accent bg-app-accent-surface" : "border-app-border bg-app-raised"}`}>한국어 <kbd className="ml-1 text-[10px] opacity-60">Q/1</kbd></button><button lang="ja" aria-pressed={showConnection} onClick={() => setShowConnection((value) => !value)} className={`jp min-h-14 rounded-xl border px-2 font-medium ${showConnection ? "border-app-accent bg-app-accent-surface" : "border-app-border bg-app-raised"}`}>접속 <kbd className="ml-1 text-[10px] opacity-60">W/2</kbd></button></div>
        <div className="grid grid-cols-2 gap-2"><button onClick={() => rate("again")} className="min-h-14 rounded-xl bg-[var(--study)] px-2 font-bold text-white"><span className="text-app-warning">✎</span> 공부하겠음 <kbd className="ml-1 text-[10px] opacity-60">A/←</kbd></button><button onClick={() => rate("good")} className="min-h-14 rounded-xl bg-[var(--known)] px-2 font-bold text-white">✓ 알고있음 <kbd className="ml-1 text-[10px] opacity-60">S/→</kbd></button></div>
      </footer>
    </div>
  </section><GrammarRestartDialog open={restartOpen} onOpenChange={setRestartOpen} onConfirm={() => restart(false)} /></>;
}

function GrammarRestartDialog({ open, onOpenChange, onConfirm }: { open: boolean; onOpenChange: (open: boolean) => void; onConfirm: () => void }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-md"><DialogTitle className="pr-10 text-xl font-black">학습을 처음부터 시작할까요?</DialogTitle><DialogDescription className="mt-2 text-sm leading-6 text-app-muted">현재 카드 위치와 이번 라운드 결과를 초기화합니다. 즐겨찾기는 유지됩니다.</DialogDescription><div className="mt-6 grid grid-cols-2 gap-3"><Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button><Button variant="destructive" onClick={onConfirm}>처음부터 시작</Button></div></DialogContent></Dialog>;
}

function GrammarBookSet({ set, points }: { set: GrammarSet; points: GrammarPoint[] }) {
  const [query, setQuery] = useState("");
  const [mobilePage, setMobilePage] = useState(0);
  const mobileTouchStart = useRef<{ x: number; y: number } | null>(null);
  const normalized = query.trim().toLocaleLowerCase();
  const visiblePoints = useMemo(() => points.filter((point) => {
    if (!normalized) return true;
    return [point.pattern, point.reading, point.meaning, point.explanation, ...point.keywords].join(" ").toLocaleLowerCase().includes(normalized);
  }), [normalized, points]);
  const visibleIds = useMemo(() => new Set(visiblePoints.map((point) => point.id)), [visiblePoints]);
  const resultCount = visibleIds.size;
  const mobilePages = useMemo(() => mobileBookPages(visiblePoints), [visiblePoints]);
  const currentMobilePage = mobilePages[Math.min(mobilePage, Math.max(mobilePages.length - 1, 0))];
  const mobilePointNumber = currentMobilePage ? visiblePoints.findIndex((point) => point.id === currentMobilePage.point.id) + 1 : 0;
  const isExamplePage = (page: MobileBookPage | undefined) => page?.kind === "examples";
  const currentPageKind = isExamplePage(currentMobilePage) ? "예문" : "설명";
  const nextPageIsFirstExample = currentPageKind === "설명" && isExamplePage(mobilePages[mobilePage + 1]) && mobilePages[mobilePage + 1]?.point.id === currentMobilePage?.point.id;

  const turnMobilePage = (next: number) => {
    if (next < 0 || next >= mobilePages.length) return;
    setMobilePage(next);
  };

  const mobileTouchEnd = (event: TouchEvent) => {
    if (!mobileTouchStart.current) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - mobileTouchStart.current.x;
    const dy = touch.clientY - mobileTouchStart.current.y;
    mobileTouchStart.current = null;
    if (Math.abs(dx) < 50 || Math.abs(dx) <= Math.abs(dy)) return;
    turnMobilePage(mobilePage + (dx < 0 ? 1 : -1));
  };

  return <section aria-label={`${set.title} 책`}>
    <label className="relative hidden lg:block">
      <span className="sr-only">문법 책 데스크톱 검색</span>
      <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-app-muted" />
      <input value={query} onChange={(event) => { setQuery(event.target.value); setMobilePage(0); }} className="min-h-12 w-full rounded-xl border border-app-border bg-app-surface pl-12 pr-4 text-sm outline-none placeholder:text-app-muted focus:border-app-accent" placeholder="문형, 의미, 키워드 검색" />
    </label>

    <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] top-14 z-20 flex flex-col bg-app-bg px-4 pb-2 pt-1 lg:hidden">
      <header className="flex h-11 shrink-0 items-center gap-2">
        <Link href="/grammar" aria-label="문법 세트로 돌아가기" className="flex h-11 w-10 shrink-0 items-center justify-center rounded-lg text-app-muted hover:bg-app-raised hover:text-app-text"><ArrowLeft aria-hidden="true" className="h-5 w-5" /></Link>
        <GrammarSetTypeIcon type="book" />
        <strong className="min-w-0 flex-1 truncate text-sm">{set.title}</strong>
        {currentMobilePage ? <span className="shrink-0 text-[11px] font-bold tabular-nums text-app-muted">문형 {mobilePointNumber}/{visiblePoints.length}</span> : null}
      </header>
      <label className="relative mt-1 block shrink-0">
        <span className="sr-only">문법 책 검색</span>
        <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-3 h-5 w-5 text-app-muted" />
        <input value={query} onChange={(event) => { setQuery(event.target.value); setMobilePage(0); }} className="min-h-11 w-full rounded-xl border border-app-border bg-app-surface pl-11 pr-4 text-sm outline-none placeholder:text-app-muted focus:border-app-accent" placeholder="문형, 의미, 키워드 검색" />
      </label>
      {currentMobilePage ? <>
        <div className="mt-2 flex shrink-0 items-center justify-between text-[11px] font-bold text-app-muted"><span>{normalized ? `검색 결과 ${visiblePoints.length}개 · ${currentPageKind}` : `${currentPageKind} · 이 문형 ${currentMobilePage.part}/${currentMobilePage.partCount}`}</span><span className="tabular-nums">{mobilePage + 1} / {mobilePages.length}</span></div>
        <div className="my-2 h-1 shrink-0 overflow-hidden rounded-full bg-app-raised"><div className="h-full rounded-full bg-app-meaning transition-[width]" style={{ width: `${(mobilePage + 1) / mobilePages.length * 100}%` }} /></div>
        <article onTouchStart={(event) => { const touch = event.changedTouches[0]; mobileTouchStart.current = { x: touch.clientX, y: touch.clientY }; }} onTouchEnd={mobileTouchEnd} className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain rounded-2xl border border-app-border bg-app-surface px-5 py-4 shadow-sm" aria-label="문법 책 현재 페이지" aria-live="polite">
          <div className="flex items-start justify-between gap-3"><h2 className="jp text-xl font-black leading-tight text-app-accent">{currentMobilePage.point.pattern}</h2><Badge variant="muted">{currentPageKind} {currentMobilePage.part}/{currentMobilePage.partCount}</Badge></div>
          <p className="mt-1 truncate text-[11px] text-app-muted">{currentMobilePage.point.sourceFile ?? set.sourceFile}</p>
          <MarkdownDocument markdown={currentMobilePage.markdown} compact />
        </article>
        <nav aria-label="문법 책 페이지" className="mt-2 grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-2xl border border-app-border bg-app-surface p-2 shadow-lg">
          <Button variant="outline" disabled={mobilePage === 0} onClick={() => turnMobilePage(mobilePage - 1)}><ChevronLeft aria-hidden="true" className="h-4 w-4" />이전</Button>
          <span className="min-w-14 text-center text-xs font-black tabular-nums">{mobilePage + 1}/{mobilePages.length}</span>
          <Button disabled={mobilePage === mobilePages.length - 1} onClick={() => turnMobilePage(mobilePage + 1)}>{nextPageIsFirstExample ? "예문 보기" : "다음"}<ChevronRight aria-hidden="true" className="h-4 w-4" /></Button>
        </nav>
      </> : <div className="mt-4 rounded-2xl border border-dashed border-app-border px-5 py-14 text-center"><p className="font-bold">검색 결과가 없습니다.</p><p className="mt-2 text-sm text-app-muted">문형이나 한국어 의미를 다른 단어로 찾아보세요.</p></div>}
    </div>

    <div className="mt-6 hidden gap-8 lg:grid lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="hidden lg:block"><nav aria-label="문법 책 목차" className="sticky top-24 rounded-2xl border border-app-border bg-app-surface p-4">
        <p className="mb-3 text-xs font-black uppercase tracking-wider text-app-muted">목차</p>
        <ol className="max-h-[calc(100vh-10rem)] space-y-1 overflow-y-auto">{set.markdown ? points.filter((point) => visibleIds.has(point.id)).map((point, index) => <li key={point.id}><a href={`#${point.id}`} className="flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-app-muted hover:bg-app-raised hover:text-app-text"><span className="shrink-0 text-xs tabular-nums">{index + 1}</span><span className="jp line-clamp-2">{point.pattern}</span></a></li>) : grammarChapters.map((chapter) => {
          const count = chapter.pointIds.filter((id) => set.pointIds.includes(id) && visibleIds.has(id)).length;
          if (!count) return null;
          return <li key={chapter.id}><a href={`#${chapter.id}`} className="flex min-h-10 items-center justify-between gap-2 rounded-lg px-2 text-sm font-semibold text-app-muted hover:bg-app-raised hover:text-app-text"><span>{chapter.title}</span><span className="text-xs">{count}</span></a></li>;
        })}</ol>
      </nav></aside>

      <article className="min-w-0 rounded-2xl border border-app-border bg-app-surface px-5 py-7 shadow-sm sm:px-10 sm:py-10">
        {set.markdown && !normalized ? <>
          <header className="mb-8 border-b border-app-border pb-6"><p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-app-accent"><BookOpen aria-hidden="true" className="h-4 w-4" />가져온 Markdown</p><p className="mt-3 text-sm text-app-muted">{set.sourceFile}</p><div className="mt-4 flex flex-wrap gap-2"><Badge variant="outline">{points.length}개 문형</Badge><Badge variant="outline">예문 {points.reduce((total, point) => total + point.examples.length, 0)}개</Badge></div></header>
        </> : !normalized ? <header className="mb-10 border-b border-app-border pb-8">
          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-app-accent"><BookOpen aria-hidden="true" className="h-4 w-4" />JLPT N1 Grammar Notes</p>
          <h2 className="mt-4 text-3xl font-black">{set.title}</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-app-muted">비슷해 보이는 문형도 접속 방식과 화자의 태도에서 차이가 납니다. 형태만 외우기보다 설명과 예문을 함께 읽어 보세요.</p>
          <div className="mt-6 flex flex-wrap gap-2"><Badge variant="outline">{grammarChapters.filter((chapter) => chapter.pointIds.some((id) => set.pointIds.includes(id))).length}개 장</Badge><Badge variant="outline">{points.length}개 문형</Badge><Badge variant="outline">예문 {points.reduce((total, point) => total + point.examples.length, 0)}개</Badge></div>
        </header> : <p role="status" className="mb-8 text-sm text-app-muted"><strong className="text-app-accent">{resultCount}개</strong> 문형을 찾았습니다.</p>}

        {set.markdown && normalized && resultCount ? <div className="space-y-10">{points.filter((point) => visibleIds.has(point.id)).map((point) => <GrammarArticle key={point.id} point={point} />)}</div> : set.markdown && !normalized ? <div className="space-y-10">{points.map((point) => <GrammarArticle key={point.id} point={point} />)}</div> : resultCount ? grammarChapters.map((chapter) => {
          const chapterPoints = chapter.pointIds.map((id) => grammarPointById.get(id)).filter((point): point is GrammarPoint => point !== undefined && set.pointIds.includes(point.id) && visibleIds.has(point.id));
          if (!chapterPoints.length) return null;
          return <section key={chapter.id} id={chapter.id} className="mb-12 scroll-mt-24 last:mb-0"><h2 className="text-2xl font-black">{chapter.title}</h2><p className="mt-2 text-sm leading-6 text-app-muted">{chapter.description}</p><div className="mt-7 space-y-10">{chapterPoints.map((point) => <GrammarArticle key={point.id} point={point} />)}</div></section>;
        }) : <div className="rounded-2xl border border-dashed border-app-border px-5 py-14 text-center"><p className="font-bold">검색 결과가 없습니다.</p><p className="mt-2 text-sm text-app-muted">문형이나 한국어 의미를 다른 단어로 찾아보세요.</p></div>}
      </article>
    </div>
  </section>;
}

function GrammarArticle({ point, id = point.id }: { point: GrammarPoint; id?: string }) {
  if (point.notesMarkdown) return <section id={id} className="scroll-mt-24 border-t border-app-border pt-7 first:border-t-0 first:pt-0"><h3 className="jp text-2xl font-black text-app-accent">{point.pattern}</h3><p className="mt-2 text-xs text-app-muted">{point.sourceFile}</p><MarkdownDocument markdown={withoutExampleBlocks(point.notesMarkdown)} compact /><GrammarExamples point={point} /></section>;
  return <section id={id} className="scroll-mt-24 border-t border-app-border pt-7 first:border-t-0 first:pt-0">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="jp text-2xl font-black text-app-accent">{point.pattern}</h3><p className="jp mt-1 text-xs text-app-muted">{point.reading}</p></div><div className="flex flex-wrap gap-1.5">{point.keywords.map((keyword) => <Badge key={keyword} variant="muted">{keyword}</Badge>)}</div></div>
    <p className="mt-4 text-lg font-black text-app-meaning">{point.meaning}</p>
    <p className="mt-3 text-sm leading-7">{point.explanation}</p>
    <div className="mt-5 rounded-xl border-l-4 border-app-accent bg-app-raised px-4 py-3"><p className="text-xs font-black uppercase tracking-wider text-app-accent">접속</p><ul className="mt-2 space-y-1 text-sm leading-6">{point.connection.map((connection) => <li key={connection} className="jp">{connection}</li>)}</ul></div>
    {point.caution ? <p className="mt-4 text-sm leading-6 text-app-warning"><strong>주의.</strong> {point.caution}</p> : null}
    <GrammarExamples point={point} />
  </section>;
}

function GrammarExamples({ point }: { point: GrammarPoint }) {
  return <div className="mt-5"><p className="text-sm font-black">예문</p><div className="mt-3 space-y-4">{point.examples.map((example, index) => <div key={example.japanese} className="grid grid-cols-[24px_1fr] gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-app-accent-surface text-xs font-bold">{index + 1}</span><p className="jp font-semibold leading-7">{example.japanese}</p></div>)}</div></div>;
}
