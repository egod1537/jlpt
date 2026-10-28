"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Eye, Pause, RotateCcw, Shuffle, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ErrorState, LoadingState } from "@/components/data-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useAsync } from "@/hooks/use-async";
import { useSession } from "@/hooks/use-session";
import { getBook, getCollections } from "@/lib/data";
import { loadProgress, rateWord, saveSession } from "@/lib/progress";
import { buildStudyCards, canRateCard, seededShuffle } from "@/lib/study";
import type { CollectionIndex, Rating, StudyCard, StudySessionState } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

type Mode = "all" | "unseen" | "due";
type Phase = "configure" | "loading" | "studying" | "complete";
const ratingLabels: Array<{ value: Rating; label: string; key: string; style: string }> = [
  { value: "again", label: "다시", key: "1", style: "border-red-300 text-red-800 hover:bg-red-950" },
  { value: "hard", label: "어려움", key: "2", style: "border-amber-300 text-amber-200 hover:bg-amber-950" },
  { value: "good", label: "알겠음", key: "3", style: "border-emerald-300 text-app-accent hover:bg-app-accent-surface" },
  { value: "easy", label: "쉬움", key: "4", style: "border-blue-300 text-blue-900 hover:bg-blue-50" },
];

function parseMode(value: string | null): Mode { return value === "unseen" || value === "due" ? value : "all"; }

export function StudyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: index, loading, error, retry } = useAsync(getCollections);
  const requestedBooks = useMemo(() => (searchParams.get("books") ?? "").split(",").filter(Boolean), [searchParams]);
  const [selectedBooks, setSelectedBooks] = useState<string[]>(requestedBooks);
  const [mode, setMode] = useState<Mode>(() => parseMode(searchParams.get("mode")));
  const [includeReview, setIncludeReview] = useState(searchParams.get("includeReview") === "1");
  const [size, setSize] = useState("20");
  const [shuffle, setShuffle] = useState(false);
  const [phase, setPhase] = useState<Phase>("configure");
  const [cards, setCards] = useState<StudyCard[]>([]);
  const [position, setPosition] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [ratings, setRatings] = useState<Record<string, Rating>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<unknown>();
  const [activeConfig, setActiveConfig] = useState<{ books: string[]; mode: Mode; includeReview: boolean }>({ books: [], mode: "all", includeReview: false });
  const resume = useSession();
  const ratingLock = useRef(false);
  const allowedIds = useMemo(() => new Set(index?.collections.map((item) => item.id) ?? []), [index]);
  const invalidIds = requestedBooks.filter((id) => !allowedIds.has(id));
  const validSelectedBooks = selectedBooks.filter((id) => allowedIds.has(id));

  const loadCards = useCallback(async (config: { books: string[]; mode: Mode; includeReview: boolean; wordIds?: string[]; position?: number; revealed?: boolean; ratings?: Record<string, Rating> }) => {
    if (!index) return;
    setPhase("loading"); setLoadError(undefined); setMessage(null);
    setActiveConfig({ books: config.books, mode: config.mode, includeReview: config.includeReview });
    try {
      const ids = config.books.length ? config.books : index.collections.map((item) => item.id);
      const books = await Promise.all(ids.map(getBook));
      let nextCards = buildStudyCards(books, loadProgress(), { mode: config.mode, includeReview: config.includeReview });
      if (config.wordIds) {
        const byId = new Map(nextCards.map((card) => [card.wordId, card]));
        nextCards = config.wordIds.flatMap((id) => byId.get(id) ? [byId.get(id)!] : []);
      } else {
        if (shuffle) nextCards = seededShuffle(nextCards, Date.now());
        if (size !== "all") nextCards = nextCards.slice(0, Number(size));
      }
      setCards(nextCards); setPosition(Math.min(config.position ?? 0, Math.max(0, nextCards.length - 1))); setRevealed(config.revealed ?? false); setRatings(config.ratings ?? {});
      if (nextCards.length === 0) { setPhase("configure"); setMessage(config.mode === "due" ? "현재 복습할 단어가 없습니다." : "선택한 조건에 맞는 학습 가능 단어가 없습니다."); return; }
      setPhase("studying");
      const session: StudySessionState = { schemaVersion: 1, updatedAt: new Date().toISOString(), books: config.books, mode: config.mode, includeReview: config.includeReview, wordIds: nextCards.map((card) => card.wordId), position: config.position ?? 0, revealed: config.revealed ?? false, ratings: config.ratings ?? {} };
      if (!saveSession(session)) setMessage("세션을 브라우저에 저장하지 못했습니다. 현재 탭에서는 계속 학습할 수 있습니다.");
    } catch (caught) { setLoadError(caught); setPhase("configure"); }
  }, [index, shuffle, size]);

  const start = () => {
    const query = new URLSearchParams();
    if (validSelectedBooks.length) query.set("books", validSelectedBooks.join(","));
    if (mode !== "all") query.set("mode", mode);
    if (includeReview) query.set("includeReview", "1");
    router.replace(query.size ? `/study?${query}` : "/study", { scroll: false });
    void loadCards({ books: validSelectedBooks, mode, includeReview });
  };
  const restore = () => { if (resume) void loadCards(resume); };
  const persistDraft = useCallback((nextPosition: number, nextRevealed: boolean, nextRatings = ratings) => {
    saveSession({ schemaVersion: 1, updatedAt: new Date().toISOString(), books: activeConfig.books, mode: activeConfig.mode, includeReview: activeConfig.includeReview, wordIds: cards.map((card) => card.wordId), position: nextPosition, revealed: nextRevealed, ratings: nextRatings });
  }, [activeConfig, cards, ratings]);
  const showBack = useCallback(() => { if (phase !== "studying" || revealed) return; setRevealed(true); persistDraft(position, true); }, [persistDraft, phase, position, revealed]);
  const move = useCallback((next: number) => { const safe = Math.max(0, Math.min(cards.length - 1, next)); setPosition(safe); setRevealed(false); ratingLock.current = false; persistDraft(safe, false); }, [cards.length, persistDraft]);
  const rate = useCallback((rating: Rating) => {
    const card = cards[position];
    if (!card || !canRateCard(revealed, Boolean(ratings[card.wordId])) || ratingLock.current) return;
    ratingLock.current = true;
    const result = rateWord(card.wordId, rating);
    if (!result.persisted) setMessage("평가는 반영했지만 브라우저 저장소에 저장하지 못했습니다.");
    const nextRatings = { ...ratings, [card.wordId]: rating };
    setRatings(nextRatings);
    if (position >= cards.length - 1) { setPhase("complete"); persistDraft(position, true, nextRatings); }
    else { const next = position + 1; setPosition(next); setRevealed(false); ratingLock.current = false; persistDraft(next, false, nextRatings); }
  }, [cards, persistDraft, position, ratings, revealed]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, select, textarea, button, a, form") || phase !== "studying") return;
      if ((event.key === " " || event.key === "Enter") && !revealed) { event.preventDefault(); showBack(); }
      else if (revealed && /^[1-4]$/.test(event.key)) { event.preventDefault(); rate(ratingLabels[Number(event.key) - 1].value); }
      else if (event.key === "ArrowLeft") move(position - 1);
      else if (event.key === "ArrowRight") move(position + 1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [move, phase, position, rate, revealed, showBack]);
  if (loading) return <LoadingState label="학습 설정을 준비하는 중입니다" />;
  if (error || !index) return <ErrorState error={error} retry={retry} />;
  if (phase === "loading") return <LoadingState label="선택한 단어장을 불러오는 중입니다" />;
  if (phase === "studying") return <StudySession cards={cards} position={position} revealed={revealed} ratings={ratings} message={message} onReveal={showBack} onRate={rate} onMove={move} onPause={() => { persistDraft(position, revealed); setPhase("configure"); }} />;
  if (phase === "complete") return <StudySummary cards={cards} ratings={ratings} onRestart={() => setPhase("configure")} />;
  return <StudyConfigurator index={index} selectedBooks={validSelectedBooks} setSelectedBooks={setSelectedBooks} mode={mode} setMode={setMode} includeReview={includeReview} setIncludeReview={setIncludeReview} size={size} setSize={setSize} shuffle={shuffle} setShuffle={setShuffle} invalidIds={invalidIds} message={message} loadError={loadError} resume={resume} onResume={restore} onStart={start} />;
}

function StudyConfigurator({ index, selectedBooks, setSelectedBooks, mode, setMode, includeReview, setIncludeReview, size, setSize, shuffle, setShuffle, invalidIds, message, loadError, resume, onResume, onStart }: { index: CollectionIndex; selectedBooks: string[]; setSelectedBooks: (value: string[]) => void; mode: Mode; setMode: (value: Mode) => void; includeReview: boolean; setIncludeReview: (value: boolean) => void; size: string; setSize: (value: string) => void; shuffle: boolean; setShuffle: (value: boolean) => void; invalidIds: string[]; message: string | null; loadError: unknown; resume: StudySessionState | null; onResume: () => void; onStart: () => void }) {
  const toggle = (id: string) => setSelectedBooks(selectedBooks.includes(id) ? selectedBooks.filter((item) => item !== id) : [...selectedBooks, id]);
  return <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
    <Card><CardContent className="p-5 sm:p-6"><h2 className="text-xl font-black">새 학습 설정</h2><p className="mt-2 text-sm leading-6 text-app-muted">단어장을 선택하지 않으면 전체 단어장의 고유 단어를 공부합니다.</p>
      {(invalidIds.length > 0 || message || Boolean(loadError)) && <div role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-950 p-3 text-sm text-amber-950"><AlertTriangle aria-hidden="true" className="mr-2 inline h-4 w-4" />{loadError instanceof Error ? loadError.message : invalidIds.length ? `존재하지 않는 단어장 ID는 제외했습니다: ${invalidIds.join(", ")}` : message ?? "학습 데이터를 불러오지 못했습니다."}</div>}
      <fieldset className="mt-6"><legend className="font-bold">학습 범위</legend><div className="mt-3 max-h-72 space-y-1 overflow-y-auto rounded-xl border border-app-border p-2">{index.collections.map((book) => <label key={book.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-app-raised"><input type="checkbox" className="h-4 w-4 accent-emerald-700" checked={selectedBooks.includes(book.id)} onChange={() => toggle(book.id)} /><span className="min-w-0 flex-1 text-sm"><span className="block truncate font-semibold">{book.title}</span><span className="text-xs text-app-muted">{book.id} · {formatNumber(book.wordCount)}개</span></span></label>)}</div><div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="ghost" onClick={() => setSelectedBooks([])}>전체 풀</Button><Button type="button" size="sm" variant="ghost" onClick={() => setSelectedBooks(index.collections.map((item) => item.id))}>모두 선택</Button></div></fieldset>
      <div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">학습 모드<Select className="mt-2 w-full font-normal" value={mode} onChange={(event) => setMode(event.target.value as Mode)}><option value="all">전체</option><option value="unseen">미학습만</option><option value="due">복습 예정만</option></Select></label><label className="text-sm font-bold">세션 크기<Select className="mt-2 w-full font-normal" value={size} onChange={(event) => setSize(event.target.value)}>{["10", "20", "50"].map((item) => <option key={item} value={item}>{item}개</option>)}<option value="all">전체</option></Select></label></div>
      <div className="mt-5 space-y-3"><label className="flex min-h-11 cursor-pointer items-center gap-3"><input type="checkbox" checked={shuffle} onChange={(event) => setShuffle(event.target.checked)} className="h-4 w-4 accent-emerald-700" /><Shuffle aria-hidden="true" className="h-4 w-4 text-app-muted" /><span className="text-sm font-semibold">단어 순서 섞기</span></label><label className="flex min-h-11 cursor-pointer items-center gap-3"><input type="checkbox" checked={includeReview} onChange={(event) => setIncludeReview(event.target.checked)} className="h-4 w-4 accent-emerald-700" /><AlertTriangle aria-hidden="true" className="h-4 w-4 text-amber-700" /><span className="text-sm font-semibold">검수 필요 데이터 포함</span></label>{includeReview && <p className="rounded-lg bg-amber-950 p-3 text-sm text-amber-200">읽기나 뜻이 확인되지 않은 카드가 포함될 수 있습니다.</p>}</div>
      <Button size="lg" className="mt-6 w-full" onClick={onStart}><Sparkles aria-hidden="true" className="h-5 w-5" />학습 시작</Button>
    </CardContent></Card>
    <div className="space-y-5">{resume ? <Card className="border-app-accent bg-app-accent-surface"><CardContent className="p-5"><h2 className="font-black text-app-accent">중단한 학습이 있습니다</h2><p className="mt-2 text-sm text-app-accent">{resume.position + 1} / {resume.wordIds.length}번째 카드부터 같은 순서로 이어갑니다.</p><Button className="mt-4 w-full" onClick={onResume}><RotateCcw aria-hidden="true" className="h-4 w-4" />이어서 학습</Button></CardContent></Card> : <Card><CardContent className="p-5"><h2 className="font-bold">세션 저장</h2><p className="mt-2 text-sm leading-6 text-app-muted">카드 순서와 현재 위치를 브라우저에 저장합니다. 다른 기기와 동기화되지는 않습니다.</p></CardContent></Card>}<Card><CardContent className="p-5"><h2 className="font-bold">키보드</h2><dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm"><dt className="font-mono">Space</dt><dd>카드 뒤집기</dd><dt className="font-mono">1–4</dt><dd>공개 후 평가</dd><dt className="font-mono">← →</dt><dd>카드 이동</dd></dl></CardContent></Card></div>
  </div>;
}

function StudySession({ cards, position, revealed, ratings, message, onReveal, onRate, onMove, onPause }: { cards: StudyCard[]; position: number; revealed: boolean; ratings: Record<string, Rating>; message: string | null; onReveal: () => void; onRate: (rating: Rating) => void; onMove: (position: number) => void; onPause: () => void }) {
  const card = cards[position]; const { word, book } = card.representative; const rated = Boolean(ratings[card.wordId]);
  return <div className="mx-auto max-w-3xl"><div className="mb-4 flex items-center justify-between gap-3"><div><p className="font-bold tabular-nums">{position + 1} / {cards.length}</p><p className="text-sm text-app-muted">남은 카드 {cards.length - position - 1}개</p></div><Button variant="ghost" onClick={onPause}><Pause aria-hidden="true" className="h-4 w-4" />일시정지</Button></div><div className="h-2 overflow-hidden rounded-full bg-app-border" role="progressbar" aria-label="학습 진행률" aria-valuemin={0} aria-valuemax={cards.length} aria-valuenow={position + 1}><div className="h-full bg-emerald-600 transition-[width]" style={{ width: `${((position + 1) / cards.length) * 100}%` }} /></div>{message && <p role="status" className="mt-4 rounded-xl bg-amber-950 p-3 text-sm text-amber-200">{message}</p>}
    <Card className="mt-6 min-h-[390px]"><CardContent className="flex min-h-[390px] flex-col items-center justify-center p-6 text-center sm:p-10"><div className="flex flex-wrap justify-center gap-2">{word.status === "needs-review" && <Badge variant="warning">검수 필요</Badge>}{word.jlptLevels.map((item) => <Badge key={item}>{item}</Badge>)}</div><h1 className="jp mt-5 text-4xl font-black leading-tight sm:text-5xl">{word.term}</h1>{word.nuance && <p className="mt-3 font-semibold text-app-accent">문맥: {word.nuance}</p>}{!revealed ? <Button size="lg" className="mt-10" onClick={onReveal}><Eye aria-hidden="true" className="h-5 w-5" />정답 보기</Button> : <div className="mt-7 w-full border-t border-app-border pt-6"><p className="jp text-lg text-app-muted">{word.reading ?? "읽기 미확인"}</p>{word.meanings.length ? <ul className="mt-4 space-y-2 text-lg font-semibold">{word.meanings.map((meaning, index) => <li key={`${meaning}-${index}`}>{meaning}</li>)}</ul> : <p className="mt-4 text-lg font-semibold">뜻 미확인</p>}{word.examples[0] && <div className="mt-5 rounded-xl bg-app-raised p-4 text-left"><p className="jp">{word.examples[0].ja}</p>{word.examples[0].ko && <p className="mt-1 text-sm text-app-muted">{word.examples[0].ko}</p>}</div>}<div className="mt-5 flex flex-wrap justify-center gap-2"><Badge variant="muted">{book.title}</Badge>{card.occurrences.length > 1 && <Badge variant="outline">다른 출처 {card.occurrences.length - 1}개</Badge>}</div>{card.occurrences.length > 1 && <details className="mt-4 text-left"><summary className="cursor-pointer text-sm font-bold text-app-accent">다른 단어장의 뜻 보기</summary><ul className="mt-2 space-y-2">{card.occurrences.filter((item) => item.book.id !== book.id).map((item) => <li key={item.book.id} className="rounded-lg bg-app-raised p-3 text-sm"><strong>{item.book.title}</strong>: {item.word.meanings.join(" · ") || "뜻 미확인"}{item.word.status === "needs-review" && " (검수 필요)"}</li>)}</ul></details>}</div>}</CardContent></Card>
    <div className="mt-4 grid grid-cols-4 gap-2">{ratingLabels.map((item) => <button key={item.value} disabled={!revealed || rated} onClick={() => onRate(item.value)} className={`min-h-14 rounded-xl border bg-app-surface px-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:cursor-not-allowed disabled:opacity-40 ${item.style}`}><span className="block text-xs font-normal">{item.key}</span>{item.label}</button>)}</div><div className="mt-4 flex justify-between"><Button variant="ghost" disabled={position === 0} onClick={() => onMove(position - 1)}><ArrowLeft aria-hidden="true" className="h-4 w-4" />이전</Button><Button variant="ghost" disabled={position === cards.length - 1} onClick={() => onMove(position + 1)}>다음<ArrowRight aria-hidden="true" className="h-4 w-4" /></Button></div>
  </div>;
}

function StudySummary({ cards, ratings, onRestart }: { cards: StudyCard[]; ratings: Record<string, Rating>; onRestart: () => void }) {
  const counts = ratingLabels.map((item) => ({ ...item, count: Object.values(ratings).filter((rating) => rating === item.value).length }));
  return <div className="mx-auto max-w-2xl text-center"><CheckCircle2 aria-hidden="true" className="mx-auto h-14 w-14 text-emerald-600" /><h1 className="mt-5 text-3xl font-black">학습을 마쳤습니다</h1><p className="mt-3 text-app-muted">{cards.length}개 카드 중 {Object.keys(ratings).length}개를 평가했습니다.</p><div className="mt-8 grid grid-cols-4 gap-2">{counts.map((item) => <div key={item.value} className="rounded-xl border border-app-border bg-app-surface p-3"><p className="text-2xl font-black">{item.count}</p><p className="mt-1 text-xs text-app-muted">{item.label}</p></div>)}</div><div className="mt-8 flex flex-wrap justify-center gap-3"><Button onClick={onRestart}><RotateCcw aria-hidden="true" className="h-4 w-4" />새 학습</Button><Button asChild variant="outline"><Link href="/due">복습 일정 보기</Link></Button></div></div>;
}
