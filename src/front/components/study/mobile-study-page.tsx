"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, RotateCcw, Shuffle, Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { clientDatabase } from "@/lib/sync/client-db";
import { useSync } from "@/components/sync/sync-provider";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

type Rating = "again" | "hard" | "good" | "easy";
type Mode = "all" | "unseen" | "due" | "weak";
type Book = { id: string; title: string; folderId: string | null };
type Folder = { id: string; name: string; parentId: string | null };
type Entry = { entryId: string; bookId: string; wordId: string; term: string; reading: string | null; meanings: string[]; primaryMeaning: string | null; examples: Array<{ ja: string; ko?: string | null }>; status: string; bookTitle: string };
type Card = { wordId: string; representative: Entry; occurrences: Entry[]; review: { dueAt: string | null; lastReviewedAt: string | null; lastRating: string | null } };
type Session = { id: string; bookIds: string[]; mode: Mode; includeReview: boolean; wordIds: string[]; position: number; revealed: boolean; ratings: Record<string, Rating>; status: string; revision: number };
type Phase = "config" | "loading" | "study" | "complete";
const ratings: Array<{ value: Rating; label: string; key: string; style: string }> = [
  { value: "again", label: "다시", key: "1", style: "border-red-300 text-red-800" },
  { value: "hard", label: "어려움", key: "2", style: "border-amber-300 text-amber-900" },
  { value: "good", label: "알겠음", key: "3", style: "border-emerald-300 text-emerald-900" },
  { value: "easy", label: "쉬움", key: "4", style: "border-blue-300 text-blue-900" },
];

export function MobileStudyPage() {
  const search = useSearchParams(); const { queue } = useSync();
  const [books, setBooks] = useState<Book[]>([]); const [folders, setFolders] = useState<Folder[]>([]); const [bookId, setBookId] = useState(search.get("folder") ? `folder:${search.get("folder")}` : search.get("books") || "");
  const [mode, setMode] = useState<Mode>(search.get("mode") === "due" ? "due" : "all"); const [size, setSize] = useState("20");
  const [includeReview, setIncludeReview] = useState(false); const [shuffle, setShuffle] = useState(false); const [dueCount, setDueCount] = useState(0);
  const [resume, setResume] = useState<Session | null>(null); const [phase, setPhase] = useState<Phase>("config"); const [cards, setCards] = useState<Card[]>([]);
  const [position, setPosition] = useState(0); const [revealed, setRevealed] = useState(false); const [sessionId, setSessionId] = useState("");
  const [rated, setRated] = useState<Record<string, Rating>>({}); const [message, setMessage] = useState("");
  const [notice, setNotice] = useState(""); const [showReading, setShowReading] = useState(false); const [showMeaning, setShowMeaning] = useState(false);
  const revision = useRef(1); const ratingLock = useRef(false);

  useEffect(() => { void (async () => {
    try {
      const [bookResponse, folderResponse, dueResponse] = await Promise.all([fetch("/api/books?limit=500&sort=name", { cache: "no-store" }), fetch("/api/folders", { cache: "no-store" }), fetch("/api/study/cards?mode=due&countOnly=true", { cache: "no-store" })]);
      if (bookResponse.ok) setBooks((await bookResponse.json()).books);
      if (folderResponse.ok) setFolders((await folderResponse.json()).folders);
      if (dueResponse.ok) setDueCount((await dueResponse.json()).totalMatches);
    } catch { const db = await clientDatabase(); setBooks(await db.getAll("books") as unknown as Book[]); }
    const sessions = await (await clientDatabase()).getAll("studySessions") as unknown as Session[];
    setResume(sessions.filter((session) => session.status === "active" || session.status === "paused").sort((a, b) => b.revision - a.revision)[0] || null);
  })(); }, []);

  const getCards = useCallback(async (config: { bookIds: string[]; mode: Mode; includeReview: boolean; limit: number; seed: number }) => {
    const query = new URLSearchParams({ mode: config.mode, includeReview: String(config.includeReview), limit: String(config.limit), seed: String(config.seed) });
    if (config.bookIds.length) query.set("books", config.bookIds.join(","));
    try {
      const response = await fetch(`/api/study/cards?${query}`, { cache: "no-store" }); if (!response.ok) throw new Error();
      return (await response.json() as { cards: Card[] }).cards;
    } catch {
      const db = await clientDatabase(); const entries = await db.getAll("entries") as unknown as Entry[]; const states = new Map((await db.getAll("reviewStates") as Array<Record<string, unknown>>).map((state) => [String(state.wordId), state]));
      const groups = new Map<string, Entry[]>();
      entries.filter((entry) => !config.bookIds.length || config.bookIds.includes(entry.bookId)).forEach((entry) => groups.set(entry.wordId, [...(groups.get(entry.wordId) || []), entry]));
      return [...groups.entries()].flatMap(([wordId, occurrences]) => { const ready = occurrences.find((entry) => entry.status === "ready"); if (!ready && !config.includeReview) return []; const state = states.get(wordId); if (config.mode === "unseen" && state) return []; if (config.mode === "due" && (!state?.dueAt || Date.parse(String(state.dueAt)) > Date.now())) return []; if (config.mode === "weak" && !new Set(["again","hard"]).has(String(state?.lastRating))) return []; return [{ wordId, representative: ready || occurrences[0], occurrences, review: { dueAt: state?.dueAt as string || null, lastReviewedAt: state?.lastReviewedAt as string || null, lastRating: state?.lastRating as string || null } }]; }).slice(0, config.limit);
    }
  }, []);

  function booksForScope(scope: string) {
    if (!scope) return [];
    if (!scope.startsWith("folder:")) return [scope];
    const root = scope.slice(7); const included = new Set([root]); let changed = true;
    while (changed) { changed = false; for (const folder of folders) if (folder.parentId && included.has(folder.parentId) && !included.has(folder.id)) { included.add(folder.id); changed = true; } }
    return books.filter((book) => book.folderId && included.has(book.folderId)).map((book) => book.id);
  }

  async function begin(existing?: Session) {
    setPhase("loading"); setMessage(""); setNotice(""); setShowReading(false); setShowMeaning(false);
    ratingLock.current = false;
    const selectedBooks = existing?.bookIds || booksForScope(bookId); const selectedMode = existing?.mode || mode; const selectedReview = existing?.includeReview ?? includeReview;
    if (existing) { setMode(existing.mode); setIncludeReview(existing.includeReview); setBookId(existing.bookIds.length === 1 ? existing.bookIds[0] : ""); }
    const list = await getCards({ bookIds: selectedBooks, mode: selectedMode, includeReview: selectedReview, limit: existing || size === "all" ? 10_000 : Number(size), seed: shuffle ? Date.now() : 0 });
    const ordered = existing ? existing.wordIds.flatMap((wordId) => list.find((card) => card.wordId === wordId) || []) : list;
    if (!ordered.length) { setMessage(selectedMode === "due" ? "현재 복습할 단어가 없습니다." : "조건에 맞는 학습 카드가 없습니다. 오프라인이라면 먼저 세트를 열어 캐시해 주세요."); setPhase("config"); return; }
    if (existing && ordered.length !== existing.wordIds.length) setNotice(`삭제되었거나 학습 범위에서 빠진 카드 ${existing.wordIds.length - ordered.length}개를 건너뛰었습니다.`);
    setCards(ordered); setPosition(Math.min(existing?.position || 0, Math.max(ordered.length - 1, 0))); setRevealed(existing?.revealed || false); setRated(existing?.ratings || {});
    if (existing) { setSessionId(existing.id); revision.current = existing.revision; }
    else {
      const id = `study-${crypto.randomUUID()}`; setSessionId(id); revision.current = 1;
      try { await queue({ type: "session.create", payload: { id, bookIds: selectedBooks, mode: selectedMode, includeReview: selectedReview, wordIds: ordered.map((card) => card.wordId), position: 0, revealed: false, ratings: {}, status: "active" } }); }
      catch { setMessage("학습 세션을 기기에 저장하지 못했습니다. 저장 공간을 확인한 뒤 다시 시도해 주세요."); setPhase("config"); return; }
    }
    setPhase("study");
  }

  const saveSession = useCallback(async (payload: Record<string, unknown>) => {
    if (!sessionId) return; const expected = revision.current; revision.current += 1;
    await queue({ type: "session.update", targetId: sessionId, expectedRevision: expected, payload });
  }, [queue, sessionId]);
  const pause = useCallback(async () => {
    await saveSession({ position, revealed, ratings: rated, status: "paused" });
    const stored = await (await clientDatabase()).get("studySessions", sessionId) as unknown as Session | undefined;
    setResume(stored || null);
    setPhase("config");
  }, [position, rated, revealed, saveSession, sessionId]);
  const reveal = useCallback(() => { if (revealed) return; setRevealed(true); void saveSession({ position, revealed: true, ratings: rated, status: "active" }); }, [position, rated, revealed, saveSession]);
  const move = useCallback((next: number) => {
    if (next < 0 || next >= cards.length || next === position) return;
    ratingLock.current = false;
    setPosition(next); setRevealed(false); setShowReading(false); setShowMeaning(false);
    void saveSession({ position: next, revealed: false, ratings: rated, status: "active" });
  }, [cards.length, position, rated, saveSession]);
  const rate = useCallback(async (rating: Rating) => {
    const card = cards[position]; if (!card || rated[card.wordId] || ratingLock.current) return; ratingLock.current = true;
    const operationId = crypto.randomUUID();
    try { await queue({ operationId, type: "review.rate", payload: { wordId: card.wordId, rating, sessionId, context: mode === "due" ? "scheduled" : card.review.lastReviewedAt ? "manual" : "new" } }); }
    catch { setNotice("평가를 기기에 저장하지 못했습니다. 저장 공간을 확인한 뒤 다시 평가해 주세요."); ratingLock.current = false; return; }
    const nextRatings = { ...rated, [card.wordId]: rating }; setRated(nextRatings);
    if (position >= cards.length - 1) { await saveSession({ position, revealed: true, ratings: nextRatings, status: "completed" }); setPhase("complete"); }
    else { const next = position + 1; setPosition(next); setRevealed(false); setShowReading(false); setShowMeaning(false); await saveSession({ position: next, revealed: false, ratings: nextRatings, status: "active" }); ratingLock.current = false; }
  }, [cards, mode, position, queue, rated, revealed, saveSession, sessionId]);
  const restartWrong = useCallback(async () => {
    const wrong = cards.filter((card) => rated[card.wordId] === "again" || rated[card.wordId] === "hard");
    if (!wrong.length) { setPhase("config"); setResume(null); return; }
    const id = `study-${crypto.randomUUID()}`; const wordIds = wrong.map((card) => card.wordId); const bookIds = [...new Set(wrong.flatMap((card) => card.occurrences.map((entry) => entry.bookId)))];
    await queue({ type: "session.create", payload: { id, bookIds, mode: "weak", includeReview: true, wordIds, position: 0, revealed: false, ratings: {}, status: "active" } });
    setCards(wrong); setPosition(0); setRevealed(false); setShowReading(false); setShowMeaning(false); setRated({}); setSessionId(id); revision.current = 1; ratingLock.current = false; setMode("weak"); setPhase("study");
  }, [cards, queue, rated]);
  useEffect(() => { const key = (event: KeyboardEvent) => { if (phase !== "study" || (event.target as HTMLElement)?.closest("input,select,textarea,button,a")) return; if (!revealed && (event.key === " " || event.key === "Enter")) { event.preventDefault(); reveal(); } else if (revealed && /^[1-4]$/.test(event.key)) void rate(ratings[Number(event.key) - 1].value); else if (event.key === "ArrowLeft") move(position - 1); else if (event.key === "ArrowRight") move(position + 1); }; window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key); }, [move, phase, position, rate, reveal, revealed]);

  if (phase === "loading") return <div className="mx-auto max-w-xl space-y-4"><div className="h-8 w-40 animate-pulse rounded bg-slate-200" /><div className="h-96 animate-pulse rounded-3xl bg-slate-200" /></div>;
  if (phase === "study") {
    const card = cards[position]; const entry = card.representative;
    const done = Object.keys(rated).length;
    return <section className="jlpt-flash mx-auto flex min-h-[calc(100dvh-8rem)] max-w-[480px] flex-col">
      {notice && <p role="status" className="mx-4 rounded-lg bg-amber-950 p-2 text-sm text-amber-200">{notice}</p>}
      <header className="flex shrink-0 items-center gap-2 px-3 pt-2">
        <button aria-label="학습 중단" onClick={() => void pause()} className="flex h-11 w-11 items-center justify-center text-[#9aa5b6]"><ArrowLeft size={22}/></button>
        <strong className="min-w-0 flex-1 truncate text-sm">{entry.bookTitle}</strong>
        <span className="text-sm tabular-nums text-[#9aa5b6]">{position + 1} / {cards.length}</span>
      </header>
      <div className="flex shrink-0 justify-center gap-6 py-3 text-xs text-[#9aa5b6]">
        <span>남음 {cards.length - done}</span>
        <button aria-label="발음 듣기" onClick={() => { if (typeof window === "undefined" || !window.speechSynthesis) return; window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(entry.reading || entry.term); utterance.lang = "ja-JP"; utterance.rate = 0.9; window.speechSynthesis.speak(utterance); }}>🔊</button>
      </div>
      <article className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-5 text-center">
        <h1 className="jp text-[clamp(44px,14vw,80px)] font-light leading-tight text-[#4ab8bf]">{entry.term}</h1>
        {entry.examples[0] && <p className="jp mt-5 text-base leading-7 text-[#9aa5b6]">{entry.examples[0].ja}</p>}
        <div className="my-5 h-px w-3/5 bg-[#2a313d]" />
        {showMeaning && <><p className="text-lg font-medium text-[#f97316]">{entry.meanings.join(", ") || "뜻 미확인"}</p>{entry.examples[0]?.ko && <p className="mt-2 text-sm text-[#c2622a]">{entry.examples[0].ko}</p>}</>}
        {showReading && <p className="jp mt-3 text-lg text-[#f97316]">{entry.reading || "읽기 미확인"}</p>}
      </article>
      <div className="shrink-0 px-4">
        <div className="h-[5px] overflow-hidden rounded-full bg-[#1f2530]"><div className="h-full bg-[#4ab8bf]" style={{ width: (done / cards.length * 100) + "%" }}/></div>
        <div className="mt-1 flex justify-between text-[11px] text-[#9aa5b6]"><span>완료 {done}</span><span>남음 {cards.length - done}</span></div>
      </div>
      <footer className="shrink-0 space-y-2 px-4 pb-[max(20px,env(safe-area-inset-bottom))] pt-2">
        <div className="grid grid-cols-2 gap-2">
          <button aria-pressed={showMeaning} onClick={() => { setShowMeaning((v) => !v); setRevealed(true); }} className={"min-h-14 rounded-xl border px-2 " + (showMeaning ? "border-[#4ab8bf] bg-[#1e5f65]" : "border-[#2a313d] bg-[#1f2530]")}>한국어</button>
          <button aria-pressed={showReading} onClick={() => { setShowReading((v) => !v); setRevealed(true); }} className={"jp min-h-14 rounded-xl border px-2 " + (showReading ? "border-[#4ab8bf] bg-[#1e5f65]" : "border-[#2a313d] bg-[#1f2530]")}>ひらがな</button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => void rate("again")} className="min-h-14 rounded-xl bg-[#2a4a6e] px-2 font-bold text-white">✎ 공부하겠음</button>
          <button onClick={() => void rate("good")} className="min-h-14 rounded-xl bg-[#2e9098] px-2 font-bold text-white">✓ 알고있음</button>
        </div>
      </footer>
    </section>;
  }
  if (phase === "complete") {
    const wrong = Object.values(rated).filter((rating) => rating === "again" || rating === "hard").length;
    return <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-7 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">✓</div><h1 className="mt-5 text-2xl font-black">학습을 마쳤습니다</h1><p className="mt-2 text-slate-600">{Object.keys(rated).length}개 평가 · 다시 볼 단어 {wrong}개 · 완료율 {cards.length ? Math.round(Object.keys(rated).length / cards.length * 100) : 0}%</p>{wrong ? <Button className="mt-7 w-full" onClick={() => void restartWrong()}><RotateCcw className="h-4 w-4" />틀린 단어 재학습</Button> : null}<Button variant={wrong ? "outline" : "default"} className="mt-3 w-full" onClick={() => { setPhase("config"); setResume(null); }}>새 학습</Button></div>;
  }
  return <div className="mx-auto max-w-xl"><h1 className="text-2xl font-black">학습</h1><p className="mt-1 text-sm text-slate-500">오늘 복습 {dueCount}개</p>
    {resume ? <button onClick={() => void begin(resume)} className="mt-5 flex w-full items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-left"><span><span className="block font-black text-emerald-950">이어서 학습</span><span className="mt-1 block text-sm text-emerald-800">{resume.position + 1} / {resume.wordIds.length}번째 카드</span></span><RotateCcw className="h-5 w-5 text-emerald-800" /></button> : null}
    <button onClick={() => { setMode("due"); setSize("20"); }} className="mt-3 flex min-h-16 w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 text-left"><span><span className="font-black">복습 시작</span><span className="ml-2 text-sm text-slate-500">{dueCount}개 대기</span></span><Sparkles className="h-5 w-5 text-emerald-700" /></button>
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-black">새 학습 설정</h2><div className="mt-5 space-y-4"><label className="block text-sm font-bold">범위<Select className="mt-2 w-full" value={bookId} onChange={(event) => setBookId(event.target.value)}><option value="">전체 단어장</option>{folders.length ? <optgroup label="폴더">{folders.map((folder) => <option key={folder.id} value={`folder:${folder.id}`}>{folder.name}</option>)}</optgroup> : null}<optgroup label="세트">{books.map((book) => <option key={book.id} value={book.id}>{book.title}</option>)}</optgroup></Select></label><div className="grid grid-cols-2 gap-3"><label className="block text-sm font-bold">모드<Select className="mt-2 w-full" value={mode} onChange={(event) => setMode(event.target.value as Mode)}><option value="all">모든 단어</option><option value="unseen">미학습</option><option value="due">복습 대기</option><option value="weak">틀린 단어</option></Select></label><label className="block text-sm font-bold">개수<Select className="mt-2 w-full" value={size} onChange={(event) => setSize(event.target.value)}><option>10</option><option>20</option><option>50</option><option value="all">전체</option></Select></label></div><label className="flex min-h-11 items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={shuffle} onChange={(event) => setShuffle(event.target.checked)} className="h-5 w-5" /><Shuffle className="h-4 w-4" />순서 섞기</label><label className="flex min-h-11 items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={includeReview} onChange={(event) => setIncludeReview(event.target.checked)} className="h-5 w-5" />검수 필요 포함</label></div>{message ? <p role="alert" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{message}</p> : null}<Button size="lg" className="mt-5 w-full" onClick={() => void begin()}><Sparkles className="h-5 w-5" />새 학습 시작</Button></section>
  </div>;
}
